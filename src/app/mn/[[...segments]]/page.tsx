/**
 * Unified catch-all route for Minnesota localities
 * Routes:
 *   /mn/cities            - Cities index (neutral data table)
 *   /mn/counties          - Counties index (neutral data table)
 *   /mn/zips              - ZIP codes index (neutral data table)
 *   /mn/[city-slug]       - City page (with for-sale/for-rent toggle in filters)
 *   /mn/county/[county-slug] - County page (with for-sale/for-rent toggle in filters)
 *   /mn/zip/[zip-code]    - ZIP page (with for-sale/for-rent toggle in filters)
 */

import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { resolveLocality, listCities, listCounties, listZips, getStateStats, getLargestCityInCounty, getPrimaryCityForZip } from '@/features/localities';
import { resolveAlias } from '@/features/localities/services/aliasService';
import LocalityPageWrapper from '@/features/localities/components/LocalityPageWrapper';
import CityLandingPage from '@/features/localities/components/CityLandingPage';
import PropertySearchPage from '@/features/localities/components/PropertySearchPage';
import StateLandingWrapper from '@/features/localities/components/StateLandingWrapper';
import IndexPageWrapper from '@/features/localities/components/IndexPageWrapper';
import CitiesIndex from '@/features/localities/components/CitiesIndex';
import CountiesIndex from '@/features/localities/components/CountiesIndex';
import ZipsIndex from '@/features/localities/components/ZipsIndex';

interface PageProps {
  params: { segments?: string[] };
  searchParams: { status?: 'for-sale' | 'for-rent' };
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const segments = resolvedParams.segments || [];
  const status = searchParams.status || 'for-sale';
  const statusText = status === 'for-sale' ? 'For Sale' : 'For Rent';
  const statusLower = status === 'for-sale' ? 'for sale' : 'for rent';
  
  if (segments.length === 0) {
    // State landing: /mn
    return {
      title: 'Minnesota Real Estate | Mnuda',
      description: 'Browse homes and properties across Minnesota cities, counties, and ZIP codes.',
    };
  }

  // Special index pages - neutral, no status parameter
  if (segments.length === 1 && ['cities', 'counties', 'zips'].includes(segments[0])) {
    const type = segments[0];
    return {
      title: `Minnesota ${type.charAt(0).toUpperCase() + type.slice(1)} | Mnuda`,
      description: `Browse all Minnesota ${type} with real estate listings.`,
    };
  }

  const locality = await resolveLocality(segments);
  
  if (!locality) {
    return {
      title: 'Not Found | Mnuda',
    };
  }

  let title = '';
  let description = '';
  let canonicalUrl = '';

  if (locality.type === 'city' && locality.city) {
    // Handle new URL structure
    if (segments.length === 1) {
      // City landing page
      title = locality.city.seo?.seo_title || 
        `Welcome to ${locality.city.name}, Minnesota | Mnuda`;
      description = locality.city.seo?.seo_description || 
        `Discover ${locality.city.name}, Minnesota. Learn about neighborhoods, real estate market, and find your perfect home.`;
      canonicalUrl = `https://mnuda.com/mn/${locality.city.slug}`;
    } else if (segments.length === 2 && ['for-sale', 'for-rent'].includes(segments[1])) {
      // Property search page
      const propertyStatus = segments[1];
      const statusText = propertyStatus === 'for-sale' ? 'For Sale' : 'For Rent';
      const statusLower = propertyStatus === 'for-sale' ? 'for sale' : 'for rent';
      
      title = `${locality.city.name}, MN Homes ${statusText} | Mnuda`;
      description = `Browse homes ${statusLower} in ${locality.city.name}, Minnesota. Find your perfect home with our comprehensive property listings.`;
      canonicalUrl = `https://mnuda.com/mn/${locality.city.slug}/${propertyStatus}`;
    }
  } else if (locality.type === 'county' && locality.county) {
    title = `${locality.county.name} County, MN Real Estate ${statusText} | Mnuda`;
    description = `Explore real estate ${statusLower} in ${locality.county.name} County, Minnesota.`;
    canonicalUrl = `https://mnuda.com/mn/county/${locality.county.slug}?status=${status}`;
  } else if (locality.type === 'zip' && locality.zip) {
    title = `${locality.zip.zip_code} ZIP Code Real Estate ${statusText} | Mnuda`;
    description = `Find properties ${statusLower} in ${locality.zip.zip_code}, Minnesota.`;
    canonicalUrl = `https://mnuda.com/mn/zip/${locality.zip.zip_code}?status=${status}`;
  }

  const noindex = locality.type === 'city' && locality.city?.seo && !locality.city.seo.is_indexable;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    ...(noindex && { robots: 'noindex, nofollow' }),
  };
}

export default async function MNPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const segments = resolvedParams.segments || [];
  const status = searchParams.status || 'for-sale';

  // State landing page: /mn
  if (segments.length === 0) {
    const stats = await getStateStats('MN');
    return (
      <StateLandingWrapper>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Minnesota Real Estate
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Browse properties across {stats.totalCities} cities, {stats.totalCounties} counties, and {stats.totalZips} ZIP codes
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Link 
              href="/mn/cities" 
              className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold mb-2">Cities</h3>
              <p className="text-gray-600">{stats.totalCities} cities</p>
            </Link>
            <Link 
              href="/mn/counties" 
              className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold mb-2">Counties</h3>
              <p className="text-gray-600">{stats.totalCounties} counties</p>
            </Link>
            <Link 
              href="/mn/zips" 
              className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold mb-2">ZIP Codes</h3>
              <p className="text-gray-600">{stats.totalZips} ZIP codes</p>
            </Link>
          </div>
        </div>
      </StateLandingWrapper>
    );
  }

  // Cities index: /mn/cities
  if (segments.length === 1 && segments[0] === 'cities') {
    const { cities, total } = await listCities({ limit: 100 });
    return (
      <IndexPageWrapper>
        <CitiesIndex
          initialCities={cities}
          initialTotal={total}
        />
      </IndexPageWrapper>
    );
  }

  // Counties index: /mn/counties
  if (segments.length === 1 && segments[0] === 'counties') {
    const { counties, total } = await listCounties({ limit: 100 });
    return (
      <IndexPageWrapper>
        <CountiesIndex
          initialCounties={counties}
          initialTotal={total}
        />
      </IndexPageWrapper>
    );
  }

  // Zips index: /mn/zips
  if (segments.length === 1 && segments[0] === 'zips') {
    const { zips, total } = await listZips({ limit: 1000 });
    return (
      <IndexPageWrapper>
        <ZipsIndex
          initialZips={zips}
          initialTotal={total}
        />
      </IndexPageWrapper>
    );
  }

  // Handle new URL structure: /mn/[city-slug] and /mn/[city-slug]/[status]
  if (segments.length === 1) {
    // Check for alias redirect (city only)
    const canonicalSlug = await resolveAlias(segments[0]);
    if (canonicalSlug) {
      redirect(`/mn/${canonicalSlug}`);
    }

    // City landing page: /mn/[city-slug]
    const locality = await resolveLocality(segments);
    if (locality && locality.type === 'city' && locality.city) {
      return (
        <LocalityPageWrapper>
          <CityLandingPage locality={locality} />
        </LocalityPageWrapper>
      );
    }
  }

  // Handle property search pages: /mn/[city-slug]/[status]
  if (segments.length === 2 && ['for-sale', 'for-rent'].includes(segments[1])) {
    const citySlug = segments[0];
    const propertyStatus = segments[1] as 'for-sale' | 'for-rent';
    
    // Check for alias redirect
    const canonicalSlug = await resolveAlias(citySlug);
    if (canonicalSlug) {
      redirect(`/mn/${canonicalSlug}/${propertyStatus}`);
    }

    // Resolve city for property search
    const locality = await resolveLocality([citySlug]);
    if (locality && locality.type === 'city' && locality.city) {
      return (
        <LocalityPageWrapper>
          <PropertySearchPage 
            locality={locality} 
            status={propertyStatus}
            searchCity={locality.city.name}
          />
        </LocalityPageWrapper>
      );
    }
  }

  // Handle county and ZIP pages (keep existing logic for now)
  if (segments.length === 2 && segments[0] === 'county') {
    const locality = await resolveLocality(segments);
    if (!locality) {
      notFound();
    }

    // Resolve search city for Zillow API
    let searchCity = '';
    let fallbackMessage = '';

    if (locality.type === 'county' && locality.county) {
      const largestCity = await getLargestCityInCounty(locality.county.id);
      searchCity = largestCity || locality.county.name;
      fallbackMessage = `Showing properties in ${locality.county.name} County. Results may include nearby areas.`;
    }

    return <LocalityPageWrapper locality={locality} status={status} searchCity={searchCity} fallbackMessage={fallbackMessage} />;
  }

  if (segments.length === 2 && segments[0] === 'zip') {
    const locality = await resolveLocality(segments);
    if (!locality) {
      notFound();
    }

    // Resolve search city for Zillow API
    let searchCity = '';
    let fallbackMessage = '';

    if (locality.type === 'zip' && locality.zip) {
      const primaryCity = await getPrimaryCityForZip(locality.zip.zip_code);
      searchCity = primaryCity || locality.zip.zip_code;
      fallbackMessage = `Showing properties in ZIP ${locality.zip.zip_code}. Results may include nearby areas.`;
    }

    return <LocalityPageWrapper locality={locality} status={status} searchCity={searchCity} fallbackMessage={fallbackMessage} />;
  }

  // Fallback to 404
  notFound();
}
