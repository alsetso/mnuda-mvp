/**
 * Client Component wrapper for state landing pages
 */

'use client';

import AppHeader from '@/features/session/components/AppHeader';

interface StateLandingWrapperProps {
  children: React.ReactNode;
}

export default function StateLandingWrapper({ children }: StateLandingWrapperProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 z-50">
        <AppHeader
          currentSession={null}
          sessions={[]}
          onNewSession={() => {
            return { id: '', name: '', createdAt: Date.now(), pins: [] };
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

