'use client';

import { useState } from 'react';
import Link from 'next/link';

interface City {
  id: string;
  name: string;
  slug: string;
  population: string;
  county: string;
}

interface County {
  id: string;
  name: string;
  slug: string;
  population: string;
  area: string;
}

interface CitiesAndCountiesSidebarProps {
  cities: City[];
  counties: County[];
}

export default function CitiesAndCountiesSidebar({ cities, counties }: CitiesAndCountiesSidebarProps) {
  const [showAllCities, setShowAllCities] = useState(false);
  const [showAllCounties, setShowAllCounties] = useState(false);
  const displayCount = 5; // Show fewer items since they're side by side
  
  const hasMoreCities = cities.length > displayCount;
  const hasMoreCounties = counties.length > displayCount;
  const displayedCities = showAllCities ? cities : cities.slice(0, displayCount);
  const displayedCounties = showAllCounties ? counties : counties.slice(0, displayCount);

  return (
    <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
        <h2 className="text-xs font-semibold text-gray-900">
          Explore Minnesota
        </h2>
        <p className="text-xs text-gray-600 mt-0.5">
          Discover cities and counties across Minnesota.
        </p>
      </div>

      {/* Cities and Counties Side by Side */}
      <div className="p-[10px] grid grid-cols-2 gap-3">
        {/* Cities Column */}
        <div>
          <h3 className="text-xs font-semibold text-gray-900 mb-1.5">Cities</h3>
          <div className="space-y-0.5">
            {displayedCities.map((city) => (
              <Link
                key={city.id}
                href={`/explore/city/${city.slug}`}
                className="block px-1.5 py-1 rounded hover:bg-gray-50 transition-colors group"
              >
                <h4 className="text-xs font-medium text-gray-900 group-hover:text-gray-700 transition-colors leading-tight">
                  {city.name}
                </h4>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {city.population}
                </div>
              </Link>
            ))}
          </div>
          {hasMoreCities && (
            <button
              onClick={() => setShowAllCities(!showAllCities)}
              className="mt-1.5 w-full px-2 py-1 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
            >
              {showAllCities ? 'Show Less' : `+${cities.length - displayCount} more`}
            </button>
          )}
        </div>

        {/* Counties Column */}
        <div>
          <h3 className="text-xs font-semibold text-gray-900 mb-1.5">Counties</h3>
          <div className="space-y-0.5">
            {displayedCounties.map((county) => (
              <Link
                key={county.id}
                href={`/explore/county/${county.slug}`}
                className="block px-1.5 py-1 rounded hover:bg-gray-50 transition-colors group"
              >
                <h4 className="text-xs font-medium text-gray-900 group-hover:text-gray-700 transition-colors leading-tight">
                  {county.name}
                </h4>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {county.population}
                </div>
              </Link>
            ))}
          </div>
          {hasMoreCounties && (
            <button
              onClick={() => setShowAllCounties(!showAllCounties)}
              className="mt-1.5 w-full px-2 py-1 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
            >
              {showAllCounties ? 'Show Less' : `+${counties.length - displayCount} more`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
