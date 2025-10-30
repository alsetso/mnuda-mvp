import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabaseServer';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    // Fetch property to get address
    const supabase = createServiceClient();
    const { data: propertyData, error: propertyError } = await supabase
      .from('properties' as never)
      .select('street_address, city, state, zipcode, full_address')
      .eq('id', id)
      .single();

    if (propertyError || !propertyData) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Type assertion for property data
    const property = propertyData as {
      street_address?: string;
      city?: string;
      state?: string;
      zipcode?: string;
      full_address?: string;
    };

    // Build full address for Zillow API
    const fullAddress = property.full_address || 
      `${property.street_address || ''} ${property.city || ''} ${property.state || ''} ${property.zipcode || ''}`.trim();
    const encodedAddress = encodeURIComponent(fullAddress);

    // Call Zillow API securely (server-side only)
    const rapidApiKey = process.env.RAPIDAPI_KEY || process.env.NEXT_PUBLIC_RAPIDAPI_KEY || 'f4a7d42741mshbc2b95a8fd24074p1cf1a6jsn44343abb32e8';
    const zillowUrl = `https://zillow56.p.rapidapi.com/search_address?address=${encodedAddress}`;

    const zillowResponse = await fetch(zillowUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'zillow56.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey
      }
    });

    if (!zillowResponse.ok) {
      const errorText = await zillowResponse.text();
      console.error('Zillow API error:', zillowResponse.status, errorText);
      return NextResponse.json(
        { error: `Zillow API error: ${zillowResponse.status}` },
        { status: zillowResponse.status }
      );
    }

    const zillowData = await zillowResponse.json();

    // Save raw response to property
    const { data: updatedProperty, error: updateError } = await supabase
      .from('properties' as never)
      .update({ raw_zillow_response: zillowData } as never)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error saving Zillow data:', updateError);
      return NextResponse.json(
        { error: 'Failed to save Zillow data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: zillowData,
      property: updatedProperty
    });
  } catch (error) {
    console.error('Error fetching Zillow data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

