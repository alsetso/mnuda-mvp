'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface FeaturedCity {
  name: string;
  slug: string;
  county_name: string;
  population: number | null;
  medianPrice?: string;
}

interface FeaturedCitiesProps {
  maxCities?: number;
}

export default function FeaturedCities({ maxCities = 6 }: FeaturedCitiesProps) {
  const [cities, setCities] = useState<FeaturedCity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedCities = async () => {
      try {
        const response = await fetch('/api/localities/mn?limit=6&priority=true');
        if (response.ok) {
          const data = await response.json();
          setCities(data.cities || []);
        } else {
          // Fallback to static data if API fails - Top 6 most popular MN cities
          setCities([
            { name: 'Minneapolis', slug: 'minneapolis', county_name: 'Hennepin', population: 429606, medianPrice: '$315,000' },
            { name: 'Saint Paul', slug: 'saint-paul', county_name: 'Ramsey', population: 311527, medianPrice: '$275,000' },
            { name: 'Rochester', slug: 'rochester', county_name: 'Olmsted', population: 121395, medianPrice: '$285,000' },
            { name: 'Duluth', slug: 'duluth', county_name: 'St. Louis', population: 86697, medianPrice: '$195,000' },
            { name: 'Bloomington', slug: 'bloomington', county_name: 'Hennepin', population: 89987, medianPrice: '$385,000' },
            { name: 'Brooklyn Park', slug: 'brooklyn-park', county_name: 'Hennepin', population: 86119, medianPrice: '$295,000' },
          ]);
        }
      } catch (error) {
        console.error('Error fetching featured cities:', error);
        // Fallback to static data - Top 6 most popular MN cities
        setCities([
          { name: 'Minneapolis', slug: 'minneapolis', county_name: 'Hennepin', population: 429606, medianPrice: '$315,000' },
          { name: 'Saint Paul', slug: 'saint-paul', county_name: 'Ramsey', population: 311527, medianPrice: '$275,000' },
          { name: 'Rochester', slug: 'rochester', county_name: 'Olmsted', population: 121395, medianPrice: '$285,000' },
          { name: 'Duluth', slug: 'duluth', county_name: 'St. Louis', population: 86697, medianPrice: '$195,000' },
          { name: 'Bloomington', slug: 'bloomington', county_name: 'Hennepin', population: 89987, medianPrice: '$385,000' },
          { name: 'Brooklyn Park', slug: 'brooklyn-park', county_name: 'Hennepin', population: 86119, medianPrice: '$295,000' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedCities();
  }, []);

  const formatPopulation = (population: number | null) => {
    if (!population) return 'N/A';
    return population.toLocaleString();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: maxCities }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 animate-pulse">
            <div className="text-center">
              <div className="w-8 h-8 bg-gray-200 rounded-lg mx-auto mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-16 mx-auto mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-12 mx-auto mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-10 mx-auto mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-14 mx-auto"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cities.slice(0, maxCities).map((city, index) => (
        <Link
          key={city.slug}
          href={`/buy/mn/${city.slug}`}
          className="group bg-white rounded-lg p-4 border border-gray-200 hover:border-[#014463] transition-all duration-200 hover:shadow-md"
        >
          <div className="text-center">
            <div className="w-8 h-8 bg-[#014463] rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-[#013a56] transition-colors">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            
            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#014463] transition-colors mb-1">
              {city.name}
            </h3>
            
            <p className="text-xs text-gray-500 mb-2">{city.county_name}</p>
            
            <div className="text-xs text-gray-600">
              <div className="mb-1">{formatPopulation(city.population)}</div>
              {city.medianPrice && (
                <div className="text-[#014463] font-medium">{city.medianPrice}</div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
