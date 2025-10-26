'use client';

import Link from 'next/link';

export default function Footer() {
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
              <strong>MNUDA</strong> is a free local service that stores data only in your browser; paid plans are required for cloud-based features. 
              <Link 
                href="/" 
                className="text-[#1dd1f5] hover:text-[#014463] font-medium transition-colors ml-1"
              >
                View Map →
              </Link>
              <Link 
                href="/" 
                className="text-[#1dd1f5] hover:text-[#014463] font-medium transition-colors ml-2"
              >
                Pricing →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
