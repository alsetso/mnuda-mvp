'use client';

import { useState, useEffect } from 'react';
import { sessionStorageService, SessionData } from '@/lib/sessionStorage';

interface SessionHeroProps {
  currentSession: SessionData | null;
  onSessionRename: (sessionId: string, newName: string) => void;
  refreshTrigger?: number;
}

export default function SessionHero({ currentSession, onSessionRename, refreshTrigger }: SessionHeroProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  useEffect(() => {
    if (currentSession) {
      setSessionData(currentSession);
      setEditTitle(currentSession.name);
    }
  }, [currentSession, refreshTrigger]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditTitle(sessionData?.name || '');
  };

  const handleSaveEdit = () => {
    if (sessionData && editTitle.trim()) {
      onSessionRename(sessionData.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(sessionData?.name || '');
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleExport = () => {
    if (!sessionData) return;

    try {
      const exportData = {
        session: {
          id: sessionData.id,
          name: sessionData.name,
          createdAt: sessionData.createdAt,
          lastAccessed: sessionData.lastAccessed,
          nodeCount: sessionData.nodes.length
        },
        nodes: sessionData.nodes,
        entitySummary: sessionStorageService.getEntitySummary(),
        actionableEntities: sessionStorageService.getActionableEntities(),
        exportedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `freemap-session-${sessionData.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  if (!sessionData) {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Centered Title Section */}
        <div className="text-center mb-4 sm:mb-6">
          {isEditing ? (
            <div className="flex items-center justify-center space-x-3">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={handleKeyPress}
                className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-[#1dd1f5] focus:outline-none focus:border-[#014463] text-center min-w-0 flex-1 max-w-md"
                autoFocus
              />
              <button
                onClick={handleSaveEdit}
                className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                title="Save"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
                title="Cancel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-3 group">
              <h1 className="text-2xl font-bold text-gray-900 truncate max-w-2xl">
                {sessionData.name}
              </h1>
              <button
                onClick={handleStartEdit}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-[#1dd1f5] hover:bg-[#1dd1f5]/10 rounded transition-all"
                title="Rename session"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Timestamps and Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="truncate">Created {formatDate(sessionData.createdAt)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Updated {formatRelativeTime(sessionData.lastAccessed)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Session Stats */}
            <div className="flex items-center space-x-3 sm:space-x-4 text-sm text-gray-500">
              <span>{sessionData.nodes.length} nodes</span>
              <span className="hidden sm:inline">•</span>
              <span>{sessionStorageService.getEntitySummary().total} entities</span>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-white bg-[#1dd1f5] border border-[#1dd1f5] rounded-md hover:bg-[#1bc4e8] focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-[#1dd1f5] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
