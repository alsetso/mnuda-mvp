'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import SessionBanner from './SessionBanner';
import UsageDropdown from './UsageDropdown';
import MinnesotaLocalityMenu from '@/features/localities/components/MinnesotaLocalityMenu';
import { SessionData } from '../services/sessionStorage';
import { useAuth } from '@/features/auth';
import { ApiStatusLabel } from '@/features/shared';

interface AppHeaderProps {
  currentSession: SessionData | null;
  sessions: SessionData[];
  onNewSession: () => SessionData;
  onSessionSwitch: (sessionId: string) => void;
  onSessionRename?: (sessionId: string, newName: string) => void;
  updateUrl?: boolean; // Optional prop to enable URL updates
  showSessionSelector?: boolean; // Optional prop to show/hide session selector
  // Mobile view toggle props
  showMobileToggle?: boolean;
  mobileView?: 'map' | 'results';
  onMobileViewToggle?: () => void;
  // Desktop sidebar toggle props
  showSidebarToggle?: boolean;
  isSidebarOpen?: boolean;
  onSidebarToggle?: () => void;
  // Skip trace sidebar toggle props
  showSkipTraceToggle?: boolean;
  isSkipTraceSidebarOpen?: boolean;
  onSkipTraceSidebarToggle?: () => void;
  skipTracePinsCount?: number;
}

export default function AppHeader({
  currentSession,
  sessions,
  onNewSession,
  onSessionSwitch,
  onSessionRename,
  showMobileToggle = false,
  mobileView = 'map',
  onMobileViewToggle,
  showSidebarToggle = false,
  isSidebarOpen = true,
  onSidebarToggle,
}: AppHeaderProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Determine page types
  const isMapPage = pathname === '/map';
  const isTracePage = pathname === '/trace';
  const needsSessionManagement = isMapPage || isTracePage;
  // Show navigation on ALL pages for consistency
  
  // Navigation items for non-map pages
  const navigationItems = [
    { href: '/map', label: 'Map' },
    { href: '/trace', label: 'Trace' }
  ];

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm backdrop-blur-sm">
        <div className="w-full px-3 sm:px-4 lg:px-8">
          <div className="flex items-center h-14 sm:h-16">
            {/* Left Section - Unified Navigation + Page-specific controls (1/3) */}
            <div className="w-1/3 flex items-center justify-start pr-1 sm:pr-4">
              <div className="flex items-center space-x-1 sm:space-x-2 w-full min-w-0">
                {/* Universal Navigation - Show on all pages */}
                {(
                  <>
                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-2">
                      {navigationItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                            pathname === item.href
                              ? 'bg-[#014463] text-white shadow-sm'
                              : 'text-gray-700 hover:text-[#014463] hover:bg-gray-50 hover:scale-105'
                          }`}
                        >
                          {item.label}
                        </Link>
                      ))}
                      <MinnesotaLocalityMenu />
                    </div>
                    
                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                      <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 text-gray-500 hover:text-[#014463] hover:bg-gray-50 rounded-lg transition-colors"
                        title="Navigation Menu"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* API Status Label - Mobile only, positioned after hamburger menu */}
                    <div className="md:hidden">
                      <ApiStatusLabel />
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Center Section - Logo (1/3) */}
            <div className="w-1/3 flex items-center justify-center">
              <Link href="/" className="hover:scale-105 transition-all duration-200">
                <h1 className="text-base sm:text-lg font-bold tracking-tight">
                  <span className="text-[#014463] drop-shadow-sm">MN</span>
                  <span className="text-[#1dd1f5] drop-shadow-sm">UDA</span>
                </h1>
              </Link>
            </div>
            
            {/* Right Section - Unified controls (1/3) */}
            <div className="w-1/3 flex items-center justify-end space-x-1 sm:space-x-2 pl-2 sm:pl-4">
              {/* API Status Label - Desktop only */}
              <div className="hidden md:block">
                <ApiStatusLabel />
              </div>

              {/* Map-specific controls */}
              {isMapPage && (
                <>
                  {/* Mobile View Toggle - Only show on mobile */}
                  {showMobileToggle && onMobileViewToggle && (
                    <div className="md:hidden">
                      <button
                        onClick={onMobileViewToggle}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#014463] focus:ring-offset-2 ${
                          mobileView === 'results' ? 'bg-[#014463]' : 'bg-gray-200'
                        }`}
                        title={`Switch to ${mobileView === 'map' ? 'Results' : 'Map'} view`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            mobileView === 'results' ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  )}
                  
                  {/* Sidebar Toggle - Only show on desktop */}
                  {showSidebarToggle && onSidebarToggle && (
                    <div className="hidden md:block">
                      <button
                        onClick={onSidebarToggle}
                        className="p-2 text-gray-500 hover:text-[#014463] hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors touch-manipulation"
                        title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
                      >
                        {isSidebarOpen ? (
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Usage Dropdown - Show on all pages */}
              <UsageDropdown />
              
              {/* Profile Icon - Always show */}
              <Link
                href={user ? "/account" : "/login"}
                className="px-2.5 py-2 text-gray-500 hover:text-[#014463] hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors touch-manipulation"
                title={user ? "Account" : "Sign in"}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Session Banner - Show on pages that need session management */}
      {needsSessionManagement && (
        <SessionBanner
          currentSession={currentSession}
          sessions={sessions}
          onSessionSwitch={onSessionSwitch}
          onCreateNewSession={onNewSession}
          onSessionRename={onSessionRename}
        />
      )}
      
      {/* Mobile Navigation Menu - Show on all pages */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 py-2 space-y-1">
            
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-[#014463] text-white'
                    : 'text-gray-700 hover:text-[#014463] hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            {/* Minnesota Section */}
            <div className="pt-2 border-t border-gray-100">
              <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Minnesota
              </div>
              <Link
                href="/mn/cities"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pathname?.startsWith('/mn')
                    ? 'bg-[#014463] text-white'
                    : 'text-gray-700 hover:text-[#014463] hover:bg-gray-50'
                }`}
              >
                Browse Properties
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
