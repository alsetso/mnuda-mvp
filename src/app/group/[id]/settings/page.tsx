'use client';

import { useParams, useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import { useAuth } from '@/features/auth';
import { useGroup } from '@/features/groups/hooks/useGroup';
import { GroupService } from '@/features/groups/services/groupService';
import { EditGroupModal } from '@/features/groups/components/EditGroupModal';
import { IntakeQuestionsManager } from '@/features/groups/components/IntakeQuestionsManager';
import { PendingMembersManager } from '@/features/groups/components/PendingMembersManager';
import { DeleteModal } from '@/features/ui/components/DeleteModal';
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/features/ui/hooks/useToast';
import { useState } from 'react';

export default function GroupSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const { user } = useAuth();
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isValidId = groupId && uuidRegex.test(groupId);
  
  const { group, refreshGroup } = useGroup(groupId);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { success, error: showError } = useToast();

  const handleUpdateGroup = async (groupId: string, data: { name?: string; emoji?: string | null; description?: string | null; logo_image_url?: string | null; cover_image_url?: string | null; website?: string | null; group_visibility?: string; feed_visibility?: string; requires_approval?: boolean }) => {
    try {
      const updatedGroup = await GroupService.updateGroup(groupId, data);
      success('Group Updated', `${updatedGroup.name} has been updated!`);
      await refreshGroup();
    } catch (err) {
      showError('Failed to Update Group', err instanceof Error ? err.message : 'Please try again.');
      throw err;
    }
  };

  const handleDeleteGroup = async () => {
    if (!group) return;
    setIsDeleting(true);
    try {
      await GroupService.deleteGroup(group.id);
      success('Group Deleted', 'The group has been deleted.');
      router.push('/group');
    } catch (err) {
      showError('Failed to Delete Group', err instanceof Error ? err.message : 'Please try again.');
      setIsDeleting(false);
      throw err;
    }
  };

  if (!user) {
    return (
      <PageLayout showHeader={true} showFooter={false}>
        <div className="min-h-screen bg-gold-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Please log in to view group settings.</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!isValidId) {
    return (
      <PageLayout showHeader={true} showFooter={false} containerMaxWidth="7xl" backgroundColor="bg-gold-100">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-2">Invalid Group ID</p>
            <p className="text-gray-400">The group ID in the URL is not valid.</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!group) {
    return (
      <PageLayout showHeader={true} showFooter={false} containerMaxWidth="7xl" backgroundColor="bg-gold-100">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-2">Group not found.</p>
            <p className="text-gray-400">The group you're looking for doesn't exist or has been deleted.</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!group.current_user_is_owner) {
    return (
      <PageLayout showHeader={true} showFooter={false} containerMaxWidth="7xl" backgroundColor="bg-gold-100">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-2">Access Denied</p>
            <p className="text-gray-400 mb-4">Only group owners can access settings.</p>
            <button
              onClick={() => router.push(`/group/${group.id}`)}
              className="px-6 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors"
            >
              Back to Group
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      showHeader={true} 
      showFooter={false} 
      containerMaxWidth="full" 
      backgroundColor="bg-gold-100"
      contentPadding=""
    >
      <div className="min-h-screen">
        {/* Header */}
        <div className="bg-white border-b-2 border-gray-200 w-full">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/group/${group.id}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Back to group"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-black">Group Settings</h1>
                <p className="text-sm text-gray-500 mt-1">{group.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Group Details Section */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-black mb-1">Group Details</h2>
                <p className="text-sm text-gray-500">Edit your group's information and branding.</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors"
              >
                Edit Group
              </button>
            </div>

            {/* Current Group Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                <p className="text-gray-900">{group.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Logo</label>
                {group.logo_image_url ? (
                  <img src={group.logo_image_url} alt={`${group.name} logo`} className="w-16 h-16 rounded-lg object-cover" />
                ) : (
                  <p className="text-gray-500 text-sm">No logo set</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Cover Image</label>
                {group.cover_image_url ? (
                  <img src={group.cover_image_url} alt={`${group.name} cover`} className="w-full max-w-md h-32 rounded-lg object-cover" />
                ) : (
                  <p className="text-gray-500 text-sm">No cover image set</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Emoji</label>
                <p className="text-2xl">{group.emoji || '—'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <p className="text-gray-900 whitespace-pre-wrap">{group.description || 'No description'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Website</label>
                {group.website ? (
                  <a href={group.website} target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:text-gold-700 underline">
                    {group.website}
                  </a>
                ) : (
                  <p className="text-gray-500 text-sm">No website set</p>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Group Stats</label>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <span>{group.member_count} {group.member_count === 1 ? 'member' : 'members'}</span>
                  <span>Created {new Date(group.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-4 border-t-2 border-red-200">
                <label className="block text-sm font-semibold text-red-700 mb-3">Danger Zone</label>
                <p className="text-sm text-gray-600 mb-4">
                  Once you delete a group, there is no going back. Please be certain.
                </p>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrashIcon className="w-5 h-5" />
                  Delete Group
                </button>
              </div>
            </div>
          </div>

          {/* Approval Settings Section */}
          {group.requires_approval && (
            <>
              {/* Intake Questions Section */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
                <IntakeQuestionsManager groupId={group.id} />
              </div>

              {/* Pending Members Section */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
                <PendingMembersManager groupId={group.id} />
              </div>
            </>
          )}

          {/* Approval Info (when not enabled) */}
          {!group.requires_approval && (
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
              <div>
                <h2 className="text-xl font-bold text-black mb-1">Member Approval</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Enable member approval to review and approve new members before they can join. You can also set up intake questions to collect information during join requests.
                </p>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors"
                >
                  Enable Approval
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <EditGroupModal
        isOpen={isEditModalOpen}
        group={group}
        onClose={() => setIsEditModalOpen(false)}
        onUpdateGroup={handleUpdateGroup}
      />

      {/* Delete Modal */}
      {group && (
        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteGroup}
          entityType="group"
          entityName={group.name}
          isDeleting={isDeleting}
        />
      )}
    </PageLayout>
  );
}

