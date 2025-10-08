/**
 * Rich city landing page component
 * Focuses on city information, lifestyle, and clear CTAs to property search
 */

import Link from 'next/link';
import { LocalityDetail } from '../services/localityService';
import SmartAddressSearch from './SmartAddressSearch';
import { PropertyCarousel } from '@/components/for-sale/PropertyCarousel';
import { MarketStatsDisplay } from '@/components/for-sale/MarketStatsDisplay';

interface CityLandingPageProps {
  locality: LocalityDetail;
}

export default function CityLandingPage({ locality }: CityLandingPageProps) {
  if (locality.type !== 'city' || !locality.city) {
    return null;
  }

  const city = locality.city;
  const marketStats = city.seo?.market_stats;
  const faq = city.seo?.faq || [];
  const nearbyCities = city.seo?.nearby_city_slugs || [];
  
  // SEO data for dynamic content
  const heroH1 = city.seo?.hero_h1;
  const seoDescription = city.seo?.seo_description;
  const introMd = city.seo?.intro_md;

  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#014463] to-[#0a5a7a] text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {heroH1 || `Welcome to ${city.name}, Minnesota`}
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-blue-100 mb-6 md:mb-8 max-w-3xl mx-auto">
              {seoDescription || `Discover ${city.name}'s vibrant community, thriving economy, and beautiful neighborhoods`}
            </p>
            
            {/* City-specific highlights */}
            <div className="mb-6 md:mb-8 flex flex-wrap justify-center gap-3">
              {city.population && (
                <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full text-sm font-medium backdrop-blur-sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Population: {city.population.toLocaleString()}
                </div>
              )}
              {city.county_name && (
                <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full text-sm font-medium backdrop-blur-sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {city.county_name} County
                </div>
              )}
              {marketStats?.median_price && (
                <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full text-sm font-medium backdrop-blur-sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Median: ${marketStats.median_price.toLocaleString()}
                </div>
              )}
            </div>
            
            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
              <Link
                href={`/mn/${city.slug}/for-sale`}
                className="bg-white text-[#014463] px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold text-base md:text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Browse Homes for Sale
              </Link>
              <Link
                href={`/mn/${city.slug}/for-rent`}
                className="bg-transparent border-2 border-white text-white px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold text-base md:text-lg hover:bg-white hover:text-[#014463] transition-colors"
              >
                Find Rentals
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Address Search Section */}
      <SmartAddressSearch 
        pageType="city-landing" 
        localityName={city.name}
      />

      {/* City Overview Section */}
      {introMd && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                About {city.name}
              </h2>
              <div className="prose prose-lg max-w-none text-gray-700">
                <div className="whitespace-pre-line leading-relaxed">
                  {introMd}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Market Stats & Featured Properties Section */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Market Stats */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <MarketStatsDisplay
                cityName={city.name}
                marketStats={marketStats}
                className="h-fit"
              />
            </div>

            {/* Featured Properties Carousel */}
            <div className="lg:col-span-1 order-1 lg:order-2">
              <PropertyCarousel
                city={city.name}
                state="MN"
                status="forSale"
                maxProperties={4}
                title={`Featured Homes in ${city.name}`}
                showTitle={true}
                isExpandable={true}
                className="h-fit"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lifestyle & Community Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8 text-center">
            Life in {city.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Schools & Education */}
            <div className="text-center">
              <div className="w-16 h-16 bg-[#014463] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Top-Rated Schools</h3>
              <p className="text-gray-600">
                {city.name} is home to excellent public and private schools, providing quality education for families.
              </p>
            </div>

            {/* Recreation & Parks */}
            <div className="text-center">
              <div className="w-16 h-16 bg-[#014463] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Parks & Recreation</h3>
              <p className="text-gray-600">
                Enjoy beautiful parks, trails, and recreational facilities that make {city.name} an active community.
              </p>
            </div>

            {/* Local Economy */}
            <div className="text-center">
              <div className="w-16 h-16 bg-[#014463] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Thriving Economy</h3>
              <p className="text-gray-600">
                {city.name} offers diverse employment opportunities and a strong local business community.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Property Search CTA Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Find Your Home in {city.name}?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Explore available properties and discover why {city.name} is the perfect place to call home.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/mn/${city.slug}/for-sale`}
                className="bg-[#014463] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#0a5a7a] transition-colors shadow-lg"
              >
                View Homes for Sale
              </Link>
              <Link
                href={`/mn/${city.slug}/for-rent`}
                className="bg-gray-100 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-200 transition-colors"
              >
                Browse Rentals
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      {faq.length > 0 && (
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="max-w-4xl mx-auto space-y-6">
              {faq.map((item, idx) => (
                <div key={idx} className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {item.question}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Nearby Cities Section */}
      {nearbyCities.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Explore Nearby Cities
            </h2>
            <div className="flex flex-wrap gap-3 justify-center">
              {nearbyCities.map((slug) => (
                <Link
                  key={slug}
                  href={`/mn/${slug}`}
                  className="inline-block px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-[#014463] hover:text-white transition-colors"
                >
                  {slug
                    .split('-')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Final CTA Section */}
      <div className="bg-[#014463] text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">
              Start Your {city.name} Home Search Today
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Connect with local real estate professionals and find your perfect home
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/mn/${city.slug}/for-sale`}
                className="bg-white text-[#014463] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Browse All Homes for Sale
              </Link>
              <Link
                href={`/mn/${city.slug}/for-rent`}
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-[#014463] transition-colors"
              >
                View All Rentals
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
