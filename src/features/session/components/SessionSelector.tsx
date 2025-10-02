'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SessionData } from '../services/sessionStorage';

interface SessionSelectorProps {
  onNewSession: () => SessionData;
  currentSession: SessionData | null;
  sessions: SessionData[];
  onSessionSwitch: (sessionId: string) => void;
  onSessionRename?: (sessionId: string, newName: string) => void;
  updateUrl?: boolean;
}

function SessionSelector({ 
  currentSession,
  onSessionRename
}: SessionSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isOnMapPage = pathname === '/map';
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSessionClick = () => {
    if (!isOnMapPage && currentSession) {
      router.push(`/map?session=${currentSession.id}`);
    }
  };

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

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full transition-all duration-200 overflow-hidden w-full max-w-full">
      {/* Status Indicator */}
      <div className="flex-shrink-0 pl-3 sm:pl-4 pr-1 sm:pr-2">
        <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${
          currentSession ? 'bg-emerald-400 shadow-emerald-400/50 shadow-sm' : 'bg-slate-300'
        }`} />
      </div>

      {/* Session Name */}
      <div className="flex-1 min-w-0 max-w-full overflow-hidden group">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleKeyDown}
            className="w-full py-2 pr-2 sm:pr-3 text-xs sm:text-sm font-medium text-slate-900 bg-transparent border-none outline-none"
            maxLength={50}
          />
        ) : !isOnMapPage && currentSession ? (
          <div className="flex items-center w-full">
            <button
              onClick={handleSessionClick}
              className="flex-1 text-left py-2 pr-2 sm:pr-3 text-xs sm:text-sm font-medium text-slate-900 hover:text-slate-700 transition-colors duration-150 truncate focus:outline-none"
              title={currentSession.name}
            >
              {currentSession.name}
            </button>
            {onSessionRename && (
              <button
                onClick={handleEditClick}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-[#1dd1f5] transition-all duration-150 flex-shrink-0"
                title="Rename session"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>
        ) : currentSession ? (
          <div className="flex items-center w-full">
            <div 
              className="flex-1 text-left py-2 pr-2 sm:pr-3 text-xs sm:text-sm font-medium text-slate-900 truncate"
              title={currentSession.name}
            >
              {currentSession.name}
            </div>
            {onSessionRename && (
              <button
                onClick={handleEditClick}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-[#1dd1f5] transition-all duration-150 flex-shrink-0"
                title="Rename session"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <div 
            className="w-full text-left py-2 pr-2 sm:pr-3 text-xs sm:text-sm font-medium text-slate-900 truncate"
            title="No session selected"
          >
            No session selected
          </div>
        )}
      </div>
    </div>
  );
}

export default SessionSelector;