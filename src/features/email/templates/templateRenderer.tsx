import React from 'react';
import { render } from '@react-email/render';
import { EmailTemplate, EmailTemplateData, EmailTemplateType } from '../types';
import { SignupConfirmationEmail } from './SignupConfirmationEmail';
import { PasswordResetEmail } from './PasswordResetEmail';
import { PasswordChangedEmail } from './PasswordChangedEmail';
import { WelcomeEmail } from './WelcomeEmail';
import { EmailLayout } from '../components/EmailLayout';
import { EmailText } from '../components/EmailText';

// Additional email template components

interface AccountDeletedEmailProps {
  name?: string;
  appName: string;
  appUrl: string;
  year: number;
}

const AccountDeletedEmail: React.FC<AccountDeletedEmailProps> = ({
  name,
  appName,
  appUrl,
  year,
}) => {
  const greeting = name ? `Hi ${name},` : 'Hi there,';

  return (
    <EmailLayout
      appName={appName}
      appUrl={appUrl}
      year={year}
      previewText="Your account has been deleted"
    >
      <EmailText variant="heading">
        Account Deleted
      </EmailText>
      
      <EmailText variant="body">
        {greeting}
      </EmailText>
      
      <EmailText variant="body">
        This email confirms that your {appName} account has been permanently deleted 
        as requested.
      </EmailText>
      
      <EmailText variant="small">
        All your data has been removed from our systems and cannot be recovered.
      </EmailText>
      
      <EmailText variant="small">
        If you didn&apos;t request this deletion, please contact our support team immediately.
      </EmailText>
    </EmailLayout>
  );
};

/**
 * Render email template with data interpolation
 */
export async function renderEmailTemplate(
  templateType: EmailTemplateType,
  data: EmailTemplateData
): Promise<EmailTemplate> {
  const { appName, appUrl, year, ...templateData } = data;

  let emailComponent;
  
  switch (templateType) {
    case 'signup-confirmation':
      emailComponent = (
        <SignupConfirmationEmail
          confirmationUrl={String(templateData.confirmationUrl || '')}
          name={String(templateData.name || '')}
          appName={String(appName)}
          appUrl={String(appUrl)}
          year={Number(year)}
        />
      );
      break;
      
    case 'password-reset':
      emailComponent = (
        <PasswordResetEmail
          resetUrl={String(templateData.resetUrl || '')}
          name={String(templateData.name || '')}
          appName={String(appName)}
          appUrl={String(appUrl)}
          year={Number(year)}
        />
      );
      break;
      
    case 'welcome':
      emailComponent = (
        <WelcomeEmail
          name={String(templateData.name || '')}
          appName={String(appName)}
          appUrl={String(appUrl)}
          year={Number(year)}
        />
      );
      break;
      
    case 'email-verification':
      emailComponent = (
        <SignupConfirmationEmail
          confirmationUrl={String(templateData.verificationUrl || '')}
          name={String(templateData.name || '')}
          appName={String(appName)}
          appUrl={String(appUrl)}
          year={Number(year)}
        />
      );
      break;
      
    case 'password-changed':
      emailComponent = (
        <PasswordChangedEmail
          name={String(templateData.name || '')}
          appName={String(appName)}
          appUrl={String(appUrl)}
          year={Number(year)}
        />
      );
      break;
      
    case 'account-deleted':
      emailComponent = (
        <AccountDeletedEmail
          name={String(templateData.name || '')}
          appName={String(appName)}
          appUrl={String(appUrl)}
          year={Number(year)}
        />
      );
      break;
      
    default:
      throw new Error(`Unknown email template type: ${templateType}`);
  }

  const html = await render(emailComponent, { pretty: true });
  const text = await render(emailComponent, { plainText: true });
  
  // Generate subject from template type and data
  const subject = generateSubject(templateType, data);

  return {
    subject,
    html,
    text,
  };
}

/**
 * Generate email subject based on template type and data
 */
function generateSubject(templateType: EmailTemplateType, data: EmailTemplateData): string {
  const { appName } = data;
  
  switch (templateType) {
    case 'signup-confirmation':
      return `Confirm your email address - ${appName}`;
    case 'password-reset':
      return `Reset your password - ${appName}`;
    case 'welcome':
      return `Welcome to ${appName}!`;
    case 'email-verification':
      return `Verify your email address - ${appName}`;
    case 'password-changed':
      return `Your password has been changed - ${appName}`;
    case 'account-deleted':
      return `Your account has been deleted - ${appName}`;
    default:
      return `Notification from ${appName}`;
  }
}
