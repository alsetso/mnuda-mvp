'use client';

import { useAuth } from '@/features/auth';
import PageLayout from '@/components/PageLayout';

interface AssetsLayoutProps {
  children: React.ReactNode;
}

export default function AssetsLayout({ children }: AssetsLayoutProps) {
  const { user: _user, isLoading: _isLoading } = useAuth();

  return (
    <PageLayout showFooter={false} containerMaxWidth="7xl" contentPadding="px-4 sm:px-6 lg:px-8 pt-0 pb-8">
      {children}
    </PageLayout>
  );
}

