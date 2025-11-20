'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bars3Icon } from '@heroicons/react/24/outline';

interface AccountHeroProps {
  onMenuToggle?: () => void;
}

export default function AccountHero({ onMenuToggle }: AccountHeroProps) {
  return (
    <div className="w-screen bg-white border-b-2 border-gray-200 h-[60px] flex items-center">
      <div className="w-full flex items-center justify-between px-4 relative">
        {/* Hamburger (mobile only, 600px or less) */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="hidden max-[600px]:block flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <Bars3Icon className="w-6 h-6 text-black" />
          </button>
        )}
        
        {/* Emblem - centered on mobile when hamburger exists, left aligned on desktop */}
        <Link 
          href="/map" 
          className={`flex-shrink-0 hover:opacity-80 transition-opacity ${
            onMenuToggle 
              ? 'max-[600px]:absolute max-[600px]:left-1/2 max-[600px]:transform max-[600px]:-translate-x-1/2 min-[601px]:relative min-[601px]:left-0 min-[601px]:transform-none' 
              : ''
          }`}
        >
          <Image
            src="/mnuda_emblem.png"
            alt="MNUDA Emblem"
            width={40}
            height={40}
            className="h-auto w-auto"
            priority
          />
        </Link>
        
        {/* Right - MNUDA Logo (smaller) */}
        <div className="flex-shrink-0">
          <Image
            src="/MNUDA-3.png"
            alt="MNUDA"
            width={120}
            height={36}
            className="h-auto w-auto"
            priority
          />
        </div>
      </div>
    </div>
  );
}
