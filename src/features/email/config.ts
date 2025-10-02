import { EmailServiceConfig } from './types';

export const emailConfig: EmailServiceConfig = {
  apiKey: process.env.RESEND_API_KEY!,
  fromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com',
  fromName: process.env.RESEND_FROM_NAME || 'Your App Name',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Your App Name',
};

// Validate required environment variables
export const validateEmailConfig = (): void => {
  const requiredVars = ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      'Please check your .env.local file.'
    );
  }
};

// Email template configuration
export const emailTemplates = {
  'signup-confirmation': {
    subject: 'Confirm your email address',
    template: 'signup-confirmation',
  },
  'password-reset': {
    subject: 'Reset your password',
    template: 'password-reset',
  },
  'welcome': {
    subject: 'Welcome to {{appName}}!',
    template: 'welcome',
  },
  'email-verification': {
    subject: 'Verify your email address',
    template: 'email-verification',
  },
  'password-changed': {
    subject: 'Your password has been changed',
    template: 'password-changed',
  },
  'account-deleted': {
    subject: 'Your account has been deleted',
    template: 'account-deleted',
  },
} as const;
