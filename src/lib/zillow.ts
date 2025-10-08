/**
 * Zillow API client and data normalizer
 * Server-only module for fetching and transforming Zillow property data
 */

export interface ZillowProperty {
  zpid: string;
  streetAddress: string;
  city: string;
  state: string;
  zipcode: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  livingArea: number;
  propertyType: string;
  homeStatus: string;
  daysOnZillow: number;
  photoCount: number;
  imgSrc: string;
  detailUrl: string;
  latitude: number;
  longitude: number;
}

export interface ZillowSearchParams {
  city: string;
  state: string;
  intent: 'for-sale' | 'for-rent';
  page?: number;
  resultsPerPage?: number;
}

export interface NormalizedProperty {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  type: string;
  status: string;
  daysListed: number;
  imageUrl: string;
  detailUrl: string;
  lat: number;
  lng: number;
  source: 'zillow';
}

/**
 * Normalize Zillow API response to consistent property format
 */
export function normalizeZillowProperty(raw: ZillowProperty): NormalizedProperty {
  return {
    id: raw.zpid,
    address: raw.streetAddress,
    city: raw.city,
    state: raw.state,
    zip: raw.zipcode,
    price: raw.price || 0,
    beds: raw.bedrooms || 0,
    baths: raw.bathrooms || 0,
    sqft: raw.livingArea || 0,
    type: raw.propertyType || 'Unknown',
    status: raw.homeStatus || 'Unknown',
    daysListed: raw.daysOnZillow || 0,
    imageUrl: raw.imgSrc || '',
    detailUrl: raw.detailUrl || '',
    lat: raw.latitude || 0,
    lng: raw.longitude || 0,
    source: 'zillow',
  };
}

/**
 * Server-only Zillow API client
 * NEVER call from client-side code
 */
export async function fetchZillowListings(
  params: ZillowSearchParams
): Promise<NormalizedProperty[]> {
  const apiKey = process.env.ZILLOW_API_KEY;
  const apiHost = process.env.ZILLOW_API_HOST || 'zillow-com1.p.rapidapi.com';

  if (!apiKey) {
    console.error('Missing ZILLOW_API_KEY');
    return [];
  }

  const { city, state, intent, page = 1, resultsPerPage = 40 } = params;

  // Map intent to Zillow status filter
  const statusMap = {
    'for-sale': 'forSale',
    'for-rent': 'forRent',
  };

  const status = statusMap[intent];

  try {
    const url = new URL(`https://${apiHost}/propertyExtendedSearch`);
    url.searchParams.set('location', `${city}, ${state}`);
    url.searchParams.set('status_type', status);
    url.searchParams.set('page', page.toString());
    url.searchParams.set('resultsPerPage', resultsPerPage.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': apiHost,
      },
      next: {
        revalidate: 3600, // Cache for 1 hour
      },
    });

    if (!response.ok) {
      console.error(`Zillow API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    const results = data?.props || [];

    return results.map(normalizeZillowProperty);
  } catch (error) {
    console.error('Zillow fetch error:', error);
    return [];
  }
}

/**
 * Get Zillow listings for a specific city and intent
 * Includes error handling and fallback to empty array
 */
export async function getZillowListingsForCity(
  city: string,
  state: string,
  intent: 'for-sale' | 'for-rent'
): Promise<NormalizedProperty[]> {
  try {
    return await fetchZillowListings({ city, state, intent });
  } catch (error) {
    console.error(`Failed to fetch Zillow listings for ${city}, ${state}:`, error);
    return [];
  }
}

