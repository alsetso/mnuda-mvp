/**
 * Locality service for cities, counties, and ZIPs
 * Tag-based ISR caching for instant editorial updates
 */

import { createServerClient } from '@/lib/supabaseServer';
import { unstable_cache } from 'next/cache';

export interface City {
  id: number;
  slug: string;
  name: string;
  county_id: number;
  county_name?: string;
  county_slug?: string;
  state_code: string;
  population: number | null;
  lat: number | null;
  lng: number | null;
  status: string;
  priority: number;
}

export interface CitySeo {
  city_slug: string;
  seo_title: string | null;
  seo_description: string | null;
  hero_h1: string | null;
  intro_md: string | null;
  faq: Array<{ question: string; answer: string }>;
  market_stats: {
    median_price?: number;
    dom?: number;
    inventory_count?: number;
    trend_delta_30d?: number;
  };
  nearby_city_slugs: string[];
  is_indexable: boolean;
}

export interface County {
  id: number;
  name: string;
  slug: string;
  state_code: string;
  city_count?: number;
  cities?: City[];
}

export interface Zip {
  id: number;
  zip_code: string;
  state_code: string;
  city_count?: number;
  cities?: City[];
}

export interface LocalityDetail {
  type: 'city' | 'county' | 'zip';
  city?: City & { seo?: CitySeo };
  county?: County;
  zip?: Zip;
}

// Tag helpers


/**
 * Get city by slug with optional SEO data
 */
export const getCityBySlug = unstable_cache(
  async (slug: string, includeSeo = true): Promise<City & { seo?: CitySeo } | null> => {
    const supabase = createServerClient();

    // Get base city with county
    const { data: city, error } = await supabase
      .from('cities')
      .select(`
        id,
        slug,
        name,
        county_id,
        state_code,
        population,
        lat,
        lng,
        status,
        priority,
        counties!inner(name, slug)
      `)
      .eq('slug', slug)
      .eq('state_code', 'MN')
      .single();

    if (error || !city) return null;

    const result: City & { seo?: CitySeo } = {
      ...(city as City),
      county_name: ((city as Record<string, unknown>).counties as { name: string; slug: string })?.name,
      county_slug: ((city as Record<string, unknown>).counties as { name: string; slug: string })?.slug,
    };

    if (includeSeo) {
      const { data: seo } = await supabase
        .from('minnesota_cities')
        .select('*')
        .eq('city_slug', slug)
        .single();

      if (seo) {
        const seoData = seo as Record<string, unknown>;
        result.seo = {
          city_slug: seoData.city_slug as string,
          seo_title: seoData.seo_title as string,
          seo_description: seoData.seo_description as string,
          hero_h1: seoData.hero_h1 as string,
          intro_md: seoData.intro_md as string,
          faq: (seoData.faq as Array<{ question: string; answer: string }>) || [],
          market_stats: (seoData.market_stats as Record<string, unknown>) || {},
          nearby_city_slugs: (seoData.nearby_city_slugs as string[]) || [],
          is_indexable: seoData.is_indexable as boolean,
        };
      }
    }

    return result;
  },
  ['city-detail'],
  {
    tags: ['city-detail'],
    revalidate: 3600,
  }
);

/**
 * Get county by slug with city count and list
 */
export const getCountyBySlug = unstable_cache(
  async (slug: string, includeCities = true): Promise<County | null> => {
    const supabase = createServerClient();

    const { data: county, error } = await supabase
      .from('counties')
      .select(`
        id,
        name,
        slug,
        state_code
      `)
      .eq('slug', slug)
      .eq('state_code', 'MN')
      .single();

    if (error || !county) return null;

    let cities: City[] = [];
    if (includeCities) {
      const { data: citiesData } = await supabase
        .from('cities')
        .select(`
          id,
          slug,
          name,
          county_id,
          state_code,
          population,
          lat,
          lng,
          status,
          priority
        `)
        .eq('county_id', (county as Record<string, unknown>).id as string)
        .eq('status', 'active')
        .order('priority', { ascending: false })
        .order('name');

      cities = citiesData || [];
    }

    return {
      ...(county as Record<string, unknown>),
      city_count: cities.length,
      cities,
    } as County & { city_count: number; cities: City[] };
  },
  ['county-detail'],
  {
    tags: ['county-detail'],
    revalidate: 3600,
  }
);

/**
 * Get ZIP with city count and list
 */
export const getZipByCode = unstable_cache(
  async (zip: string, includeCities = true): Promise<Zip | null> => {
    const supabase = createServerClient();

    const { data: zipData, error } = await supabase
      .from('zips')
      .select(`
        id,
        zip_code,
        state_code
      `)
      .eq('zip_code', zip)
      .eq('state_code', 'MN')
      .single();

    if (error || !zipData) return null;

    let cities: City[] = [];
    if (includeCities) {
      const { data: citiesData } = await supabase
        .from('city_zips')
        .select(`
          cities!inner (
            id,
            slug,
            name,
            county_id,
            state_code,
            population,
            lat,
            lng,
            status,
            priority
          )
        `)
        .eq('zip_id', (zipData as Record<string, unknown>).id as string);

      if (citiesData) {
        cities = citiesData
          .map((item: { cities: City }) => item.cities)
          .filter((city: City) => city.status === 'active')
          .sort((a: City, b: City) => {
            if (b.priority !== a.priority) return b.priority - a.priority;
            return a.name.localeCompare(b.name);
          });
      }
    }

    return {
      ...(zipData as Record<string, unknown>),
      city_count: cities.length,
      cities,
    } as Zip & { city_count: number; cities: City[] };
  },
  ['zip-detail'],
  {
    tags: ['zip-detail'],
    revalidate: 3600,
  }
);

/**
 * List cities with pagination and search
 */
export interface ListCitiesParams {
  limit?: number;
  offset?: number;
  search?: string;
  letter?: string;
  includeSeo?: boolean;
}

export const listCities = unstable_cache(
  async (params: ListCitiesParams = {}): Promise<{ cities: City[]; total: number }> => {
    const {
      limit = 50,
      offset = 0,
      search,
      letter,
    } = params;

    const supabase = createServerClient();

    let query = supabase
      .from('cities')
      .select(`
        id,
        slug,
        name,
        county_id,
        state_code,
        population,
        lat,
        lng,
        status,
        priority,
        counties!inner(name, slug)
      `, { count: 'exact' })
      .eq('state_code', 'MN')
      .eq('status', 'active')
      .order('priority', { ascending: false })
      .order('name');

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (letter) {
      query = query.ilike('name', `${letter}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error || !data) {
      return { cities: [], total: 0 };
    }

    const cities = data.map(city => ({
      ...(city as Record<string, unknown>),
      county_name: ((city as Record<string, unknown>).counties as { name: string; slug: string })?.name,
      county_slug: ((city as Record<string, unknown>).counties as { name: string; slug: string })?.slug,
    }));

    return { cities: cities as City[], total: count || 0 };
  },
  ['cities-list'],
  {
    tags: ['mn-cities-index'],
    revalidate: 3600,
  }
);

/**
 * List counties with city counts
 */
export interface ListCountiesParams {
  limit?: number;
  offset?: number;
  search?: string;
}

export const listCounties = unstable_cache(
  async (params: ListCountiesParams = {}): Promise<{ counties: County[]; total: number }> => {
    const { limit = 50, offset = 0, search } = params;
    const supabase = createServerClient();

    let query = supabase
      .from('counties')
      .select(`
        id,
        name,
        slug,
        state_code
      `, { count: 'exact' })
      .eq('state_code', 'MN')
      .order('name');

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error || !data) {
      return { counties: [], total: 0 };
    }

    // Add city_count to each county
    const countiesWithCounts = await Promise.all(
      data.map(async (county) => {
        const { count: cityCount } = await supabase
          .from('cities')
          .select('id', { count: 'exact', head: true })
          .eq('county_id', (county as Record<string, unknown>).id as string)
          .eq('status', 'active');
        
        return {
          ...(county as Record<string, unknown>),
          city_count: cityCount || 0,
        };
      })
    );

    return { counties: countiesWithCounts as County[], total: count || 0 };
  },
  ['counties-list'],
  {
    tags: ['mn-counties-index'],
    revalidate: 3600,
  }
);

/**
 * List ZIPs with city counts
 */
export interface ListZipsParams {
  limit?: number;
  offset?: number;
  search?: string;
}

export const listZips = unstable_cache(
  async (params: ListZipsParams = {}): Promise<{ zips: Zip[]; total: number }> => {
    const { limit = 50, offset = 0, search } = params;
    const supabase = createServerClient();

    let query = supabase
      .from('zips')
      .select(`
        id,
        zip_code,
        state_code
      `, { count: 'exact' })
      .eq('state_code', 'MN')
      .order('zip_code');

    if (search) {
      query = query.ilike('zip_code', `${search}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error || !data) {
      return { zips: [], total: 0 };
    }

    // Add city_count to each zip
    const zipsWithCounts = await Promise.all(
      data.map(async (zip) => {
        const { count: cityCount } = await supabase
          .from('city_zips')
          .select('id', { count: 'exact', head: true })
          .eq('zip_id', (zip as Record<string, unknown>).id as string);
        
        return {
          ...(zip as Record<string, unknown>),
          city_count: cityCount || 0,
        };
      })
    );

    return { zips: zipsWithCounts as Zip[], total: count || 0 };
  },
  ['zips-list'],
  {
    tags: ['mn-zips-index'],
    revalidate: 3600,
  }
);

/**
 * Get state-level statistics
 */
export async function getStateStats(stateCode: string = 'MN'): Promise<{
  totalCities: number;
  totalCounties: number;
  totalZips: number;
}> {
  const supabase = createServerClient();

  const [citiesResult, countiesResult, zipsResult] = await Promise.all([
    supabase.from('cities').select('id', { count: 'exact', head: true }).eq('state_code', stateCode).eq('status', 'active'),
    supabase.from('counties').select('id', { count: 'exact', head: true }).eq('state_code', stateCode),
    supabase.from('zips').select('id', { count: 'exact', head: true }).eq('state_code', stateCode),
  ]);

  return {
    totalCities: citiesResult.count || 0,
    totalCounties: countiesResult.count || 0,
    totalZips: zipsResult.count || 0,
  };
}

/**
 * Resolve locality from segments array
 * Supports: [city], ['county', county], ['zip', zip]
 */
export async function resolveLocality(segments: string[]): Promise<LocalityDetail | null> {
  if (segments.length === 0) return null;

  // County: ['county', slug]
  if (segments.length === 2 && segments[0] === 'county') {
    const county = await getCountyBySlug(segments[1]);
    if (!county) return null;
    return { type: 'county', county };
  }

  // ZIP: ['zip', code]
  if (segments.length === 2 && segments[0] === 'zip') {
    const zip = await getZipByCode(segments[1]);
    if (!zip) return null;
    return { type: 'zip', zip };
  }

  // City: [slug]
  if (segments.length === 1) {
    const city = await getCityBySlug(segments[0], true);
    if (!city) return null;
    return { type: 'city', city };
  }

  return null;
}

/**
 * Get the largest city in a county for Zillow API searches
 */
export async function getLargestCityInCounty(countyId: number): Promise<string | null> {
  const supabase = createServerClient();

  try {
    const { data, error } = await supabase
      .from('cities')
      .select('name')
      .eq('county_id', countyId)
      .order('population', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching largest city in county:', error);
      return null;
    }

    return (data as Record<string, unknown>)?.name as string || null;
  } catch (error) {
    console.error('Error fetching largest city in county:', error);
    return null;
  }
}

/**
 * Get the primary city for a ZIP code for Zillow API searches
 */
export async function getPrimaryCityForZip(zipCode: string): Promise<string | null> {
  const supabase = createServerClient();

  try {
    // First get the ZIP record
    const { data: zipData, error: zipError } = await supabase
      .from('zips')
      .select('id')
      .eq('zip_code', zipCode)
      .single();

    if (zipError || !zipData) {
      console.error('Error fetching ZIP record:', zipError);
      return null;
    }

    // Get the first city associated with this ZIP
    const { data: cityData, error: cityError } = await supabase
      .from('city_zips')
      .select(`
        cities!inner (
          name,
          population
        )
      `)
      .eq('zip_id', (zipData as Record<string, unknown>).id as string)
      .order('cities(population)', { ascending: false })
      .limit(1)
      .single();

    if (cityError) {
      console.error('Error fetching primary city for ZIP:', cityError);
      return null;
    }

    return ((cityData as Record<string, unknown>).cities as { name: string; population: number })?.name || null;
  } catch (error) {
    console.error('Error fetching primary city for ZIP:', error);
    return null;
  }
}

