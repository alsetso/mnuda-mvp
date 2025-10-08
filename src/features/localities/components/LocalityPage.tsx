/**
 * Unified locality page template for cities, counties, and ZIPs
 * Supports for-sale and for-rent verticals
 */

import { Suspense } from 'react';
import { LocalityDetail } from '../services/localityService';
import { PropertySearchLayout } from '@/components/for-sale';
import CompactCitiesList from './CompactCitiesList';
import SmartAddressSearch from './SmartAddressSearch';

function PropertySearchSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="h-8 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="h-48 bg-gray-200 animate-pulse"></div>
            <div className="p-4 space-y-3">
              <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface LocalityPageProps {
  locality: LocalityDetail;
  status: 'for-sale' | 'for-rent';
  searchCity: string;
  fallbackMessage?: string;
}

function generateTitle(locality: LocalityDetail, status: string): string {
  const action = status === 'for-sale' ? 'For Sale' : 'For Rent';
  
  if (locality.type === 'city' && locality.city) {
    return locality.city.seo?.seo_title || 
      `${locality.city.name}, MN Homes ${action} | Mnuda`;
  }
  
  if (locality.type === 'county' && locality.county) {
    return `${locality.county.name} County, MN Real Estate ${action} | Mnuda`;
  }
  
  if (locality.type === 'zip' && locality.zip) {
    return `${locality.zip.zip_code} ZIP Code Real Estate ${action} | Mnuda`;
  }
  
  return `Minnesota Real Estate ${action}`;
}

function generateDescription(locality: LocalityDetail, status: string): string {
  const action = status === 'for-sale' ? 'for sale' : 'for rent';
  
  if (locality.type === 'city' && locality.city) {
    return locality.city.seo?.seo_description || 
      `Browse homes ${action} in ${locality.city.name}, Minnesota. Find your next property with Mnuda.`;
  }
  
  if (locality.type === 'county' && locality.county) {
    return `Explore real estate ${action} in ${locality.county.name} County, Minnesota.`;
  }
  
  if (locality.type === 'zip' && locality.zip) {
    return `Find properties ${action} in ${locality.zip.zip_code}, Minnesota.`;
  }
  
  return `Minnesota real estate ${action}.`;
}

function generateH1(locality: LocalityDetail, status: string): string {
  const action = status === 'for-sale' ? 'For Sale' : 'For Rent';
  
  if (locality.type === 'city' && locality.city) {
    return locality.city.seo?.hero_h1 || 
      `${locality.city.name}, MN Homes ${action}`;
  }
  
  if (locality.type === 'county' && locality.county) {
    return `${locality.county.name} County Real Estate ${action}`;
  }
  
  if (locality.type === 'zip' && locality.zip) {
    return `${locality.zip.zip_code} Real Estate ${action}`;
  }
  
  return `Minnesota Real Estate ${action}`;
}

function generateCanonicalUrl(locality: LocalityDetail, status: string): string {
  const base = 'https://mnuda.com';
  
  if (locality.type === 'city' && locality.city) {
    return `${base}/mn/${locality.city.slug}?status=${status}`;
  }
  
  if (locality.type === 'county' && locality.county) {
    return `${base}/mn/county/${locality.county.slug}?status=${status}`;
  }
  
  if (locality.type === 'zip' && locality.zip) {
    return `${base}/mn/zip/${locality.zip.zip_code}?status=${status}`;
  }
  
  return `${base}/mn?status=${status}`;
}

function generateBreadcrumbSchema(locality: LocalityDetail, status: string) {
  const base = 'https://mnuda.com';
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: base,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: status === 'for-sale' ? 'For Sale' : 'For Rent',
      item: `${base}/mn?status=${status}`,
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Minnesota',
      item: `${base}/mn?status=${status}`,
    },
  ];

  if (locality.type === 'city' && locality.city) {
    items.push({
      '@type': 'ListItem',
      position: 4,
      name: 'Cities',
      item: `${base}/mn/cities?status=${status}`,
    });
    items.push({
      '@type': 'ListItem',
      position: 5,
      name: locality.city.name,
      item: `${base}/mn/${locality.city.slug}?status=${status}`,
    });
  } else if (locality.type === 'county' && locality.county) {
    items.push({
      '@type': 'ListItem',
      position: 4,
      name: 'Counties',
      item: `${base}/mn/counties?status=${status}`,
    });
    items.push({
      '@type': 'ListItem',
      position: 5,
      name: `${locality.county.name} County`,
      item: `${base}/mn/county/${locality.county.slug}?status=${status}`,
    });
  } else if (locality.type === 'zip' && locality.zip) {
    items.push({
      '@type': 'ListItem',
      position: 4,
      name: 'ZIPs',
      item: `${base}/mn/zips?status=${status}`,
    });
    items.push({
      '@type': 'ListItem',
      position: 5,
      name: locality.zip.zip_code,
      item: `${base}/mn/zip/${locality.zip.zip_code}?status=${status}`,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

function generateFAQSchema(faq: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export default function LocalityPage({ locality, status, searchCity, fallbackMessage }: LocalityPageProps) {
  const vertical = status;
  const title = generateTitle(locality, status);
  const description = generateDescription(locality, status);
  const h1 = generateH1(locality, status);
  const canonicalUrl = generateCanonicalUrl(locality, status);
  const breadcrumbSchema = generateBreadcrumbSchema(locality, status);

  // Generate FAQ schema if available
  const faqSchema =
    locality.type === 'city' && locality.city?.seo?.faq && locality.city.seo.faq.length > 0
      ? generateFAQSchema(locality.city.seo.faq)
      : null;


  // Market stats
  const marketStats = locality.type === 'city' && locality.city?.seo?.market_stats;

  return (
    <>
      {/* SEO meta tags - handled in page.tsx metadata */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{h1}</h1>
          <p className="text-gray-600">{description}</p>

          {/* Market Stats Cards */}
          {marketStats && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {marketStats.median_price && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-xs font-medium text-gray-500 uppercase">Median Price</div>
                  <div className="text-2xl font-bold text-[#014463] mt-1">
                    ${marketStats.median_price.toLocaleString()}
                  </div>
                </div>
              )}
              {marketStats.inventory_count !== undefined && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-xs font-medium text-gray-500 uppercase">Active Listings</div>
                  <div className="text-2xl font-bold text-[#014463] mt-1">
                    {marketStats.inventory_count}
                  </div>
                </div>
              )}
              {marketStats.dom && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-xs font-medium text-gray-500 uppercase">Days on Market</div>
                  <div className="text-2xl font-bold text-[#014463] mt-1">
                    {marketStats.dom}
                  </div>
                </div>
              )}
              {marketStats.trend_delta_30d !== undefined && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-xs font-medium text-gray-500 uppercase">30-Day Trend</div>
                  <div
                    className={`text-2xl font-bold mt-1 ${
                      marketStats.trend_delta_30d > 0
                        ? 'text-green-600'
                        : marketStats.trend_delta_30d < 0
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {marketStats.trend_delta_30d > 0 && '+'}
                    {marketStats.trend_delta_30d}%
                  </div>
                </div>
              )}
            </div>
          )}
          
          {locality.type === 'city' && locality.city?.seo?.intro_md && (
            <div className="mt-6 prose prose-sm max-w-none text-gray-700">
              {/* Simple paragraph rendering - upgrade to markdown parser in next iteration */}
              <p className="whitespace-pre-line">{locality.city.seo.intro_md}</p>
            </div>
          )}
        </div>
      </div>

      {/* Address Search for County Pages */}
      {locality.type === 'county' && locality.county && (
        <SmartAddressSearch 
          pageType="county" 
          localityName={locality.county.name}
        />
      )}

      {/* County Cities List */}
      {(locality.type === 'county' && locality.county?.cities && locality.county.cities.length > 0) && (
        <CompactCitiesList
          cities={locality.county.cities}
          title={`Cities in ${locality.county.name} County`}
          vertical={vertical}
          maxVisible={12}
        />
      )}

      {/* Address Search for ZIP Pages */}
      {locality.type === 'zip' && locality.zip && (
        <SmartAddressSearch 
          pageType="zip" 
          localityName={locality.zip.zip_code}
        />
      )}

      {/* ZIP Cities List */}
      {(locality.type === 'zip' && locality.zip?.cities && locality.zip.cities.length > 0) && (
        <CompactCitiesList
          cities={locality.zip.cities}
          title={`Cities in ZIP ${locality.zip.zip_code}`}
          vertical={vertical}
          maxVisible={8}
        />
      )}

      {/* Search Scope Notice for Counties/ZIPs */}
      {fallbackMessage && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">{fallbackMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Property Search Results with Skeleton Loader */}
      <Suspense fallback={<PropertySearchSkeleton />}>
        <PropertySearchLayout
          city={searchCity}
          state="MN"
          status={status === 'for-sale' ? 'forSale' : 'forRent'}
        />
      </Suspense>

      {/* Related Cities Section */}
      {locality.type === 'city' &&
        locality.city?.seo?.nearby_city_slugs &&
        locality.city.seo.nearby_city_slugs.length > 0 && (
          <div className="bg-gray-50 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 py-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Nearby Cities
              </h2>
              <div className="flex flex-wrap gap-3">
                {locality.city.seo.nearby_city_slugs.map((slug) => (
                  <a
                    key={slug}
                    href={`/${vertical}/mn/${slug}`}
                    className="inline-block px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-[#014463] hover:text-[#014463] transition-colors"
                  >
                    {slug
                      .split('-')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ')}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* FAQ Section */}
      {locality.type === 'city' && locality.city?.seo?.faq && locality.city.seo.faq.length > 0 && (
        <div className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {locality.city.seo.faq.map((item, idx) => (
                <div key={idx} className="border-b border-gray-100 pb-6 last:border-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.question}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

