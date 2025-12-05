'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/features/auth';
import { ToastProvider } from '@/features/ui/contexts/ToastContext';
import { ProfileProvider } from '@/features/profiles/contexts/ProfileContext';
import PageLoadingOverlay from '@/components/feed/PageLoadingOverlay';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ProfileProvider>
        <ToastProvider>
          <PageLoadingOverlay />
          {children}
        </ToastProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}



