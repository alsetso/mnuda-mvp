'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SessionData } from '../services/sessionStorage';
import { useToast } from '@/features/ui/hooks/useToast';

interface SessionSelectorAccordionProps {
  onNewSession: () => SessionData;
  currentSession: SessionData | null;
  sessions: SessionData[];
  onSessionSwitch: (sessionId: string) => void;
  className?: string;
}

export default function SessionSelectorAccordion({ 
  onNewSession, 
  currentSession,
  sessions,
  onSessionSwitch,
  className = ''
}: SessionSelectorAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { success } = useToast();

  const handleSessionSelect = (sessionId: string) => {
    onSessionSwitch(sessionId);
    setIsExpanded(false);
    setSearchTerm('');
    setFocusedIndex(-1);
    router.push(`/map?session=${sessionId}`);
  };

  const handleNewSession = async () => {
    if (isCreatingSession) return;
    
    setIsCreatingSession(true);
    
    try {
      const newSession = onNewSession();
      
      // Show success toast
      success('New Session Created', `Session "${newSession.name}" has been created and is now active.`);
      
      setIsExpanded(false);
      setSearchTerm('');
      setFocusedIndex(-1);
      
      // Wait for the new session to be created and set as current
      if (newSession && newSession.id) {
        router.push(`/map?session=${newSession.id}`);
      } else {
        router.push('/map');
      }
    } catch (error) {
      console.error('Error creating new session:', error);
    } finally {
      setTimeout(() => {
        setIsCreatingSession(false);
      }, 500);
    }
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
    if (!isExpanded) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsExpanded(true);
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
        setIsExpanded(false);
        setSearchTerm('');
        setFocusedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setSearchTerm('');
        setFocusedIndex(-1);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);

  return (
    <div ref={containerRef} className={`border-b border-gray-200 ${className}`}>
      {/* Accordion Header */}
      <div className="p-4 bg-gray-50">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          onKeyDown={handleKeyDown}
          className="w-full flex items-center justify-between text-left focus:outline-none"
          aria-expanded={isExpanded}
          aria-haspopup="listbox"
        >
          <div className="flex items-center space-x-3">
            {/* Status Indicator */}
            <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              currentSession ? 'bg-emerald-400 shadow-emerald-400/50 shadow-sm' : 'bg-slate-300'
            }`} />
            
            {/* Session Info */}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900 truncate">
                {currentSession?.name || 'Select session...'}
              </div>
              <div className="text-xs text-gray-500">
                {currentSession ? `${currentSession.nodes.length} nodes` : 'No session selected'}
              </div>
            </div>
          </div>

          {/* Expand/Collapse Icon */}
          <div className="flex-shrink-0">
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
      </div>

      {/* Accordion Content */}
      {isExpanded && (
        <div className="bg-white border-t border-gray-200">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <svg className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded focus:outline-none focus:bg-white focus:border-gray-300 transition-colors"
                autoFocus
              />
            </div>
          </div>

          {/* Sessions List */}
          <div className="max-h-64 overflow-y-auto">
            {allOptions.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-gray-500">
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
                      disabled={isCreatingSession}
                      className={`w-full px-3 py-3 text-left transition-colors border-b border-gray-100 ${
                        isCreatingSession 
                          ? 'bg-gray-50 cursor-not-allowed' 
                          : 'hover:bg-gray-50'
                      } ${isFocused ? 'bg-gray-50' : ''}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                          isCreatingSession ? 'bg-gray-400' : 'bg-gray-600'
                        }`}>
                          {isCreatingSession ? (
                            <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={`text-sm font-medium ${
                            isCreatingSession ? 'text-gray-400' : 'text-gray-900'
                          }`}>
                            {isCreatingSession ? 'Creating Session...' : 'New Session'}
                          </div>
                          <div className="text-xs text-gray-500">Create a new investigation session</div>
                        </div>
                      </div>
                    </button>
                  );
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => handleSessionSelect(option.id)}
                    className={`w-full px-3 py-3 text-left hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-gray-50' : ''
                    } ${isFocused ? 'bg-gray-50' : ''}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isSelected ? 'bg-gray-600' : 'bg-gray-300'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm font-medium truncate ${
                          isSelected ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {'name' in option ? option.name : 'Unknown Session'}
                        </div>
                        <div className="text-xs text-gray-500">
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
