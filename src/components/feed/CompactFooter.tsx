'use client';

import Link from 'next/link';
import Logo from '@/features/ui/components/Logo';

export default function CompactFooter() {
  return (
    <div className="bg-white border border-gray-200 rounded-md p-[10px] space-y-3">
      {/* Navigation Links */}
      <nav aria-label="Footer navigation">
        <ul className="space-y-2">
          <li>
            <Link 
              href="/" 
              className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
            >
              Home
            </Link>
          </li>
          <li>
            <Link 
              href="/map" 
              className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
            >
              Map
            </Link>
          </li>
          <li>
            <Link 
              href="/explore" 
              className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
            >
              Explore
            </Link>
          </li>
          <li>
            <Link 
              href="/business/directory" 
              className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
            >
              Businesses
            </Link>
          </li>
          <li>
            <Link 
              href="/feed" 
              className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
            >
              Feed
            </Link>
          </li>
        </ul>
      </nav>

      {/* Legal Links */}
      <div className="pt-3 border-t border-gray-200">
        <ul className="space-y-1.5">
          <li>
            <Link 
              href="/legal/terms-of-service" 
              className="text-[10px] text-gray-500 hover:text-gray-700 transition-colors"
            >
              Terms of Service
            </Link>
          </li>
          <li>
            <Link 
              href="/legal/privacy-policy" 
              className="text-[10px] text-gray-500 hover:text-gray-700 transition-colors"
            >
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link 
              href="/legal/community-guidelines" 
              className="text-[10px] text-gray-500 hover:text-gray-700 transition-colors"
            >
              Community Guidelines
            </Link>
          </li>
        </ul>
      </div>

      {/* Logo & Copyright */}
      <div className="pt-3 border-t border-gray-200">
        <Logo size="sm" variant="default" />
        <p className="text-[10px] text-gray-500 mt-1.5">
          © {new Date().getFullYear()} MNUDA. All rights reserved.
        </p>
      </div>
    </div>
  );
}


