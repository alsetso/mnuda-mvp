import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';
import type { FeedPost, Account } from '@/types/feed';
import { checkRateLimit, RateLimitPresets, createRateLimitHeaders } from '@/lib/rateLimit';

/**
 * GET /api/feed
 * Fetch feed posts - RLS handles visibility filtering
 */
export async function GET(request: NextRequest) {
  // Rate limiting: 200 requests per minute for feed reads
  const rateLimit = checkRateLimit(request, RateLimitPresets.generous);
  
  if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
        },
        { 
          status: 429,
          headers: createRateLimitHeaders(
            rateLimit.remaining, 
            rateLimit.resetTime,
            RateLimitPresets.generous.maxRequests
          ),
        }
      );
  }
  try {
    const response = new NextResponse();
    const cookieStore = await cookies();
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set({ name, value, ...options });
            });
          },
        },
      }
    );

    // Performance monitoring
    const startTime = performance.now();
    const timings: Record<string, number> = {};

    // Check auth status
    const authStart = performance.now();
    const { data: { user } } = await supabase.auth.getUser();
    timings.auth = performance.now() - authStart;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const cursor = searchParams.get('cursor'); // For keyset pagination
    const visibility = searchParams.get('visibility');
    const city = searchParams.get('city');
    const county = searchParams.get('county');
    const state = searchParams.get('state');

    // Handle 'only_me' visibility filter - need to get account first
    let accountIdForOnlyMe: string | null = null;
    if (visibility === 'only_me' && user) {
      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!account) {
        return NextResponse.json({
          posts: [],
          hasMore: false,
        });
      }
      accountIdForOnlyMe = account.id;
    }

    // Explicit column list - only what we need
    const postsColumns = [
      'id',
      'account_id',
      'title',
      'content',
      'visibility',
      'images',
      'map_type',
      'map_geometry',
      'map_center',
      'map_screenshot',
      'map_hide_pin',
      'city',
      'county',
      'state',
      'created_at',
      'updated_at'
    ].join(', ');

    // Build query with accounts join
    const queryStart = performance.now();
    let query = supabase
      .from('posts')
      .select(`${postsColumns}, accounts(id, first_name, last_name, image_url, username, plan)`)
      .order('created_at', { ascending: false });

    // CRITICAL: Filter by visibility for anonymous users to reduce RLS evaluation
    if (!user) {
      query = query.eq('visibility', 'public');
    }

    // Apply location filters
    if (city) {
      query = query.eq('city', city);
    }
    if (county) {
      query = query.eq('county', county);
    }
    if (state) {
      query = query.eq('state', state);
    }

    // Apply visibility filter if specified
    if (visibility && ['public', 'draft', 'members_only'].includes(visibility)) {
      query = query.eq('visibility', visibility);
    } else if (visibility === 'only_me' && accountIdForOnlyMe) {
      query = query.eq('account_id', accountIdForOnlyMe).eq('visibility', 'only_me');
    }

    // Keyset pagination (cursor-based) - more efficient than OFFSET
    if (cursor) {
      query = query.lt('created_at', cursor);
      query = query.limit(limit + 1); // Fetch one extra to check hasMore
    } else {
      // Fallback to OFFSET for backward compatibility
      query = query.range(offset, offset + limit - 1);
    }

    const { data: posts, error } = await query;
    timings.postsQuery = performance.now() - queryStart;

    if (error) {
      const totalTime = performance.now() - startTime;
      // Log basic error info (safe for production)
      console.error('[Feed API] Error after', `${totalTime.toFixed(2)}ms:`, error.message || 'Unknown error');
      console.error('Error code:', error.code);
      // Only log detailed error info in development (could expose internal structure)
      if (process.env.NODE_ENV === 'development') {
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        console.error('Full error object:', error);
      }
      return NextResponse.json(
        { 
          error: 'Failed to fetch feed',
          // Never expose internal error details to clients in production
          ...(process.env.NODE_ENV === 'development' && {
            details: error.message || 'Unknown error',
            code: error.code,
            hint: error.hint,
          }),
        },
        { status: 500 }
      );
    }

    // Handle keyset pagination: check if we have more posts
    let postsToReturn = posts || [];
    let hasMore = false;
    let nextCursor: string | null = null;

    if (cursor && posts && posts.length > limit) {
      // We fetched one extra, so we have more
      hasMore = true;
      postsToReturn = posts.slice(0, limit);
      nextCursor = postsToReturn[postsToReturn.length - 1]?.created_at || null;
    } else if (cursor) {
      // No cursor means this is the first page or we're using OFFSET
      hasMore = (posts?.length || 0) === limit;
      if (posts && posts.length > 0) {
        nextCursor = posts[posts.length - 1]?.created_at || null;
      }
    } else {
      // OFFSET pagination fallback
      hasMore = (posts?.length || 0) === limit;
    }

    // Accounts are now included in the join, extract them
    const accountsMap = new Map<string, Account>();
    (postsToReturn || []).forEach((post: FeedPost & { accounts?: Account }) => {
      if (post.accounts && post.account_id) {
        accountsMap.set(post.account_id, post.accounts);
      }
    });

    // Enrich posts with account data and format map data
    const enrichedPosts = (postsToReturn || []).map((post: FeedPost) => {
      // Build map_data from structured columns for backward compatibility
      let map_data = null;
      if (post.map_geometry || post.map_type) {
        // Extract center coordinates from PostGIS geometry if needed
        // Supabase returns PostGIS geometry as GeoJSON, so map_center is { type: 'Point', coordinates: [lng, lat] }
        let center: [number, number] | undefined;
        if (post.map_center) {
          if (post.map_center.type === 'Point' && Array.isArray(post.map_center.coordinates)) {
            center = post.map_center.coordinates as [number, number];
          } else if (post.map_geometry?.type === 'Point' && Array.isArray(post.map_geometry.coordinates)) {
            center = post.map_geometry.coordinates as [number, number];
          }
        }
        
        map_data = {
          type: post.map_type || 'pin',
          geometry: post.map_geometry,
          ...(center && { center }),
          ...(post.map_screenshot && { screenshot: post.map_screenshot }),
          ...(post.map_hide_pin && { hidePin: post.map_hide_pin }),
        };
      }
      
      // Extract accounts from join result
      const accountData = post.accounts || accountsMap.get(post.account_id) || null;
      
      // Remove accounts from post object (it's nested from join)
      const { accounts: _, ...postWithoutAccounts } = post;
      
      return {
        ...postWithoutAccounts,
        accounts: accountData,
        map_data, // Include for backward compatibility
      };
    });

    const totalTime = performance.now() - startTime;
    timings.total = totalTime;

    // Log performance in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Feed API] Performance:', {
        ...timings,
        postsCount: enrichedPosts.length,
        accountsCount: accountsMap.size,
        hasMore,
        pagination: cursor ? 'keyset' : 'offset',
      });
    }

    const jsonResponse = NextResponse.json({
      posts: enrichedPosts,
      hasMore,
      ...(nextCursor && { nextCursor }), // Include cursor for keyset pagination
    }, { headers: response.headers });

    // Add performance headers
    jsonResponse.headers.set('X-Response-Time', `${totalTime.toFixed(2)}ms`);
    jsonResponse.headers.set('X-Timing-Auth', `${timings.auth.toFixed(2)}ms`);
    jsonResponse.headers.set('X-Timing-Posts', `${timings.postsQuery.toFixed(2)}ms`);
    
    // Add rate limit headers
    Object.entries(createRateLimitHeaders(
      rateLimit.remaining, 
      rateLimit.resetTime,
      RateLimitPresets.generous.maxRequests
    )).forEach(([key, value]) => {
      jsonResponse.headers.set(key, value);
    });
    
    // Copy cookies from response
    response.cookies.getAll().forEach((cookie) => {
      jsonResponse.cookies.set(cookie.name, cookie.value, {
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite as 'lax' | 'strict' | 'none',
        path: cookie.path,
        maxAge: cookie.maxAge,
      });
    });
    
    return jsonResponse;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    // Log error without exposing sensitive details
    console.error('[Feed API] Error:', errorMessage);
    // Only log stack traces in development (could expose internal structure)
    if (process.env.NODE_ENV === 'development' && error instanceof Error) {
      console.error('[Feed API] Stack:', error.stack);
    }
    return NextResponse.json(
      { 
        error: 'Internal server error',
        // Only expose error details to clients in development
        ...(process.env.NODE_ENV === 'development' && { details: errorMessage })
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/feed
 * Create a new post - RLS verifies account ownership
 */
export async function POST(request: NextRequest) {
  try {
    const response = new NextResponse();
    const cookieStore = await cookies();
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set({ name, value, ...options });
            });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting: 60 requests per minute for authenticated post creation
    const rateLimit = checkRateLimit(request, RateLimitPresets.moderate, user.id);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
        },
        { 
          status: 429,
          headers: {
            ...createRateLimitHeaders(
              rateLimit.remaining, 
              rateLimit.resetTime,
              RateLimitPresets.moderate.maxRequests
            ),
            ...Object.fromEntries(response.headers.entries()),
          },
        }
      );
    }

    const body = await request.json();
    const { 
      title, 
      content, 
      visibility = 'public', 
      account_id, 
      images,
      map_data,
      type = 'simple',
      city,
      state,
      zip,
      county,
      full_address
    } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Auto-generate title from first line of content if not provided
    const finalTitle = title?.trim() || content.trim().split('\n')[0].substring(0, 200) || null;

    if (!['public', 'draft'].includes(visibility)) {
      return NextResponse.json(
        { error: 'Invalid visibility. Must be: public or draft' },
        { status: 400 }
      );
    }

    // Get user's account if not provided
    let finalAccountId = account_id;
    if (!finalAccountId) {
      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!account) {
        return NextResponse.json(
          { error: 'Account not found' },
          { status: 400 }
        );
      }
      finalAccountId = account.id;
    }

    // Transform map_data to structured columns if provided
    const mapInsertData: MapInsertData = {};
    if (map_data) {
      mapInsertData.map_type = map_data.type;
      mapInsertData.map_geometry = map_data.geometry;
      mapInsertData.map_hide_pin = map_data.hidePin || false;
      mapInsertData.map_screenshot = map_data.screenshot || null;
      
      // Set map_center from center or geometry
      if (map_data.center) {
        mapInsertData.map_center = `POINT(${map_data.center[0]} ${map_data.center[1]})`;
      } else if (map_data.geometry?.type === 'Point' && map_data.geometry.coordinates) {
        const [lng, lat] = map_data.geometry.coordinates;
        mapInsertData.map_center = `POINT(${lng} ${lat})`;
      }
      
      // Store polygon separately for 'both' type
      if (map_data.type === 'both' && map_data.polygon) {
        mapInsertData.map_geometry = map_data.polygon;
      }
      
      // Also keep map_data for backward compatibility (will be migrated by trigger)
      mapInsertData.map_data = map_data;
    }

    // Insert post - RLS verifies account ownership
    const insertData: PostInsertData = {
      account_id: finalAccountId,
      ...(finalTitle && { title: finalTitle }),
      content: content.trim(),
      visibility: visibility as 'public' | 'draft',
      type: 'simple' as const,
      ...(city && { city }),
      ...(state && { state }),
      ...(zip && { zip }),
      ...(county && { county }),
      ...(full_address && { full_address }),
      ...mapInsertData,
    };

    // Save images array to database (images only for now)
    // Structure: [{ url: string, filename: string, type: string }]
    if (images && Array.isArray(images) && images.length > 0) {
      insertData.images = images;
    } else {
      insertData.images = [];
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      // Log error without exposing sensitive details
      console.error('Insert error:', error.message || 'Unknown error');
      // Only log full error object in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Full error object:', error);
      }
      return NextResponse.json(
        { 
          error: 'Failed to create post',
          // Only expose error details to clients in development
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        },
        { status: 500 }
      );
    }

    // Fetch account data
    const { data: account } = await supabase
      .from('accounts')
      .select('id, first_name, last_name, image_url')
      .eq('id', finalAccountId)
      .single();

    const enrichedPost = {
      ...post,
      accounts: account || null,
    };

    const jsonResponse = NextResponse.json({ post: enrichedPost }, { 
      status: 201,
      headers: response.headers 
    });
    
    // Add rate limit headers
    Object.entries(createRateLimitHeaders(
      rateLimit.remaining, 
      rateLimit.resetTime,
      RateLimitPresets.moderate.maxRequests
    )).forEach(([key, value]) => {
      jsonResponse.headers.set(key, value);
    });
    
    // Copy cookies from response
    response.cookies.getAll().forEach((cookie) => {
      jsonResponse.cookies.set(cookie.name, cookie.value, {
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite as 'lax' | 'strict' | 'none',
        path: cookie.path,
        maxAge: cookie.maxAge,
      });
    });
    
    return jsonResponse;
  } catch (error) {
    // Log error without exposing sensitive details
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in feed POST:', errorMessage);
    // Only log full error details in development
    if (process.env.NODE_ENV === 'development' && error instanceof Error) {
      console.error('Error stack:', error.stack);
      console.error('Full error object:', error);
    }
    return NextResponse.json(
      { 
        error: 'Internal server error',
        // Only expose error details to clients in development
        ...(process.env.NODE_ENV === 'development' && { details: errorMessage })
      },
      { status: 500 }
    );
  }
}
