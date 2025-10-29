import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, workspaceName, workspaceEmoji, workspaceDescription } = await request.json();

    if (!email || !workspaceName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const { data, error } = await resend.emails.send({
      from: 'MNUDA <noreply@mnuda.com>',
      to: [email],
      subject: `You've been added to ${workspaceEmoji} ${workspaceName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Workspace Invitation</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9fafb;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .mnuda-blue { color: #014463; }
            .mnuda-cyan { color: #1dd1f5; }
            .workspace-info {
              background: #f8fafc;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            .workspace-emoji {
              font-size: 32px;
              margin-bottom: 10px;
            }
            .workspace-name {
              font-size: 20px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 5px;
            }
            .workspace-description {
              color: #6b7280;
              font-size: 14px;
            }
            .cta-button {
              display: inline-block;
              background: #014463;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                <span class="mnuda-blue">MN</span><span class="mnuda-cyan">UDA</span>
              </div>
            </div>
            
            <h1 style="color: #1f2937; margin-bottom: 20px;">You've been added to a workspace!</h1>
            
            <p style="color: #4b5563; margin-bottom: 20px;">
              You've been added to a workspace and can now collaborate with your team.
            </p>
            
            <div class="workspace-info">
              <div class="workspace-emoji">${workspaceEmoji}</div>
              <div class="workspace-name">${workspaceName}</div>
              ${workspaceDescription ? `<div class="workspace-description">${workspaceDescription}</div>` : ''}
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://mnuda.com'}/dashboard" class="cta-button">
                Access Workspace
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              If you don't have an account yet, you can sign up with this email address to access the workspace.
            </p>
            
            <div class="footer">
              <p>This email was sent by MNUDA</p>
              <p>Minnesota Skip Trace Tool - Professional Data Access</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: data?.id });
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
