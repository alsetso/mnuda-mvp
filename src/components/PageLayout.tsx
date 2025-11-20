'use client';

import React from 'react';
import AppHeader from '@/features/session/components/AppHeader';
import Footer from '@/features/ui/components/Footer';
import { useAuth } from '@/features/auth';
import { useServerAuth } from '@/components/ServerAuthProvider';
import type { ServerAuthUser } from '@/lib/authServer';
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
  /**
   * Server-side auth data to prevent header flash
   * Pass this from server components that use getServerAuth()
   */
  serverAuth?: ServerAuthUser | null;
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
  serverAuth,
}: PageLayoutProps) {
  // Prefer server auth to prevent flash, fallback to client auth
  const serverAuthUser = useServerAuth();
  const { user: clientUser } = useAuth();
  const user = serverAuth || serverAuthUser || clientUser;
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

  // Height and overflow logic:
  // - When contentPadding is provided: use min-h-screen (allows natural scrolling)
  // - When contentPadding is empty and no footer: use h-screen with overflow-hidden (fixed viewport)
  // - When contentPadding is empty but footer exists: use min-h-screen (allows scrolling)
  const heightClass = shouldShowFooter === false && contentPadding === '' ? 'h-screen' : '';
  const overflowClass = shouldShowFooter === false && contentPadding === '' ? 'overflow-hidden' : '';
  const minHeightClass = shouldShowFooter !== false || contentPadding !== '' ? 'min-h-screen' : '';

  return (
    <div className={`flex flex-col ${backgroundColor} ${heightClass} ${overflowClass} ${minHeightClass}`} style={{ 
      margin: 0, 
      padding: 0, 
      height: shouldShowFooter === false && contentPadding === '' ? '100vh' : undefined,
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
            serverAuth={serverAuth || serverAuthUser}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden" style={{ margin: 0, padding: 0, marginTop: showHeader ? '3rem' : '0' }}>
        {/* Main Content - Scrollable area */}
        <main className={`flex-1 ${maxWidthClass !== 'max-w-full' ? `${maxWidthClass} mx-auto w-full` : 'w-full'} overflow-y-auto`} style={{ 
          maxWidth: '100vw', 
          margin: 0, 
          padding: 0, 
          paddingTop: showHeader && contentPadding ? '0' : '0',
          width: '100%',
          minHeight: 0,
          flexShrink: 1,
          position: 'relative',
          height: contentPadding ? undefined : '100%'
        }}>
          <div className={contentPadding || ''} style={contentPadding ? { margin: 0, width: '100%' } : { width: '100%', margin: 0, padding: 0 }}>
            {children}
          </div>
        </main>
      </div>

      {/* Footer - Auto at bottom 
          Logic:
          - Always shows when user is NOT logged in (public pages)
          - When logged in, shows only if showFooter={true}
      */}
      {shouldShowFooter && (
        <div className="flex-shrink-0">
          <Footer />
        </div>
      )}
    </div>
  );
}

