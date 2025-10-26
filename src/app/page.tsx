'use client';

import Link from 'next/link';
import { useSessionManager } from '@/features/session/hooks/useSessionManager';
import AppHeader from '@/features/session/components/AppHeader';
import { useState, useEffect } from 'react';

export default function Home() {
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

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Minnesota Skip Trace Tool",
    "description": "Free Minnesota skip tracing tool to find people, properties, and data instantly. No sign-up required.",
    "url": "https://mnuda.com",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Free skip tracing",
      "Minnesota property search",
      "People search",
      "Address lookup",
      "Phone number search",
      "No registration required"
    ],
    "provider": {
      "@type": "Organization",
      "name": "MNUDA",
      "url": "https://mnuda.com"
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      {/* App Header */}
      <AppHeader
        currentSession={currentSession}
        sessions={sessions}
        onNewSession={createNewSession}
        onSessionSwitch={switchSession}
        updateUrl={false}
      />

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-[#014463] text-sm font-medium mb-6">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Free • No Sign-up • Privacy First
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Minnesota User Data App
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Find people, properties, and data across Minnesota instantly. 
              Professional skip tracing tools available to everyone, completely free.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Link 
                href={currentSession ? `/map?session=${currentSession.id}` : '/map'} 
                className="inline-flex items-center justify-center px-6 py-3 bg-[#014463] text-white text-sm font-semibold rounded-lg hover:bg-[#013a56] transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Start Skip Tracing
              </Link>
              <Link 
                href="/" 
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-[#014463] border border-[#014463] text-sm font-semibold rounded-lg hover:bg-blue-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Browse Properties
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-gray-500">
              <div className="flex items-center">
                <svg className="w-3 h-3 mr-1 text-[#014463]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Your searches stay private
              </div>
              <div className="flex items-center">
                <svg className="w-3 h-3 mr-1 text-[#014463]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Results in under 3 seconds
              </div>
              <div className="flex items-center">
                <svg className="w-3 h-3 mr-1 text-[#014463]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Always free, no limits
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tools Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Core Tools
            </h2>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Three powerful tools to help you find people, properties, and data in Minnesota
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Map Tool */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#014463] transition-colors">
              <div className="w-10 h-10 bg-[#014463] rounded-md flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Interactive Map</h3>
              <p className="text-sm text-gray-600 mb-3">
                Visualize addresses, properties, and locations across Minnesota with our interactive mapping tool.
              </p>
              <Link 
                href={currentSession ? `/map?session=${currentSession.id}` : '/map'} 
                className="inline-flex items-center px-4 py-2 bg-[#014463] text-white text-xs font-semibold rounded-md hover:bg-[#013a56] transition-colors"
              >
                Open Map
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Trace Tool */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#014463] transition-colors">
              <div className="w-10 h-10 bg-[#014463] rounded-md flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Skip Trace</h3>
              <p className="text-sm text-gray-600 mb-3">
                Find people, addresses, phone numbers, and family connections. Our skip tracing tool 
                searches comprehensive Minnesota databases.
              </p>
              <Link 
                href={currentSession ? `/map?session=${currentSession.id}` : '/map'} 
                className="inline-flex items-center px-4 py-2 bg-[#014463] text-white text-xs font-semibold rounded-md hover:bg-[#013a56] transition-colors"
              >
                Start Tracing
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Property Search Tool */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#014463] transition-colors">
              <div className="w-10 h-10 bg-[#014463] rounded-md flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Property Search</h3>
              <p className="text-sm text-gray-600 mb-3">
                Browse Minnesota properties for sale and rent. Access detailed property information, 
                photos, and market data.
              </p>
              <Link 
                href="/" 
                className="inline-flex items-center px-4 py-2 bg-[#014463] text-white text-xs font-semibold rounded-md hover:bg-[#013a56] transition-colors"
              >
                Browse Properties
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* App Functions Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Skip Tracing Functions
            </h2>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Everything you need to find people, properties, and data in Minnesota
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* People Search */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#014463] transition-colors">
              <div className="w-8 h-8 bg-[#014463] rounded-md flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">People Search</h3>
              <p className="text-xs text-gray-600 mb-2">
                Find current addresses, phone numbers, and contact information for anyone in Minnesota.
              </p>
              <ul className="text-xs text-gray-500 space-y-0.5">
                <li>• Name-based search</li>
                <li>• Phone number lookup</li>
                <li>• Email address finder</li>
                <li>• Family connections</li>
              </ul>
            </div>

            {/* Property Search */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#014463] transition-colors">
              <div className="w-8 h-8 bg-[#014463] rounded-md flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Property Search</h3>
              <p className="text-xs text-gray-600 mb-2">
                Access property records, ownership history, and real estate data across Minnesota.
              </p>
              <ul className="text-xs text-gray-500 space-y-0.5">
                <li>• Property ownership</li>
                <li>• Tax assessments</li>
                <li>• Sales history</li>
                <li>• Zoning information</li>
              </ul>
            </div>

            {/* Address Lookup */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#014463] transition-colors">
              <div className="w-8 h-8 bg-[#014463] rounded-md flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Address Lookup</h3>
              <p className="text-xs text-gray-600 mb-2">
                Get detailed information about any address in Minnesota, including residents and property details.
              </p>
              <ul className="text-xs text-gray-500 space-y-0.5">
                <li>• Current residents</li>
                <li>• Property details</li>
                <li>• Neighborhood data</li>
                <li>• School districts</li>
              </ul>
            </div>

            {/* Phone Search */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#014463] transition-colors">
              <div className="w-8 h-8 bg-[#014463] rounded-md flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Phone Search</h3>
              <p className="text-xs text-gray-600 mb-2">
                Reverse phone number lookup to find the owner and associated information.
              </p>
              <ul className="text-xs text-gray-500 space-y-0.5">
                <li>• Phone number owner</li>
                <li>• Associated addresses</li>
                <li>• Carrier information</li>
                <li>• Line type detection</li>
              </ul>
            </div>

            {/* Business Search */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#014463] transition-colors">
              <div className="w-8 h-8 bg-[#014463] rounded-md flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Business Search</h3>
              <p className="text-xs text-gray-600 mb-2">
                Find business information, owners, and contact details for Minnesota companies.
              </p>
              <ul className="text-xs text-gray-500 space-y-0.5">
                <li>• Business registration</li>
                <li>• Owner information</li>
                <li>• Contact details</li>
                <li>• Business address</li>
              </ul>
            </div>

            {/* Data Export */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#014463] transition-colors">
              <div className="w-8 h-8 bg-[#014463] rounded-md flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Data Export</h3>
              <p className="text-xs text-gray-600 mb-2">
                Export your search results in multiple formats for further analysis and record keeping.
              </p>
              <ul className="text-xs text-gray-500 space-y-0.5">
                <li>• CSV export</li>
                <li>• Excel format</li>
                <li>• PDF reports</li>
                <li>• JSON data</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              How Skip Tracing Works
            </h2>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Three simple steps to find anyone or anything in Minnesota
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#014463] rounded-md flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-bold text-white">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Enter Information</h3>
              <p className="text-sm text-gray-600">
                Start with any information you have - name, address, phone number, or email. 
                Our system accepts partial information and finds the rest.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-[#014463] rounded-md flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-bold text-white">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">AI-Powered Search</h3>
              <p className="text-sm text-gray-600">
                Our advanced algorithms search through Minnesota&apos;s comprehensive databases 
                to find connections, addresses, and related information.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-[#014463] rounded-md flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-bold text-white">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Get Results</h3>
              <p className="text-sm text-gray-600">
                Receive detailed reports with addresses, phone numbers, property records, 
                and family connections - all organized and easy to understand.
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* Key Features Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Why Choose Our Skip Trace Tool?
            </h2>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Professional-grade skip tracing capabilities, available to everyone
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#014463] transition-colors">
              <div className="w-8 h-8 bg-[#014463] rounded-md flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-xs text-gray-600">
                Get results in seconds, not hours. Our optimized database queries deliver 
                comprehensive skip trace results instantly.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#014463] transition-colors">
              <div className="w-8 h-8 bg-[#014463] rounded-md flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Comprehensive Data</h3>
              <p className="text-xs text-gray-600">
                Access property records, phone numbers, addresses, family connections, 
                and more from Minnesota&apos;s most complete database.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#014463] transition-colors">
              <div className="w-8 h-8 bg-[#014463] rounded-md flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Easy to Use</h3>
              <p className="text-xs text-gray-600">
                No training required. Simply enter any information you have and let our 
                system do the work. Results are organized and easy to understand.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#014463] transition-colors">
              <div className="w-8 h-8 bg-[#014463] rounded-md flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Minnesota Focused</h3>
              <p className="text-xs text-gray-600">
                Specialized for Minnesota data. Our system knows the state&apos;s geography, 
                counties, and local databases better than any generic tool.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#014463] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-3">
              Ready to Start Skip Tracing?
            </h2>
            <p className="text-sm text-blue-100 mb-6 max-w-2xl mx-auto">
              Join thousands of Minnesotans who use our free skip tracing tool to find people, 
              properties, and information across the state.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Link 
                href={currentSession ? `/map?session=${currentSession.id}` : '/map'} 
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-[#014463] text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Start Skip Tracing Now
              </Link>
              <Link 
                href="/" 
                className="inline-flex items-center justify-center px-6 py-3 bg-transparent text-white border border-white text-sm font-semibold rounded-lg hover:bg-white hover:text-[#014463] transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Browse Properties
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-gray-300">
              <div className="flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                No registration required
              </div>
              <div className="flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Completely free forever
              </div>
              <div className="flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Your data stays private
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}