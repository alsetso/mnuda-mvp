'use client';

import { useAuth } from '@/features/auth';
import PageLayout from '@/components/PageLayout';

interface AccountLayoutProps {
  children: React.ReactNode;
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  const { user: _user, isLoading: _isLoading } = useAuth();

  return (
    <PageLayout showFooter={false} containerMaxWidth="2xl" contentPadding="px-4 sm:px-6 lg:px-8 py-6">
      <div>
        {children}
      </div>
    </PageLayout>
  );
}
