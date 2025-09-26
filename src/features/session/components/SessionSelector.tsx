'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SessionData } from '../services/sessionStorage';

interface SessionSelectorProps {
  onNewSession: () => void;
  currentSession: SessionData | null;
  sessions: SessionData[];
  onSessionSwitch: (sessionId: string) => void;
  onSessionRename: (sessionId: string, newName: string) => void;
  updateUrl?: boolean;
}

function SessionSelector({ 
  onNewSession, 
  currentSession,
  sessions,
  onSessionSwitch,
  onSessionRename,
  updateUrl: _updateUrl = false
}: SessionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSessionSelect = (sessionId: string) => {
    onSessionSwitch(sessionId);
    setIsOpen(false);
    setSearchTerm('');
    setFocusedIndex(-1);
    router.push(`/map?session=${sessionId}`);
  };

  const handleNewSession = () => {
    onNewSession();
    setIsOpen(false);
    setSearchTerm('');
    setFocusedIndex(-1);
    router.push('/map');
  };

  const startEditing = () => {
    if (currentSession) {
      setIsEditing(true);
      setEditName(currentSession.name);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const saveEdit = () => {
    if (currentSession && editName.trim()) {
      onSessionRename(currentSession.id, editName.trim());
    }
    setIsEditing(false);
    setEditName('');
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditName('');
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMs < 60000) return 'Just now';
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
    if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Filter and sort sessions
  const filteredSessions = sessions
    .filter(session => 
      session.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.lastAccessed - a.lastAccessed);

  // Add "New Session" option to filtered results
  const allOptions = [
    { type: 'new', id: 'new-session' },
    ...filteredSessions.map(session => ({ type: 'session', ...session }))
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, allOptions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && allOptions[focusedIndex]) {
          const option = allOptions[focusedIndex];
          if (option.type === 'new') {
            handleNewSession();
          } else {
            handleSessionSelect(option.id);
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
        break;
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      {/* Main Selector */}
      <div className="flex items-center bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-full shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
        {/* Status Indicator */}
        <div className="flex-shrink-0 pl-4 pr-2">
          <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${
            currentSession ? 'bg-emerald-400 shadow-emerald-400/50 shadow-sm' : 'bg-slate-300'
          }`} />
        </div>

        {/* Session Name / Input */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={handleEditKeyDown}
              className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none py-2"
              placeholder="Session name..."
            />
          ) : (
            <button
              onClick={() => setIsOpen(!isOpen)}
              onKeyDown={handleKeyDown}
              className="w-full text-left py-2 text-sm font-medium text-slate-900 hover:text-slate-700 transition-colors duration-150 truncate focus:outline-none"
              aria-expanded={isOpen}
              aria-haspopup="listbox"
            >
              {currentSession?.name || 'Select session...'}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center pr-2">
          {currentSession && !isEditing && (
            <button
              onClick={startEditing}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all duration-150 mr-1"
              title="Rename session"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all duration-150"
          >
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-xl z-50 max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-colors"
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-64 overflow-y-auto py-2">
            {allOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                No sessions found
              </div>
            ) : (
              allOptions.map((option, index) => {
                const isFocused = focusedIndex === index;
                const isSelected = option.type === 'session' && currentSession?.id === option.id;

                if (option.type === 'new') {
                  return (
                    <button
                      key="new-session"
                      onClick={handleNewSession}
                      className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 ${
                        isFocused ? 'bg-slate-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-slate-900">New Session</div>
                          <div className="text-xs text-slate-500">Start fresh</div>
                        </div>
                      </div>
                    </button>
                  );
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => handleSessionSelect(option.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors ${
                      isSelected ? 'bg-cyan-50/50 border-r-2 border-r-cyan-400' : ''
                    } ${isFocused ? 'bg-slate-50' : ''}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isSelected ? 'bg-cyan-400 shadow-cyan-400/50 shadow-sm' : 'bg-slate-300'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <div className={`font-medium truncate ${
                          isSelected ? 'text-cyan-700' : 'text-slate-900'
                        }`}>
                          {'name' in option ? option.name : 'Unknown Session'}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {'nodes' in option ? option.nodes.length : 0} nodes • {'lastAccessed' in option ? formatDate(option.lastAccessed) : 'Unknown'}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SessionSelector;