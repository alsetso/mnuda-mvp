import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';
import type { PageStats, SupabaseRPCResponse } from '@/types/analytics';

/**
 * GET /api/analytics/business-stats
 * Returns page statistics: total loads, unique visitors, and active accounts
 * Query params: 
 *   - page: 'business' or 'directory' (for page slug stats)
 *   - id: UUID (for individual page stats by entity_id)
 *   - hours: 24 or 168 (default 24)
 * 
 * Either 'page' or 'id' must be provided, but not both.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageSlug = searchParams.get('page');
    const pageId = searchParams.get('id');
    const hoursParam = searchParams.get('hours');
    const hours = hoursParam === '168' ? 168 : 24; // Default to 24 hours

    // Validate that exactly one of page or id is provided
    if (!pageSlug && !pageId) {
      return NextResponse.json(
        { error: 'Either "page" or "id" parameter is required' },
        { status: 400 }
      );
    }

    if (pageSlug && pageId) {
      return NextResponse.json(
        { error: 'Cannot provide both "page" and "id" parameters' },
        { status: 400 }
      );
    }

    // Validate page slug if provided
    if (pageSlug && !['business', 'directory'].includes(pageSlug)) {
      return NextResponse.json(
        { error: 'Invalid page parameter. Must be "business" or "directory"' },
        { status: 400 }
      );
    }

    // Validate UUID format if id is provided
    if (pageId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(pageId)) {
        return NextResponse.json(
          { error: 'Invalid id parameter. Must be a valid UUID' },
          { status: 400 }
        );
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    const cookieStore = await cookies();
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

    let stats: PageStats[] | null = null;
    let error: { code?: string; message: string; details?: string; hint?: string } | null = null;

    // Get page statistics using the appropriate database function
    if (pageSlug) {
      // Use slug-based stats (for landing pages)
      // @ts-expect-error - RPC function types not fully defined in Database type
      const { data, error: rpcError } = await supabase.rpc('get_page_stats', {
        p_page_slug: pageSlug,
        p_hours: hours,
      });
      stats = data as PageStats[] | null;
      error = rpcError ? {
        code: rpcError.code,
        message: rpcError.message,
        details: rpcError.details,
        hint: rpcError.hint,
      } : null;
    } else if (pageId) {
      // Use id-based stats (for individual pages)
      console.log('[business-stats] Fetching stats by ID:', { pageId, hours });
      // @ts-expect-error - RPC function types not fully defined in Database type
      const { data, error: rpcError } = await supabase.rpc('get_page_stats_by_id', {
        p_entity_id: pageId,
        p_hours: hours,
      });
      stats = data as PageStats[] | null;
      error = rpcError ? {
        code: rpcError.code,
        message: rpcError.message,
        details: rpcError.details,
        hint: rpcError.hint,
      } : null;
      
      console.log('[business-stats] RPC result:', {
        hasData: !!result.data,
        dataLength: Array.isArray(result.data) ? result.data.length : 0,
        data: result.data,
        error: result.error,
      });
    }

    if (error) {
      console.error('[business-stats] Error fetching page stats:', error);
      console.error('[business-stats] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { 
          error: 'Failed to fetch page statistics',
          details: error.message 
        },
        { status: 500 }
      );
    }

    // Validate that we got data
    if (!stats || !Array.isArray(stats) || stats.length === 0) {
      console.log('[business-stats] No stats data returned (no views yet)');
      // Return zeros if no data (this is valid - no views yet)
      return NextResponse.json({
        total_loads: 0,
        unique_visitors: 0,
        accounts_active: 0,
      });
    }

    const result = {
      total_loads: Number(stats[0]?.total_loads) || 0,
      unique_visitors: Number(stats[0]?.unique_visitors) || 0,
      accounts_active: Number(stats[0]?.accounts_active) || 0,
    };
    
    console.log('[business-stats] Returning stats:', result);
    
    // Return stats with default values if null
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in business-stats route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

