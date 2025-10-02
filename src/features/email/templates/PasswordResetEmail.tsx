import React from 'react';
import { EmailLayout } from '../components/EmailLayout';
import { EmailText } from '../components/EmailText';
import { EmailButton } from '../components/EmailButton';

interface PasswordResetEmailProps {
  resetUrl: string;
  name?: string;
  appName: string;
  appUrl: string;
  year: number;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({
  resetUrl,
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
      previewText="Reset your password"
    >
      <EmailText variant="heading">
        Reset Your Password
      </EmailText>
      
      <EmailText variant="body">
        {greeting}
      </EmailText>
      
      <EmailText variant="body">
        We received a request to reset your password for your {appName} account. 
        Click the button below to create a new password.
      </EmailText>
      
      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <EmailButton href={resetUrl}>
          Reset Password
        </EmailButton>
      </div>
      
      <EmailText variant="small">
        If the button doesn&apos;t work, you can also copy and paste this link into your browser:
      </EmailText>
      
      <EmailText variant="small" style={{ wordBreak: 'break-all' }}>
        {resetUrl}
      </EmailText>
      
      <EmailText variant="small">
        This link will expire in 1 hour for security reasons.
      </EmailText>
      
      <EmailText variant="small">
        If you didn&apos;t request a password reset, you can safely ignore this email. 
        Your password will remain unchanged.
      </EmailText>
      
      <EmailText variant="small">
        For security reasons, we recommend using a strong, unique password that you 
        haven&apos;t used elsewhere.
      </EmailText>
    </EmailLayout>
  );
};
