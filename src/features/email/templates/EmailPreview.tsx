import React from 'react';
import { SignupConfirmationEmail } from './SignupConfirmationEmail';

/**
 * Simple preview component to test email templates
 * This is for development/testing purposes only
 */
export const EmailPreview: React.FC = () => {
  const mockData = {
    confirmationUrl: 'https://mnuda.link/verify?token=abc123',
    name: 'John Doe',
    appName: 'MNUDA',
    appUrl: 'https://mnuda.link',
    year: new Date().getFullYear(),
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5' }}>
      <h2>Email Preview</h2>
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        backgroundColor: 'white', 
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <SignupConfirmationEmail {...mockData} />
      </div>
    </div>
  );
};
