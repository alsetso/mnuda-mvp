import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, phone, planType, planPrice, userTypes, company, message } = body;

    // Validate required fields
    if (!email || !name || !phone || !planType || !planPrice) {
      return NextResponse.json(
        { error: 'Missing required fields: email, name, phone, planType, planPrice' },
        { status: 400 }
      );
    }

    // Send email to support@mnuda.com
    const { data, error } = await resend.emails.send({
      from: 'noreply@mnuda.link',
      to: 'support@mnuda.com',
      subject: `New ${planType} Access Request - ${planType} Plan`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #014463 0%, #1dd1f5 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: bold;">
              <span style="color: #014463;">MN</span><span style="color: #1dd1f5;">UDA</span>
            </h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">New Premium Access Request</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 20px;">${planType} Access Request Details</h2>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 16px;">Request Information</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #4a5568; font-weight: 500; width: 120px;">Name:</td>
                  <td style="padding: 8px 0; color: #1a202c;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Email:</td>
                  <td style="padding: 8px 0; color: #1a202c;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Phone:</td>
                  <td style="padding: 8px 0; color: #1a202c;">${phone}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">User Type:</td>
                  <td style="padding: 8px 0; color: #1a202c;">${userTypes && userTypes.length > 0 ? userTypes.join(', ') : 'Not specified'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Company:</td>
                  <td style="padding: 8px 0; color: #1a202c;">${company || 'Not provided'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Plan:</td>
                  <td style="padding: 8px 0; color: #1a202c; font-weight: 600;">${planType} - $${planPrice}/month</td>
                </tr>
              </table>
            </div>

            ${message ? `
              <div style="margin-bottom: 20px;">
                <h3 style="color: #2d3748; margin: 0 0 10px 0; font-size: 16px;">Additional Message</h3>
                <div style="background: #f8fafc; padding: 15px; border-radius: 6px; color: #4a5568; line-height: 1.5;">
                  ${message.replace(/\n/g, '<br>')}
                </div>
              </div>
            ` : ''}

            <div style="background: #e6fffa; border: 1px solid #81e6d9; padding: 15px; border-radius: 6px; margin-top: 20px;">
              <p style="margin: 0; color: #234e52; font-size: 14px;">
                <strong>Next Steps:</strong> Please review this request and follow up with the user to provide access to the ${planType} plan.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #718096; font-size: 12px;">
            <p>This request was submitted through the MNUDA signup flow.</p>
          </div>
        </div>
      `,
      text: `
New ${planType} Access Request - ${planType} Plan

Name: ${name}
Email: ${email}
Phone: ${phone}
User Type: ${userTypes && userTypes.length > 0 ? userTypes.join(', ') : 'Not specified'}
Company: ${company || 'Not provided'}
Plan: ${planType} - $${planPrice}/month

${message ? `Additional Message:\n${message}\n` : ''}

Next Steps: Please review this request and follow up with the user to provide access to the ${planType} plan.

This request was submitted through the MNUDA signup flow.
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
    });
  } catch (error) {
    console.error('Support request API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
