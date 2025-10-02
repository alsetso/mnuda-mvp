# Resend Email System Setup Guide

This guide will help you set up a production-grade custom email system using Resend with Supabase SMTP integration.

## Prerequisites

- Supabase project with authentication enabled
- Resend account with verified domain
- Next.js application (already configured)

## 1. Resend Setup

### Create Resend Account
1. Go to [resend.com](https://resend.com) and create an account
2. Verify your domain in Resend dashboard
3. Generate an API key in the API Keys section

### Domain Verification
1. Add your domain in Resend dashboard
2. Add the required DNS records (SPF, DKIM, DMARC)
3. Wait for verification (usually takes a few minutes)

## 2. Environment Variables

Create or update your `.env.local` file with the following variables:

```env
# Existing Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=Your App Name

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Your App Name
```

## 3. Supabase SMTP Configuration

### Configure Custom SMTP in Supabase
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **SMTP Settings**
3. Enable **Custom SMTP**
4. Configure the following settings:

```
Host: smtp.resend.com
Port: 465
Username: resend
Password: [Your Resend API Key]
Sender Email: noreply@yourdomain.com
Sender Name: Your App Name
```

### Disable Supabase Email Templates (Optional)
1. Go to **Authentication** > **Email Templates**
2. Disable the default templates if you want to use only custom emails
3. Or keep them as fallback for system emails

## 4. Email Templates

The system includes the following email templates:

- **Signup Confirmation**: Sent when users sign up
- **Password Reset**: Sent when users request password reset
- **Welcome**: Sent after successful email confirmation
- **Email Verification**: Sent for email verification
- **Password Changed**: Sent when password is updated
- **Account Deleted**: Sent when account is deleted

## 5. Usage Examples

### Sending Custom Emails

```typescript
import { emailService } from '@/features/email';

// Send signup confirmation
await emailService.sendSignupConfirmation(
  'user@example.com',
  'https://yourapp.com/confirm?token=abc123',
  'John Doe'
);

// Send password reset
await emailService.sendPasswordReset(
  'user@example.com',
  'https://yourapp.com/reset?token=abc123',
  'John Doe'
);

// Send welcome email
await emailService.sendWelcome('user@example.com', 'John Doe');
```

### Using Email Hooks

```typescript
import { useEmailNotifications } from '@/features/email/hooks/useEmailNotifications';

function MyComponent() {
  const { sendSignupConfirmation, sendPasswordReset } = useEmailNotifications();

  const handleSignup = async (email: string) => {
    try {
      await sendSignupConfirmation(email, confirmationUrl, name);
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };
}
```

## 6. Customization

### Customizing Email Templates

1. Edit templates in `src/features/email/templates/`
2. Modify the `EmailLayout` component for consistent branding
3. Update colors, fonts, and styling in the component files

### Adding New Email Types

1. Create a new template component in `src/features/email/templates/`
2. Add the template type to `EmailTemplateType` in `src/features/email/types/index.ts`
3. Update the `templateRenderer.tsx` to handle the new template
4. Add a method to `emailService.ts` for sending the new email type

## 7. Testing

### Local Testing
1. Use Resend's test mode for development
2. Check email delivery in Resend dashboard
3. Test all email templates with different data

### Production Testing
1. Send test emails to real addresses
2. Verify email deliverability
3. Check spam folder placement
4. Test on different email clients

## 8. Monitoring and Analytics

### Resend Dashboard
- Monitor email delivery rates
- Track open and click rates
- View bounce and complaint rates
- Set up webhooks for real-time events

### Application Logging
- Email send attempts are logged to console
- Failed sends include error details
- Retry logic is built-in with exponential backoff

## 9. Best Practices

### Email Deliverability
- Use verified domains
- Maintain good sender reputation
- Include unsubscribe links
- Follow CAN-SPAM and GDPR guidelines

### Security
- Never expose API keys in client-side code
- Validate email addresses before sending
- Use HTTPS for all email links
- Implement rate limiting for email sending

### Performance
- Use async/await for email sending
- Implement retry logic for failed sends
- Cache email templates when possible
- Monitor email service performance

## 10. Troubleshooting

### Common Issues

**Emails not being sent:**
- Check API key configuration
- Verify domain is properly set up
- Check Supabase SMTP settings
- Review error logs

**Emails going to spam:**
- Verify SPF, DKIM, and DMARC records
- Use a reputable domain
- Avoid spam trigger words
- Maintain good engagement rates

**Template rendering issues:**
- Check React Email component syntax
- Verify template data is properly passed
- Test templates in Resend's preview mode

### Support Resources
- [Resend Documentation](https://resend.com/docs)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [React Email Documentation](https://react.email/docs)

## 11. Production Checklist

Before going live:

- [ ] Domain verified in Resend
- [ ] DNS records (SPF, DKIM, DMARC) configured
- [ ] Environment variables set in production
- [ ] Supabase SMTP configured
- [ ] All email templates tested
- [ ] Error handling implemented
- [ ] Monitoring set up
- [ ] Unsubscribe functionality working
- [ ] Privacy policy and terms updated
- [ ] Email deliverability tested

## 12. Maintenance

### Regular Tasks
- Monitor email delivery rates
- Update email templates as needed
- Review and update DNS records
- Check for new Resend features
- Update dependencies regularly

### Security Updates
- Rotate API keys periodically
- Monitor for security advisories
- Update email templates for security best practices
- Review access permissions regularly
