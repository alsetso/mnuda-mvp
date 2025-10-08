/**
 * Client Component wrapper for index pages (cities/counties/zips)
 */

'use client';

import AppHeader from '@/features/session/components/AppHeader';

interface IndexPageWrapperProps {
  children: React.ReactNode;
}

export default function IndexPageWrapper({ children }: IndexPageWrapperProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 z-50">
        <AppHeader
          currentSession={null}
          sessions={[]}
          onNewSession={() => {
            return { 
              id: '', 
              name: '', 
              createdAt: Date.now(), 
              pins: [],
              lastAccessed: Date.now(),
              nodes: [],
              locationTrackingActive: false
            };
          }}
          onSessionSwitch={() => {}}
          updateUrl={false}
        />
      </div>
      <div className="h-[50px]"></div>
      {children}
    </div>
  );
}

