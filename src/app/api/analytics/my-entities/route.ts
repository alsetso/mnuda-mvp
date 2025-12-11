import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

type EntityType = 'post' | 'account';

interface EntityWithViews {
  entity_type: EntityType;
  entity_id: string;
  entity_slug: string | null;
  title: string;
  total_views: number; // Filtered views from page_views table
  unique_visitors: number;
  first_viewed_at: string | null;
  last_viewed_at: string | null;
  created_at: string;
  url: string;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get('entity_type') as EntityType | null;
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    const supabase = createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
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

    // Get current user account
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    const accountId = (account as { id: string }).id;
    const entities: EntityWithViews[] = [];

    // Get user's posts
    if (!entityType || entityType === 'post') {
      const postsQuery = supabase
        .from('posts')
        .select('id, title, slug, created_at, visibility')
        .eq('profile_id', accountId)
        .in('visibility', ['public', 'members_only']);

      const { data: posts } = await postsQuery.order('created_at', { ascending: false });

      if (posts) {
        for (const post of posts) {
          const postData = post as { id: string; title: string | null; slug: string | null; created_at: string };
          // Get page view stats
          const { data: pageViews } = await supabase
            .from('page_views')
            .select('viewed_at, account_id')
            .eq('entity_type', 'post')
            .eq('entity_id', postData.id);

          const filteredViews = (pageViews as Array<{ viewed_at: string; account_id: string | null }> | null)?.filter(pv => {
            const viewDate = new Date(pv.viewed_at);
            if (dateFrom && viewDate < new Date(dateFrom)) return false;
            if (dateTo) {
              const toDate = new Date(dateTo);
              toDate.setHours(23, 59, 59, 999); // Include entire day
              if (viewDate > toDate) return false;
            }
            return true;
          }) || [];

          const uniqueVisitors = new Set(filteredViews.map(pv => pv.account_id).filter(Boolean)).size;

          entities.push({
            entity_type: 'post',
            entity_id: postData.id,
            entity_slug: postData.slug,
            title: postData.title || 'Untitled',
            total_views: filteredViews.length,
            unique_visitors: uniqueVisitors,
            first_viewed_at: filteredViews.length > 0 ? filteredViews[filteredViews.length - 1]?.viewed_at : null,
            last_viewed_at: filteredViews.length > 0 ? filteredViews[0]?.viewed_at : null,
            created_at: postData.created_at,
            url: `/feed/post/${postData.slug || postData.id}`,
          });
        }
      }
    }


    // Get user's account/profile
    if (!entityType || entityType === 'account') {
        const { data: accountData } = await supabase
        .from('accounts')
        .select('id, username, first_name, last_name, created_at')
        .eq('id', accountId)
        .single();

      if (accountData) {
        const accountDataTyped = accountData as { id: string; username: string | null; first_name: string | null; last_name: string | null; created_at: string };
        const { data: pageViews } = await supabase
          .from('page_views')
          .select('viewed_at, account_id')
          .eq('entity_type', 'account')
          .or(`entity_id.eq.${accountId},entity_slug.eq.${accountDataTyped.username || accountId}`);

        const filteredViews = (pageViews as Array<{ viewed_at: string; account_id: string | null }> | null)?.filter(pv => {
          if (dateFrom && new Date(pv.viewed_at) < new Date(dateFrom)) return false;
          if (dateTo && new Date(pv.viewed_at) > new Date(dateTo)) return false;
          return true;
        }) || [];

        const uniqueVisitors = new Set(filteredViews.map(pv => pv.account_id).filter(Boolean)).size;

        entities.push({
          entity_type: 'account',
          entity_id: accountDataTyped.id,
          entity_slug: accountDataTyped.username,
          title: `${accountDataTyped.first_name || ''} ${accountDataTyped.last_name || ''}`.trim() || 'My Profile',
          total_views: filteredViews.length,
          unique_visitors: uniqueVisitors,
          first_viewed_at: filteredViews.length > 0 ? filteredViews[filteredViews.length - 1]?.viewed_at : null,
          last_viewed_at: filteredViews.length > 0 ? filteredViews[0]?.viewed_at : null,
          created_at: accountDataTyped.created_at,
          url: accountDataTyped.username ? `/profile/${accountDataTyped.username}` : '',
        });
      }
    }

    // Business/pages functionality removed - not prioritizing

    // Sort by last_viewed_at (most recent first) or created_at
    entities.sort((a, b) => {
      const aDate = a.last_viewed_at ? new Date(a.last_viewed_at).getTime() : 0;
      const bDate = b.last_viewed_at ? new Date(b.last_viewed_at).getTime() : 0;
      if (aDate !== bDate) return bDate - aDate;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return NextResponse.json({
      entities,
      total: entities.length,
    });
  } catch (error) {
    console.error('Error in GET /api/analytics/my-entities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


