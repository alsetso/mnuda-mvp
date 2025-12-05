import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';
import { headers } from 'next/headers';
import { extractClientIP } from '@/lib/utils/ipAddress';

/**
 * POST /api/feed/[id]/view
 * Track a view for a feed post (unique per profile/user)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const headersList = await headers();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // Route handlers can set cookies, but this endpoint doesn't need to
          },
        },
      }
    );
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const isAuthenticated = !authError && !!user;

    // Check if post exists and is visible
    const { data: feedPost, error: feedPostError } = await supabase
      .from('posts')
      .select('id, visibility')
      .eq('id', id)
      .single();

    if (feedPostError || !feedPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check visibility - drafts are not viewable
    if (feedPost.visibility === 'draft') {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Get IP address and user agent
    // Create a Headers-like object for extractClientIP
    const requestHeaders = new Headers();
    headersList.forEach((value, key) => {
      requestHeaders.set(key, value);
    });
    const ipAddress = extractClientIP({ headers: requestHeaders }) || 
                     request.ip || 
                     null;
    const userAgent = headersList.get('user-agent') || null;

    let profileId: string | null = null;
    let userId: string | null = null;

    if (isAuthenticated && user) {
      userId = user.id;

      // Get user's account and first profile
      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (account) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('account_id', account.id)
          .limit(1)
          .single();

        if (profile) {
          profileId = profile.id;
        }
      }
    }

    // Check if view already exists
    let existingView = null;
    if (profileId) {
      const { data } = await supabase
        .from('post_views')
        .select('id')
        .eq('post_id', id)
        .eq('profile_id', profileId)
        .single();
      existingView = data;
    } else if (userId) {
      const { data } = await supabase
        .from('post_views')
        .select('id')
        .eq('post_id', id)
        .eq('user_id', userId)
        .single();
      existingView = data;
    }

    // If view already exists, return success without incrementing
    if (existingView) {
      return NextResponse.json({ 
        success: true, 
        alreadyViewed: true,
        viewCount: feedPost.view_count || 0
      });
    }

    // Insert new view
    const viewData: any = {
      post_id: id,
      ip_address: ipAddress,
    };

    if (profileId) {
      viewData.profile_id = profileId;
    }
    if (userId) {
      viewData.user_id = userId;
    }

    const { error: insertError } = await supabase
      .from('post_views')
      .insert(viewData);

    if (insertError) {
      // If unique constraint violation, view was already recorded
      if (insertError.code === '23505') {
        return NextResponse.json({ 
          success: true, 
          alreadyViewed: true,
          viewCount: feedPost.view_count || 0
        });
      }
      console.error('Error tracking view:', insertError);
      return NextResponse.json(
        { error: 'Failed to track view' },
        { status: 500 }
      );
    }

    // Fetch updated view count
    const { data: updatedPost } = await supabase
      .from('posts')
      .select('view_count')
      .eq('id', id)
      .single();

    return NextResponse.json({ 
      success: true,
      viewCount: updatedPost?.view_count || 0
    });
  } catch (error) {
    console.error('Error in feed view API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

