import React from 'react';
import { EmailLayout } from '../components/EmailLayout';
import { EmailText } from '../components/EmailText';
import { EmailButton } from '../components/EmailButton';
// import { Img } from '@react-email/components';

interface SignupConfirmationEmailProps {
  confirmationUrl: string;
  name?: string;
  appName: string;
  appUrl: string;
  year: number;
}

export const SignupConfirmationEmail: React.FC<SignupConfirmationEmailProps> = ({
  confirmationUrl,
  // name,
  appName,
  appUrl,
  year,
}) => {
  return (
    <EmailLayout
      appName={appName}
      appUrl={appUrl}
      year={year}
      previewText="Verify your email address"
    >
      {/* MNUDA Logo */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{
          display: 'inline-block',
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#1a202c',
          padding: '20px',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '2px solid #e2e8f0'
        }}>
          <span style={{ color: '#014463' }}>MN</span>
          <span style={{ color: '#1dd1f5' }}>UDA</span>
        </div>
      </div>

      {/* Simple heading */}
      <EmailText variant="heading" style={{ textAlign: 'center', marginBottom: '20px' }}>
        Verify Your Email
      </EmailText>
      
      {/* Simple message */}
      <EmailText variant="body" style={{ textAlign: 'center', marginBottom: '30px' }}>
        Click the button below to verify your email address and complete your signup.
      </EmailText>
      
      {/* Verify button */}
      <div style={{ textAlign: 'center', margin: '40px 0' }}>
        <EmailButton href={confirmationUrl}>
          Verify Email
        </EmailButton>
      </div>
      
      {/* Simple footer text */}
      <EmailText variant="small" style={{ textAlign: 'center', color: '#718096' }}>
        If you didn&apos;t create an account, you can safely ignore this email.
      </EmailText>
    </EmailLayout>
  );
};
