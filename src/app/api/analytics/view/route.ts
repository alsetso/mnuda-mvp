import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import { extractClientIP } from '@/lib/utils/ipAddress';

type EntityType = 'post' | 'city' | 'county' | 'account' | 'business' | 'page' | 'feed' | 'map';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const body = await request.json();
    const { entity_type, entity_id, entity_slug } = body;

    // Validate entity_type
    const validTypes: EntityType[] = ['post', 'city', 'county', 'account', 'business', 'page', 'feed', 'map'];
    if (!entity_type || !validTypes.includes(entity_type)) {
      return NextResponse.json(
        { error: 'Invalid entity_type. Must be one of: post, city, county, account, business, page, feed, map' },
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
        } as any,
      }
    );

    // Get current user account
    const { data: { user } } = await supabase.auth.getUser();
    let accountId: string | null = null;
    
    if (user) {
      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      accountId = account?.id || null;
    }

    // Get IP address for anonymous tracking
    // Use improved IP extraction that handles proxies/CDNs
    const ipAddress = extractClientIP(request);
    
    // Log IP extraction for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[IP Extraction]', {
        extracted: ipAddress,
        headers: {
          'x-forwarded-for': request.headers.get('x-forwarded-for'),
          'x-real-ip': request.headers.get('x-real-ip'),
          'cf-connecting-ip': request.headers.get('cf-connecting-ip'),
          'x-client-ip': request.headers.get('x-client-ip'),
        },
      });
    }

    // Record page view with account_id
    const rpcParams = {
      p_entity_type: entity_type,
      p_entity_id: entity_id || null,
      p_entity_slug: entity_slug || null,
      p_account_id: accountId,
      p_ip_address: ipAddress || null,
    };
    
    console.log('[view] Recording page view:', {
      entity_type,
      entity_id,
      entity_slug,
      accountId: accountId ? accountId.substring(0, 8) + '...' : 'null',
      ipAddress: ipAddress ? 'present' : 'null',
      rpcParams,
    });
    
    const { data: viewCount, error } = await supabase.rpc('record_page_view', rpcParams);

    if (error) {
      console.error('[view] Error recording page view:', {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        },
        entity_type,
        entity_id,
        entity_slug,
        accountId: accountId ? 'present' : 'null',
        ipAddress: ipAddress ? 'present' : 'null',
        rpcParams,
      });
      // Don't return error - silently fail to not break page rendering
      // Log for debugging but allow page to continue
      return NextResponse.json({
        success: false,
        error: error.message,
        view_count: 0,
      });
    }

    const response = {
      success: true,
      view_count: viewCount || 0,
    };
    
    console.log('[view] Page view recorded successfully:', {
      entity_type,
      entity_id,
      view_count: viewCount,
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in POST /api/analytics/view:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const searchParams = request.nextUrl.searchParams;
    const entity_type = searchParams.get('entity_type') as EntityType;
    const entity_id = searchParams.get('entity_id');
    const entity_slug = searchParams.get('entity_slug');

    if (!entity_type) {
      return NextResponse.json(
        { error: 'entity_type is required' },
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
        } as any,
      }
    );

    // Map entity types to table names (map, feed, and page pages don't have view_count columns)
    const tableMap: Partial<Record<EntityType, string>> = {
      post: 'posts',
      city: 'cities',
      county: 'counties',
      account: 'accounts',
      business: 'pages',
      page: 'pages',
    };

    // For map, feed, and page page-level tracking, return 0 (no view_count column)
    if (entity_type === 'map' || entity_type === 'feed' || ((entity_type === 'business' || entity_type === 'page') && !entity_id)) {
      return NextResponse.json({
        view_count: 0,
      });
    }

    // Query view_count directly from the entity table
    let query;
    if (entity_id) {
      query = supabase
        .from(tableMap[entity_type]!)
        .select('view_count')
        .eq('id', entity_id)
        .single();
    } else if (entity_slug) {
      if (entity_type === 'account') {
        // Accounts use username
        query = supabase
          .from('accounts')
          .select('view_count')
          .eq('username', entity_slug)
          .single();
      } else if (entity_type === 'post') {
        query = supabase
          .from(tableMap[entity_type]!)
          .select('view_count')
          .eq('slug', entity_slug)
          .single();
      } else if (entity_type === 'city' || entity_type === 'county') {
        // Try slug first, fallback to name
        query = supabase
          .from(tableMap[entity_type]!)
          .select('view_count')
          .or(`slug.eq.${entity_slug},name.eq.${entity_slug}`)
          .single();
      } else {
        return NextResponse.json(
          { error: 'Slug lookup not supported for this entity type' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Either entity_id or entity_slug must be provided' },
        { status: 400 }
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting view count:', error);
      return NextResponse.json(
        { error: 'Failed to get view count', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      view_count: data?.view_count || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/analytics/view:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
