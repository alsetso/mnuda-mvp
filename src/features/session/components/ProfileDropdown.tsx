'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, MemberService, Member } from '@/features/auth';
import ProfilePhoto from '@/components/ProfilePhoto';

interface ProfileDropdownProps {
  className?: string;
}

export default function ProfileDropdown({ className = '' }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const fetchMember = async () => {
      if (user) {
        try {
          const memberData = await MemberService.getCurrentMember();
          setMember(memberData);
        } catch (error) {
          console.error('Error fetching member for ProfileDropdown:', error);
        }
      }
    };

    fetchMember();
  }, [user]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      localStorage.removeItem('freemap_sessions');
      localStorage.removeItem('freemap_current_session');
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [isOpen]);

  if (!user) {
    return (
      <Link
        href="/login"
        className={`px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-700 rounded transition-colors ${className}`}
      >
        Sign In
      </Link>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Profile Button */}
      <button
        onClick={handleToggle}
        className={`flex items-center space-x-2 px-2 sm:px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
          isOpen
            ? 'text-gold-400 bg-gray-800/60'
            : 'text-gray-300 hover:text-gold-400 hover:bg-gray-800/60'
        }`}
      >
        <ProfilePhoto 
          profile={member ? {
            id: member.id,
            avatar_url: member.avatar_url,
            name: member.name,
            email: member.email
          } : null}
          size="sm"
          editable={false}
        />
        <svg 
          className={`w-4 h-4 transition-all duration-200 ${isOpen ? 'rotate-180 text-gold-400' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full w-56 bg-black/95 backdrop-blur-md z-50 overflow-hidden">
          <div className="py-1">
            {/* User Info */}
            <div className="px-4 py-3">
              <p className="text-sm font-medium text-gray-100">{user.email}</p>
              <p className="text-xs text-gray-400">Account</p>
            </div>

            {/* Navigation Links */}
            <Link
              href="/account/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-300 hover:text-gold-400 hover:bg-gray-800/60 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gold-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
            <Link
              href="/account/business"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-300 hover:text-gold-400 hover:bg-gray-800/60 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gold-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Business
            </Link>
            <Link
              href="/account/billing"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-300 hover:text-gold-400 hover:bg-gray-800/60 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gold-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Billing
            </Link>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:text-gold-400 hover:bg-gray-800/60 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gold-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
