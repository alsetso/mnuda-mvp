/**
 * Counties Index with search and quick links
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { County } from '../services/localityService';

interface CountiesIndexProps {
  initialCounties: County[];
  initialTotal: number;
}

export default function CountiesIndex({
  initialCounties,
  initialTotal,
}: CountiesIndexProps) {
  const [counties] = useState<County[]>(initialCounties);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCounties = counties.filter((county) => {
    if (searchQuery && !county.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Minnesota Counties
        </h1>
        <p className="text-gray-600">
          Browse {initialTotal} counties across Minnesota
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search counties..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014463]"
        />
      </div>

      {/* Results */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredCounties.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No counties found matching your criteria.
            </div>
          ) : (
            filteredCounties.map((county) => (
              <div key={county.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Link
                      href={`/mn/county/${county.slug}`}
                      className="text-lg font-semibold text-[#014463] hover:underline"
                    >
                      {county.name} County
                    </Link>
                    {county.city_count !== undefined && (
                      <div className="text-sm text-gray-600 mt-1">
                        {county.city_count} cities
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex space-x-2">
                    <Link
                      href={`/mn/county/${county.slug}?status=for-sale`}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      For Sale
                    </Link>
                    <Link
                      href={`/mn/county/${county.slug}?status=for-rent`}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      For Rent
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-gray-600">
        Showing {filteredCounties.length} of {initialTotal} counties
      </div>
    </div>
  );
}

