import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

/**
 * GET /api/feed
 * Fetch feed posts - RLS handles visibility filtering
 */
export async function GET(request: NextRequest) {
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

    // Check auth status for debugging
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Feed GET - User authenticated:', !!user, 'User ID:', user?.id);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
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
        // If no account found, return empty results
        return NextResponse.json({
          posts: [],
          hasMore: false,
        });
      }
      accountIdForOnlyMe = account.id;
    }

    let query = supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by city if provided
    if (city) {
      query = query.eq('city', city);
    }

    // Filter by county if provided
    if (county) {
      query = query.eq('county', county);
    }

    // Filter by state if provided
    if (state) {
      query = query.eq('state', state);
    }

    // Optional visibility filter (RLS already enforces access)
    if (visibility && ['public', 'draft', 'members_only'].includes(visibility)) {
      query = query.eq('visibility', visibility);
    } else if (visibility === 'only_me' && accountIdForOnlyMe) {
      query = query.eq('account_id', accountIdForOnlyMe).eq('visibility', 'only_me');
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('Feed query error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      return NextResponse.json(
        { 
          error: 'Failed to fetch feed', 
          details: error.message || 'Unknown error',
          code: error.code,
          hint: error.hint
        },
        { status: 500 }
      );
    }

    // Fetch accounts separately if needed (gracefully handle errors)
    const accountIds = [...new Set((posts || []).map((p: any) => p.account_id).filter(Boolean))];
    let accountsMap = new Map();
    
    if (accountIds.length > 0) {
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('id, first_name, last_name, image_url')
        .in('id', accountIds);
      
      if (accountsError) {
        console.error('Accounts query error:', accountsError);
        console.error('Account IDs requested:', accountIds);
        // Continue without account data rather than failing
      } else if (accounts) {
        console.log(`Fetched ${accounts.length} accounts for ${accountIds.length} account IDs`);
        accountsMap = new Map(accounts.map((a: any) => [a.id, a]));
      } else {
        console.warn('No accounts returned for account IDs:', accountIds);
      }
    }

    // Enrich posts with account data and format map data
    const enrichedPosts = (posts || []).map((post: any) => {
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
      
      return {
        ...post,
        accounts: accountsMap.get(post.account_id) || null,
        map_data, // Include for backward compatibility
      };
    });

    const jsonResponse = NextResponse.json({
      posts: enrichedPosts,
      hasMore: (posts?.length || 0) === limit,
    }, { headers: response.headers });
    
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
    console.error('Error in feed GET:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error stack:', errorStack);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: errorMessage
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
    const mapInsertData: any = {};
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
    const insertData: any = {
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
      console.error('Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create post', details: error.message },
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
    console.error('Error in feed POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
