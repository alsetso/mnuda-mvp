'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserIcon, CreditCardIcon, Squares2X2Icon, XMarkIcon } from '@heroicons/react/24/outline';

interface AccountSidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AccountSidebar({ className = '', isOpen = true, onClose }: AccountSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/account/profiles', label: 'Profiles', icon: Squares2X2Icon },
    { href: '/account/settings', label: 'Settings', icon: UserIcon },
    { href: '/account/billing', label: 'Billing', icon: CreditCardIcon },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {onClose && (
        <>
          {isOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={onClose}
            />
          )}
        </>
      )}
      
      {/* Sidebar */}
      <nav className={`
        ${onClose ? 'fixed md:relative' : 'relative'}
        ${onClose && !isOpen ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
        top-0 left-0 h-full z-50
        w-60 flex-shrink-0 border-r border-gray-200 bg-white
        transition-transform duration-300 ease-in-out
        ${className}
      `}>
        {/* Mobile close button */}
        {onClose && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 md:hidden">
            <span className="text-sm font-semibold text-black">Menu</span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <XMarkIcon className="w-5 h-5 text-black" />
            </button>
          </div>
        )}
        
        <ul className="flex flex-col gap-1 p-2 lg:p-4 overflow-y-auto h-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            
            return (
              <li key={item.href} className="flex-shrink-0">
                <Link
                  href={item.href}
                  onClick={() => {
                    // Close mobile menu when navigating
                    if (onClose) {
                      onClose();
                    }
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

