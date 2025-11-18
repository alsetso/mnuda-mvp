'use client';

import Link from 'next/link';
import Logo from './Logo';

interface FooterProps {
  fixed?: boolean;
}

export default function Footer({ fixed = false }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const footerClasses = fixed
    ? 'fixed bottom-0 left-0 right-0 bg-gold-50 text-gray-700 border-t border-gold-200 z-10'
    : 'bg-gold-50 text-gray-700 mt-auto border-t border-gold-200';

  return (
    <footer className={footerClasses} role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12 mb-10">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Logo size="lg" variant="default" />
            </div>
            <p className="text-sm text-gray-600 mb-6 max-w-md leading-relaxed">
              MNUDA: Homes Bought. Projects Managed.
            </p>
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                <strong>MNUDA</strong>
              </p>
              <p className="text-xs text-gray-500">
                Homes Bought. Projects Managed.
              </p>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-semibold text-black uppercase tracking-wider mb-4">
              Services
            </h3>
            <nav aria-label="Services navigation">
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/map" 
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                    title="Map - Interactive map with community pins and property search"
                  >
                    Map
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Account & Legal */}
          <div>
            <h3 className="text-sm font-semibold text-black uppercase tracking-wider mb-4">
              Account & Legal
            </h3>
            <nav aria-label="Account and legal navigation">
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/login" 
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                    title="Sign In - Access your MNUDA account"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/account/settings" 
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                    title="Settings - Manage your account settings and preferences"
                  >
                    Settings
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/terms-of-service" 
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                    title="Terms of Service - Read our terms and conditions"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gold-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600 text-center md:text-left">
              © {currentYear} MNUDA. All rights reserved. Homes Bought. Projects Managed.
            </p>
            <div className="flex items-center gap-6 text-xs text-gray-500">
              <span>Minnesota, United States</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
