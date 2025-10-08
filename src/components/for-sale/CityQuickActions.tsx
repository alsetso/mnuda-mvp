'use client';

import { useRouter } from 'next/navigation';
import { PropertyStatus } from './types';

interface CityQuickActionsProps {
  title?: string;
  className?: string;
  showTitle?: boolean;
  status?: PropertyStatus;
  layout?: 'grid' | 'list';
}

const MINNESOTA_CITIES = [
  'Plymouth',
  'Maple Grove',
  'Eden Prairie',
  'Woodbury',
  'Rochester',
  'Bloomington',
  'Edina',
  'Lakeville',
  'Eagan',
  'Blaine',
  'Burnsville',
  'Minnetonka',
  'St. Louis Park',
  'Shakopee',
  'Roseville',
  'Savage',
  'Mankato'
];

export function CityQuickActions({ 
  title = "Explore Minnesota Cities", 
  className = "",
  showTitle = true,
  status = 'forSale',
  layout = 'grid'
}: CityQuickActionsProps) {
  const router = useRouter();

  const handleCityClick = (city: string) => {
    const slug = city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const marketplaceType = status === 'forRent' ? 'for-rent' : 'for-sale';
    router.push(`/marketplace/${marketplaceType}/${slug}?city=${encodeURIComponent(city)}&state=MN&status=${status}`);
  };

  const getStatusText = () => {
    switch (status) {
      case 'forSale':
        return 'Explore homes for sale in Minnesota\'s most desirable cities';
      case 'forRent':
        return 'Explore rental properties in Minnesota\'s most desirable cities';
      case 'recentlySold':
        return 'Explore recently sold homes in Minnesota\'s most desirable cities';
      default:
        return 'Explore properties in Minnesota\'s most desirable cities';
    }
  };

  const getActionText = () => {
    switch (status) {
      case 'forSale':
        return 'Click any city to view available homes for sale';
      case 'forRent':
        return 'Click any city to view available rental properties';
      case 'recentlySold':
        return 'Click any city to view recently sold homes';
      default:
        return 'Click any city to view available properties';
    }
  };

  return (
    <div className={`bg-white border-t border-gray-200 py-8 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {showTitle && (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              {title}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {getStatusText()}
            </p>
          </div>
        )}
        
        {layout === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {MINNESOTA_CITIES.map((city) => (
              <button
                key={city}
                onClick={() => handleCityClick(city)}
                className="group relative p-4 text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">
                    {city}
                  </span>
                  <svg 
                    className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {MINNESOTA_CITIES.map((city) => (
              <button
                key={city}
                onClick={() => handleCityClick(city)}
                className="group w-full p-4 text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-gray-900 group-hover:text-blue-900 transition-colors">
                    {city}
                  </span>
                  <svg 
                    className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            {getActionText()}
          </p>
        </div>
      </div>
    </div>
  );
}
