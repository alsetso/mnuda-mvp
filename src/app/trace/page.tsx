'use client';

import { useSessionManager } from '@/features/session/hooks/useSessionManager';
import AppHeader from '@/features/session/components/AppHeader';
import { useState, useEffect } from 'react';

export default function TracePage() {
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
            Skip Trace
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Find people, properties, and data across Minnesota with our professional skip tracing tools.
          </p>

          {/* Coming Soon Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 text-[#014463] text-sm font-medium mb-8">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Coming Soon
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Address Lookup</h3>
              <p className="text-gray-600 text-sm">Find current and previous addresses for any person in Minnesota.</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone Number Search</h3>
              <p className="text-gray-600 text-sm">Get current phone numbers and contact information for individuals.</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Property Records</h3>
              <p className="text-gray-600 text-sm">Access detailed property ownership and transaction history.</p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
            <p className="text-gray-600 mb-6">
              Our skip tracing tools will be available soon. In the meantime, explore our map and search features.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/map"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-[#014463] hover:bg-[#013a56] transition-colors duration-200"
              >
                Explore Map
              </a>
              <a
                href="/search"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                Try Search
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
