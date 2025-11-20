'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/features/auth';
import { ToastProvider } from '@/features/ui/contexts/ToastContext';
import { ProfileProvider } from '@/features/profiles/contexts/ProfileContext';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ProfileProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}

