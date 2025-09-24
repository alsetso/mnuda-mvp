'use client';

import { useState } from 'react';
import { sessionStorageService, SessionData } from '@/lib/sessionStorage';

interface SessionSelectorProps {
  onSessionChange: (nodes: unknown[]) => void;
  onNewSession: () => void;
  currentSession: SessionData | null;
  sessions: SessionData[];
  onSessionSwitch: (sessionId: string) => unknown[];
  onSessionRename: (sessionId: string, newName: string) => void;
}

function SessionSelector({ 
  onSessionChange, 
  onNewSession, 
  currentSession,
  sessions,
  onSessionSwitch,
  onSessionRename
}: SessionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleSessionSelect = (sessionId: string) => {
    const nodes = onSessionSwitch(sessionId);
    onSessionChange(nodes);
    setIsOpen(false);
  };

  const handleNewSession = () => {
    onNewSession();
    setIsOpen(false);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this session?')) {
      sessionStorageService.deleteSession(sessionId);
      if (currentSession?.id === sessionId) {
        onNewSession();
      }
    }
  };

  const handleStartEdit = (sessionId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(sessionId);
    setEditName(currentName);
  };

  const handleSaveEdit = (sessionId: string) => {
    if (editName.trim()) {
      onSessionRename(sessionId, editName.trim());
    }
    setEditingSessionId(null);
    setEditName('');
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditName('');
  };

  const handleKeyPress = (e: React.KeyboardEvent, sessionId: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(sessionId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-[#1dd1f5]"
      >
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="truncate max-w-32">
            {currentSession?.name || 'No Session'}
          </span>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="p-3 border-b border-gray-100">
            <button
              onClick={handleNewSession}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-[#014463] bg-[#1dd1f5]/10 border border-[#1dd1f5]/30 rounded-md hover:bg-[#1dd1f5]/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Session</span>
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No sessions found. Create your first session to get started.
              </div>
            ) : (
              sessions
                .sort((a, b) => b.lastAccessed - a.lastAccessed)
                .map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSessionSelect(session.id)}
                    className={`p-3 border-b border-gray-50 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                      currentSession?.id === session.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            currentSession?.id === session.id ? 'bg-blue-500' : 'bg-gray-300'
                          }`}></div>
                          
                          {editingSessionId === session.id ? (
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onBlur={() => handleSaveEdit(session.id)}
                              onKeyDown={(e) => handleKeyPress(e, session.id)}
                              className="text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#1dd1f5] focus:border-[#1dd1f5]"
                              autoFocus
                            />
                          ) : (
                            <div className="flex items-center space-x-1 group">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {session.name}
                              </h4>
                              <button
                                onClick={(e) => handleStartEdit(session.id, session.name, e)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-[#1dd1f5] hover:bg-[#1dd1f5]/10 rounded transition-all"
                                title="Rename session"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {session.nodes.length} nodes • {formatDate(session.lastAccessed)}
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          Created {formatDate(session.createdAt)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Delete session"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default SessionSelector;
