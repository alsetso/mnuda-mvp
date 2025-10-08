/**
 * Compact, collapsible cities list for county and ZIP pages
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

interface City {
  id: number;
  name: string;
  slug: string;
  population?: number;
}

interface CompactCitiesListProps {
  cities: City[];
  title: string;
  vertical: string;
  maxVisible?: number;
}

export default function CompactCitiesList({ 
  cities, 
  title, 
  vertical, 
  maxVisible = 12 
}: CompactCitiesListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const visibleCities = isExpanded ? cities : cities.slice(0, maxVisible);
  const hasMoreCities = cities.length > maxVisible;
  const remainingCount = cities.length - maxVisible;

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {title}
          </h2>
          {hasMoreCities && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-[#014463] hover:text-[#0a5a7a] font-medium"
            >
              {isExpanded ? 'Show Less' : `Show All ${cities.length} Cities`}
            </button>
          )}
        </div>
        
        {/* Compact grid layout */}
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
          {visibleCities.map((city) => (
            <Link
              key={city.id}
              href={`/${vertical}/mn/${city.slug}`}
              className="block p-2 bg-gray-50 rounded border border-gray-200 hover:border-[#014463] hover:bg-blue-50 transition-all group"
            >
              <div className="text-sm font-medium text-gray-900 group-hover:text-[#014463] truncate">
                {city.name}
              </div>
              {city.population && (
                <div className="text-xs text-gray-500 mt-0.5">
                  {city.population >= 1000 
                    ? `${(city.population / 1000).toFixed(1)}k`
                    : city.population.toLocaleString()
                  }
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* Show remaining count when collapsed */}
        {!isExpanded && hasMoreCities && (
          <div className="mt-3 text-center">
            <button
              onClick={() => setIsExpanded(true)}
              className="text-sm text-gray-600 hover:text-[#014463] font-medium"
            >
              + {remainingCount} more cities
            </button>
          </div>
        )}

        {/* Summary stats */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {cities.length} {cities.length === 1 ? 'city' : 'cities'} in this area
            </span>
            {cities.some(city => city.population) && (
              <span>
                Total population: {cities
                  .filter(city => city.population)
                  .reduce((sum, city) => sum + (city.population || 0), 0)
                  .toLocaleString()
                }
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
