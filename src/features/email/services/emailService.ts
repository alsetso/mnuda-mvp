import { Resend } from 'resend';
import { 
  EmailTemplate, 
  EmailOptions, 
  EmailTemplateData, 
  EmailSendResult,
  EmailTemplateType 
} from '../types';
import { emailConfig, validateEmailConfig } from '../config';
import { renderEmailTemplate } from '../templates/templateRenderer';

class EmailService {
  private resend: Resend | null = null;
  private config = emailConfig;

  constructor() {
    // Only validate and initialize on server side and not during build
    if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
      try {
        validateEmailConfig();
      } catch (error) {
        // During build time, just log a warning instead of throwing
        if (process.env.NODE_ENV === 'production') {
          console.warn('Email service configuration incomplete:', error);
        }
      }
    }
    
    // Only initialize Resend if we have an API key
    if (this.config.apiKey) {
      this.resend = new Resend(this.config.apiKey);
    } else {
      console.warn('Resend API key not found, email service will not work');
    }
  }

  /**
   * Send email with retry logic and error handling
   */
  async sendEmail(
    templateType: EmailTemplateType,
    options: EmailOptions,
    templateData: EmailTemplateData = {}
  ): Promise<EmailSendResult> {
    // Check if Resend is initialized
    if (!this.resend) {
      return {
        success: false,
        error: 'Email service not initialized - missing API key',
      };
    }

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const template = await this.getEmailTemplate(templateType, templateData);
        
        const emailOptions = {
          from: options.from || {
            email: this.config.fromEmail,
            name: this.config.fromName,
          },
          to: Array.isArray(options.to) 
            ? options.to.map(recipient => recipient.email)
            : [options.to.email],
          subject: template.subject,
          html: template.html,
          text: template.text,
          reply_to: options.replyTo,
          tags: options.tags || [],
        } as unknown as Parameters<typeof this.resend.emails.send>[0]; // Type assertion for Resend API

        const result = await this.resend.emails.send(emailOptions);

        if (result.error) {
          throw new Error(result.error.message);
        }

        return {
          success: true,
          messageId: result.data?.id,
        };
      } catch (error) {
        lastError = error as Error;
        console.error(`Email send attempt ${attempt} failed:`, error);

        // Don't retry on certain errors
        if (this.isNonRetryableError(error as Error)) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error occurred',
    };
  }

  /**
   * Get email template with data interpolation
   */
  private async getEmailTemplate(
    templateType: EmailTemplateType,
    data: EmailTemplateData
  ): Promise<EmailTemplate> {
    const templateData = {
      ...data,
      appName: this.config.appName,
      appUrl: this.config.appUrl,
      year: new Date().getFullYear(),
    };

    return await renderEmailTemplate(templateType, templateData);
  }

  /**
   * Check if error should not be retried
   */
  private isNonRetryableError(error: Error): boolean {
    const nonRetryableErrors = [
      'invalid_email',
      'rate_limit_exceeded',
      'forbidden',
      'unauthorized',
    ];

    return nonRetryableErrors.some(errorType => 
      error.message.toLowerCase().includes(errorType)
    );
  }

  /**
   * Send signup confirmation email
   */
  async sendSignupConfirmation(
    email: string,
    confirmationUrl: string,
    name?: string
  ): Promise<EmailSendResult> {
    return this.sendEmail(
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
    return this.sendEmail(
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
    return this.sendEmail(
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
    return this.sendEmail(
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
    return this.sendEmail(
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
    return this.sendEmail(
      'account-deleted',
      { to: { email, name } },
      { name }
    );
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
