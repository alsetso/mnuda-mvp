import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/features/email/services/emailService';
import { EmailTemplateType } from '@/features/email/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateType, options, templateData } = body;

    // Validate required fields
    if (!templateType || !options || !options.to) {
      return NextResponse.json(
        { error: 'Missing required fields: templateType, options, options.to' },
        { status: 400 }
      );
    }

    // Validate template type
    const validTemplateTypes: EmailTemplateType[] = [
      'signup-confirmation',
      'password-reset',
      'welcome',
      'email-verification',
      'password-changed',
      'account-deleted',
    ];

    if (!validTemplateTypes.includes(templateType)) {
      return NextResponse.json(
        { error: 'Invalid template type' },
        { status: 400 }
      );
    }

    // Send email
    const result = await emailService.sendEmail(
      templateType,
      options,
      templateData
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
