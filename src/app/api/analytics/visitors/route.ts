import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import type { Visitor } from '@/types/analytics';

type EntityType = 'post' | 'city' | 'county' | 'account';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const searchParams = request.nextUrl.searchParams;
    const entity_type = searchParams.get('entity_type') as EntityType;
    const entity_id = searchParams.get('entity_id');
    const entity_slug = searchParams.get('entity_slug');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!entity_type) {
      return NextResponse.json(
        { error: 'entity_type is required' },
        { status: 400 }
      );
    }

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

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get account
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

    // Verify ownership of the entity
    let isOwner = false;
    if (entity_type === 'account') {
      // For account profiles, check if viewing own profile
      if (entity_id === account.id) {
        isOwner = true;
      } else if (entity_slug) {
        const { data: targetAccount } = await supabase
          .from('accounts')
          .select('id')
          .eq('username', entity_slug)
          .single();
        isOwner = targetAccount?.id === account.id;
      }
    } else if (entity_type === 'post') {
      if (entity_id) {
        const { data: post } = await supabase
          .from('posts')
          .select('account_id')
          .eq('id', entity_id)
          .single();
        isOwner = post?.account_id === account.id;
      }
    }

    if (!isOwner) {
      return NextResponse.json(
        { error: 'You can only view visitors to your own content' },
        { status: 403 }
      );
    }

    // Get visitors
    const { data: visitors, error } = await supabase.rpc('get_entity_visitors', {
      p_entity_type: entity_type,
      p_entity_id: entity_id || null,
      p_entity_slug: entity_slug || null,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error('Error getting visitors:', error);
      return NextResponse.json(
        { error: 'Failed to get visitors', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      visitors: visitors || [],
      total: visitors?.length || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/analytics/visitors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

