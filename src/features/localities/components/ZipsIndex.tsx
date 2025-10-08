/**
 * ZIPs Index with search and quick links
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Zip } from '../services/localityService';

interface ZipsIndexProps {
  initialZips: Zip[];
  initialTotal: number;
}

export default function ZipsIndex({
  initialZips,
  initialTotal,
}: ZipsIndexProps) {
  const [zips] = useState<Zip[]>(initialZips);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredZips = zips.filter((zip) => {
    if (searchQuery && !zip.zip_code.includes(searchQuery)) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Minnesota ZIP Codes
        </h1>
        <p className="text-gray-600">
          Browse {initialTotal} ZIP codes across Minnesota
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search ZIP codes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014463]"
        />
      </div>

      {/* Results - Grid layout for ZIPs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredZips.length === 0 ? (
          <div className="col-span-full px-6 py-12 text-center text-gray-500">
            No ZIP codes found matching your criteria.
          </div>
        ) : (
          filteredZips.map((zip) => (
            <Link
              key={zip.id}
              href={`/mn/zip/${zip.zip_code}`}
              className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-[#014463] transition-all text-center"
            >
              <div className="text-lg font-semibold text-[#014463]">
                {zip.zip_code}
              </div>
              {zip.city_count !== undefined && (
                <div className="text-xs text-gray-600 mt-1">
                  {zip.city_count} {zip.city_count === 1 ? 'city' : 'cities'}
                </div>
              )}
            </Link>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-gray-600">
        Showing {filteredZips.length} of {initialTotal} ZIP codes
      </div>
    </div>
  );
}

