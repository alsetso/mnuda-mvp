import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';
import type { PageStats, SupabaseRPCResponse } from '@/types/analytics';

/**
 * GET /api/analytics/map-stats
 * Returns map page statistics: total loads, unique visitors, and active accounts
 * Query params: hours (24 or 168, default 24)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hoursParam = searchParams.get('hours');
    const hours = hoursParam === '168' ? 168 : 24; // Default to 24 hours

    const cookieStore = await cookies();
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

    // Get map statistics using the database function
    // This function uses SECURITY DEFINER so it bypasses RLS
    const { data: stats, error } = await supabase.rpc('get_map_page_stats', {
      p_hours: hours,
    }) as SupabaseRPCResponse<PageStats[]>;

    if (error) {
      console.error('Error fetching map stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch map statistics' },
        { status: 500 }
      );
    }

    // Return stats with default values if null
    return NextResponse.json({
      total_loads: stats?.[0]?.total_loads || 0,
      unique_visitors: stats?.[0]?.unique_visitors || 0,
      accounts_active: stats?.[0]?.accounts_active || 0,
    });
  } catch (error) {
    console.error('Error in map-stats route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

