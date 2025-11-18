import { supabase } from '@/lib/supabase';
import { withAuthRetry } from '@/lib/authHelpers';

export type MemberRole = 'general' | 'investor' | 'admin';
export type MemberType = 'homeowner' | 'investor' | 'agent' | 'contractor' | 'lender' | 'advisor';

export interface Member {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: MemberRole;
  // Professional information
  company: string | null;
  job_title: string | null;
  bio: string | null;
  website: string | null;
  linkedin_url: string | null;
  phone: string | null;
  // Location information
  city: string | null;
  state: string | null;
  zip_code: string | null;
  primary_market_area: string | null;
  market_radius: number | null; // Radius in miles (1-99)
  // Member type and subtype
  member_type: MemberType;
  member_subtype: string | null;
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface UpdateMemberData {
  name?: string | null;
  avatar_url?: string | null;
  role?: MemberRole;
  company?: string | null;
  job_title?: string | null;
  bio?: string | null;
  website?: string | null;
  linkedin_url?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  primary_market_area?: string | null;
  market_radius?: number | null;
  member_type?: MemberType;
  member_subtype?: string | null;
}

export class MemberService {
  /**
   * Get the current user's member record
   */
  static async getCurrentMember(): Promise<Member | null> {
    return withAuthRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      return this.getMemberById(user.id);
    }, 'Get current member');
  }

  /**
   * Get a member by user ID
   */
  static async getMemberById(userId: string): Promise<Member | null> {
    return withAuthRetry(async () => {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        console.error('Auth error in getMemberById:', authError);
        throw new Error('User not authenticated');
      }

      if (authUser.id !== userId) {
        throw new Error('Unauthorized: Cannot access other user\'s member record');
      }

      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching member:', error);
        throw new Error(`Failed to fetch member: ${error.message}`);
      }

      return data;
    }, 'Get member by ID');
  }

  /**
   * Ensure a member record exists for the current user
   */
  static async ensureMemberExists(): Promise<Member> {
    return withAuthRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      let member = await this.getMemberById(user.id);
      
      if (!member) {
        // Create member record if it doesn't exist
        const { data: newMember, error } = await supabase
          .from('members')
          .insert({
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.name || user.email?.split('@')[0] || null,
            role: 'general' // Every user automatically gets 'general' role
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating member:', error);
          throw new Error('Failed to create member');
        }

        if (!newMember) {
          throw new Error('Failed to create member: no data returned');
        }

        member = newMember;
      }

      if (!member) {
        throw new Error('Member not found and could not be created');
      }

      return member;
    }, 'Ensure member exists');
  }

  /**
   * Update the current user's member record
   */
  static async updateCurrentMember(data: UpdateMemberData): Promise<Member> {
    return withAuthRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Ensure member exists
      await this.ensureMemberExists();

      // Remove undefined values
      const cleanedData: UpdateMemberData = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanedData[key as keyof UpdateMemberData] = value;
        }
      });

      const { data: member, error } = await supabase
        .from('members')
        .update(cleanedData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating member:', error);
        throw new Error(`Failed to update member: ${error.message}`);
      }

      return member;
    }, 'Update current member');
  }

  /**
   * Get display name from member record
   */
  static getDisplayName(member: Member): string {
    return member.name || member.email.split('@')[0] || 'User';
  }
}
