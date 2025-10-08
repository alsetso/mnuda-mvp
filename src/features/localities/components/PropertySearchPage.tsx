/**
 * Property search page component
 * Focused on property listings with filters and search functionality
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { LocalityDetail } from '../services/localityService';
import { PropertySearchLayout } from '@/components/for-sale';
import { PropertyStatus } from '@/components/for-sale/types';
import SmartAddressSearch from './SmartAddressSearch';

interface PropertySearchPageProps {
  locality: LocalityDetail;
  status: 'for-sale' | 'for-rent';
  searchCity: string;
  fallbackMessage?: string;
}

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

export default function PropertySearchPage({ 
  locality, 
  status, 
  searchCity, 
  fallbackMessage 
}: PropertySearchPageProps) {
  const propertyStatus: PropertyStatus = status === 'for-sale' ? 'forSale' : 'forRent';
  
  // Generate page title based on locality type
  const getPageTitle = () => {
    if (locality.type === 'city' && locality.city) {
      return `${locality.city.name}, MN Homes ${status === 'for-sale' ? 'For Sale' : 'For Rent'}`;
    } else if (locality.type === 'county' && locality.county) {
      return `${locality.county.name} County, MN Real Estate ${status === 'for-sale' ? 'For Sale' : 'For Rent'}`;
    } else if (locality.type === 'zip' && locality.zip) {
      return `${locality.zip.zip_code} ZIP Code Real Estate ${status === 'for-sale' ? 'For Sale' : 'For Rent'}`;
    }
    return `Minnesota Real Estate ${status === 'for-sale' ? 'For Sale' : 'For Rent'}`;
  };

  const getBreadcrumb = () => {
    if (locality.type === 'city' && locality.city) {
      return (
        <nav className="text-sm text-gray-600 mb-4">
          <Link href="/mn" className="hover:text-[#014463]">Minnesota</Link>
          <span className="mx-2">/</span>
          <Link href={`/mn/${locality.city.slug}`} className="hover:text-[#014463]">
            {locality.city.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">
            {status === 'for-sale' ? 'Homes for Sale' : 'Rentals'}
          </span>
        </nav>
      );
    } else if (locality.type === 'county' && locality.county) {
      return (
        <nav className="text-sm text-gray-600 mb-4">
          <Link href="/mn" className="hover:text-[#014463]">Minnesota</Link>
          <span className="mx-2">/</span>
          <Link href={`/mn/county/${locality.county.slug}`} className="hover:text-[#014463]">
            {locality.county.name} County
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">
            {status === 'for-sale' ? 'Homes for Sale' : 'Rentals'}
          </span>
        </nav>
      );
    } else if (locality.type === 'zip' && locality.zip) {
      return (
        <nav className="text-sm text-gray-600 mb-4">
          <Link href="/mn" className="hover:text-[#014463]">Minnesota</Link>
          <span className="mx-2">/</span>
          <Link href={`/mn/zip/${locality.zip.zip_code}`} className="hover:text-[#014463]">
            ZIP {locality.zip.zip_code}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">
            {status === 'for-sale' ? 'Homes for Sale' : 'Rentals'}
          </span>
        </nav>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {getBreadcrumb()}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {getPageTitle()}
          </h1>
          <p className="text-gray-600">
            {status === 'for-sale' 
              ? `Browse homes for sale in ${searchCity}, Minnesota`
              : `Find rental properties in ${searchCity}, Minnesota`
            }
          </p>
        </div>
      </div>

      {/* Address Search Section */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <SmartAddressSearch 
          pageType="property-search" 
          localityName={locality.type === 'city' && locality.city ? locality.city.name : 
                       locality.type === 'county' && locality.county ? locality.county.name :
                       locality.type === 'zip' && locality.zip ? locality.zip.zip_code : 'this area'}
        />
      </div>

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

      {/* Property Search Results */}
      <Suspense fallback={<PropertySearchSkeleton />}>
        <PropertySearchLayout
          city={searchCity}
          state="MN"
          status={propertyStatus}
        />
      </Suspense>
    </div>
  );
}
