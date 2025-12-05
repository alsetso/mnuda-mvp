import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

/**
 * GET /api/feed/[id]
 * Fetch a single post - RLS handles access control
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          set: () => {},
          remove: () => {},
        },
      }
    );

    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Fetch account data
    const { data: account } = await supabase
      .from('accounts')
      .select('id, first_name, last_name, image_url')
      .eq('id', post.account_id)
      .single();

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

    const enrichedPost = {
      ...post,
      accounts: account || null,
      map_data, // Include for backward compatibility
    };

    return NextResponse.json({ post: enrichedPost });
  } catch (error) {
    console.error('Error in feed GET [id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/feed/[id]
 * Update a post - RLS verifies ownership
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          set: () => {},
          remove: () => {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, visibility, map_data } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Auto-generate title from first line of content if not provided
    const finalTitle = title?.trim() || content.trim().split('\n')[0].substring(0, 200) || null;

    if (visibility && !['public', 'draft'].includes(visibility)) {
      return NextResponse.json(
        { error: 'Invalid visibility. Must be: public or draft' },
        { status: 400 }
      );
    }

    // Transform map_data to structured columns if provided
    // The trigger will automatically populate PostGIS columns from map_geometry
    const mapUpdateData: MapUpdateData = {};
    if (map_data !== undefined) {
      if (map_data === null) {
        // Clear all map data
        mapUpdateData.map_type = null;
        mapUpdateData.map_geometry = null;
        mapUpdateData.map_center = null;
        mapUpdateData.map_hide_pin = false;
        mapUpdateData.map_screenshot = null;
        mapUpdateData.map_data = null;
      } else {
        mapUpdateData.map_type = map_data.type;
        mapUpdateData.map_hide_pin = map_data.hidePin || false;
        mapUpdateData.map_screenshot = map_data.screenshot || null;
        
        // Store geometry - trigger will calculate map_center and map_bounds
        if (map_data.type === 'both' && map_data.polygon) {
          // For 'both' type, store the polygon as the main geometry
          mapUpdateData.map_geometry = map_data.polygon;
          // Also include center in geometry metadata for trigger
          if (map_data.center) {
            mapUpdateData.map_geometry = {
              ...map_data.polygon,
              center: map_data.center
            };
          }
        } else {
          mapUpdateData.map_geometry = map_data.geometry;
          // Include center in geometry if available
          if (map_data.center) {
            mapUpdateData.map_geometry = {
              ...map_data.geometry,
              center: map_data.center
            };
          }
        }
        
        // Also keep map_data for backward compatibility
        mapUpdateData.map_data = map_data;
      }
    }

    // Update post - RLS verifies ownership
    const updateData: PostUpdateData = {
      ...(finalTitle !== null && { title: finalTitle }),
      content: content.trim(),
      ...(visibility && { visibility }),
      ...mapUpdateData,
    };

    const { data: post, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update post', details: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }

    // Fetch account data
    const { data: account } = await supabase
      .from('accounts')
      .select('id, first_name, last_name, image_url')
      .eq('id', post.account_id)
      .single();

    // Build map_data from structured columns for backward compatibility
    let responseMapData = null;
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
      
      responseMapData = {
        type: post.map_type || 'pin',
        geometry: post.map_geometry,
        ...(center && { center }),
        ...(post.map_screenshot && { screenshot: post.map_screenshot }),
        ...(post.map_hide_pin && { hidePin: post.map_hide_pin }),
      };
    }

    const enrichedPost = {
      ...post,
      accounts: account || null,
      map_data: responseMapData, // Include for backward compatibility
    };

    return NextResponse.json({ post: enrichedPost });
  } catch (error) {
    console.error('Error in feed PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
