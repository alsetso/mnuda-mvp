/**
 * Server-only Zillow search API route
 * Proxies Zillow API requests to prevent key exposure
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchZillowListings, type ZillowSearchParams } from '@/lib/zillow';

export const runtime = 'edge'; // Optional: deploy to edge for lower latency
export const revalidate = 3600; // Cache responses for 1 hour

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const city = searchParams.get('city');
  const state = searchParams.get('state') || 'MN';
  const intent = searchParams.get('intent') as 'for-sale' | 'for-rent';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Validate required params
  if (!city || !intent) {
    return NextResponse.json(
      { error: 'Missing required parameters: city, intent' },
      { status: 400 }
    );
  }

  if (!['for-sale', 'for-rent'].includes(intent)) {
    return NextResponse.json(
      { error: 'Invalid intent. Must be "for-sale" or "for-rent"' },
      { status: 400 }
    );
  }

  try {
    const params: ZillowSearchParams = {
      city,
      state,
      intent,
      page,
      resultsPerPage: 40,
    };

    const listings = await fetchZillowListings(params);

    return NextResponse.json(
      {
        success: true,
        data: listings,
        count: listings.length,
        params: { city, state, intent, page },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    console.error('Zillow search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

