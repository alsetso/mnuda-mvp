'use client';

import { useEffect, useState, ReactNode } from 'react';
import AppSidebarClient from './AppSidebarClient';
import { useAuth } from '@/features/auth';

interface AppContentWrapperProps {
  children: ReactNode;
}

export default function AppContentWrapper({ children }: AppContentWrapperProps) {
  const headerHeight = '3.5rem'; // 56px
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(false);
  const { user } = useAuth();
  const isAuthenticated = !!user;

  // Listen for sidebar state changes from AppTop
  useEffect(() => {
    const handleSidebarState = (e: Event) => {
      const customEvent = e as CustomEvent<{ isOpen: boolean }>;
      setIsSidebarOpen(customEvent.detail.isOpen);
    };
    
    const handleAgentPanelState = (e: Event) => {
      const customEvent = e as CustomEvent<{ isOpen: boolean }>;
      setIsAgentPanelOpen(customEvent.detail.isOpen);
    };

    window.addEventListener('appSidebarState', handleSidebarState);
    window.addEventListener('appAgentPanelState', handleAgentPanelState);

    return () => {
      window.removeEventListener('appSidebarState', handleSidebarState);
      window.removeEventListener('appAgentPanelState', handleAgentPanelState);
    };
  }, []);

  return (
    <div
      className="fixed z-[90] bg-[#f4f2ef] overflow-hidden left-0 bottom-0 rounded-t-md"
      style={{
        top: headerHeight,
        right: isAgentPanelOpen ? '485px' : '0', // 480px panel + 5px gap
        width: isAgentPanelOpen ? 'calc(100% - 480px - 5px)' : '100%',
      }}
    >
      {/* Main Content Container with Sidebar Inside */}
      <div className="h-full w-full flex overflow-hidden relative">
        {/* Sidebar - Desktop: in flex layout, Mobile: absolute overlay (doesn't take flex space) */}
        {isAuthenticated && !isAgentPanelOpen && (
          <div 
            className="h-full overflow-hidden absolute md:relative md:flex-shrink-0 z-[200] rounded-tl-md"
          >
            <AppSidebarClient isAuthenticated={isAuthenticated} />
          </div>
        )}

        {/* Content Container - Expands to full width on mobile, flex-1 on desktop */}
        <div className="flex-1 h-full overflow-y-auto overflow-x-hidden w-full md:w-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

