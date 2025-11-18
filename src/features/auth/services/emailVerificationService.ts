import { supabase } from '@/lib/supabase';

export interface EmailVerificationResult {
  exists: boolean;
  isConfirmed: boolean;
  authMethod: 'password' | 'unknown';
  error?: string;
}


class EmailVerificationService {
  /**
   * Verify email for login - check if account exists, is confirmed, and ready for password auth
   */
  async verifyEmailForLogin(email: string): Promise<EmailVerificationResult> {
    try {
      // Use the fallback method that doesn't require admin privileges
      return await this.verifyEmailForLoginFallback(email);
    } catch (error) {
      console.error('Login email verification error:', error);
      return {
        exists: false,
        isConfirmed: false,
        authMethod: 'unknown',
        error: 'Unable to verify email. Please try again.'
      };
    }
  }

  /**
   * Resend confirmation email for unconfirmed accounts
   */
  async resendConfirmationEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/account/settings`,
        },
      });

      if (error) {
        console.error('Resend confirmation error:', error);
        return {
          success: false,
          error: error.message.includes('Email not confirmed') 
            ? 'Please check your email for the confirmation link.'
            : 'Failed to resend confirmation email. Please try again.'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Resend confirmation error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.'
      };
    }
  }


  /**
   * Login-specific email verification using sign-in attempt
   * This method is completely separate from signup verification
   */
  async verifyEmailForLoginFallback(email: string): Promise<EmailVerificationResult> {
    try {
      // Try to sign in with a dummy password to check if account exists
      // This will fail but give us information about the account
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: 'dummy-password-for-login-verification'
      });

      if (error) {
        // Parse the error message more carefully
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('invalid login credentials') || 
            errorMessage.includes('invalid credentials')) {
          // Account exists but wrong password - this is a password account
          // We need to check if email is confirmed by trying a different approach
          return await this.checkEmailConfirmationStatus(email);
        } else if (errorMessage.includes('email not confirmed') || 
                   errorMessage.includes('not confirmed')) {
          return {
            exists: true,
            isConfirmed: false,
            authMethod: 'password',
            error: 'Please confirm your email address before signing in.'
          };
        } else if (errorMessage.includes('user not found') || 
                   errorMessage.includes('no user found')) {
          return {
            exists: false,
            isConfirmed: false,
            authMethod: 'unknown',
            error: 'No account found with this email address.'
          };
        } else if (errorMessage.includes('oauth') || 
                   errorMessage.includes('provider') ||
                   errorMessage.includes('social')) {
          // This is an OAuth-only account, not supported
          return {
            exists: true,
            isConfirmed: true,
            authMethod: 'unknown',
            error: 'This account uses a different authentication method. Please contact support.'
          };
        } else if (errorMessage.includes('too many requests') ||
                   errorMessage.includes('rate limit')) {
          return {
            exists: false,
            isConfirmed: false,
            authMethod: 'unknown',
            error: 'Too many attempts. Please wait a moment and try again.'
          };
        } else {
          // Other errors - be more conservative
          return {
            exists: false,
            isConfirmed: false,
            authMethod: 'unknown',
            error: 'Unable to verify email. Please try again.'
          };
        }
      }

      // If no error (shouldn't happen with dummy password), account exists
      return {
        exists: true,
        isConfirmed: true,
        authMethod: 'password'
      };
    } catch (error) {
      console.error('Login email verification error:', error);
      return {
        exists: false,
        isConfirmed: false,
        authMethod: 'unknown',
        error: 'Unable to verify email. Please try again.'
      };
    }
  }

  /**
   * Check email confirmation status by attempting password reset
   * This is a safer way to verify if an email is confirmed
   */
  private async checkEmailConfirmationStatus(email: string): Promise<EmailVerificationResult> {
    try {
      // Try to send a password reset email - this will only work if email is confirmed
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/account/settings`,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          return {
            exists: true,
            isConfirmed: false,
            authMethod: 'password',
            error: 'Please confirm your email address before signing in.'
          };
        } else {
          // If we can't send reset email, assume account exists but may not be confirmed
          return {
            exists: true,
            isConfirmed: true, // Conservative assumption
            authMethod: 'password'
          };
        }
      }

      // If no error, email is confirmed and account exists
      return {
        exists: true,
        isConfirmed: true,
        authMethod: 'password'
      };
    } catch {
      // If we can't check confirmation status, assume account exists
      return {
        exists: true,
        isConfirmed: true, // Conservative assumption
        authMethod: 'password'
      };
    }
  }

}

export const emailVerificationService = new EmailVerificationService();
