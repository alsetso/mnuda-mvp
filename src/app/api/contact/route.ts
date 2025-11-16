import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, serviceType, projectType, timeline, propertyType } = body;

    // Validate required fields
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phone' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check for Resend API key
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('Missing RESEND_API_KEY');
      return NextResponse.json(
        { error: 'Server configuration error: Email service not configured' },
        { status: 500 }
      );
    }

    // Format service type labels
    const serviceTypeLabels: Record<string, string> = {
      project: 'Project Management',
      cash: 'Cash Offer for My Home',
      both: 'Both',
    };

    const projectTypeLabels: Record<string, string> = {
      renovation: 'Home Renovation',
      repair: 'Repairs & Maintenance',
      remodel: 'Full Remodel',
      other: 'Other',
    };

    const timelineLabels: Record<string, string> = {
      asap: 'As Soon As Possible',
      month: 'Within a Month',
      quarter: 'Within 3 Months',
      flexible: 'Flexible Timeline',
    };

    const propertyTypeLabels: Record<string, string> = {
      single: 'Single Family Home',
      multi: 'Multi-Family',
      condo: 'Condo',
      commercial: 'Commercial',
    };

    // Build email HTML content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #666; }
            .value { color: #333; margin-top: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Lead Submission</h1>
            </div>
            <div class="content">
              <h2>Contact Information</h2>
              <div class="field">
                <div class="label">Name:</div>
                <div class="value">${name}</div>
              </div>
              <div class="field">
                <div class="label">Email:</div>
                <div class="value"><a href="mailto:${email}">${email}</a></div>
              </div>
              <div class="field">
                <div class="label">Phone:</div>
                <div class="value"><a href="tel:${phone}">${phone}</a></div>
              </div>
              
              <h2 style="margin-top: 30px;">Service Details</h2>
              <div class="field">
                <div class="label">Service Type:</div>
                <div class="value">${serviceTypeLabels[serviceType] || serviceType || 'Not specified'}</div>
              </div>
              ${projectType ? `
              <div class="field">
                <div class="label">Project Type:</div>
                <div class="value">${projectTypeLabels[projectType] || projectType}</div>
              </div>
              ` : ''}
              ${timeline ? `
              <div class="field">
                <div class="label">Timeline:</div>
                <div class="value">${timelineLabels[timeline] || timeline}</div>
              </div>
              ` : ''}
              ${propertyType ? `
              <div class="field">
                <div class="label">Property Type:</div>
                <div class="value">${propertyTypeLabels[propertyType] || propertyType}</div>
              </div>
              ` : ''}
              
              <div class="field" style="margin-top: 30px;">
                <div class="label">Submitted:</div>
                <div class="value">${new Date().toLocaleString()}</div>
              </div>
            </div>
            <div class="footer">
              <p>This lead was submitted through the MNUDA website contact form.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Build email text content (plain text fallback)
    const emailText = `
New Lead Submission

Contact Information:
Name: ${name}
Email: ${email}
Phone: ${phone}

Service Details:
Service Type: ${serviceTypeLabels[serviceType] || serviceType || 'Not specified'}
${projectType ? `Project Type: ${projectTypeLabels[projectType] || projectType}\n` : ''}
${timeline ? `Timeline: ${timelineLabels[timeline] || timeline}\n` : ''}
${propertyType ? `Property Type: ${propertyTypeLabels[propertyType] || propertyType}\n` : ''}

Submitted: ${new Date().toLocaleString()}

This lead was submitted through the MNUDA website contact form.
    `.trim();

    // Send email directly via Resend API
    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'MNUDA <support@mnuda.com>',
          to: 'cole@mnuda.com',
          subject: `New Lead: ${name} - ${serviceTypeLabels[serviceType] || serviceType || 'Inquiry'}`,
          html: emailHtml,
          text: emailText,
        }),
      });

      if (!resendResponse.ok) {
        const errorData = await resendResponse.json().catch(() => ({}));
        console.error('Resend API error:', {
          status: resendResponse.status,
          statusText: resendResponse.statusText,
          error: errorData,
        });
        return NextResponse.json(
          { error: `Failed to send email: ${errorData.message || resendResponse.statusText}` },
          { status: 500 }
        );
      }

      const resendResult = await resendResponse.json();
      console.log('Lead email sent successfully via Resend:', {
        id: resendResult.id,
        name,
        email,
        phone,
        timestamp: new Date().toISOString(),
      });
    } catch (emailError) {
      console.error('Error sending email via Resend:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Form submitted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

