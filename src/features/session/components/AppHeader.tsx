'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import SessionSelector from './SessionSelector';
import UsageDropdown from './UsageDropdown';
import { SessionData } from '../services/sessionStorage';
import { useAuth } from '@/features/auth';

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
  updateUrl = false,
  showSessionSelector = true,
  showMobileToggle = false,
  mobileView = 'map',
  onMobileViewToggle,
  showSidebarToggle = false,
  isSidebarOpen = true,
  onSidebarToggle,
  showSkipTraceToggle = false,
  isSkipTraceSidebarOpen = false,
  onSkipTraceSidebarToggle,
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
    { href: '/trace', label: 'Trace' },
    { href: '/buy', label: 'Buy' },
    { href: '/sell', label: 'Sell' },
    { href: '/loan', label: 'Loan' }
  ];

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="w-full px-3 sm:px-4 lg:px-8">
          <div className="flex items-center h-14 sm:h-16">
            {/* Left Section - Unified Navigation + Page-specific controls (1/3) */}
            <div className="w-1/3 flex items-center justify-start pr-1 sm:pr-4">
              <div className="flex items-center space-x-1 sm:space-x-2 w-full min-w-0">
                {/* Skip Trace Toggle - Only on map page, positioned before navigation */}
                {isMapPage && showSkipTraceToggle && onSkipTraceSidebarToggle && (
                  <button
                    onClick={onSkipTraceSidebarToggle}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-[#1dd1f5] hover:bg-[#1dd1f5]/10 rounded-lg transition-colors touch-manipulation"
                    title={isSkipTraceSidebarOpen ? "Hide Skip Trace List" : "Show Skip Trace List"}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                )}

                {/* Universal Navigation - Hide on map and trace pages */}
                {!isMapPage && !isTracePage && (
                  <>
                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-1">
                      {navigationItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            pathname === item.href
                              ? 'bg-[#1dd1f5] text-white'
                              : 'text-gray-600 hover:text-[#1dd1f5] hover:bg-[#1dd1f5]/10'
                          }`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                    
                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                      <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 text-gray-400 hover:text-[#1dd1f5] hover:bg-[#1dd1f5]/10 rounded-lg transition-colors"
                        title="Navigation Menu"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Center Section - Logo (1/3) */}
            <div className="w-1/3 flex items-center justify-center">
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <h1 className="text-base sm:text-lg font-semibold">
                  <span className="text-[#014463]">MN</span>
                  <span className="text-[#1dd1f5]">UDA</span>
                </h1>
              </Link>
            </div>
            
            {/* Right Section - Unified controls (1/3) */}
            <div className="w-1/3 flex items-center justify-end space-x-1 sm:space-x-2 pl-2 sm:pl-4">
              {/* Session Selector - Show on pages that need session management */}
              {needsSessionManagement && showSessionSelector && (
                <div className="flex-1 min-w-0 max-w-xs overflow-hidden">
                  <SessionSelector 
                    onNewSession={onNewSession}
                    currentSession={currentSession}
                    sessions={sessions}
                    onSessionSwitch={onSessionSwitch}
                    onSessionRename={onSessionRename}
                    updateUrl={updateUrl}
                  />
                </div>
              )}

              {/* Map-specific controls */}
              {isMapPage && (
                <>
                  {/* Mobile View Toggle - Only show on mobile */}
                  {showMobileToggle && onMobileViewToggle && (
                    <div className="md:hidden">
                      <button
                        onClick={onMobileViewToggle}
                        className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:ring-offset-2"
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
                        className="p-2 text-gray-400 hover:text-[#1dd1f5] hover:bg-[#1dd1f5]/10 rounded-lg transition-colors touch-manipulation"
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
                className="p-2 text-gray-400 hover:text-[#1dd1f5] hover:bg-[#1dd1f5]/10 rounded-lg transition-colors touch-manipulation"
                title={user ? "Account" : "Sign in"}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation Menu - Hide on map and trace pages */}
      {isMobileMenuOpen && !isMapPage && !isTracePage && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 py-2 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-[#1dd1f5] text-white'
                    : 'text-gray-600 hover:text-[#1dd1f5] hover:bg-[#1dd1f5]/10'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
