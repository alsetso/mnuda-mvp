/**
 * Minnesota Locality Menu - search-first mega menu with tabs for Cities/Counties/ZIPs
 * Uses real database data for dynamic search and navigation
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { City, County, Zip } from '../services/localityService';

interface MinnesotaLocalityMenuProps {
  className?: string;
}

type TabType = 'cities' | 'counties' | 'zips';

interface MinnesotaLocalityMenuData {
  cities: City[];
  counties: County[];
  zips: Zip[];
}

export default function MinnesotaLocalityMenu({ className = '' }: MinnesotaLocalityMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('cities');
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<MinnesotaLocalityMenuData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUnifiedSearch, setShowUnifiedSearch] = useState(false);
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if any MN locality page is currently active
  const isActive = pathname?.startsWith('/mn');

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchQuery('');
      setShowUnifiedSearch(false);
    }
  };

  // Auto-switch to unified search when typing
  useEffect(() => {
    if (searchQuery.trim()) {
      setShowUnifiedSearch(true);
    } else {
      setShowUnifiedSearch(false);
    }
  }, [searchQuery]);

  // Fetch data when dropdown opens
  useEffect(() => {
    if (isOpen && !data) {
      fetchData();
    }
  }, [isOpen, data]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/localities/mn');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch locality data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fuzzy search function
  const fuzzySearch = (query: string, text: string): boolean => {
    if (!query) return true;
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Exact match gets highest priority
    if (textLower.includes(queryLower)) return true;
    
    // Fuzzy matching - check if all characters in query appear in order
    let queryIndex = 0;
    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
      if (textLower[i] === queryLower[queryIndex]) {
        queryIndex++;
      }
    }
    return queryIndex === queryLower.length;
  };

  // Filter data by search query with fuzzy search
  const filteredCities = data?.cities.filter((city) =>
    fuzzySearch(searchQuery, city.name) || 
    (city.county_name && fuzzySearch(searchQuery, city.county_name))
  ) || [];

  const filteredCounties = data?.counties.filter((county) =>
    fuzzySearch(searchQuery, county.name)
  ) || [];

  const filteredZips = data?.zips.filter((zip) =>
    fuzzySearch(searchQuery, zip.zip_code)
  ) || [];

  // Combined search results for unified view
  const combinedResults = [
    ...filteredCities.slice(0, 10).map(city => ({ type: 'city' as const, data: city })),
    ...filteredCounties.slice(0, 10).map(county => ({ type: 'county' as const, data: county })),
    ...filteredZips.slice(0, 10).map(zip => ({ type: 'zip' as const, data: zip }))
  ].slice(0, 10); // Limit to 10 total results

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        onClick={handleToggle}
        className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-1 ${
          isActive
            ? 'bg-[#014463] text-white shadow-sm'
            : 'text-gray-700 hover:text-[#014463] hover:bg-gray-50 hover:scale-105'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>Minnesota</span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Mega Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-[350px] bg-white border border-gray-200 rounded-lg shadow-xl z-50">
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search cities, counties, or ZIP codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014463]"
              autoFocus
            />
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('cities')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === 'cities'
                  ? 'bg-[#014463] text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cities
            </button>
            <button
              onClick={() => setActiveTab('counties')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === 'counties'
                  ? 'bg-[#014463] text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Counties
            </button>
            <button
              onClick={() => setActiveTab('zips')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === 'zips'
                  ? 'bg-[#014463] text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              ZIP Codes
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-3 max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#014463]"></div>
                <span className="ml-2 text-xs text-gray-600">Loading...</span>
              </div>
            ) : showUnifiedSearch ? (
              /* Unified Search Results */
              <div className="space-y-2">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    Search Results ({combinedResults.length})
                  </h3>
                  <div className="space-y-1">
                    {combinedResults.length === 0 ? (
                      <p className="text-xs text-gray-500">
                        No results found matching &quot;{searchQuery}&quot;.
                      </p>
                    ) : (
                      combinedResults.map((result) => (
                        <Link
                          key={`${result.type}-${
                            result.data.id || 
                            (result.type === 'city' ? (result.data as City).slug : 
                             result.type === 'county' ? (result.data as County).slug : 
                             (result.data as Zip).zip_code)
                          }`}
                          href={
                            result.type === 'city' ? `/mn/${result.data.slug}` :
                            result.type === 'county' ? `/mn/county/${result.data.slug}` :
                            `/mn/zip/${result.data.zip_code}`
                          }
                          className="block p-2 rounded hover:bg-gray-50 transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <div className="flex items-center space-x-2">
                            <div className="flex-1">
                              <div className="text-xs font-medium text-gray-900">
                                {result.type === 'city' ? result.data.name : 
                                 result.type === 'county' ? `${result.data.name} County` : 
                                 result.data.zip_code}
                              </div>
                              {result.type === 'city' && result.data.county_name && (
                                <div className="text-xs text-gray-500">
                                  {result.data.county_name} County
                                </div>
                              )}
                              {result.type === 'county' && result.data.city_count && (
                                <div className="text-xs text-gray-500">
                                  {result.data.city_count} cities
                                </div>
                              )}
                              {result.type === 'zip' && result.data.city_count && (
                                <div className="text-xs text-gray-500">
                                  {result.data.city_count} cities
                                </div>
                              )}
                            </div>
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {activeTab === 'cities' && (
                  <div className="space-y-2">
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                        {searchQuery ? `Results (${filteredCities.length})` : 'Cities'}
                      </h3>
                      <div className="space-y-1 max-h-[200px] overflow-y-auto">
                        {filteredCities.length === 0 ? (
                          <p className="text-xs text-gray-500">
                            {searchQuery ? 'No cities found matching your search.' : 'No cities available.'}
                          </p>
                        ) : (
                          filteredCities.slice(0, 8).map((city) => (
                            <Link
                              key={city.slug}
                              href={`/mn/${city.slug}`}
                              className="block p-2 rounded hover:bg-gray-50 transition-colors"
                              onClick={() => setIsOpen(false)}
                            >
                              <div className="flex items-center space-x-2">
                                <div className="flex-1">
                                  <div className="text-xs font-medium text-gray-900">
                                    {city.name}
                                  </div>
                                  {city.county_name && (
                                    <div className="text-xs text-gray-500">
                                      {city.county_name} County
                                    </div>
                                  )}
                                </div>
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>

                    {/* View All Link */}
                    <div className="pt-1 border-t border-gray-200">
                      <Link
                        href="/mn/cities"
                        className="block text-xs text-[#014463] hover:underline font-medium"
                        onClick={() => setIsOpen(false)}
                      >
                        View All Cities →
                      </Link>
                    </div>
                  </div>
                )}

                {activeTab === 'counties' && (
                  <div className="space-y-2">
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                        {searchQuery ? `Results (${filteredCounties.length})` : 'Counties'}
                      </h3>
                      <div className="space-y-1 max-h-[200px] overflow-y-auto">
                        {filteredCounties.length === 0 ? (
                          <p className="text-xs text-gray-500">
                            {searchQuery ? 'No counties found matching your search.' : 'No counties available.'}
                          </p>
                        ) : (
                          filteredCounties.slice(0, 8).map((county) => (
                            <Link
                              key={county.slug}
                              href={`/mn/county/${county.slug}`}
                              className="block p-2 rounded hover:bg-gray-50 transition-colors"
                              onClick={() => setIsOpen(false)}
                            >
                              <div className="flex items-center space-x-2">
                                <div className="flex-1">
                                  <div className="text-xs font-medium text-gray-900">
                                    {county.name} County
                                  </div>
                                  {county.city_count && (
                                    <div className="text-xs text-gray-500">
                                      {county.city_count} cities
                                    </div>
                                  )}
                                </div>
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>

                    {/* View All Link */}
                    <div className="pt-1 border-t border-gray-200">
                      <Link
                        href="/mn/counties"
                        className="block text-xs text-[#014463] hover:underline font-medium"
                        onClick={() => setIsOpen(false)}
                      >
                        View All Counties →
                      </Link>
                    </div>
                  </div>
                )}

                {activeTab === 'zips' && (
                  <div className="space-y-2">
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                        {searchQuery ? `Results (${filteredZips.length})` : 'ZIP Codes'}
                      </h3>
                      <div className="grid grid-cols-2 gap-1 max-h-[200px] overflow-y-auto">
                        {filteredZips.length === 0 ? (
                          <div className="col-span-2">
                            <p className="text-xs text-gray-500">
                              {searchQuery ? 'No ZIP codes found matching your search.' : 'No ZIP codes available.'}
                            </p>
                          </div>
                        ) : (
                          filteredZips.slice(0, 8).map((zip) => (
                            <Link
                              key={zip.zip_code}
                              href={`/mn/zip/${zip.zip_code}`}
                              className="block p-2 rounded hover:bg-gray-50 transition-colors"
                              onClick={() => setIsOpen(false)}
                            >
                              <div className="flex items-center space-x-2">
                                <div className="flex-1">
                                  <div className="text-xs font-medium text-gray-900">
                                    {zip.zip_code}
                                  </div>
                                  {zip.city_count && (
                                    <div className="text-xs text-gray-500">
                                      {zip.city_count} cities
                                    </div>
                                  )}
                                </div>
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>

                    {/* View All Link */}
                    <div className="pt-1 border-t border-gray-200">
                      <Link
                        href="/mn/zips"
                        className="block text-xs text-[#014463] hover:underline font-medium"
                        onClick={() => setIsOpen(false)}
                      >
                        View All ZIP Codes →
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

