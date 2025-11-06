'use client';

import Link from 'next/link';
import Logo from './Logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gold-50 text-gray-700 mt-auto border-t border-gold-200" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12 mb-10">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Logo size="lg" variant="default" />
            </div>
            <p className="text-sm text-gray-600 mb-6 max-w-md leading-relaxed">
              We combine technology, capital, and strategy to acquire and develop high-value real estate and business opportunities that strengthen our state&apos;s economic foundation.
            </p>
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                <strong>MNUDA Network</strong>
              </p>
              <p className="text-xs text-gray-500">
                Minnesota Real Estate Investment Network
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
                    href="/skip-tracing" 
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                    title="Skip Tracing - Find people by name, email, phone, or address"
                  >
                    Skip Tracing
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/community" 
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                    title="Community - Interactive map with community pins and property search"
                  >
                    Community
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/directory" 
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                    title="Directory - Browse Minnesota counties and location data"
                  >
                    Directory
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/assets" 
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                    title="Assets - Manage your real estate assets and properties"
                  >
                    Assets
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Tools */}
          <div>
            <h3 className="text-sm font-semibold text-black uppercase tracking-wider mb-4">
              Tools
            </h3>
            <nav aria-label="Tools navigation">
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/workflow" 
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                    title="Workflow - Transform and process bulk data lists"
                  >
                    Workflow
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/advertising" 
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                    title="Advertising - Create and manage Facebook and Instagram ads"
                  >
                    Advertising
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/print" 
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                    title="Print - Print documents and reports"
                  >
                    Print
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-black uppercase tracking-wider mb-4">
              Company
            </h3>
            <nav aria-label="Company navigation">
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/about" 
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                    title="About MNUDA - Learn about our mission and values"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/brand" 
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                    title="Brand Standards - View our brand guidelines"
                  >
                    Brand Standards
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
                    href="/settings" 
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
              © {currentYear} MNUDA Network. All rights reserved. Minnesota Real Estate Investment Network
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
