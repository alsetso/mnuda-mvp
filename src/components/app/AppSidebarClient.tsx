'use client';

/**
 * @deprecated Use AppSidebar with useClientState={true} instead
 * This component is kept for backward compatibility but will be removed
 */
import AppSidebar from './AppSidebar';

interface AppSidebarClientProps {
  isAuthenticated: boolean;
}

export default function AppSidebarClient({ isAuthenticated }: AppSidebarClientProps) {
  return <AppSidebar isAuthenticated={isAuthenticated} useClientState={true} />;
}

