'use client';

import { UserGroupIcon } from '@heroicons/react/24/outline';
import type { GroupMember } from '../types';

interface GroupMembersListProps {
  members: GroupMember[];
  isLoading?: boolean;
}

export function GroupMembersList({ members, isLoading = false }: GroupMembersListProps) {
  const getAuthorInitial = (member: GroupMember): string => {
    if (member.user?.name) {
      return member.user.name.charAt(0).toUpperCase();
    }
    if (member.user?.email) {
      return member.user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getAuthorName = (member: GroupMember): string => {
    return member.user?.name || member.user?.email?.split('@')[0] || 'Anonymous';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-xl p-12 text-center">
        <p className="text-gray-500">No members yet.</p>
      </div>
    );
  }

  // Sort: owners first, then by join date
  const sortedMembers = [...members].sort((a, b) => {
    if (a.is_owner && !b.is_owner) return -1;
    if (!a.is_owner && b.is_owner) return 1;
    return new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime();
  });

  return (
    <div className="space-y-3">
      {sortedMembers.map((member) => (
        <div
          key={`${member.group_id}-${member.user_id}`}
          className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-gold-200 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {member.user?.avatar_url ? (
                <img
                  src={member.user.avatar_url}
                  alt={getAuthorName(member)}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
                />
              ) : (
                <div className="w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center ring-2 ring-gray-100">
                  <span className="text-gold-600 font-semibold text-base">
                    {getAuthorInitial(member)}
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-black text-sm sm:text-base">
                  {getAuthorName(member)}
                </span>
                {member.is_owner && (
                  <span className="px-2 py-0.5 bg-gold-100 text-gold-700 text-xs font-semibold rounded">
                    Owner
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                Joined {new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

