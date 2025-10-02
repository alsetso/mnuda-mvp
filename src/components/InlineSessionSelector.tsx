'use client';

import { useState } from 'react';
import { SessionData } from '@/features/session/services/sessionStorage';

interface InlineSessionSelectorProps {
  currentSession: SessionData | null;
  sessions: SessionData[];
  onNewSession: () => SessionData;
  onSessionSwitch: (sessionId: string) => void;
}

export default function InlineSessionSelector({
  currentSession,
  sessions,
  onNewSession,
  onSessionSwitch
}: InlineSessionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSessionSelect = (sessionId: string) => {
    onSessionSwitch(sessionId);
    setIsOpen(false);
  };

  const handleNewSession = () => {
    onNewSession();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg hover:border-[#1dd1f5] focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#1dd1f5]/10 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-[#014463]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">
              {currentSession ? currentSession.name : 'No session selected'}
            </p>
            <p className="text-xs text-gray-500">
              {currentSession ? `${currentSession.nodes.length} traces` : 'Select a session'}
            </p>
          </div>
        </div>
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
          {/* New Session Button */}
          <button
            onClick={handleNewSession}
            className="w-full flex items-center space-x-3 p-3 hover:bg-[#1dd1f5]/5 transition-colors border-b border-gray-100"
          >
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Create New Session</p>
              <p className="text-xs text-gray-500">Start a new trace session</p>
            </div>
          </button>

          {/* Existing Sessions */}
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => handleSessionSelect(session.id)}
                className={`w-full flex items-center space-x-3 p-3 hover:bg-[#1dd1f5]/5 transition-colors ${
                  currentSession?.id === session.id ? 'bg-[#1dd1f5]/10' : ''
                }`}
              >
                <div className="w-8 h-8 bg-[#1dd1f5]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#014463]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{session.name}</p>
                  <p className="text-xs text-gray-500">
                    {session.nodes.length} traces • {new Date(session.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {currentSession?.id === session.id && (
                  <div className="w-2 h-2 bg-[#1dd1f5] rounded-full"></div>
                )}
              </button>
            ))
          ) : (
            <div className="p-3 text-center text-sm text-gray-500">
              No sessions yet
            </div>
          )}
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
