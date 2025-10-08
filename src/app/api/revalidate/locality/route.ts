/**
 * On-demand revalidation API for locality pages and indexes
 * POST /api/revalidate/locality
 * Body: { type: 'city' | 'county' | 'zip', slug: string, vertical?: 'for-sale' | 'for-rent' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, slug, vertical } = body;

    if (!type || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields: type, slug' },
        { status: 400 }
      );
    }

    // Revalidate tags
    if (type === 'city') {
      revalidateTag(`mn-city-${slug}`);
      revalidateTag('mn-cities-index');
      if (vertical) {
        revalidateTag(`mn-cities-index-${vertical}`);
      }
    } else if (type === 'county') {
      revalidateTag(`mn-county-${slug}`);
      revalidateTag('mn-counties-index');
      if (vertical) {
        revalidateTag(`mn-counties-index-${vertical}`);
      }
    } else if (type === 'zip') {
      revalidateTag(`mn-zip-${slug}`);
      revalidateTag('mn-zips-index');
      if (vertical) {
        revalidateTag(`mn-zips-index-${vertical}`);
      }
    }

    // Revalidate paths
    if (type === 'city') {
      revalidatePath(`/for-sale/mn/${slug}`);
      revalidatePath(`/for-rent/mn/${slug}`);
      revalidatePath('/for-sale/mn/cities');
      revalidatePath('/for-rent/mn/cities');
    } else if (type === 'county') {
      revalidatePath(`/for-sale/mn/county/${slug}`);
      revalidatePath(`/for-rent/mn/county/${slug}`);
      revalidatePath('/for-sale/mn/counties');
      revalidatePath('/for-rent/mn/counties');
    } else if (type === 'zip') {
      revalidatePath(`/for-sale/mn/zip/${slug}`);
      revalidatePath(`/for-rent/mn/zip/${slug}`);
      revalidatePath('/for-sale/mn/zips');
      revalidatePath('/for-rent/mn/zips');
    }

    return NextResponse.json({
      revalidated: true,
      type,
      slug,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

