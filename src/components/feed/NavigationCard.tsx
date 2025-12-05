'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GlobeAltIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import AboutMnUDAModal from './AboutMnUDAModal';

export default function NavigationCard() {
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  return (
    <>
      <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
        {/* Navigation Items */}
        <div className="p-[10px] space-y-0.5">
          <Link
            href="/explore"
            className="flex items-center gap-2 px-[10px] py-[10px] rounded-md hover:bg-gray-50 transition-colors group"
          >
            <GlobeAltIcon className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
            <span className="text-xs text-gray-700 group-hover:text-gray-900">Explore</span>
          </Link>
          <button
            onClick={() => setIsAboutModalOpen(true)}
            className="w-full flex items-center gap-2 px-[10px] py-[10px] rounded-md hover:bg-gray-50 transition-colors group text-left"
          >
            <InformationCircleIcon className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
            <span className="text-xs text-gray-700 group-hover:text-gray-900">More Info</span>
          </button>
        </div>
      </div>

      <AboutMnUDAModal 
        isOpen={isAboutModalOpen} 
        onClose={() => setIsAboutModalOpen(false)} 
      />
    </>
  );
}
