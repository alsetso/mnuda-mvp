// Workspace types for the clean workspace system
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  is_owned: boolean;
  member_count: number;
  item_count: number;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  // Computed fields
  user?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export interface WorkspaceItem {
  id: string;
  workspace_id: string;
  item_type: 'person' | 'property' | 'address' | 'phone' | 'email' | 'vehicle' | 'business';
  title: string;
  data: Record<string, unknown>; // Skip trace data
  created_by: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  creator?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export interface CreateWorkspaceData {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceData {
  name?: string;
  description?: string;
}

export interface CreateWorkspaceItemData {
  item_type: string;
  title: string;
  data: Record<string, unknown>;
}
