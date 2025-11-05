'use client';

import { useState, ReactNode, useEffect } from 'react';
import SecondarySidebar from './SecondarySidebar';
import RightPanel from './RightPanel';

interface DiscordLayoutProps {
  children: ReactNode;
  workspaces?: Array<{
    id: string;
    name: string;
    description?: string;
    emoji?: string;
    memberCount: number;
    propertyCount: number;
  }>;
  workspacesLoading?: boolean;
  onSecondarySidebarToggle?: () => void;
  onRightPanelToggle?: () => void;
}

export default function DiscordLayout({ 
  children, 
  workspaces = [],
  workspacesLoading = false,
  onSecondarySidebarToggle,
  onRightPanelToggle,
}: DiscordLayoutProps) {
  // Responsive defaults: closed on mobile, open on desktop
  const [isSecondarySidebarOpen, setIsSecondarySidebarOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  useEffect(() => {
    // Set initial state based on screen size
    const checkScreenSize = () => {
      if (window.innerWidth >= 1024) {
        setIsSecondarySidebarOpen(true);
        setIsRightPanelOpen(true);
      } else {
        setIsSecondarySidebarOpen(false);
        setIsRightPanelOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <div className="flex flex-1 h-[calc(100vh-3rem)] bg-gold-100 overflow-hidden">
      {/* Secondary Sidebar - Workspaces & Community */}
      <SecondarySidebar
        isOpen={isSecondarySidebarOpen}
        onToggle={() => {
          setIsSecondarySidebarOpen(!isSecondarySidebarOpen);
          onSecondarySidebarToggle?.();
        }}
        workspaces={workspaces}
        isLoading={workspacesLoading}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="flex-1 overflow-y-auto bg-gold-100">
          {children}
        </div>
      </main>

      {/* Right Panel - News & Data */}
      <RightPanel
        isOpen={isRightPanelOpen}
        onToggle={() => {
          setIsRightPanelOpen(!isRightPanelOpen);
          onRightPanelToggle?.();
        }}
      />
    </div>
  );
}
