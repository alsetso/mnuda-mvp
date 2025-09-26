'use client';

import { useSessionManager } from '@/features/session/hooks/useSessionManager';

export default function Footer() {
  const { currentSession } = useSessionManager();
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold">
              <span className="text-[#014463]">MN</span>
              <span className="text-[#1dd1f5]">UDA</span>
            </h2>
          </div>
          
          {/* Disclaimer */}
          <div className="text-center sm:text-right max-w-2xl">
            <p className="text-sm text-gray-600 leading-relaxed">
              <strong>MNUDA</strong> is a free real estate skip tracing tool for a limited time. 
              All data is stored locally in your browser - we don&apos;t collect or store any personal information on our servers.
            </p>
            <div className="mt-2 flex space-x-4 justify-center sm:justify-end">
              <a 
                href={currentSession ? `/map?session=${currentSession.id}` : '/map'} 
                className="text-sm text-[#1dd1f5] hover:text-[#014463] font-medium transition-colors"
              >
                Get Started →
              </a>
              <a 
                href="/map" 
                className="text-sm text-[#1dd1f5] hover:text-[#014463] font-medium transition-colors"
              >
                View Map →
              </a>
              <a 
                href="/learn-more" 
                className="text-sm text-[#1dd1f5] hover:text-[#014463] font-medium transition-colors"
              >
                Learn More →
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
