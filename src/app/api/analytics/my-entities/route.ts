import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

type EntityType = 'post' | 'account' | 'business' | 'page';

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

    const entities: EntityWithViews[] = [];

    // Get user's posts
    if (!entityType || entityType === 'post') {
      const postsQuery = supabase
        .from('posts')
        .select('id, title, slug, created_at, visibility')
        .eq('profile_id', account.id)
        .in('visibility', ['public', 'members_only']);

      const { data: posts } = await postsQuery.order('created_at', { ascending: false });

      if (posts) {
        for (const post of posts) {
          // Get page view stats
          const { data: pageViews } = await supabase
            .from('page_views')
            .select('viewed_at, account_id')
            .eq('entity_type', 'post')
            .eq('entity_id', post.id);

          const filteredViews = pageViews?.filter(pv => {
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
            entity_id: post.id,
            entity_slug: post.slug,
            title: post.title,
            total_views: filteredViews.length,
            unique_visitors: uniqueVisitors,
            first_viewed_at: filteredViews.length > 0 ? filteredViews[filteredViews.length - 1]?.viewed_at : null,
            last_viewed_at: filteredViews.length > 0 ? filteredViews[0]?.viewed_at : null,
            created_at: post.created_at,
            url: `/feed/post/${post.slug || post.id}`,
          });
        }
      }
    }


    // Get user's account/profile
    if (!entityType || entityType === 'account') {
        const { data: accountData } = await supabase
        .from('accounts')
        .select('id, username, first_name, last_name, created_at')
        .eq('id', account.id)
        .single();

      if (accountData) {
        const { data: pageViews } = await supabase
          .from('page_views')
          .select('viewed_at, account_id')
          .eq('entity_type', 'account')
          .or(`entity_id.eq.${account.id},entity_slug.eq.${accountData.username || account.id}`);

        const filteredViews = pageViews?.filter(pv => {
          if (dateFrom && new Date(pv.viewed_at) < new Date(dateFrom)) return false;
          if (dateTo && new Date(pv.viewed_at) > new Date(dateTo)) return false;
          return true;
        }) || [];

        const uniqueVisitors = new Set(filteredViews.map(pv => pv.account_id).filter(Boolean)).size;

        entities.push({
          entity_type: 'account',
          entity_id: accountData.id,
          entity_slug: accountData.username,
          title: `${accountData.first_name || ''} ${accountData.last_name || ''}`.trim() || 'My Profile',
          total_views: filteredViews.length,
          unique_visitors: uniqueVisitors,
          first_viewed_at: filteredViews.length > 0 ? filteredViews[filteredViews.length - 1]?.viewed_at : null,
          last_viewed_at: filteredViews.length > 0 ? filteredViews[0]?.viewed_at : null,
          created_at: accountData.created_at,
          url: accountData.username ? `/profile/${accountData.username}` : `/accounts/${accountData.id}`,
        });
      }
    }

    // Get user's pages
    if (!entityType || entityType === 'business' || entityType === 'page') {
      const { data: pages } = await supabase
        .from('pages')
        .select('id, name, created_at')
        .eq('account_id', account.id)
        .order('created_at', { ascending: false });

      if (pages) {
        for (const page of pages) {
          const { data: pageViews } = await supabase
            .from('page_views')
            .select('viewed_at, account_id')
            .eq('entity_type', 'page')
            .eq('entity_id', page.id);

          const filteredViews = pageViews?.filter(pv => {
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
            entity_type: 'page',
            entity_id: page.id,
            entity_slug: null,
            title: page.name,
            total_views: filteredViews.length,
            unique_visitors: uniqueVisitors,
            first_viewed_at: filteredViews.length > 0 ? filteredViews[filteredViews.length - 1]?.viewed_at : null,
            last_viewed_at: filteredViews.length > 0 ? filteredViews[0]?.viewed_at : null,
            created_at: page.created_at,
            url: `/page/${page.id}`,
          });
        }
      }
    }

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


