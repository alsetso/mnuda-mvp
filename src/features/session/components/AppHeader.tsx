'use client';

import { useState } from 'react';
import SessionSelector from './SessionSelector';
import UsageModal from './UsageModal';
import { SessionData } from '../services/sessionStorage';

interface AppHeaderProps {
  currentSession: SessionData | null;
  sessions: SessionData[];
  onNewSession: () => void;
  onSessionSwitch: (sessionId: string) => void;
  onSessionRename: (sessionId: string, newName: string) => void;
}

export default function AppHeader({
  currentSession,
  sessions,
  onNewSession,
  onSessionSwitch,
  onSessionRename,
}: AppHeaderProps) {
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left side - Logo and Session Selector */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <div className="flex-shrink-0">
                <h1 className="text-base sm:text-lg font-semibold">
                  <span className="text-[#014463]">MN</span>
                  <span className="text-[#1dd1f5]">UDA</span>
                </h1>
              </div>
              <div className="min-w-0 flex-1">
                <SessionSelector 
                  onNewSession={onNewSession}
                  currentSession={currentSession}
                  sessions={sessions}
                  onSessionSwitch={onSessionSwitch}
                  onSessionRename={onSessionRename}
                />
              </div>
            </div>
            
            {/* Right side - Navigation and Usage Icon */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {/* Usage Icon */}
              <button
                onClick={() => setIsUsageModalOpen(true)}
                className="p-2 text-gray-400 hover:text-[#1dd1f5] hover:bg-[#1dd1f5]/10 rounded-lg transition-colors touch-manipulation"
                title="View storage usage"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Modal */}
      <UsageModal 
        isOpen={isUsageModalOpen}
        onClose={() => setIsUsageModalOpen(false)}
        onSessionSwitch={onSessionSwitch}
      />
    </>
  );
}
