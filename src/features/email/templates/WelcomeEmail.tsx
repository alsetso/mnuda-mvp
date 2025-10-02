import React from 'react';
import { EmailLayout } from '../components/EmailLayout';
import { EmailText } from '../components/EmailText';
import { EmailButton } from '../components/EmailButton';

interface WelcomeEmailProps {
  name?: string;
  appName: string;
  appUrl: string;
  year: number;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
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
      previewText="Welcome to your new account!"
    >
      <EmailText variant="heading">
        Welcome to {appName}! 🎉
      </EmailText>
      
      <EmailText variant="body">
        {greeting}
      </EmailText>
      
      <EmailText variant="body">
        Your email has been confirmed and your account is now active. 
        You&apos;re all set to start using {appName}!
      </EmailText>
      
      <EmailText variant="subheading">
        What&apos;s next?
      </EmailText>
      
      <EmailText variant="body">
        • Complete your profile setup<br/>
        • Explore our features and tools<br/>
        • Connect with other users<br/>
        • Get help from our support team
      </EmailText>
      
      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <EmailButton href={appUrl}>
          Get Started
        </EmailButton>
      </div>
      
      <EmailText variant="small">
        Need help getting started? Check out our{' '}
        <a href={`${appUrl}/help`} style={{ color: '#4299e1' }}>
          help center
        </a>{' '}
        or reach out to our support team.
      </EmailText>
      
      <EmailText variant="small">
        We&apos;re excited to have you on board!
      </EmailText>
    </EmailLayout>
  );
};
