import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabaseServer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both sync and async params (Next.js 13 vs 15)
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    // Trim whitespace from code
    const trimmedCode = code.trim();

    // Use service client to bypass RLS for code verification
    // Service role has full access but we verify code server-side for security
    const supabase = createServiceClient();
    
    // Verify we have service role permissions
    if (!supabase) {
      console.error('Failed to create service client');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // First, fetch the property by ID to check if it exists and what code it has
    const { data: propertyData, error: propertyError } = await supabase
      .from('properties' as never)
      .select('id, code')
      .eq('id', id)
      .single();

    if (propertyError || !propertyData) {
      console.error('Property fetch error:', {
        error: propertyError,
        message: propertyError?.message,
        details: propertyError?.details,
        hint: propertyError?.hint,
        propertyId: id
      });
      return NextResponse.json(
        { error: 'Property not found', details: propertyError?.message },
        { status: 404 }
      );
    }

    // Check if property has a code set
    const storedCode = (propertyData as { id: string; code?: string | null }).code;
    if (!storedCode || typeof storedCode !== 'string') {
      return NextResponse.json(
        { error: 'Property does not have an access code set' },
        { status: 404 }
      );
    }

    // Compare codes (case-sensitive, trimmed)
    const trimmedStoredCode = storedCode.trim();
    if (trimmedStoredCode !== trimmedCode) {
      return NextResponse.json(
        { error: 'Invalid access code' },
        { status: 404 }
      );
    }

    // Fetch full property data
    const { data, error } = await supabase
      .from('properties' as never)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Property data fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch property data' },
        { status: 500 }
      );
    }

    // Type assertion for property data
    const property = data as {
      id: string;
      full_address: string;
      street_address: string;
      city: string;
      state: string;
      zipcode: string;
      latitude?: number | null;
      longitude?: number | null;
      status: string;
      raw_zillow_response?: Record<string, unknown> | null;
      created_at: string;
      updated_at: string;
    };

    // Return property data (excluding sensitive fields if needed)
    return NextResponse.json({
      id: property.id,
      full_address: property.full_address,
      street_address: property.street_address,
      city: property.city,
      state: property.state,
      zipcode: property.zipcode,
      latitude: property.latitude,
      longitude: property.longitude,
      status: property.status,
      raw_zillow_response: property.raw_zillow_response || null,
      created_at: property.created_at,
      updated_at: property.updated_at
    });
  } catch (error) {
    console.error('Error fetching property:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

