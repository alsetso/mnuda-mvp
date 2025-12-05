import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

type EntityType = 'post' | 'city' | 'county' | 'account' | 'business';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const searchParams = request.nextUrl.searchParams;
    const entity_type = searchParams.get('entity_type') as EntityType;
    const entity_id = searchParams.get('entity_id');
    const entity_slug = searchParams.get('entity_slug');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!entity_type || (!entity_id && !entity_slug)) {
      return NextResponse.json(
        { error: 'entity_type and either entity_id or entity_slug are required' },
        { status: 400 }
      );
    }

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

    // Build query for page_views
    // Note: Using left join syntax - accounts will be null for anonymous views
    let query = supabase
      .from('page_views')
      .select(`
        id,
        viewed_at,
        account_id,
        accounts!left (
          id,
          username,
          first_name,
          last_name,
          image_url
        )
      `)
      .eq('entity_type', entity_type)
      .order('viewed_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    // Filter by entity_id or entity_slug
    if (entity_id) {
      query = query.eq('entity_id', entity_id);
    } else if (entity_slug) {
      query = query.eq('entity_slug', entity_slug);
    }

    const { data: pageViews, error } = await query;

    if (error) {
      // Handle permission errors gracefully without logging
      if (error.code === 'PGRST301' || error.message?.includes('permission denied') || error.message?.includes('row-level security')) {
        return NextResponse.json(
          { error: 'Permission denied', page_views: [] },
          { status: 403 }
        );
      }
      // Only log unexpected errors
      console.error('Error fetching page views:', error);
      return NextResponse.json(
        { error: 'Failed to fetch page views', details: error.message },
        { status: 500 }
      );
    }

    // Format response
    const formattedViews = (pageViews || []).map((pv: PageView) => ({
      id: pv.id,
      viewed_at: pv.viewed_at,
      account_id: pv.account_id,
      account: pv.accounts ? {
        id: pv.accounts.id,
        username: pv.accounts.username,
        first_name: pv.accounts.first_name,
        last_name: pv.accounts.last_name,
        image_url: pv.accounts.image_url,
      } : null,
    }));

    return NextResponse.json({
      page_views: formattedViews,
      total: formattedViews.length,
    });
  } catch (error) {
    // Only log unexpected errors, not permission issues
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (!errorMessage.includes('permission') && !errorMessage.includes('row-level security')) {
      console.error('Error in GET /api/analytics/page-views:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error', page_views: [] },
      { status: 500 }
    );
  }
}

