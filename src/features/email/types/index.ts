export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailOptions {
  to: EmailRecipient | EmailRecipient[];
  from?: {
    email: string;
    name: string;
  };
  replyTo?: string;
  tags?: Array<{
    name: string;
    value: string;
  }>;
}

export interface EmailTemplateData {
  [key: string]: string | number | boolean | undefined;
}

export interface EmailServiceConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  appUrl: string;
  appName: string;
}

export type EmailTemplateType = 
  | 'signup-confirmation'
  | 'password-reset'
  | 'welcome'
  | 'email-verification'
  | 'password-changed'
  | 'account-deleted';

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
