'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/features/auth';
import { ToastProvider } from '@/features/ui/contexts/ToastContext';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  );
}

