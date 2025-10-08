'use client';

import { useState } from 'react';

interface MarketStats {
  median_price?: number;
  inventory_count?: number;
  dom?: number;
  trend_delta_30d?: number;
  price_per_sqft?: number;
  new_listings_30d?: number;
  sold_listings_30d?: number;
  market_activity?: 'hot' | 'balanced' | 'cool';
}

interface MarketStatsDisplayProps {
  cityName: string;
  marketStats?: MarketStats;
  className?: string;
}

export function MarketStatsDisplay({ cityName, marketStats, className = '' }: MarketStatsDisplayProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'trends'>('overview');

  if (!marketStats) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <div className="p-8 text-center">
          <div className="text-gray-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Market Data Coming Soon</h3>
          <p className="text-gray-600">We&apos;re gathering the latest market statistics for {cityName}.</p>
        </div>
      </div>
    );
  }

  const getMarketActivityColor = (activity?: string) => {
    switch (activity) {
      case 'hot': return 'text-red-600 bg-red-50';
      case 'cool': return 'text-blue-600 bg-blue-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  const getMarketActivityLabel = (activity?: string) => {
    switch (activity) {
      case 'hot': return 'Hot Market';
      case 'cool': return 'Cool Market';
      default: return 'Balanced Market';
    }
  };

  const getTrendIcon = (trend?: number) => {
    if (!trend) return null;
    if (trend > 0) {
      return (
        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
        </svg>
      );
    } else if (trend < 0) {
      return (
        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">{cityName} Market Overview</h3>
          {marketStats.market_activity && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getMarketActivityColor(marketStats.market_activity)}`}>
              {getMarketActivityLabel(marketStats.market_activity)}
            </span>
          )}
        </div>
        
        {/* Tab Navigation */}
        <div className="mt-4 flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-[#014463] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'trends'
                ? 'bg-white text-[#014463] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Trends
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {marketStats.median_price && (
              <div className="text-center">
                <div className="text-2xl font-bold text-[#014463] mb-1">
                  ${marketStats.median_price.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Median Price</div>
                <div className="text-xs text-gray-500 mt-1">All property types</div>
              </div>
            )}
            
            {marketStats.inventory_count !== undefined && (
              <div className="text-center">
                <div className="text-2xl font-bold text-[#014463] mb-1">
                  {marketStats.inventory_count}
                </div>
                <div className="text-sm text-gray-600">Active Listings</div>
                <div className="text-xs text-gray-500 mt-1">Currently available</div>
              </div>
            )}
            
            {marketStats.dom && (
              <div className="text-center">
                <div className="text-2xl font-bold text-[#014463] mb-1">
                  {marketStats.dom}
                </div>
                <div className="text-sm text-gray-600">Days on Market</div>
                <div className="text-xs text-gray-500 mt-1">Average time to sell</div>
              </div>
            )}
            
            {marketStats.price_per_sqft && (
              <div className="text-center">
                <div className="text-2xl font-bold text-[#014463] mb-1">
                  ${marketStats.price_per_sqft}
                </div>
                <div className="text-sm text-gray-600">Price per Sq Ft</div>
                <div className="text-xs text-gray-500 mt-1">Median value</div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Price Trend */}
            {marketStats.trend_delta_30d !== undefined && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">30-Day Price Trend</h4>
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(marketStats.trend_delta_30d)}
                    <span className={`text-sm font-medium ${
                      marketStats.trend_delta_30d > 0
                        ? 'text-green-600'
                        : marketStats.trend_delta_30d < 0
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}>
                      {marketStats.trend_delta_30d > 0 && '+'}
                      {marketStats.trend_delta_30d}%
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {marketStats.trend_delta_30d > 0
                    ? 'Prices are trending upward'
                    : marketStats.trend_delta_30d < 0
                    ? 'Prices are trending downward'
                    : 'Prices are stable'
                  }
                </p>
              </div>
            )}

            {/* Market Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {marketStats.new_listings_30d !== undefined && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <h4 className="font-medium text-gray-900">New Listings</h4>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {marketStats.new_listings_30d}
                  </div>
                  <div className="text-sm text-gray-600">Last 30 days</div>
                </div>
              )}

              {marketStats.sold_listings_30d !== undefined && (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="font-medium text-gray-900">Properties Sold</h4>
                  </div>
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {marketStats.sold_listings_30d}
                  </div>
                  <div className="text-sm text-gray-600">Last 30 days</div>
                </div>
              )}
            </div>

            {/* Market Insights */}
            <div className="bg-[#014463] text-white rounded-lg p-4">
              <h4 className="font-medium mb-2">Market Insight</h4>
              <p className="text-sm text-blue-100">
                {marketStats.market_activity === 'hot' 
                  ? `${cityName} is experiencing a competitive market with high demand and limited inventory.`
                  : marketStats.market_activity === 'cool'
                  ? `${cityName} has a buyer-friendly market with more inventory and negotiating power.`
                  : `${cityName} has a balanced market with healthy inventory levels and steady demand.`
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
