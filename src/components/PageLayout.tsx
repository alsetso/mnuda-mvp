'use client';

import React from 'react';
import AppHeader from '@/features/session/components/AppHeader';
import Footer from '@/features/ui/components/Footer';
import IconBar from '@/components/IconBar';
import { useAuth } from '@/features/auth';
import { SessionData } from '@/features/session/services/sessionStorage';

interface PageLayoutProps {
  children: React.ReactNode;
  /**
   * Show header - defaults to true for authenticated pages
   */
  showHeader?: boolean;
  /**
   * Show footer
   * - When user is NOT logged in: Footer always shows (ignores this prop)
   * - When user IS logged in: Respects this prop (defaults to false for authenticated pages)
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
  backgroundColor = 'bg-gold-100',
  contentPadding = 'px-4 sm:px-6 lg:px-8 py-8',
}: PageLayoutProps) {
  const { user } = useAuth();
  const maxWidthClass = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  }[containerMaxWidth];

  // Footer logic:
  // - Always show footer when user is NOT logged in (public pages)
  // - When logged in, respect the showFooter prop (default false for authenticated pages)
  const shouldShowFooter = !user ? true : showFooter;
  const hasIconBar = user && showHeader;

  const heightClass = shouldShowFooter === false && contentPadding === '' ? 'h-screen' : '';
  const overflowClass = shouldShowFooter === false && contentPadding === '' ? 'overflow-hidden' : '';
  const minHeightClass = shouldShowFooter !== false || contentPadding !== '' ? 'min-h-screen' : '';

  return (
    <div className={`flex flex-col ${backgroundColor} ${heightClass} ${overflowClass} ${minHeightClass} ${hasIconBar ? 'h-screen' : ''}`} style={{ 
      margin: 0, 
      padding: 0, 
      height: shouldShowFooter === false && contentPadding === '' ? '100vh' : (hasIconBar ? '100vh' : undefined),
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

      {/* Main Content with Icon Bar if authenticated */}
      <div className="flex flex-1 min-h-0 overflow-hidden" style={{ margin: 0, padding: 0 }}>
        {/* Icon Bar - Always on left for authenticated users, fixed height */}
        {hasIconBar && (
          <div className="flex-shrink-0" style={{ margin: 0, padding: 0 }}>
            <IconBar />
          </div>
        )}

        {/* Main Content - Scrollable area */}
        <main className={`flex-1 ${maxWidthClass !== 'max-w-full' ? `${maxWidthClass} mx-auto w-full` : 'w-full'} overflow-y-auto`} style={{ 
          maxWidth: '100vw', 
          margin: 0, 
          padding: 0, 
          width: '100%',
          minHeight: 0,
          flexShrink: 1,
          position: 'relative'
        }}>
          <div className={contentPadding || ''} style={contentPadding ? { margin: 0, width: '100%' } : { width: '100%', margin: 0, padding: 0 }}>
            {children}
          </div>
        </main>
      </div>

      {/* Footer - Auto at bottom 
          Logic:
          - Always shows when user is NOT logged in (public pages)
          - When logged in, shows only if showFooter={true} AND no icon bar
          - Hidden when icon sidebar is shown (authenticated dashboard view)
      */}
      {shouldShowFooter && !hasIconBar && (
        <div className="flex-shrink-0">
          <Footer />
        </div>
      )}
    </div>
  );
}

