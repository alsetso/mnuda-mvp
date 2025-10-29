import { supabase } from '@/lib/supabase';

export class WorkspaceService {
  static async createWorkspace(data: { name: string; description?: string }) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      // Create workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name: data.name,
          description: data.description || null,
          owner_id: user.user.id,
        })
        .select()
        .single();

      if (workspaceError) {
        throw new Error(`Failed to create workspace: ${workspaceError.message}`);
      }

      // Add owner as member
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: user.user.id,
          role: 'owner'
        });

      if (memberError) {
        console.warn('Failed to add owner as member:', memberError.message);
        // Don't throw error - workspace was created successfully
      }

      return workspace;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  }

  static async getWorkspaces() {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch workspaces: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      throw error;
    }
  }
}