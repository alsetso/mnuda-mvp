/**
 * API endpoint for Minnesota locality data
 * Used by MinnesotaLocalityMenu dropdown
 */

import { NextResponse } from 'next/server';
import { listCities, listCounties, listZips } from '@/features/localities';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    // Fetch all Minnesota localities in parallel
    const [citiesResult, countiesResult, zipsResult] = await Promise.all([
      listCities({ limit: 1000 }),
      listCounties({ limit: 100 }),
      listZips({ limit: 1000 })
    ]);

    return NextResponse.json({
      cities: citiesResult.cities,
      counties: countiesResult.counties,
      zips: zipsResult.zips,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Error fetching Minnesota locality data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locality data' },
      { status: 500 }
    );
  }
}
