'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserGroupIcon, ShareIcon, Cog6ToothIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import type { Group } from '../types';

interface GroupHeaderProps {
  group: Group;
  onJoin: () => Promise<void>;
  onLeave: () => Promise<void>;
  isJoining?: boolean;
  isLeaving?: boolean;
}

export function GroupHeader({ group, onJoin, onLeave, isJoining = false, isLeaving = false }: GroupHeaderProps) {
  const router = useRouter();
  const [isSharing, setIsSharing] = useState(false);
  
  const canEdit = group.current_user_is_owner;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: group.name,
          text: group.description || '',
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      setIsSharing(true);
      setTimeout(() => setIsSharing(false), 2000);
    }
  };

  return (
    <div className="bg-white border-b-2 border-gray-200 w-full relative">
      {/* Cover Image */}
      {group.cover_image_url && (
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={group.cover_image_url}
            alt={`${group.name} cover`}
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-white/80" />
        </div>
      )}
      
      <div className="relative w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-start gap-4 sm:gap-6">
          {/* Logo/Emoji/Icon - Larger, more prominent */}
          <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 bg-gold-100 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden ring-2 ring-white">
            {group.logo_image_url ? (
              <img
                src={group.logo_image_url}
                alt={group.name}
                className="w-full h-full object-cover"
              />
            ) : group.emoji ? (
              <span className="text-5xl sm:text-6xl">{group.emoji}</span>
            ) : (
              <UserGroupIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gold-600" />
            )}
          </div>

          {/* Content - Better spacing and hierarchy */}
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black leading-tight">
                  {group.name}
                </h1>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {group.group_visibility === 'unlisted' && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1.5">
                      <EyeSlashIcon className="w-4 h-4" />
                      <span>Unlisted</span>
                    </span>
                  )}
                  {group.feed_visibility === 'members_only' && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1.5">
                      <EyeSlashIcon className="w-4 h-4" />
                      <span>Members Only Feed</span>
                    </span>
                  )}
                </div>
              </div>
              
              {group.description && (
                <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base line-clamp-2">
                  {group.description}
                </p>
              )}

              {/* Stats - Compact, horizontal */}
              <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <UserGroupIcon className="w-4 h-4" />
                  <span className="font-medium">{group.member_count}</span>
                  <span>{group.member_count === 1 ? 'member' : 'members'}</span>
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1.5">
                  <EyeIcon className="w-4 h-4" />
                  <span className="font-medium">{group.visit_count.toLocaleString()}</span>
                  <span className="hidden sm:inline">{group.visit_count === 1 ? 'view' : 'views'}</span>
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">
                  Created {new Date(group.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Actions - Right aligned, compact */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {group.current_user_is_member ? (
                <button
                  onClick={onLeave}
                  disabled={isLeaving}
                  className="px-4 sm:px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
                >
                  {isLeaving ? 'Leaving...' : 'Leave'}
                </button>
              ) : (
                <button
                  onClick={onJoin}
                  disabled={isJoining}
                  className="px-4 sm:px-6 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap shadow-sm"
                >
                  {isJoining ? 'Joining...' : 'Join Group'}
                </button>
              )}
              
              {canEdit && (
                <button
                  onClick={() => router.push(`/group/${group.id}/settings`)}
                  className="p-2 sm:px-4 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base"
                  aria-label="Group settings"
                >
                  <Cog6ToothIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Settings</span>
                </button>
              )}
              
              {group.website && (
                <a
                  href={group.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 sm:px-4 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base"
                  aria-label="Visit website"
                >
                  <span className="hidden sm:inline">Website</span>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
              
              <button
                onClick={handleShare}
                className="p-2 sm:px-4 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base"
                aria-label="Share group"
              >
                <ShareIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{isSharing ? 'Copied!' : 'Share'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

