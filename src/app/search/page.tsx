'use client';

import { useSessionManager } from '@/features/session/hooks/useSessionManager';
import AppHeader from '@/features/session/components/AppHeader';
import { useState, useEffect } from 'react';

export default function SearchPage() {
  const { 
    currentSession, 
    sessions,
    createNewSession, 
    switchSession
  } = useSessionManager();

  const [, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* App Header */}
      <AppHeader
        currentSession={currentSession}
        sessions={sessions}
        onNewSession={createNewSession}
        onSessionSwitch={switchSession}
        updateUrl={false}
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          {/* Page Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Property Search
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Search for properties, people, and data across Minnesota with our comprehensive search tools.
          </p>

          {/* Search Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-12">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Search Minnesota</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="search-query" className="block text-sm font-medium text-gray-700 mb-2">
                    What are you looking for?
                  </label>
                  <input
                    type="text"
                    id="search-query"
                    placeholder="Enter name, address, phone number, or property details..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#014463] focus:border-transparent"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="search-location" className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#014463] focus:border-transparent">
                      <option value="">All of Minnesota</option>
                      <option value="minneapolis">Minneapolis</option>
                      <option value="saint-paul">Saint Paul</option>
                      <option value="rochester">Rochester</option>
                      <option value="duluth">Duluth</option>
                      <option value="bloomington">Bloomington</option>
                      <option value="brooklyn-park">Brooklyn Park</option>
                      <option value="plymouth">Plymouth</option>
                      <option value="st-cloud">St. Cloud</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="search-type" className="block text-sm font-medium text-gray-700 mb-2">
                      Search Type
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#014463] focus:border-transparent">
                      <option value="all">All Results</option>
                      <option value="people">People</option>
                      <option value="properties">Properties</option>
                      <option value="businesses">Businesses</option>
                      <option value="phone">Phone Numbers</option>
                    </select>
                  </div>
                </div>
                
                <button className="w-full sm:w-auto bg-[#014463] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#013a56] transition-colors duration-200">
                  Search Now
                </button>
              </div>
            </div>
          </div>

          {/* Search Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">People Search</h3>
              <p className="text-gray-600 text-sm">Find people by name, phone number, or address across Minnesota.</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Property Search</h3>
              <p className="text-gray-600 text-sm">Search properties by address, owner, or property details.</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Search</h3>
              <p className="text-gray-600 text-sm">Find businesses and their contact information across Minnesota.</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <a
                href="/map"
                className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Map View
              </a>
              <a
                href="/trace"
                className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Skip Trace
              </a>
              <a
                href="/usage"
                className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Usage Stats
              </a>
              <a
                href="/account"
                className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Account
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
