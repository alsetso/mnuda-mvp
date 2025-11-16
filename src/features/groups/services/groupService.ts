import { supabase } from '@/lib/supabase';
import type { 
  Group, 
  GroupMember, 
  GroupPost, 
  CreateGroupData, 
  UpdateGroupData,
  IntakeQuestion,
  IntakeResponse,
  JoinGroupRequest,
  ApprovalStatus
} from '../types';

export class GroupService {
  /**
   * Get all groups with membership status for current user
   * Filters out unlisted groups (they should only be accessible via direct link)
   */
  static async getAllGroups(): Promise<Group[]> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('group_visibility', 'public')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching groups:', error);
      throw new Error(`Failed to fetch groups: ${error.message}`);
    }

    if (!user || !data) {
      return (data || []).map(group => ({
        ...group,
        current_user_is_member: false,
        current_user_is_owner: false,
      }));
    }

    // Check membership for each group (only approved members)
    const { data: memberships, error: membershipError } = await supabase
      .from('group_members')
      .select('group_id, is_owner, approval_status')
      .eq('user_id', user.id)
      .eq('approval_status', 'approved');

    if (membershipError) {
      console.error('Error fetching memberships:', membershipError);
      // Continue without membership data
    }

    const membershipMap = new Map(
      memberships?.map(m => [m.group_id, { is_owner: m.is_owner, status: m.approval_status }]) || []
    );

    // Also get pending status for display
    const { data: allMemberships } = await supabase
      .from('group_members')
      .select('group_id, approval_status')
      .eq('user_id', user.id);

    const statusMap = new Map(
      allMemberships?.map(m => [m.group_id, m.approval_status]) || []
    );

    return (data || []).map(group => {
      const membership = membershipMap.get(group.id);
      return {
        ...group,
        current_user_is_member: membership !== undefined,
        current_user_is_owner: membership?.is_owner === true,
        current_user_approval_status: statusMap.get(group.id) as ApprovalStatus | undefined,
      };
    });
  }

  /**
   * Get group by ID with membership status
   */
  static async getGroupById(groupId: string, trackVisit: boolean = false): Promise<Group | null> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching group:', error);
      throw new Error(`Failed to fetch group: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // Track visit asynchronously (non-blocking)
    if (trackVisit) {
      GroupService.incrementVisitCount(groupId).catch(err => {
        console.error('Failed to track visit:', err);
      });
    }

    if (!user) {
      return {
        ...data,
        current_user_is_member: false,
        current_user_is_owner: false,
      };
    }

    const { data: membership } = await supabase
      .from('group_members')
      .select('is_owner, approval_status')
      .eq('group_id', data.id)
      .eq('user_id', user.id)
      .single();

    return {
      ...data,
      current_user_is_member: membership?.approval_status === 'approved',
      current_user_is_owner: membership?.is_owner === true,
      current_user_approval_status: membership?.approval_status as ApprovalStatus | undefined,
    };
  }

  /**
   * Get user's groups
   */
  static async getUserGroups(): Promise<Group[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('group_members')
      .select(`
        group:groups(*),
        is_owner,
        approval_status
      `)
      .eq('user_id', user.id)
      .eq('approval_status', 'approved')
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Error fetching user groups:', error);
      throw new Error(`Failed to fetch user groups: ${error.message}`);
    }

    return (data || []).map((item: { group: Group; is_owner: boolean; approval_status: string }) => ({
      ...item.group,
      current_user_is_member: true,
      current_user_is_owner: item.is_owner,
      current_user_approval_status: item.approval_status as ApprovalStatus,
    }));
  }

  /**
   * Create a new group
   */
  static async createGroup(data: CreateGroupData): Promise<Group> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!data.name.trim()) {
      throw new Error('Group name is required');
    }

    if (data.name.length < 3 || data.name.length > 100) {
      throw new Error('Group name must be between 3 and 100 characters');
    }

    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        created_by: user.id,
        name: data.name.trim(),
        emoji: data.emoji || null,
        description: data.description?.trim() || null,
        logo_image_url: data.logo_image_url || null,
        cover_image_url: data.cover_image_url || null,
        website: data.website?.trim() || null,
        group_visibility: data.group_visibility || 'public',
        feed_visibility: data.feed_visibility || 'public',
        requires_approval: data.requires_approval || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating group:', error);
      throw new Error(`Failed to create group: ${error.message}`);
    }

    return {
      ...group,
      current_user_is_member: true,
      current_user_is_owner: true,
    };
  }

  /**
   * Update a group (owners only)
   */
  static async updateGroup(groupId: string, data: UpdateGroupData): Promise<Group> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) {
      if (!data.name.trim()) {
        throw new Error('Group name cannot be empty');
      }
      if (data.name.length < 3 || data.name.length > 100) {
        throw new Error('Group name must be between 3 and 100 characters');
      }
      updateData.name = data.name.trim();
    }
    if (data.emoji !== undefined) updateData.emoji = data.emoji;
    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || null;
      if (data.description && data.description.length > 500) {
        throw new Error('Description cannot exceed 500 characters');
      }
    }
    if (data.logo_image_url !== undefined) updateData.logo_image_url = data.logo_image_url;
    if (data.cover_image_url !== undefined) updateData.cover_image_url = data.cover_image_url;
    if (data.website !== undefined) {
      const website = data.website?.trim() || null;
      if (website && !website.match(/^https?:\/\//)) {
        throw new Error('Website must be a valid URL starting with http:// or https://');
      }
      updateData.website = website;
    }
    if (data.group_visibility !== undefined) updateData.group_visibility = data.group_visibility;
    if (data.feed_visibility !== undefined) updateData.feed_visibility = data.feed_visibility;
    if (data.requires_approval !== undefined) updateData.requires_approval = data.requires_approval;

    const { data: group, error } = await supabase
      .from('groups')
      .update(updateData)
      .eq('id', groupId)
      .select()
      .single();

    if (error) {
      console.error('Error updating group:', error);
      throw new Error(`Failed to update group: ${error.message}`);
    }

    if (!group) {
      throw new Error('Group not found or access denied');
    }

    // Check membership status
    const { data: membership } = await supabase
      .from('group_members')
      .select('is_owner, approval_status')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    return {
      ...group,
      current_user_is_member: membership?.approval_status === 'approved',
      current_user_is_owner: membership?.is_owner === true,
      current_user_approval_status: membership?.approval_status as ApprovalStatus | undefined,
    };
  }

  /**
   * Delete a group (owners only)
   */
  static async deleteGroup(groupId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (error) {
      console.error('Error deleting group:', error);
      throw new Error(`Failed to delete group: ${error.message}`);
    }
  }

  /**
   * Join a group
   * If group requires approval, creates pending membership
   * Otherwise, creates approved membership immediately
   */
  static async joinGroup(groupId: string, request?: JoinGroupRequest): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if group allows joining
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('group_visibility, requires_approval')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      throw new Error('Group not found');
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('group_members')
      .select('approval_status')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      if (existing.approval_status === 'approved') {
        return; // Already approved member
      }
      if (existing.approval_status === 'pending') {
        throw new Error('You already have a pending request for this group');
      }
    }

    // Determine approval status
    const approvalStatus: ApprovalStatus = group.requires_approval ? 'pending' : 'approved';

    // Insert membership
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: user.id,
        is_owner: false,
        approval_status: approvalStatus,
      });

    if (memberError) {
      console.error('Error joining group:', memberError);
      throw new Error(`Failed to join group: ${memberError.message}`);
    }

    // If approval required and intake questions exist, save responses
    if (group.requires_approval && request?.responses && request.responses.length > 0) {
      const { error: responseError } = await supabase
        .from('group_intake_responses')
        .insert(
          request.responses.map(r => ({
            group_id: groupId,
            user_id: user.id,
            question_id: r.question_id,
            response_text: r.response_text,
          }))
        );

      if (responseError) {
        console.error('Error saving intake responses:', responseError);
        // Don't fail the join - responses are supplementary
      }
    }
  }

  /**
   * Leave a group
   */
  static async leaveGroup(groupId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error leaving group:', error);
      throw new Error(`Failed to leave group: ${error.message}`);
    }
  }

  /**
   * Get group members (approved only by default)
   */
  static async getGroupMembers(groupId: string, includePending: boolean = false): Promise<GroupMember[]> {
    let query = supabase
      .from('group_members')
      .select(`
        *,
        user:members!group_members_user_id_members_fk(id, name, avatar_url, email)
      `)
      .eq('group_id', groupId);

    if (!includePending) {
      query = query.eq('approval_status', 'approved');
    }

    const { data, error } = await query
      .order('is_owner', { ascending: false })
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Error fetching group members:', error);
      throw new Error(`Failed to fetch group members: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get pending members for a group (owners only)
   */
  static async getPendingMembers(groupId: string): Promise<GroupMember[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        *,
        user:members!group_members_user_id_members_fk(id, name, avatar_url, email)
      `)
      .eq('group_id', groupId)
      .eq('approval_status', 'pending')
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending members:', error);
      throw new Error(`Failed to fetch pending members: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get group posts (feed)
   */
  static async getGroupPosts(groupId: string, limit: number = 50): Promise<GroupPost[]> {
    const { data, error } = await supabase
      .from('group_posts')
      .select(`
        *,
        user:members!group_posts_user_id_members_fk(id, name, avatar_url)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching group posts:', error);
      throw new Error(`Failed to fetch group posts: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create a post in a group (members only)
   */
  static async createPost(groupId: string, content: string): Promise<GroupPost> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!content.trim()) {
      throw new Error('Post content cannot be empty');
    }

    if (content.length > 500) {
      throw new Error('Post content cannot exceed 500 characters');
    }

    const { data, error } = await supabase
      .from('group_posts')
      .insert({
        group_id: groupId,
        user_id: user.id,
        content: content.trim(),
      })
      .select(`
        *,
        user:members!group_posts_user_id_members_fk(id, name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error creating post:', error);
      throw new Error(`Failed to create post: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a post (own posts only)
   */
  static async deletePost(postId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('group_posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting post:', error);
      throw new Error(`Failed to delete post: ${error.message}`);
    }
  }

  /**
   * Increment visit count for a group
   */
  static async incrementVisitCount(groupId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_group_visit_count', {
      group_id: groupId,
    });

    if (error) {
      console.error('Error incrementing visit count:', error);
      // Don't throw - visit tracking is non-critical
    }
  }

  /**
   * Get intake questions for a group
   */
  static async getIntakeQuestions(groupId: string): Promise<IntakeQuestion[]> {
    const { data, error } = await supabase
      .from('group_intake_questions')
      .select('*')
      .eq('group_id', groupId)
      .order('question_order', { ascending: true });

    if (error) {
      console.error('Error fetching intake questions:', error);
      throw new Error(`Failed to fetch intake questions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create or update intake questions for a group (owners only)
   * Max 3 questions
   */
  static async setIntakeQuestions(groupId: string, questions: Array<{ question_text: string; question_order: number }>): Promise<IntakeQuestion[]> {
    if (questions.length > 3) {
      throw new Error('Maximum 3 intake questions allowed');
    }

    // Delete existing questions
    await supabase
      .from('group_intake_questions')
      .delete()
      .eq('group_id', groupId);

    if (questions.length === 0) {
      return [];
    }

    // Insert new questions
    const { data, error } = await supabase
      .from('group_intake_questions')
      .insert(
        questions.map(q => ({
          group_id: groupId,
          question_text: q.question_text,
          question_order: q.question_order,
        }))
      )
      .select()
      .order('question_order', { ascending: true });

    if (error) {
      console.error('Error setting intake questions:', error);
      throw new Error(`Failed to set intake questions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get intake responses for a pending member (owners only)
   */
  static async getMemberResponses(groupId: string, userId: string): Promise<IntakeResponse[]> {
    const { data, error } = await supabase
      .from('group_intake_responses')
      .select(`
        *,
        question:group_intake_questions(*)
      `)
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .order('question_id', { ascending: true });

    if (error) {
      console.error('Error fetching member responses:', error);
      throw new Error(`Failed to fetch member responses: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Approve or deny a pending member (owners only)
   */
  static async updateMemberStatus(groupId: string, userId: string, status: ApprovalStatus): Promise<void> {
    if (status !== 'approved' && status !== 'denied') {
      throw new Error('Status must be approved or denied');
    }

    const { error } = await supabase
      .from('group_members')
      .update({ approval_status: status })
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating member status:', error);
      throw new Error(`Failed to update member status: ${error.message}`);
    }
  }
}

