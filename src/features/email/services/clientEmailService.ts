import { 
  EmailOptions, 
  EmailTemplateData, 
  EmailSendResult,
  EmailTemplateType 
} from '../types';

/**
 * Client-side email service that calls the API route
 */
class ClientEmailService {
  private baseUrl: string;

  constructor() {
    // Use window.location.origin for client-side calls
    this.baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
  }

  /**
   * Send email via API route
   */
  private async sendEmailViaAPI(
    templateType: EmailTemplateType,
    options: EmailOptions,
    templateData: EmailTemplateData = {}
  ): Promise<EmailSendResult> {
    try {
      console.log('Sending email via API:', { templateType, baseUrl: this.baseUrl });
      
      const response = await fetch(`${this.baseUrl}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateType,
          options,
          templateData,
        }),
      });

      const result = await response.json();
      console.log('Email API response:', { status: response.status, result });

      if (!response.ok) {
        return {
          success: false,
          error: result.error || `HTTP ${response.status}: Failed to send email`,
        };
      }

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('Client email service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error - unable to send email',
      };
    }
  }

  /**
   * Send signup confirmation email
   */
  async sendSignupConfirmation(
    email: string,
    confirmationUrl: string,
    name?: string
  ): Promise<EmailSendResult> {
    return this.sendEmailViaAPI(
      'signup-confirmation',
      { to: { email, name } },
      { confirmationUrl, name }
    );
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(
    email: string,
    resetUrl: string,
    name?: string
  ): Promise<EmailSendResult> {
    return this.sendEmailViaAPI(
      'password-reset',
      { to: { email, name } },
      { resetUrl, name }
    );
  }

  /**
   * Send welcome email
   */
  async sendWelcome(
    email: string,
    name?: string
  ): Promise<EmailSendResult> {
    return this.sendEmailViaAPI(
      'welcome',
      { to: { email, name } },
      { name }
    );
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(
    email: string,
    verificationUrl: string,
    name?: string
  ): Promise<EmailSendResult> {
    return this.sendEmailViaAPI(
      'email-verification',
      { to: { email, name } },
      { verificationUrl, name }
    );
  }

  /**
   * Send password changed notification
   */
  async sendPasswordChanged(
    email: string,
    name?: string
  ): Promise<EmailSendResult> {
    return this.sendEmailViaAPI(
      'password-changed',
      { to: { email, name } },
      { name }
    );
  }

  /**
   * Send account deleted notification
   */
  async sendAccountDeleted(
    email: string,
    name?: string
  ): Promise<EmailSendResult> {
    return this.sendEmailViaAPI(
      'account-deleted',
      { to: { email, name } },
      { name }
    );
  }
}

// Export singleton instance for client-side use
export const clientEmailService = new ClientEmailService();
export default clientEmailService;
