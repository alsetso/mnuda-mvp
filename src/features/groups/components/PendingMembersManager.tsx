'use client';

import { useState, useEffect } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { GroupService } from '../services/groupService';
import type { GroupMember, IntakeResponse } from '../types';
import { useToast } from '@/features/ui/hooks/useToast';
import ProfilePhoto from '@/components/ProfilePhoto';

interface PendingMembersManagerProps {
  groupId: string;
}

export function PendingMembersManager({ groupId }: PendingMembersManagerProps) {
  const [pendingMembers, setPendingMembers] = useState<GroupMember[]>([]);
  const [memberResponses, setMemberResponses] = useState<Record<string, IntakeResponse[]>>({});
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const { success, error: showError } = useToast();

  const loadPendingMembers = async () => {
    setIsLoading(true);
    try {
      const members = await GroupService.getPendingMembers(groupId);
      setPendingMembers(members);

      // Load responses for all pending members
      const responsesMap: Record<string, IntakeResponse[]> = {};
      for (const member of members) {
        try {
          const responses = await GroupService.getMemberResponses(groupId, member.user_id);
          responsesMap[member.user_id] = responses;
        } catch (err) {
          console.error(`Failed to load responses for user ${member.user_id}:`, err);
        }
      }
      setMemberResponses(responsesMap);
    } catch (err) {
      showError('Failed to Load', err instanceof Error ? err.message : 'Could not load pending members.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPendingMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const handleApprove = async (userId: string) => {
    setProcessingIds(prev => new Set(prev).add(userId));
    try {
      await GroupService.updateMemberStatus(groupId, userId, 'approved');
      await loadPendingMembers();
      success('Member Approved', 'The member has been approved and can now participate.');
    } catch (err) {
      showError('Failed to Approve', err instanceof Error ? err.message : 'Could not approve member.');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleDeny = async (userId: string) => {
    if (!confirm('Are you sure you want to deny this member? This action cannot be undone.')) {
      return;
    }

    setProcessingIds(prev => new Set(prev).add(userId));
    try {
      await GroupService.updateMemberStatus(groupId, userId, 'denied');
      await loadPendingMembers();
      success('Member Denied', 'The member request has been denied.');
    } catch (err) {
      showError('Failed to Deny', err instanceof Error ? err.message : 'Could not deny member.');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const toggleExpand = (userId: string) => {
    setExpandedMember(expandedMember === userId ? null : userId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (pendingMembers.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p className="text-gray-500 mb-2">No pending members</p>
        <p className="text-sm text-gray-400">
          New join requests will appear here for your review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-black">Pending Members</h3>
        <p className="text-sm text-gray-500 mt-1">
          Review and approve or deny membership requests.
        </p>
      </div>

      <div className="space-y-3">
        {pendingMembers.map((member) => {
          const user = member.user;
          const responses = memberResponses[member.user_id] || [];
          const isExpanded = expandedMember === member.user_id;
          const isProcessing = processingIds.has(member.user_id);

          if (!user) return null;

          return (
            <div
              key={member.user_id}
              className="bg-white border-2 border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start gap-4">
                <ProfilePhoto
                  profile={{
                    id: user.id,
                    avatar_url: user.avatar_url,
                    name: user.name,
                    email: user.email
                  }}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div>
                      <h4 className="font-semibold text-black truncate">
                        {user.name || 'Unknown User'}
                      </h4>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApprove(member.user_id)}
                        disabled={isProcessing}
                        className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Approve member"
                      >
                        <CheckIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeny(member.user_id)}
                        disabled={isProcessing}
                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Deny member"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mb-2">
                    Requested {new Date(member.joined_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </div>

                  {responses.length > 0 && (
                    <div>
                      <button
                        onClick={() => toggleExpand(member.user_id)}
                        className="text-sm text-gold-600 hover:text-gold-700 font-medium"
                      >
                        {isExpanded ? 'Hide' : 'Show'} Responses ({responses.length})
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-3 pt-3 border-t border-gray-200">
                          {responses.map((response, idx) => (
                            <div key={`${response.question_id}-${idx}`} className="bg-gray-50 rounded-lg p-3">
                              <div className="text-sm font-semibold text-gray-700 mb-1">
                                {response.question?.question_text || 'Question'}
                              </div>
                              <div className="text-sm text-gray-900 whitespace-pre-wrap">
                                {response.response_text}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {responses.length === 0 && (
                    <p className="text-xs text-gray-400 italic">No intake responses provided</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

