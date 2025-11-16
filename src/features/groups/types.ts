export type GroupVisibility = 'public' | 'unlisted';
export type FeedVisibility = 'public' | 'members_only';
export type ApprovalStatus = 'pending' | 'approved' | 'denied';

export interface Group {
  id: string;
  created_by: string;
  name: string;
  emoji: string | null;
  description: string | null;
  logo_image_url: string | null;
  cover_image_url: string | null;
  website: string | null;
  member_count: number;
  visit_count: number;
  group_visibility: GroupVisibility;
  feed_visibility: FeedVisibility;
  requires_approval: boolean;
  created_at: string;
  updated_at: string;
  current_user_is_member?: boolean;
  current_user_is_owner?: boolean;
  current_user_approval_status?: ApprovalStatus;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  is_owner: boolean;
  approval_status: ApprovalStatus;
  joined_at: string;
  user?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    email: string;
  };
}

export interface GroupPost {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
}

export interface CreateGroupData {
  name: string;
  emoji?: string | null;
  description?: string | null;
  logo_image_url?: string | null;
  cover_image_url?: string | null;
  website?: string | null;
  group_visibility?: GroupVisibility;
  feed_visibility?: FeedVisibility;
  requires_approval?: boolean;
}

export interface UpdateGroupData {
  name?: string;
  emoji?: string | null;
  description?: string | null;
  logo_image_url?: string | null;
  cover_image_url?: string | null;
  website?: string | null;
  group_visibility?: GroupVisibility;
  feed_visibility?: FeedVisibility;
  requires_approval?: boolean;
}

export interface IntakeQuestion {
  id: string;
  group_id: string;
  question_text: string;
  question_order: number;
  created_at: string;
}

export interface IntakeResponse {
  group_id: string;
  user_id: string;
  question_id: string;
  response_text: string;
  created_at: string;
  question?: IntakeQuestion;
}

export interface JoinGroupRequest {
  responses: Array<{
    question_id: string;
    response_text: string;
  }>;
}

