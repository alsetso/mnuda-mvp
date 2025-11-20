import { supabase } from '@/lib/supabase';
import { withAuthRetry } from '@/lib/authHelpers';
import { ProfileType } from '@/features/auth';

export interface Profile {
  id: string;
  account_id: string;
  username: string;
  profile_image: string | null;
  profile_type: ProfileType;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProfileData {
  account_id: string;
  username: string;
  profile_image?: string | null;
  profile_type: ProfileType;
}

export interface UpdateProfileData {
  username?: string;
  profile_image?: string | null;
  profile_type?: ProfileType;
  onboarded?: boolean;
}

export class ProfileService {
  /**
   * Get display name for a profile
   */
  static getDisplayName(profile: Profile): string {
    return profile.username || 'Unnamed Profile';
  }

  /**
   * Get primary county from onboarding answers (helper - data now in onboarding_answers)
   * Note: This requires fetching answers separately
   */
  static getPrimaryCountyFromAnswers(answers: Array<{ question_id: number; value: any }>, questions: Array<{ id: number; key: string }>): string | null {
    const countyQuestion = questions.find(q => q.key === 'primary_county');
    if (!countyQuestion) return null;
    const answer = answers.find(a => a.question_id === countyQuestion.id);
    return answer?.value || null;
  }

  /**
   * Get all profiles for the current user's account
   */
  static async getCurrentAccountProfiles(): Promise<Profile[]> {
    return withAuthRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!account) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('account_id', account.id)
        .order('created_at', { ascending: true });

      if (error) throw new Error(`Failed to fetch profiles: ${error.message}`);
      return data || [];
    }, 'Get current account profiles');
  }

  /**
   * Get first profile (legacy compatibility - no primary concept anymore)
   */
  static async getPrimaryProfile(): Promise<Profile | null> {
    return withAuthRetry(async () => {
      const profiles = await this.getCurrentAccountProfiles();
      return profiles.length > 0 ? profiles[0] : null;
    }, 'Get primary profile');
  }

  /**
   * Get profile by ID
   */
  static async getProfileById(profileId: string): Promise<Profile | null> {
    return withAuthRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, accounts!inner(user_id)')
        .eq('id', profileId)
        .eq('accounts.user_id', user.id)
        .single();

      return profile as Profile | null;
    }, 'Get profile by ID');
  }

  /**
   * Create a new profile
   */
  static async createProfile(data: CreateProfileData): Promise<Profile> {
    return withAuthRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('id', data.account_id)
        .eq('user_id', user.id)
        .single();

      if (!account) throw new Error('Account not found or unauthorized');

      const { data: profile, error } = await supabase
        .from('profiles')
        .insert(data)
        .select()
        .single();

      if (error) throw new Error(`Failed to create profile: ${error.message}`);
      return profile;
    }, 'Create profile');
  }

  /**
   * Update a profile
   */
  static async updateProfile(profileId: string, data: UpdateProfileData): Promise<Profile> {
    return withAuthRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const existingProfile = await this.getProfileById(profileId);
      if (!existingProfile) throw new Error('Profile not found or unauthorized');

      const { data: profile, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', profileId)
        .select()
        .single();

      if (error) throw new Error(`Failed to update profile: ${error.message}`);
      return profile;
    }, 'Update profile');
  }

  /**
   * Delete a profile
   */
  static async deleteProfile(profileId: string): Promise<void> {
    return withAuthRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const existingProfile = await this.getProfileById(profileId);
      if (!existingProfile) throw new Error('Profile not found or unauthorized');

      const profiles = await this.getCurrentAccountProfiles();
      if (profiles.length === 1) throw new Error('Cannot delete the last profile');

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw new Error(`Failed to delete profile: ${error.message}`);
    }, 'Delete profile');
  }

}
