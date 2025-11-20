'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth, AccountService, Account } from '@/features/auth';
import ProfilePhoto from '@/components/ProfilePhoto';
import { navItems } from '@/config/navigation';

export default function IconBar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    const fetchAccount = async () => {
      if (user) {
        try {
          const accountData = await AccountService.getCurrentAccount();
          setAccount(accountData);
        } catch (error) {
          console.error('Error fetching account for IconBar:', error);
        }
      }
    };

    fetchAccount();
  }, [user]);

  if (!user) return null;

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const homeItem = navItems.find(item => item.href === '/');
  const HomeIcon = homeItem?.icon;

  return (
    <div className="flex-shrink-0 w-12 bg-gold-100 border-r border-gray-300 flex flex-col items-center py-1.5" style={{ height: 'calc(100vh - 3rem)', marginTop: 0 }}>
      {/* Logo/Home Icon */}
      {HomeIcon && (
        <Link
          href="/"
          className={`mb-1.5 w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
            isActive('/')
              ? 'bg-gold-200/60 text-gold-600'
              : 'text-gray-700 hover:text-gold-600 hover:bg-gold-200/60'
          }`}
          title="Home"
        >
          <HomeIcon className="w-5 h-5" />
        </Link>
      )}

      {/* Divider */}
      <div className="w-6 h-px bg-gray-300 my-1.5" />

      {/* Navigation Icons */}
      <nav className="flex-1 flex flex-col items-center gap-1 w-full">
        {navItems.slice(1).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all relative group ${
                active
                  ? 'bg-gold-200/60 text-gold-600'
                  : 'text-gray-700 hover:text-gold-600 hover:bg-gold-200/60'
              }`}
              title={item.name}
            >
              <Icon className="w-5 h-5" />
              {/* Active indicator */}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-1 h-5 bg-gold-600 rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Icon */}
      <div className="mt-auto">
        <Link
          href="/account/settings"
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all overflow-hidden ${
            pathname.startsWith('/account')
              ? 'ring-2 ring-gold-600/50'
              : 'hover:ring-2 hover:ring-gold-600/50'
          }`}
          title="Account Settings"
        >
          <ProfilePhoto 
            profile={account ? {
              id: account.id,
              avatar_url: account.avatar_url,
              name: account.name,
              email: account.email
            } : null} 
            size="sm" 
            editable={false} 
          />
        </Link>
      </div>
    </div>
  );
}

