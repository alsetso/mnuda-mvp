'use client';

import React from 'react';
import AppHeader from '@/features/session/components/AppHeader';
import Footer from '@/features/ui/components/Footer';
import { SessionData } from '@/features/session/services/sessionStorage';

interface PageLayoutProps {
  children: React.ReactNode;
  /**
   * Show header - defaults to true for authenticated pages
   */
  showHeader?: boolean;
  /**
   * Show footer - defaults to true for authenticated pages
   */
  showFooter?: boolean;
  /**
   * Custom header configuration
   */
  headerProps?: {
    currentSession?: SessionData | null;
    sessions?: SessionData[];
    onNewSession?: () => Promise<SessionData>;
    onSessionSwitch?: (sessionId: string) => void;
    updateUrl?: boolean;
    showSessionSelector?: boolean;
    showMobileToggle?: boolean;
  };
  /**
   * Page container max width class
   */
  containerMaxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  /**
   * Background color class
   */
  backgroundColor?: string;
  /**
   * Padding class for main content
   */
  contentPadding?: string;
}

/**
 * Unified Page Layout Component
 * 
 * Enterprise-grade layout wrapper that ensures consistent header/footer
 * across all pages with proper flex layout and no duplication.
 * 
 * Features:
 * - Single source of truth for header/footer
 * - Conditional rendering for auth pages
 * - Proper flex layout with sticky header
 * - Consistent spacing and containers
 * - No footer duplication
 */
export default function PageLayout({
  children,
  showHeader = true,
  showFooter = true,
  headerProps = {},
  containerMaxWidth = '7xl',
  backgroundColor = 'bg-gray-50',
  contentPadding = 'px-4 sm:px-6 lg:px-8 py-8',
}: PageLayoutProps) {
  const maxWidthClass = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  }[containerMaxWidth];

  const heightClass = showFooter === false && contentPadding === '' ? 'h-screen' : '';
  const overflowClass = showFooter === false && contentPadding === '' ? 'overflow-hidden' : '';
  const minHeightClass = showFooter !== false || contentPadding !== '' ? 'min-h-screen' : '';
  const mainOverflowClass = showFooter === false && contentPadding === '' ? 'overflow-hidden' : 'overflow-visible';

  return (
    <div className={`flex flex-col ${backgroundColor} ${heightClass} ${overflowClass} ${minHeightClass}`} style={{ 
      margin: 0, 
      padding: 0, 
      height: showFooter === false && contentPadding === '' ? '100vh' : undefined,
      width: '100%',
      maxWidth: '100vw',
      position: 'relative'
    }}>
      {/* Header - Sticky */}
      {showHeader && (
        <div className="flex-shrink-0" style={{ margin: 0, padding: 0 }}>
          <AppHeader
            currentSession={headerProps.currentSession ?? null}
            sessions={headerProps.sessions ?? []}
            onNewSession={
              headerProps.onNewSession ??
              (async () => ({
                id: '',
                name: '',
                createdAt: Date.now(),
                lastAccessed: Date.now(),
                nodes: [],
                locationTrackingActive: false,
                isActive: true,
              }))
            }
            onSessionSwitch={headerProps.onSessionSwitch ?? (() => {})}
            updateUrl={headerProps.updateUrl ?? false}
            showSessionSelector={headerProps.showSessionSelector ?? false}
            showMobileToggle={headerProps.showMobileToggle ?? false}
          />
        </div>
      )}

      {/* Main Content - Flex grow to push footer down */}
      <main className={`flex-1 ${maxWidthClass !== 'max-w-full' ? `${maxWidthClass} mx-auto w-full` : 'w-full'} ${mainOverflowClass}`} style={{ 
        maxWidth: '100vw', 
        margin: 0, 
        padding: 0, 
        width: '100%',
        minHeight: 0,
        flexShrink: 1,
        position: 'relative'
      }}>
        <div className={contentPadding || ''} style={contentPadding ? { margin: 0, width: '100%' } : { height: '100%', width: '100%', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </main>

      {/* Footer - Auto at bottom */}
      {showFooter && (
        <div className="flex-shrink-0">
          <Footer />
        </div>
      )}
    </div>
  );
}

