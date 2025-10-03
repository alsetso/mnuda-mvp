'use client';

import { useState, useRef, useEffect } from 'react';
import { SessionData } from '../services/sessionStorage';

interface SessionBannerProps {
  currentSession: SessionData | null;
  sessions: SessionData[];
  onSessionSwitch: (sessionId: string) => void;
  onCreateNewSession: () => SessionData;
  onSessionRename?: (sessionId: string, newName: string) => void;
}

export default function SessionBanner({
  currentSession,
  sessions,
  onSessionSwitch,
  onCreateNewSession,
  onSessionRename,
}: SessionBannerProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setIsEditing(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentSession && onSessionRename) {
      setIsEditing(true);
      setEditName(currentSession.name);
    }
  };

  const handleNameSubmit = () => {
    if (currentSession && onSessionRename && editName.trim()) {
      onSessionRename(currentSession.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleNameCancel = () => {
    setIsEditing(false);
    setEditName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };

  const handleSessionSelect = (sessionId: string) => {
    onSessionSwitch(sessionId);
    setIsDropdownOpen(false);
  };

  const handleCreateNewSession = () => {
    const newSession = onCreateNewSession();
    onSessionSwitch(newSession.id);
    setIsDropdownOpen(false);
  };

  // Calculate total entities from all nodes in the session
  const getTotalEntities = (session: SessionData): number => {
    return session.nodes.reduce((total, node) => {
      if (node.personData && typeof node.personData === 'object') {
        const personData = node.personData as Record<string, unknown>;
        if (personData.entityCounts) {
          const entityCounts = personData.entityCounts as Record<string, number>;
          return total + (entityCounts.properties || 0) +
                        (entityCounts.addresses || 0) +
                        (entityCounts.phones || 0) +
                        (entityCounts.emails || 0) +
                        (entityCounts.persons || 0) +
                        (entityCounts.images || 0);
        }
        if (personData.totalEntities) {
          return total + (personData.totalEntities as number);
        }
      }
      return total;
    }, 0);
  };

  return (
    <div className="sticky top-14 z-40 w-full bg-white border-b border-gray-200">
      <div className="w-full px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Left Section - Session Info & Stats */}
            <div className="flex items-center gap-4">
              {/* Status Indicator */}
              <div className={`w-2 h-2 rounded-full ${currentSession ? 'bg-green-500' : 'bg-gray-300'}`} />

              {/* Session Name */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {isEditing ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleNameSubmit}
                    onKeyDown={handleKeyDown}
                    className="text-sm font-medium text-gray-900 bg-transparent border-b border-gray-300 outline-none focus:border-[#1dd1f5] min-w-0 flex-1"
                    maxLength={50}
                    placeholder="Session name"
                  />
                ) : (
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {currentSession ? currentSession.name : 'No session selected'}
                    </span>
                    {currentSession && onSessionRename && (
                      <button
                        onClick={handleEditClick}
                        className="p-1 text-gray-400 hover:text-[#1dd1f5] flex-shrink-0"
                        title="Rename session"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Session Stats */}
              {currentSession && (
                <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>{currentSession.nodes.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{getTotalEntities(currentSession)}</span>
                  </div>
                  <div className="hidden md:block text-gray-400">
                    <span>Created {new Date(currentSession.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Section - Session Management */}
            <div className="flex items-center gap-3">
              {/* Create New Session Button */}
              <button
                onClick={handleCreateNewSession}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-white bg-[#1dd1f5] hover:bg-[#014463] rounded"
                title="Create new session"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden sm:inline">New</span>
              </button>

              {/* Sessions Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span className="hidden sm:inline">Sessions</span>
                  <span className="sm:hidden">All</span>
                  {sessions.length > 0 && (
                    <span className="flex items-center justify-center w-4 h-4 text-xs font-medium text-white bg-[#1dd1f5] rounded-full">
                      {sessions.length}
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded z-50">
                    <div className="p-2">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                        <h3 className="text-sm font-medium text-gray-900">Session Manager</h3>
                        <div className="text-xs text-gray-500">{sessions.length} total</div>
                      </div>

                      {/* Sessions List */}
                      <div className="max-h-64 overflow-y-auto">
                        {sessions.length > 0 ? (
                          <div className="space-y-1">
                            {sessions.map((session) => (
                              <button
                                key={session.id}
                                onClick={() => handleSessionSelect(session.id)}
                                className={`w-full text-left px-3 py-2 rounded text-sm ${
                                  currentSession?.id === session.id
                                    ? 'bg-[#1dd1f5] text-white'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{session.name}</div>
                                    <div className={`text-xs mt-0.5 ${
                                      currentSession?.id === session.id ? 'text-white/80' : 'text-gray-500'
                                    }`}>
                                      {session.nodes.length} nodes • {getTotalEntities(session)} entities • {new Date(session.createdAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                  {currentSession?.id === session.id && (
                                    <div className="ml-2">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="px-3 py-4 text-sm text-gray-500 text-center">
                            No sessions found
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
