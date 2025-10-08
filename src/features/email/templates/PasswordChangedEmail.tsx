import React from 'react';
import { EmailLayout } from '../components/EmailLayout';
import { EmailText } from '../components/EmailText';
import { EmailButton } from '../components/EmailButton';

interface PasswordChangedEmailProps {
  name?: string;
  appName: string;
  appUrl: string;
  year: number;
  loginUrl?: string;
}

export const PasswordChangedEmail: React.FC<PasswordChangedEmailProps> = ({
  name,
  appName,
  appUrl,
  year,
  loginUrl,
}) => {
  const greeting = name ? `Hi ${name},` : 'Hi there,';
  const loginButtonUrl = loginUrl || `${appUrl}/login`;

  return (
    <EmailLayout
      appName={appName}
      appUrl={appUrl}
      year={year}
      previewText="Your password has been updated"
    >
      <EmailText variant="heading">
        Password Updated Successfully
      </EmailText>
      
      <EmailText variant="body">
        {greeting}
      </EmailText>
      
      <EmailText variant="body">
        Your password for your {appName} account has been successfully updated. 
        This change was made on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}.
      </EmailText>
      
      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <EmailButton href={loginButtonUrl}>
          Sign In to Your Account
        </EmailButton>
      </div>
      
      <EmailText variant="body">
        If you made this change, no further action is required. Your account is secure and ready to use.
      </EmailText>
      
      <EmailText variant="small">
        <strong>Security Notice:</strong> If you did not make this password change, please contact our support team immediately. 
        Your account security is important to us.
      </EmailText>
      
      <EmailText variant="small">
        For your security, we recommend:
      </EmailText>
      
      <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
        <li style={{ marginBottom: '5px' }}>Using a strong, unique password</li>
        <li style={{ marginBottom: '5px' }}>Enabling two-factor authentication if available</li>
        <li style={{ marginBottom: '5px' }}>Not sharing your password with anyone</li>
        <li style={{ marginBottom: '5px' }}>Logging out from shared devices</li>
      </ul>
      
      <EmailText variant="small">
        If you have any questions or concerns, please don&apos;t hesitate to contact our support team.
      </EmailText>
    </EmailLayout>
  );
};
