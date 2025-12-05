'use client';

import { useState } from 'react';
import Link from 'next/link';

interface City {
  id: string;
  name: string;
  slug: string;
  population: string; // Pre-formatted string
  county: string;
}

interface County {
  id: string;
  name: string;
  slug: string;
  population: string; // Pre-formatted string
  area: string; // Pre-formatted string
}

type LocationListSidebarProps = 
  | { type: 'city'; locations: City[] }
  | { type: 'county'; locations: County[] };

export default function LocationListSidebar(props: LocationListSidebarProps) {
  const [showAll, setShowAll] = useState(false);
  const displayCount = 10;
  const hasMore = props.locations.length > displayCount;
  const displayedLocations = showAll ? props.locations : props.locations.slice(0, displayCount);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#dfdedc] p-4 lg:sticky lg:top-6">
      <h2 className="text-lg font-bold text-gray-900 mb-2">
        {props.type === 'city' ? 'Other Minnesota Cities' : 'All Minnesota Counties'}
      </h2>
      <p className="text-xs text-gray-600 mb-3">
        {props.type === 'city' 
          ? 'Explore other cities in the great state of Minnesota.'
          : 'Explore all 87 counties that make up the great state of Minnesota.'}
      </p>

      <div className="space-y-1">
        {displayedLocations.map((location) => (
          <Link
            key={location.id}
            href={props.type === 'city' ? `/explore/city/${location.slug}` : `/explore/county/${location.slug}`}
            className="block p-2 rounded hover:bg-gray-50 transition-colors group"
          >
            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
              {location.name}
            </h3>
            <div className="text-xs text-gray-500 mt-0.5">
              {props.type === 'city' ? (
                <span>{location.population} · {(location as City).county}</span>
              ) : (
                <span>{location.population} · {(location as County).area}</span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 w-full px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
        >
          {showAll ? 'Show Less' : `See More (${props.locations.length - displayCount} more)`}
        </button>
      )}
    </div>
  );
}
