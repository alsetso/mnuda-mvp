/**
 * Zillow address search API endpoint
 * Searches for specific property by full address
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json(
      { error: 'Address parameter is required' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://zillow56.p.rapidapi.com/search_address?address=${encodeURIComponent(address)}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'zillow56.p.rapidapi.com',
          'x-rapidapi-key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Zillow API error: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error searching address:', error);
    return NextResponse.json(
      { error: 'Failed to search address' },
      { status: 500 }
    );
  }
}
