'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import { useAuth } from '@/features/auth';
import { useGroups } from '@/features/groups/hooks/useGroups';
import { GroupCard } from '@/features/groups/components/GroupCard';
import { CreateGroupModal } from '@/features/groups/components/CreateGroupModal';
import { JoinGroupModal } from '@/features/groups/components/JoinGroupModal';
import { GroupService } from '@/features/groups/services/groupService';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/features/ui/hooks/useToast';
import type { Group } from '@/features/groups/types';

type FilterType = 'all' | 'mine';

export default function GroupsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { groups, isLoading, refreshGroups } = useGroups();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const { success, error: showError } = useToast();
  
  // Load user's groups when filter is "mine"
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [isLoadingUserGroups, setIsLoadingUserGroups] = useState(false);
  const hasLoadedUserGroups = useRef(false);
  
  const loadUserGroups = async () => {
    if (!user || hasLoadedUserGroups.current || isLoadingUserGroups) return;
    
    setIsLoadingUserGroups(true);
    hasLoadedUserGroups.current = true;
    try {
      const data = await GroupService.getUserGroups();
      setUserGroups(data);
    } catch (err) {
      console.error('Error loading user groups:', err);
      showError('Failed to Load', 'Could not load your groups.');
      hasLoadedUserGroups.current = false; // Allow retry on error
    } finally {
      setIsLoadingUserGroups(false);
    }
  };
  
  // Filter groups based on selected filter
  const filteredGroups = useMemo(() => {
    if (filter === 'mine') {
      return userGroups;
    }
    return groups;
  }, [filter, groups, userGroups]);
  
  const isFilterLoading = isLoading || (filter === 'mine' && isLoadingUserGroups);

  const handleCreateGroup = async (data: { name: string; emoji?: string | null; description?: string | null; logo_image_url?: string | null; cover_image_url?: string | null; website?: string | null }) => {
    try {
      const group = await GroupService.createGroup(data);
      success('Group Created', `${group.name} has been created!`);
      await refreshGroups();
      router.push(`/group/${group.id}`);
    } catch (err) {
      showError('Failed to Create Group', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const handleJoinClick = (group: Group) => {
    setSelectedGroup(group);
    setIsJoinModalOpen(true);
  };

  const handleJoinSuccess = async () => {
    await refreshGroups();
    if (filter === 'mine') {
      hasLoadedUserGroups.current = false;
      await loadUserGroups();
    }
  };

  if (!user) {
    return (
      <PageLayout showHeader={true} showFooter={false}>
        <div className="min-h-screen bg-gold-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Please log in to view groups.</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showHeader={true} showFooter={false} containerMaxWidth="full" backgroundColor="bg-gold-100" contentPadding="">
      <div className="min-h-screen bg-gold-100">
        {/* Hero Section - Dark background */}
        <div className="bg-black text-white py-16 w-full">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center">
              <h1 className="text-5xl font-bold mb-4">Groups</h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                Join communities and collaborate on shared interests. Connect with like-minded people and build meaningful relationships.
              </p>
              <div className="mt-8">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-8 py-4 bg-gold-500 hover:bg-gold-600 text-black font-bold text-lg rounded-lg transition-colors flex items-center gap-2 shadow-lg mx-auto"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create Group
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          {/* Filter Tabs */}
          <div className="mb-6 flex items-center gap-2">
            <button
              onClick={() => {
                setFilter('all');
                hasLoadedUserGroups.current = false; // Reset when switching away
              }}
              className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-gold-500 text-black'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Groups
            </button>
            <button
              onClick={() => {
                setFilter('mine');
                loadUserGroups();
              }}
              className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
                filter === 'mine'
                  ? 'bg-gold-500 text-black'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              My Groups
            </button>
          </div>

          {/* Groups Grid */}
          {isFilterLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="bg-white border-2 border-gray-200 rounded-xl p-16 text-center">
              <p className="text-gray-500 text-lg mb-2">
                {filter === 'mine' ? "You haven't joined any groups yet." : 'No groups yet.'}
              </p>
              <p className="text-gray-400 mb-6">
                {filter === 'mine' 
                  ? 'Join groups from the "All Groups" view or create your own!'
                  : 'Create your first group to get started!'
                }
              </p>
              {filter === 'all' && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-6 py-3 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create Group
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group) => (
                <GroupCard key={group.id} group={group} onJoinClick={handleJoinClick} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateGroup={handleCreateGroup}
      />

      {/* Join Group Modal */}
      {selectedGroup && (
        <JoinGroupModal
          isOpen={isJoinModalOpen}
          onClose={() => {
            setIsJoinModalOpen(false);
            setSelectedGroup(null);
          }}
          group={selectedGroup}
          onJoinSuccess={handleJoinSuccess}
        />
      )}
    </PageLayout>
  );
}

