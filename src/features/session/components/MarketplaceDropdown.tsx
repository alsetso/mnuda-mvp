'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

interface MarketplaceDropdownProps {
  className?: string;
}

export default function MarketplaceDropdown({ className = '' }: MarketplaceDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  const marketplaceItems = [
    { href: '/marketplace/for-sale', label: 'For Sale' },
    { href: '/marketplace/for-rent', label: 'For Rent' }
  ];

  // Check if any marketplace page is currently active
  const isMarketplaceActive = marketplaceItems.some(item => pathname === item.href);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-1 ${
          isMarketplaceActive
            ? 'bg-[#014463] text-white shadow-sm'
            : 'text-gray-700 hover:text-[#014463] hover:bg-gray-50 hover:scale-105'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>Marketplace</span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {marketplaceItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-2 text-sm transition-colors duration-200 ${
                  pathname === item.href
                    ? 'bg-[#014463] text-white'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-[#014463]'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

