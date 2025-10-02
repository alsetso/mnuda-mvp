import { supabase } from '@/lib/supabase';
import { clientEmailService } from './clientEmailService';

/**
 * Service for handling password reset functionality with custom emails
 */
export class PasswordResetService {
  /**
   * Send password reset email using Supabase's built-in flow
   */
  static async sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Use Supabase's built-in password reset flow
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Supabase password reset error:', error);
        return { success: false, error: error.message };
      }

      // Supabase will automatically send the password reset email
      // We don't need to send a custom email - Supabase handles this
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
   * Update password and send confirmation email
   */
  static async updatePassword(
    newPassword: string,
    userEmail?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('Password update error:', error);
        return { success: false, error: error.message };
      }

      // Send password changed notification email
      if (userEmail) {
        const emailResult = await clientEmailService.sendPasswordChanged(userEmail);
        if (!emailResult.success) {
          console.warn('Custom password changed email failed:', emailResult.error);
          // Don't fail the password update if email fails
        }
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
