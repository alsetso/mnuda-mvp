'use client';

import Link from 'next/link';
import SessionSelector from './SessionSelector';
import { SessionData } from '../services/sessionStorage';

interface AppHeaderProps {
  currentSession: SessionData | null;
  sessions: SessionData[];
  onNewSession: () => void;
  onSessionSwitch: (sessionId: string) => void;
  onSessionRename: (sessionId: string, newName: string) => void;
  updateUrl?: boolean; // Optional prop to enable URL updates
  showSessionSelector?: boolean; // Optional prop to show/hide session selector
  // Mobile view toggle props
  showMobileToggle?: boolean;
  mobileView?: 'map' | 'results';
  onMobileViewToggle?: () => void;
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
}: AppHeaderProps) {

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="w-full px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left side - Logo and Session Selector */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <div className="flex-shrink-0">
                <Link href="/" className="hover:opacity-80 transition-opacity">
                  <h1 className="text-base sm:text-lg font-semibold">
                    <span className="text-[#014463]">MN</span>
                    <span className="text-[#1dd1f5]">UDA</span>
                  </h1>
                </Link>
              </div>
              {showSessionSelector && (
                <div className="min-w-0 flex-1">
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
            </div>
            
            {/* Right side - Navigation and Usage Icon */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {/* Mobile View Toggle - Only show on mobile */}
              {showMobileToggle && onMobileViewToggle && (
                <div className="md:hidden ml-3">
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
              
              {/* Usage Icon */}
              <Link
                href="/usage"
                className="p-2 text-gray-400 hover:text-[#1dd1f5] hover:bg-[#1dd1f5]/10 rounded-lg transition-colors touch-manipulation"
                title="View storage usage"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
