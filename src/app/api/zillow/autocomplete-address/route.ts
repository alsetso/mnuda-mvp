/**
 * Zillow address autocomplete API endpoint
 * Provides Minnesota-only address suggestions
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 3) {
    return NextResponse.json(
      { suggestions: [] },
      { status: 200 }
    );
  }

  try {
    // Use Zillow's autocomplete API with Minnesota filter
    const response = await fetch(
      `https://zillow56.p.rapidapi.com/autocomplete?query=${encodeURIComponent(query)}&state=MN`,
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
    
    // Filter and format suggestions to ensure Minnesota-only results
    const suggestions = (data.suggestions || [])
      .filter((suggestion: { address?: string; text?: string; state?: string }) => {
        // Ensure the suggestion is in Minnesota
        const address = suggestion.address || suggestion.text || '';
        return address.toLowerCase().includes('mn') || 
               address.toLowerCase().includes('minnesota') ||
               suggestion.state === 'MN';
      })
      .map((suggestion: { text?: string; address?: string; city?: string; state?: string; zipcode?: string; zpid?: string }) => ({
        text: suggestion.text || suggestion.address || '',
        address: suggestion.address || suggestion.text || '',
        city: suggestion.city || '',
        state: suggestion.state || 'MN',
        zipcode: suggestion.zipcode || '',
        zpid: suggestion.zpid || null
      }))
      .slice(0, 8); // Limit to 8 suggestions
    
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error fetching address autocomplete:', error);
    return NextResponse.json(
      { suggestions: [] },
      { status: 200 } // Return empty array instead of error to prevent UI issues
    );
  }
}
