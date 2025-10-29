'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/features/auth';
import PageLayout from '@/components/PageLayout';

interface AccountLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { name: 'Overview', href: '/account' },
  { name: 'Settings', href: '/account/settings' },
];

export default function AccountLayout({ children }: AccountLayoutProps) {
  const pathname = usePathname();
  const { user: _user, isLoading: _isLoading } = useAuth();

  return (
    <PageLayout containerMaxWidth="2xl" contentPadding="px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            {navigationItems.find(item => item.href === pathname)?.name || 'Account'}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8 border-b border-gray-200">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Page Content */}
        <div className="bg-white border border-gray-200 rounded">
          {children}
        </div>
    </PageLayout>
  );
}
