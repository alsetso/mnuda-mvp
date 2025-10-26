'use client';

import { useState, useRef, useEffect } from 'react';
import { SessionData } from '../services/sessionStorage';
import { ExportModal } from '@/features/export';
import { useToast } from '@/features/ui/hooks/useToast';
import SessionSettingsModal from './SessionSettingsModal';

interface SessionBannerProps {
  currentSession: SessionData | null;
  sessions: SessionData[];
  onSessionSwitch: (sessionId: string) => void;
  onCreateNewSession: () => SessionData;
  onSessionRename?: (sessionId: string, newName: string) => void;
  onSessionDelete?: (sessionId: string) => void;
  onUpdateSession?: (updates: {
    name: string;
    description: string;
    isActive: boolean;
    locationTrackingActive: boolean;
  }) => Promise<void>;
}

export default function SessionBanner({
  currentSession,
  sessions,
  onSessionSwitch,
  onCreateNewSession,
  onSessionRename,
  onSessionDelete,
  onUpdateSession,
}: SessionBannerProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { success } = useToast();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setIsEditing(false);
        setEditingSessionId(null);
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

  const handleEditClick = (e: React.MouseEvent, sessionId: string, sessionName: string) => {
    e.stopPropagation();
    if (onSessionRename) {
      setIsEditing(true);
      setEditingSessionId(sessionId);
      setEditName(sessionName);
    }
  };

  const handleNameSubmit = () => {
    if (editingSessionId && onSessionRename && editName.trim()) {
      onSessionRename(editingSessionId, editName.trim());
    }
    setIsEditing(false);
    setEditingSessionId(null);
    setEditName('');
  };

  const handleNameCancel = () => {
    setIsEditing(false);
    setEditingSessionId(null);
    setEditName('');
  };

  const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (onSessionDelete && window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      onSessionDelete(sessionId);
    }
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

  const handleCreateNewSession = async () => {
    // Prevent multiple rapid clicks
    if (isCreatingSession) return;
    
    setIsCreatingSession(true);
    
    try {
      const newSession = onCreateNewSession();
      
      // Show success toast
      success('New Session Created', `Session "${newSession.name}" has been created and is now active.`);
      
      // Switch to the new session
      onSessionSwitch(newSession.id);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error creating new session:', error);
    } finally {
      // Reset the creating state after a short delay to prevent rapid clicking
      setTimeout(() => {
        setIsCreatingSession(false);
      }, 500);
    }
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
    <>
      <div className="sticky top-14 z-40 w-full bg-gray-50 border-b border-gray-200">
        <div className="w-full px-4 py-2">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              {/* Left Section - Session Dropdown and Stats */}
              <div className="flex items-center gap-4">
                {/* Status Indicator */}
                <div className={`w-2 h-2 rounded-full ${
                  currentSession?.isActive === true ? 'bg-green-500' : 
                  currentSession?.isActive === false ? 'bg-red-500' : 
                  'bg-gray-400'
                }`} />

                {/* Session Name Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg min-w-0 max-w-[125px] sm:max-w-none"
                  >
                    {isEditing ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleNameSubmit}
                        onKeyDown={handleKeyDown}
                        className="text-sm font-medium text-gray-900 bg-transparent border-none outline-none min-w-0 flex-1"
                        maxLength={50}
                        placeholder="Session name"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="truncate">
                        {currentSession ? currentSession.name : 'No session selected'}
                      </span>
                    )}
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="p-2">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                          <h3 className="text-sm font-medium text-gray-900">Sessions</h3>
                          <div className="text-xs text-gray-500">{sessions.length} total</div>
                        </div>

                        {/* Sessions List */}
                        <div className="max-h-64 overflow-y-auto">
                          {sessions.length > 0 ? (
                            <div className="space-y-1">
                              {sessions.map((session) => (
                                <div
                                  key={session.id}
                                  className={`group relative px-3 py-2 rounded text-sm ${
                                    currentSession?.id === session.id
                                      ? 'bg-[#1dd1f5] text-white'
                                      : 'text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  <button
                                    onClick={() => handleSessionSelect(session.id)}
                                    className="w-full text-left"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1 min-w-0">
                                        {editingSessionId === session.id ? (
                                          <input
                                            ref={inputRef}
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onBlur={handleNameSubmit}
                                            onKeyDown={handleKeyDown}
                                            className="text-sm font-medium bg-transparent border-none outline-none min-w-0 flex-1 w-full"
                                            maxLength={50}
                                            placeholder="Session name"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        ) : (
                                          <div className="font-medium truncate">{session.name}</div>
                                        )}
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
                                  
                                  {/* Edit and Delete Buttons */}
                                  {editingSessionId !== session.id && (
                                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {onSessionRename && (
                                        <button
                                          onClick={(e) => handleEditClick(e, session.id, session.name)}
                                          className={`p-1 rounded hover:bg-opacity-20 ${
                                            currentSession?.id === session.id 
                                              ? 'text-white hover:bg-white' 
                                              : 'text-gray-400 hover:text-[#1dd1f5] hover:bg-[#1dd1f5]'
                                          }`}
                                          title="Rename session"
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                          </svg>
                                        </button>
                                      )}
                                      {onSessionDelete && (
                                        <button
                                          onClick={(e) => handleDeleteClick(e, session.id)}
                                          className={`p-1 rounded hover:bg-opacity-20 ${
                                            currentSession?.id === session.id 
                                              ? 'text-white hover:bg-red-500' 
                                              : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                          }`}
                                          title="Delete session"
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
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

                {/* Session Stats */}
                {currentSession && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span>{currentSession.nodes.length} nodes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{getTotalEntities(currentSession)} entities</span>
                    </div>
                    <div className="hidden md:block text-gray-400">
                      <span>Created {new Date(currentSession.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Section - Action Buttons */}
              <div className="flex items-center gap-3">
                {/* Export Button */}
                {currentSession && currentSession.nodes.length > 0 && (
                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
                    title="Export session data"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="hidden sm:inline">Export</span>
                  </button>
                )}

                {/* Create New Session Button */}
                <button
                  onClick={handleCreateNewSession}
                  disabled={isCreatingSession}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    isCreatingSession 
                      ? 'text-gray-400 bg-gray-200 cursor-not-allowed' 
                      : 'text-white bg-[#014463] hover:bg-[#1dd1f5]'
                  }`}
                  title={isCreatingSession ? "Creating session..." : "Create new session"}
                >
                  {isCreatingSession ? (
                    <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )}
                  <span className="hidden sm:inline">{isCreatingSession ? 'Creating...' : 'New'}</span>
                </button>

                {/* Settings Button */}
                {currentSession && onUpdateSession && (
                  <button
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 hover:text-[#014463] transition-colors"
                    title="Session settings"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="hidden sm:inline">Settings</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Session Settings Modal */}
      {onUpdateSession && (
        <SessionSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          currentSession={currentSession}
          onUpdateSession={onUpdateSession}
        />
      )}
    </>
  );
}
