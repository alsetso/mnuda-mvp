import { supabase } from '@/lib/supabase';

export class ProfileService {
  /**
   * Get the current user's auth data
   */
  static async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
}
