import { NextRequest, NextResponse } from 'next/server';
import { getApiHeaders } from '@/features/api/config/apiConfig';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { street, citystatezip } = body;

    // Validate required fields
    if (!street || !citystatezip) {
      return NextResponse.json(
        { error: 'Missing required fields: street, citystatezip' },
        { status: 400 }
      );
    }

    // Call the Skip Trace API
    const encodedStreet = encodeURIComponent(street);
    const encodedCityStateZip = encodeURIComponent(citystatezip);
    const url = `https://skip-tracing-working-api.p.rapidapi.com/search/byaddress?street=${encodedStreet}&citystatezip=${encodedCityStateZip}&page=1`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getApiHeaders('skipTrace')
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Skip Trace API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Return the data with records count for status checking
    return NextResponse.json({
      ...data,
      records: data.Records || 0,
      status: data.Status || 200
    });

  } catch (error) {
    console.error('Address API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
