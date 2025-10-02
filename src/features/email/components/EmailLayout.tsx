import React from 'react';
import { 
  Html, 
  Head, 
  Body, 
  Container, 
  Section, 
  Text, 
  Link,
  // Img,
  Hr
} from '@react-email/components';

interface EmailLayoutProps {
  children: React.ReactNode;
  appName: string;
  appUrl: string;
  year: number;
  previewText?: string;
}

export const EmailLayout: React.FC<EmailLayoutProps> = ({
  children,
  appName,
  appUrl,
  year,
  previewText = '',
}) => {
  return (
    <Html>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{previewText}</title>
        <style>{`
          @media only screen and (max-width: 600px) {
            .container {
              width: 100% !important;
              padding: 20px !important;
            }
            .content {
              padding: 20px !important;
            }
            .button {
              width: 100% !important;
              display: block !important;
            }
          }
        `}</style>
      </Head>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Link href={appUrl} style={logoLinkStyle}>
              <Text style={logoStyle}>{appName}</Text>
            </Link>
          </Section>

          {/* Main Content */}
          <Section style={contentStyle}>
            {children}
          </Section>

          {/* Footer */}
          <Hr style={hrStyle} />
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              © {year} {appName}. All rights reserved.
            </Text>
            <Text style={footerTextStyle}>
              <Link href={`${appUrl}/unsubscribe`} style={footerLinkStyle}>
                Unsubscribe
              </Link>
              {' • '}
              <Link href={`${appUrl}/privacy`} style={footerLinkStyle}>
                Privacy Policy
              </Link>
              {' • '}
              <Link href={`${appUrl}/support`} style={footerLinkStyle}>
                Support
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const bodyStyle = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
  margin: 0,
  padding: 0,
};

const containerStyle = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
  width: '100%',
};

const headerStyle = {
  backgroundColor: '#ffffff',
  borderBottom: '1px solid #e1e5e9',
  padding: '20px 30px',
  textAlign: 'center' as const,
};

const logoLinkStyle = {
  textDecoration: 'none',
};

const logoStyle = {
  color: '#1a202c',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: 0,
};

const contentStyle = {
  padding: '30px',
};

const hrStyle = {
  border: 'none',
  borderTop: '1px solid #e1e5e9',
  margin: '30px 0',
};

const footerStyle = {
  backgroundColor: '#f8fafc',
  padding: '20px 30px',
  textAlign: 'center' as const,
};

const footerTextStyle = {
  color: '#718096',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '5px 0',
};

const footerLinkStyle = {
  color: '#4299e1',
  textDecoration: 'none',
};
