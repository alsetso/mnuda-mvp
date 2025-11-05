'use client';

import Link from 'next/link';
import Logo from './Logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gold-50 text-gray-700 mt-auto border-t border-gold-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-10">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Logo size="lg" variant="default" />
            </div>
            <p className="text-sm text-gray-600 mb-6 max-w-md">
              A tech agency with man power and strategy to capitalize on high value opportunities in Minnesota for the betterment of Minnesota and its communities and real estate opportunities.
            </p>
            <Link 
              href="/login" 
              className="inline-flex items-center justify-center rounded-lg bg-black px-6 py-3 text-white font-medium hover:bg-gray-900 transition-colors"
            >
              Apply Now
            </Link>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold text-black uppercase tracking-wider mb-4">Platform</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-sm text-gray-600 hover:text-black transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-gray-600 hover:text-black transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/workspace/new" className="text-sm text-gray-600 hover:text-black transition-colors">
                  Create Workspace
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-sm text-gray-600 hover:text-black transition-colors">
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-black uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm text-gray-600 hover:text-black transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/brand" className="text-sm text-gray-600 hover:text-black transition-colors">
                  Brand Standards
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-black uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/terms-of-service" className="text-sm text-gray-600 hover:text-black transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gold-200">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <p className="text-sm text-gray-600">
              © {currentYear} MNUDA Network. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <span>Minnesota Real Estate Investment Network</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
