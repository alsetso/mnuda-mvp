'use client';

import Link from 'next/link';
import { UserGroupIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import type { Group } from '../types';

interface GroupCardProps {
  group: Group;
  onJoinClick?: (group: Group) => void;
}

export function GroupCard({ group, onJoinClick }: GroupCardProps) {
  const handleJoinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onJoinClick) {
      onJoinClick(group);
    }
  };

  return (
    <div className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gold-500 hover:shadow-lg transition-all duration-200">
      <Link
        href={`/group/${group.id}`}
        className="block"
      >
        <div className="flex items-start gap-4">
          {/* Logo/Emoji/Icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center group-hover:bg-gold-200 transition-colors overflow-hidden">
            {group.logo_image_url ? (
              <img
                src={group.logo_image_url}
                alt={group.name}
                className="w-full h-full object-cover"
              />
            ) : group.emoji ? (
              <span className="text-2xl">{group.emoji}</span>
            ) : (
              <UserGroupIcon className="w-6 h-6 text-gold-600" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-lg font-bold text-black group-hover:text-gold-600 transition-colors line-clamp-1 flex-1">
                {group.name}
              </h3>
            </div>
            
            {group.description && (
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-3">
                {group.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <UserGroupIcon className="w-4 h-4" />
                {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
              </span>
              <span className="flex items-center gap-1">
                <EyeIcon className="w-4 h-4" />
                {group.visit_count.toLocaleString()}
              </span>
              {group.feed_visibility === 'members_only' && (
                <span className="flex items-center gap-1 text-gray-400">
                  <EyeSlashIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Members Only</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Join Button - Only show if user is not a member */}
      {!group.current_user_is_member && onJoinClick && (
        <div className="mt-4 pt-4 border-t-2 border-gray-200">
          <button
            onClick={handleJoinClick}
            className="w-full px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors"
          >
            Join Group
          </button>
        </div>
      )}
    </div>
  );
}

