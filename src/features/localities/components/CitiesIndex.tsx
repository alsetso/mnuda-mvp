/**
 * Cities Index with A-Z navigation, search, pagination, and editorial preview toggle
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { City } from '../services/localityService';

interface CitiesIndexProps {
  initialCities: City[];
  initialTotal: number;
  showEditorial?: boolean;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function CitiesIndex({
  initialCities,
  initialTotal,
  showEditorial = false,
}: CitiesIndexProps) {
  const [cities] = useState<City[]>(initialCities);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editorialPreview, setEditorialPreview] = useState(false);

  const filteredCities = cities.filter((city) => {
    if (searchQuery && !city.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedLetter && !city.name.toUpperCase().startsWith(selectedLetter)) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Minnesota Cities
        </h1>
        <p className="text-gray-600">
          Browse {initialTotal.toLocaleString()} cities across Minnesota
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014463]"
          />
          {showEditorial && (
            <button
              onClick={() => setEditorialPreview(!editorialPreview)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                editorialPreview
                  ? 'bg-[#014463] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {editorialPreview ? 'Hide' : 'Show'} Editorial
            </button>
          )}
        </div>

        {/* A-Z Navigation */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedLetter(null)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              selectedLetter === null
                ? 'bg-[#014463] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {ALPHABET.map((letter) => (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedLetter === letter
                  ? 'bg-[#014463] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredCities.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No cities found matching your criteria.
            </div>
          ) : (
            filteredCities.map((city) => (
              <div key={city.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link
                      href={`/mn/${city.slug}`}
                      className="text-lg font-semibold text-[#014463] hover:underline"
                    >
                      {city.name}
                    </Link>
                    <div className="text-sm text-gray-600 mt-1">
                      {city.county_name && (
                        <span>
                          {city.county_name} County
                          {city.population && ` • ${city.population.toLocaleString()} residents`}
                        </span>
                      )}
                    </div>

                    {/* Editorial Preview */}
                    {editorialPreview && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm space-y-1">
                        <div>
                          <span className="font-medium text-blue-900">SEO Title:</span>
                          <span className="text-blue-800 ml-2">
                            {city.name}, MN Homes For Sale
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-blue-900">H1:</span>
                          <span className="text-blue-800 ml-2">
                            {city.name}, MN Homes For Sale
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-blue-900">Meta:</span>
                          <span className="text-blue-800 ml-2">
                            Browse homes for sale in {city.name}, Minnesota.
                          </span>
                        </div>
                        <div className="pt-2">
                          <a
                            href={`/admin/cities/${city.slug}`}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            Edit →
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex space-x-2">
                    <Link
                      href={`/mn/${city.slug}?status=for-sale`}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      For Sale
                    </Link>
                    <Link
                      href={`/mn/${city.slug}?status=for-rent`}
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
        Showing {filteredCities.length} of {initialTotal} cities
      </div>
    </div>
  );
}

