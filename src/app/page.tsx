'use client';

import Link from 'next/link';
import { useSessionManager } from '@/features/session/hooks/useSessionManager';
import AppHeader from '@/features/session/components/AppHeader';

export default function Home() {
  const { 
    currentSession, 
    sessions,
    createNewSession, 
    switchSession, 
    renameSession
  } = useSessionManager();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* App Header */}
      <AppHeader
        currentSession={currentSession}
        sessions={sessions}
        onNewSession={() => createNewSession()}
        onSessionSwitch={switchSession}
        onSessionRename={renameSession}
        updateUrl={false}
      />


      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Free Minnesota Address
            <span className="text-[#1dd1f5]"> Skip Tracing</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Find property owners, contact information, and property details instantly. 
            No sign-up required. No hidden fees. No data storage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href={currentSession ? `/map?session=${currentSession.id}` : '/map'} 
              className="bg-[#1dd1f5] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#014463] transition-colors shadow-lg"
            >
              Start Searching Now
            </Link>
            <Link 
              href="/map" 
              className="bg-white text-[#1dd1f5] border-2 border-[#1dd1f5] px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#1dd1f5] hover:text-white transition-colors"
            >
              View Map
            </Link>
            <Link 
              href="/learn-more" 
              className="border-2 border-[#1dd1f5] text-[#1dd1f5] px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#1dd1f5] hover:text-white transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose MNUDA?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We believe real estate data should be accessible to everyone
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#1dd1f5] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#1dd1f5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">100% Free</h3>
              <p className="text-gray-600">
                No hidden fees, no credit card required, no subscription needed. 
                Completely free for individual use.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#1dd1f5] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#1dd1f5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Privacy First</h3>
              <p className="text-gray-600">
                Your searches stay local. We don&apos;t store your data or track your activity. 
                Your privacy is protected.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#1dd1f5] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#1dd1f5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Instant Results</h3>
              <p className="text-gray-600">
                Get property owner information, contact details, and property insights 
                in seconds, not hours.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to get the information you need
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#1dd1f5] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Enter Address</h3>
              <p className="text-gray-600">
                Simply type in the property address you want to research
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-[#1dd1f5] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Results</h3>
              <p className="text-gray-600">
                Our system searches multiple databases to find owner information
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-[#1dd1f5] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Take Action</h3>
              <p className="text-gray-600">
                Use the contact information to reach out to property owners
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#1dd1f5] py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of real estate professionals who trust MNUDA for their skip tracing needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href={currentSession ? `/map?session=${currentSession.id}` : '/map'} 
              className="bg-white text-[#1dd1f5] px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              Start Your First Search
            </Link>
            <Link 
              href="/map" 
              className="bg-white/20 text-white border-2 border-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-[#1dd1f5] transition-colors"
            >
              View Map
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
