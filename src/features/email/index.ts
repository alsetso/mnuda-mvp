// Export main email service
export { emailService, default as EmailService } from './services/emailService';

// Export types
export type {
  EmailTemplate,
  EmailRecipient,
  EmailOptions,
  EmailTemplateData,
  EmailServiceConfig,
  EmailTemplateType,
  EmailSendResult,
} from './types';

// Export configuration
export { emailConfig, validateEmailConfig, emailTemplates } from './config';

// Export components
export { EmailLayout } from './components/EmailLayout';
export { EmailButton } from './components/EmailButton';
export { EmailText } from './components/EmailText';

// Export templates
export { SignupConfirmationEmail } from './templates/SignupConfirmationEmail';
export { PasswordResetEmail } from './templates/PasswordResetEmail';
export { WelcomeEmail } from './templates/WelcomeEmail';
