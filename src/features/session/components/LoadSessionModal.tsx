'use client';

import { useState, useMemo } from 'react';
import { SessionData } from '../services/sessionStorage';

interface LoadSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SessionData[];
  onSessionSelect: (sessionId: string) => void;
  onCreateNewSession: () => SessionData;
}

export default function LoadSessionModal({
  isOpen,
  onClose,
  sessions,
  onSessionSelect,
  onCreateNewSession,
}: LoadSessionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllSessions, setShowAllSessions] = useState(false);

  // Filter sessions based on search query
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) {
      return sessions;
    }
    
    return sessions.filter(session =>
      session.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sessions, searchQuery]);

  // Get sessions to display (first 3 or all based on showAllSessions)
  const displaySessions = useMemo(() => {
    if (showAllSessions) {
      return filteredSessions;
    }
    return filteredSessions.slice(0, 3);
  }, [filteredSessions, showAllSessions]);

  const handleSessionClick = (sessionId: string) => {
    onSessionSelect(sessionId);
    onClose();
  };

  const handleCreateNew = () => {
    onCreateNewSession();
    onClose();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Load Session</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-6 pb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#014463] focus:border-transparent"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {displaySessions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">
                {searchQuery ? 'No sessions found matching your search' : 'No sessions available'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {displaySessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSessionClick(session.id)}
                  className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-[#1dd1f5]/50 hover:bg-[#1dd1f5]/10 transition-all duration-150 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate group-hover:text-[#014463]">
                        {session.name}
                      </h3>
                      <div className="flex items-center mt-1 space-x-3 text-xs text-gray-500">
                        <span>{formatDate(session.lastAccessed)}</span>
                        <span>•</span>
                        <span>{session.nodes.length} nodes</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-3">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-[#014463] transition-colors duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Show More/Less Button */}
          {filteredSessions.length > 3 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAllSessions(!showAllSessions)}
                className="text-sm text-[#1dd1f5] hover:text-[#014463] font-medium transition-colors duration-150"
              >
                {showAllSessions ? (
                  <>
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Show Less
                  </>
                ) : (
                  <>
                    Show {filteredSessions.length - 3} More
                    <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleCreateNew}
            className="w-full bg-[#014463] hover:bg-[#1dd1f5] text-white font-medium py-3 px-4 rounded-xl transition-colors duration-150 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Create New Session</span>
          </button>
        </div>
      </div>
    </div>
  );
}
