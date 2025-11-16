import { useState, useEffect, useCallback } from 'react';
import { GroupService, type Group, type GroupMember, type GroupPost } from '../services/groupService';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useGroup(groupId: string) {
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useState<RealtimeChannel | null>(null)[0];

  const loadGroup = useCallback(async () => {
    if (!groupId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await GroupService.getGroupById(groupId, true);
      setGroup(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load group');
      setError(error);
      console.error('Error loading group:', error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  const loadMembers = useCallback(async () => {
    if (!group?.id) return;
    
    setIsLoadingMembers(true);
    try {
      const data = await GroupService.getGroupMembers(group.id);
      setMembers(data);
    } catch (err) {
      console.error('Error loading members:', err);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [group?.id]);

  const loadPosts = useCallback(async () => {
    if (!group?.id) return;
    
    setIsLoadingPosts(true);
    try {
      const data = await GroupService.getGroupPosts(group.id);
      setPosts(data);
    } catch (err) {
      console.error('Error loading posts:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [group?.id]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  useEffect(() => {
    if (group?.id) {
      loadMembers();
      loadPosts();
    }
  }, [group?.id, loadMembers, loadPosts]);

  // Subscribe to realtime posts
  useEffect(() => {
    if (!group?.id) return;

    const channel = supabase
      .channel(`group_posts:${group.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_posts',
          filter: `group_id=eq.${group.id}`,
        },
        async (payload) => {
          // Reload posts to get the new one with user data
          try {
            const updatedPosts = await GroupService.getGroupPosts(group.id);
            setPosts(updatedPosts);
          } catch (err) {
            console.error('Error fetching updated posts:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'group_posts',
          filter: `group_id=eq.${group.id}`,
        },
        () => {
          // Reload posts to remove deleted one
          loadPosts();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [group?.id, loadPosts]);

  const joinGroup = useCallback(async () => {
    if (!group?.id) return;
    try {
      await GroupService.joinGroup(group.id);
      await loadGroup(); // Refresh to update membership status
    } catch (err) {
      throw err;
    }
  }, [group?.id, loadGroup]);

  const leaveGroup = useCallback(async () => {
    if (!group?.id) return;
    try {
      await GroupService.leaveGroup(group.id);
      await loadGroup(); // Refresh to update membership status
    } catch (err) {
      throw err;
    }
  }, [group?.id, loadGroup]);

  const createPost = useCallback(async (content: string) => {
    if (!group?.id) return;
    try {
      const newPost = await GroupService.createPost(group.id, content);
      setPosts((prev) => [newPost, ...prev]);
      return newPost;
    } catch (err) {
      throw err;
    }
  }, [group?.id]);

  const deletePost = useCallback(async (postId: string) => {
    try {
      await GroupService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    group,
    members,
    posts,
    isLoading,
    isLoadingMembers,
    isLoadingPosts,
    error,
    joinGroup,
    leaveGroup,
    createPost,
    deletePost,
    refreshGroup: loadGroup,
    refreshMembers: loadMembers,
    refreshPosts: loadPosts,
  };
}

