import { supabase } from '@/lib/supabase';

/**
 * Service for handling password reset functionality
 */
export class PasswordResetService {
  /**
   * Send password reset email using Supabase's built-in flow
   */
  static async sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Use Supabase's built-in password reset flow
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/account/settings`,
      });

      if (error) {
        console.error('Supabase password reset error:', error);
        return { success: false, error: error.message };
      }

      // Supabase will automatically send the password reset email
      return { success: true };
    } catch (error) {
      console.error('Password reset service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Update password
   */
  static async updatePassword(
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('Password update error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Password update service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
