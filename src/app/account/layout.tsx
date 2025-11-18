'use client';

import PageLayout from '@/components/PageLayout';

interface AccountLayoutProps {
  children: React.ReactNode;
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  return (
    <PageLayout showFooter={false} containerMaxWidth="2xl" contentPadding="px-4 sm:px-6 lg:px-8 py-6">
      <div>
        {children}
      </div>
    </PageLayout>
  );
}

