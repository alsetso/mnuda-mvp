'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import { useAuth } from '@/features/auth';
import { useGroup } from '@/features/groups/hooks/useGroup';
import { GroupHeader } from '@/features/groups/components/GroupHeader';
import { GroupFeed } from '@/features/groups/components/GroupFeed';
import { GroupMembersList } from '@/features/groups/components/GroupMembersList';
import { JoinGroupModal } from '@/features/groups/components/JoinGroupModal';
import { useToast } from '@/features/ui/hooks/useToast';

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;
  const { user } = useAuth();
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isValidId = groupId && uuidRegex.test(groupId);
  const {
    group,
    members,
    posts,
    isLoading,
    isLoadingMembers,
    isLoadingPosts,
    leaveGroup,
    createPost,
    deletePost,
    refreshGroup,
  } = useGroup(groupId);
  const [activeTab, setActiveTab] = useState<'feed' | 'members'>('feed');
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const { success, error: showError } = useToast();

  const handleJoinClick = () => {
    setIsJoinModalOpen(true);
  };

  const handleJoinSuccess = async () => {
    await refreshGroup();
  };

  const handleLeave = async () => {
    if (!confirm(`Are you sure you want to leave ${group?.name}?`)) return;
    
    setIsLeaving(true);
    try {
      await leaveGroup();
      success('Left Group', `You've left ${group?.name}.`);
    } catch (err) {
      showError('Failed to Leave', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsLeaving(false);
    }
  };

  const handleCreatePost = async (content: string) => {
    try {
      await createPost(content);
    } catch (err) {
      showError('Failed to Post', err instanceof Error ? err.message : 'Please try again.');
      throw err;
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      success('Post Deleted', 'Your post has been deleted.');
    } catch (err) {
      showError('Failed to Delete', err instanceof Error ? err.message : 'Please try again.');
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

  if (isLoading) {
    return (
      <PageLayout showHeader={true} showFooter={false} containerMaxWidth="full" backgroundColor="bg-gold-100">
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
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

  return (
    <PageLayout 
      showHeader={true} 
      showFooter={false} 
      containerMaxWidth="full" 
      backgroundColor="bg-gold-100"
      contentPadding=""
    >
      <div 
        className="relative min-h-screen w-full" 
        style={{ 
          marginTop: '-3rem',
          paddingTop: 0,
          position: 'relative'
        }}
      >
        {/* Header - Full width, flush with app header */}
        <div 
          className="sticky z-[99] w-full"
          style={{ top: '3rem' }}
        >
          <GroupHeader
            group={group}
            onJoin={handleJoinClick}
            onLeave={handleLeave}
            isJoining={false}
            isLeaving={isLeaving}
          />
        </div>

        {/* Tabs - Full width */}
        <div className="bg-white border-b-2 border-gray-200 z-10">
          <div className="w-full">
            <div className="flex gap-1 px-4 sm:px-6 lg:px-8">
              <button
                onClick={() => setActiveTab('feed')}
                className={`px-6 py-4 font-semibold transition-colors border-b-2 ${
                  activeTab === 'feed'
                    ? 'text-gold-600 border-gold-500'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Feed
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`px-6 py-4 font-semibold transition-colors border-b-2 ${
                  activeTab === 'members'
                    ? 'text-gold-600 border-gold-500'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Members ({members.length})
              </button>
            </div>
          </div>
        </div>

        {/* Content - Centered with max width for readability */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'feed' ? (
            <GroupFeed
              groupId={group.id}
              posts={posts}
              canPost={group.current_user_is_member || false}
              canView={group.feed_visibility === 'public' || group.current_user_is_member || false}
              onCreatePost={handleCreatePost}
              onDeletePost={handleDeletePost}
              currentUserId={user.id}
              isLoading={isLoadingPosts}
            />
          ) : (
            <GroupMembersList members={members} isLoading={isLoadingMembers} />
          )}
        </div>
      </div>

      {/* Join Group Modal */}
      {group && (
        <JoinGroupModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          group={group}
          onJoinSuccess={handleJoinSuccess}
        />
      )}
    </PageLayout>
  );
}

