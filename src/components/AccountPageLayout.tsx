'use client';

import { ReactNode } from 'react';
import AccountSidebar from './AccountSidebar';

interface AccountPageLayoutProps {
  children: ReactNode;
}

/**
 * AccountPageLayout - Two-column grid for account pages
 * Only handles the content area grid (sidebar nav + page content)
 * Should be used inside SimplePageLayout which provides nav and footer
 */
export default function AccountPageLayout({ children }: AccountPageLayoutProps) {
  return (
    <div className="max-w-7xl xl:max-w-[90rem] 2xl:max-w-[100rem] mx-auto p-[10px]">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-3">
        {/* Left sidebar navigation */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <AccountSidebar />
        </aside>

        {/* Main content */}
        <main className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

