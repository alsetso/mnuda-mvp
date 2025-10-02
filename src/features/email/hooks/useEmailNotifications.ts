import { useCallback } from 'react';
import { clientEmailService } from '../services/clientEmailService';

/**
 * Hook for managing email notifications in the auth flow
 */
export function useEmailNotifications() {

  const sendSignupConfirmation = useCallback(async (
    email: string,
    confirmationUrl: string,
    name?: string
  ) => {
    try {
      const result = await clientEmailService.sendSignupConfirmation(
        email,
        confirmationUrl,
        name
      );
      
      if (!result.success) {
        console.warn('Custom signup confirmation email failed, using Supabase default:', result.error);
        return { success: false, error: result.error };
      }
      
      return result;
    } catch (error) {
      console.warn('Custom signup confirmation email failed, using Supabase default:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  const sendPasswordReset = useCallback(async (
    email: string,
    resetUrl: string,
    name?: string
  ) => {
    try {
      const result = await clientEmailService.sendPasswordReset(
        email,
        resetUrl,
        name
      );
      
      if (!result.success) {
        console.warn('Custom password reset email failed, using Supabase default:', result.error);
        return { success: false, error: result.error };
      }
      
      return result;
    } catch (error) {
      console.warn('Custom password reset email failed, using Supabase default:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  const sendWelcomeEmail = useCallback(async (
    email: string,
    name?: string
  ) => {
    try {
      const result = await clientEmailService.sendWelcome(email, name);
      
      if (!result.success) {
        console.warn('Custom welcome email failed:', result.error);
        return { success: false, error: result.error };
      }
      
      return result;
    } catch (error) {
      console.warn('Custom welcome email failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  const sendEmailVerification = useCallback(async (
    email: string,
    verificationUrl: string,
    name?: string
  ) => {
    try {
      const result = await clientEmailService.sendEmailVerification(
        email,
        verificationUrl,
        name
      );
      
      if (!result.success) {
        console.warn('Custom email verification failed:', result.error);
        return { success: false, error: result.error };
      }
      
      return result;
    } catch (error) {
      console.warn('Custom email verification failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  const sendPasswordChangedNotification = useCallback(async (
    email: string,
    name?: string
  ) => {
    try {
      const result = await clientEmailService.sendPasswordChanged(email, name);
      
      if (!result.success) {
        console.warn('Custom password changed notification failed:', result.error);
        return { success: false, error: result.error };
      }
      
      return result;
    } catch (error) {
      console.warn('Custom password changed notification failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  const sendAccountDeletedNotification = useCallback(async (
    email: string,
    name?: string
  ) => {
    try {
      const result = await clientEmailService.sendAccountDeleted(email, name);
      
      if (!result.success) {
        console.warn('Custom account deleted notification failed:', result.error);
        return { success: false, error: result.error };
      }
      
      return result;
    } catch (error) {
      console.warn('Custom account deleted notification failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  return {
    sendSignupConfirmation,
    sendPasswordReset,
    sendWelcomeEmail,
    sendEmailVerification,
    sendPasswordChangedNotification,
    sendAccountDeletedNotification,
  };
}
