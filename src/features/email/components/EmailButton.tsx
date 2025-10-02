import React from 'react';
import { Link } from '@react-email/components';

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export const EmailButton: React.FC<EmailButtonProps> = ({
  href,
  children,
  variant = 'primary',
}) => {
  const buttonStyle = variant === 'primary' ? primaryButtonStyle : secondaryButtonStyle;

  return (
    <Link href={href} style={buttonStyle}>
      {children}
    </Link>
  );
};

const primaryButtonStyle = {
  backgroundColor: '#4299e1',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '24px',
  padding: '12px 24px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  width: 'auto',
};

const secondaryButtonStyle = {
  backgroundColor: 'transparent',
  border: '2px solid #4299e1',
  borderRadius: '6px',
  color: '#4299e1',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '24px',
  padding: '10px 22px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  width: 'auto',
};
