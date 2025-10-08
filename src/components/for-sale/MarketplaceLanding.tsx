'use client';

import { CityQuickActions } from './CityQuickActions';
import { PropertyStatus } from './types';

interface MarketplaceLandingProps {
  status: PropertyStatus;
  className?: string;
}

export function MarketplaceLanding({ status, className = '' }: MarketplaceLandingProps) {
  const getPageTitle = () => {
    switch (status) {
      case 'forSale':
        return 'Homes for Sale in Minnesota';
      case 'forRent':
        return 'Homes for Rent in Minnesota';
      case 'recentlySold':
        return 'Recently Sold Homes in Minnesota';
      default:
        return 'Properties in Minnesota';
    }
  };

  const getPageDescription = () => {
    switch (status) {
      case 'forSale':
        return 'Discover your dream home in Minnesota\'s most desirable cities. Browse thousands of homes for sale with detailed property information and market insights.';
      case 'forRent':
        return 'Find your perfect rental home in Minnesota. Explore available properties in top-rated cities with comprehensive rental information.';
      case 'recentlySold':
        return 'Research the Minnesota real estate market with recently sold home data. Compare prices and trends across different cities.';
      default:
        return 'Explore Minnesota real estate opportunities across our most popular cities.';
    }
  };

  const getCityTitle = () => {
    switch (status) {
      case 'forSale':
        return 'Popular Cities for Home Buyers';
      case 'forRent':
        return 'Top Rental Markets';
      case 'recentlySold':
        return 'Active Real Estate Markets';
      default:
        return 'Explore Minnesota Cities';
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {getPageTitle()}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              {getPageDescription()}
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">17+</div>
                <div className="text-sm text-gray-500">Cities</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">1000s</div>
                <div className="text-sm text-gray-500">Properties</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
                <div className="text-sm text-gray-500">Updated</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* City Quick Actions */}
      <CityQuickActions 
        title={getCityTitle()}
        status={status}
        layout="grid"
        showTitle={true}
      />

      {/* Additional Info Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Why Choose Minnesota?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Minnesota offers exceptional quality of life with top-rated schools, 
              thriving job markets, and beautiful natural landscapes. Whether you&apos;re 
              buying, renting, or researching the market, our comprehensive property 
              data helps you make informed decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
