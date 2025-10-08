/**
 * Client Component wrapper for locality pages
 * Handles AppHeader with event handlers
 */

'use client';

import AppHeader from '@/features/session/components/AppHeader';
import LocalityPage from './LocalityPage';
import { LocalityDetail } from '../services/localityService';

interface LocalityPageWrapperProps {
  locality?: LocalityDetail;
  status?: 'for-sale' | 'for-rent';
  searchCity?: string;
  fallbackMessage?: string;
  children?: React.ReactNode;
}

export default function LocalityPageWrapper({ locality, status, searchCity, fallbackMessage, children }: LocalityPageWrapperProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 z-50">
        <AppHeader
          currentSession={null}
          sessions={[]}
          onNewSession={() => {
            // No-op for locality pages
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
          onSessionSwitch={() => {
            // No-op for locality pages
          }}
          updateUrl={false}
        />
      </div>
      <div className="h-[50px]"></div>
      
      {children ? children : (
        locality && status && searchCity ? (
          <LocalityPage locality={locality} status={status} searchCity={searchCity} fallbackMessage={fallbackMessage} />
        ) : null
      )}
    </div>
  );
}

