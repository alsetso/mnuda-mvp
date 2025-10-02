'use client';

import { useRouter, usePathname } from 'next/navigation';
import { SessionData } from '../services/sessionStorage';

interface SessionSelectorProps {
  onNewSession: () => SessionData;
  currentSession: SessionData | null;
  sessions: SessionData[];
  onSessionSwitch: (sessionId: string) => void;
  updateUrl?: boolean;
}

function SessionSelector({ 
  currentSession
}: SessionSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isOnMapPage = pathname === '/map';

  const handleSessionClick = () => {
    if (!isOnMapPage && currentSession) {
      router.push(`/map?session=${currentSession.id}`);
    }
  };

  return (
    <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full transition-all duration-200 overflow-hidden w-full max-w-full">
      {/* Status Indicator */}
      <div className="flex-shrink-0 pl-3 sm:pl-4 pr-1 sm:pr-2">
        <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${
          currentSession ? 'bg-emerald-400 shadow-emerald-400/50 shadow-sm' : 'bg-slate-300'
        }`} />
      </div>

      {/* Session Name */}
      <div className="flex-1 min-w-0 max-w-full overflow-hidden">
        {!isOnMapPage && currentSession ? (
          <button
            onClick={handleSessionClick}
            className="w-full text-left py-2 pr-2 sm:pr-3 text-xs sm:text-sm font-medium text-slate-900 hover:text-slate-700 transition-colors duration-150 truncate focus:outline-none"
            title={currentSession.name}
          >
            {currentSession.name}
          </button>
        ) : (
          <div 
            className="w-full text-left py-2 pr-2 sm:pr-3 text-xs sm:text-sm font-medium text-slate-900 truncate"
            title={currentSession?.name || 'No session selected'}
          >
            {currentSession?.name || 'No session selected'}
          </div>
        )}
      </div>
    </div>
  );
}

export default SessionSelector;