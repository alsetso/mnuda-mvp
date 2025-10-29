import { supabase } from '@/lib/supabase';
import { Profile, ProfileInsert, ProfileUpdate } from '@/types/supabase';

export class ProfileService {
  /**
   * Link invited user to workspaces when they create their profile
   */
  static async linkInvitedUserToWorkspaces(userId: string, email: string): Promise<void> {
    try {
      // Find workspace memberships that have this email but no profile_id
      const { data: pendingInvitations, error } = await supabase
        .from('workspace_members')
        .select('workspace_id, role, joined_at')
        .eq('email', email)
        .is('profile_id', null);

      if (error) {
        console.error('Error finding pending invitations:', error);
        return;
      }

      if (!pendingInvitations || pendingInvitations.length === 0) {
        return; // No pending invitations
      }

      // Update each pending invitation with the user's profile_id
      for (const invitation of pendingInvitations) {
        const { error: updateError } = await supabase
          .from('workspace_members')
          .update({ profile_id: userId })
          .eq('workspace_id', invitation.workspace_id)
          .eq('email', email)
          .is('profile_id', null);

        if (updateError) {
          console.error('Error linking user to workspace:', updateError);
        }
      }

      console.log(`Linked user ${email} to ${pendingInvitations.length} workspace(s)`);
    } catch (error) {
      console.error('Error linking invited user to workspaces:', error);
    }
  }

  /**
   * Get the current user's profile by user ID
   */
  static async getCurrentProfile(userId?: string): Promise<Profile | null> {
    try {
      let userIdToUse = userId;
      
      // If no userId provided, try to get from auth
      if (!userIdToUse) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return null;
        }
        userIdToUse = user.id;
      }

      return await this.getProfileById(userIdToUse);
    } catch (error) {
      console.error('Error getting current profile:', error);
      return null;
    }
  }

  /**
   * Get a profile by user ID
   */
  static async getProfileById(userId: string): Promise<Profile | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error.message);
        return null;
      }

      return profile;
    } catch (error) {
      console.error('Error getting profile by ID:', error);
      return null;
    }
  }

  /**
   * Create a new profile
   */
  static async createProfile(profileData: ProfileInsert): Promise<Profile | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile, error } = await (supabase as any)
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        throw error;
      }

      return profile;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  /**
   * Update a profile
   */
  static async updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile, error } = await (supabase as any)
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      return profile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Update the current user's profile by user ID
   */
  static async updateCurrentProfile(userId: string, updates: ProfileUpdate): Promise<Profile | null> {
    try {
      if (!userId) {
        throw new Error('User ID is required to update profile');
      }

      // Check if profile exists, create if it doesn't
      let profile = await this.getProfileById(userId);
      
      if (!profile) {
        // Get user email from auth
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Create profile if it doesn't exist
          profile = await this.createProfile({
            id: userId,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null
          });
        }
      }

      return await this.updateProfile(userId, updates);
    } catch (error) {
      console.error('Error updating current profile:', error);
      throw error;
    }
  }

  /**
   * Delete a profile (and associated user)
   */
  static async deleteProfile(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting profile:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  }

  /**
   * Check if a profile exists for the current user
   */
  static async profileExists(): Promise<boolean> {
    try {
      const profile = await this.getCurrentProfile();
      return profile !== null;
    } catch (error) {
      console.error('Error checking profile existence:', error);
      return false;
    }
  }

  /**
   * Ensure a profile exists for the current user, create if it doesn't
   */
  static async ensureProfileExists(): Promise<Profile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      let profile = await this.getCurrentProfile();
      
      if (!profile) {
        // Create profile with basic info from auth user
        const profileData: ProfileInsert = {
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.user_metadata?.first_name || null,
        };
        
        profile = await this.createProfile(profileData);
      }

      return profile;
    } catch (error) {
      console.error('Error ensuring profile exists:', error);
      return null;
    }
  }

  /**
   * Get user's display name (first name + last name, or full name, or email prefix)
   */
  static getDisplayName(profile: Profile): string {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile.first_name) {
      return profile.first_name;
    }
    if (profile.full_name) {
      return profile.full_name;
    }
    return profile.email.split('@')[0] || 'User';
  }

  /**
   * Get user's full name (combines first_name and last_name)
   */
  static getFullName(profile: Profile): string {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile.full_name || '';
  }

}
