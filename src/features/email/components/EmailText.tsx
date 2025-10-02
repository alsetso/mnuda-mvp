import React from 'react';
import { Text } from '@react-email/components';

interface EmailTextProps {
  children: React.ReactNode;
  variant?: 'heading' | 'subheading' | 'body' | 'small' | 'muted';
  style?: React.CSSProperties;
}

export const EmailText: React.FC<EmailTextProps> = ({
  children,
  variant = 'body',
  style = {},
}) => {
  const variantStyle = getVariantStyle(variant);
  const combinedStyle = { ...variantStyle, ...style };

  return <Text style={combinedStyle}>{children}</Text>;
};

const getVariantStyle = (variant: string): React.CSSProperties => {
  switch (variant) {
    case 'heading':
      return {
        color: '#1a202c',
        fontSize: '28px',
        fontWeight: 'bold',
        lineHeight: '36px',
        margin: '0 0 20px 0',
      };
    case 'subheading':
      return {
        color: '#2d3748',
        fontSize: '20px',
        fontWeight: '600',
        lineHeight: '28px',
        margin: '0 0 16px 0',
      };
    case 'body':
      return {
        color: '#4a5568',
        fontSize: '16px',
        lineHeight: '24px',
        margin: '0 0 16px 0',
      };
    case 'small':
      return {
        color: '#718096',
        fontSize: '14px',
        lineHeight: '20px',
        margin: '0 0 12px 0',
      };
    case 'muted':
      return {
        color: '#a0aec0',
        fontSize: '14px',
        lineHeight: '20px',
        margin: '0 0 12px 0',
      };
    default:
      return {
        color: '#4a5568',
        fontSize: '16px',
        lineHeight: '24px',
        margin: '0 0 16px 0',
      };
  }
};
