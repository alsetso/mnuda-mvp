import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const body = await request.json();
    const { type } = await params;
    
    // Validate lead type
    if (!['buy', 'sell', 'loan'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid lead type' },
        { status: 400 }
      );
    }

    // Validate required fields
    const { name, email, phone } = body;
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phone' },
        { status: 400 }
      );
    }

    // Format lead type for display
    const leadTypeDisplay = type.charAt(0).toUpperCase() + type.slice(1);
    
    // Create email content based on lead type
    const getEmailContent = () => {
      switch (type) {
        case 'buy':
          return {
            subject: `New Buy Lead - Minnesota Real Estate`,
            html: createBuyEmailHTML(body),
            text: createBuyEmailText(body)
          };
        case 'sell':
          return {
            subject: `New Sell Lead - Minnesota Real Estate`,
            html: createSellEmailHTML(body),
            text: createSellEmailText(body)
          };
        case 'loan':
          return {
            subject: `New Loan Lead - Minnesota Real Estate`,
            html: createLoanEmailHTML(body),
            text: createLoanEmailText(body)
          };
        default:
          return {
            subject: `New ${leadTypeDisplay} Lead - Minnesota Real Estate`,
            html: createGenericEmailHTML(body, leadTypeDisplay),
            text: createGenericEmailText(body, leadTypeDisplay)
          };
      }
    };

    const emailContent = getEmailContent();

    // Send email to support@mnuda.com
    const { data, error } = await resend.emails.send({
      from: 'noreply@mnuda.link',
      to: 'support@mnuda.com',
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
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
    console.error('Lead API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Type definitions for email templates
interface BuyLeadData {
  name: string;
  email: string;
  phone: string;
  message: string;
  propertyAddress?: string;
  budget?: string;
  timeline?: string;
  propertyType?: string;
}

interface SellLeadData {
  name: string;
  email: string;
  phone: string;
  message: string;
  propertyAddress?: string;
  propertyType?: string;
  estimatedValue?: string;
  timeline?: string;
  reasonForSelling?: string;
}

interface LoanLeadData {
  name: string;
  email: string;
  phone: string;
  message: string;
  loanAmount?: string;
  propertyAddress?: string;
  propertyValue?: string;
  loanType?: string;
  creditScore?: string;
  timeline?: string;
}

// Email template functions
function createBuyEmailHTML(data: BuyLeadData) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #014463 0%, #1dd1f5 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold;">
          <span style="color: #014463;">MN</span><span style="color: #1dd1f5;">UDA</span>
        </h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">New Buy Lead - Minnesota Real Estate</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 20px;">Buyer Information</h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 16px;">Contact Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500; width: 120px;">Name:</td>
              <td style="padding: 8px 0; color: #1a202c;">${data.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Email:</td>
              <td style="padding: 8px 0; color: #1a202c;">${data.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Phone:</td>
              <td style="padding: 8px 0; color: #1a202c;">${data.phone}</td>
            </tr>
          </table>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 16px;">Buying Preferences</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500; width: 120px;">Budget:</td>
              <td style="padding: 8px 0; color: #1a202c;">${data.budget || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Property Type:</td>
              <td style="padding: 8px 0; color: #1a202c;">${data.propertyType || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Timeline:</td>
              <td style="padding: 8px 0; color: #1a202c;">${data.timeline || 'Not specified'}</td>
            </tr>
          </table>
        </div>

        <div style="background: #e6fffa; border: 1px solid #81e6d9; padding: 15px; border-radius: 6px; margin-top: 20px;">
          <p style="margin: 0; color: #234e52; font-size: 14px;">
            <strong>Next Steps:</strong> Contact this buyer to discuss their Minnesota property search and connect them with appropriate listings.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #718096; font-size: 12px;">
        <p>This lead was submitted through the MNUDA buy page.</p>
      </div>
    </div>
  `;
}

function createSellEmailHTML(data: SellLeadData) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #014463 0%, #1dd1f5 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold;">
          <span style="color: #014463;">MN</span><span style="color: #1dd1f5;">UDA</span>
        </h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">New Sell Lead - Minnesota Real Estate</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 20px;">Seller Information</h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 16px;">Contact Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500; width: 120px;">Name:</td>
              <td style="padding: 8px 0; color: #1a202c;">${data.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Email:</td>
              <td style="padding: 8px 0; color: #1a202c;">${data.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Phone:</td>
              <td style="padding: 8px 0; color: #1a202c;">${data.phone}</td>
            </tr>
          </table>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 16px;">Property Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500; width: 120px;">Address:</td>
              <td style="padding: 8px 0; color: #1a202c;">${data.propertyAddress || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Property Type:</td>
              <td style="padding: 8px 0; color: #1a202c;">${data.propertyType || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Timeline:</td>
              <td style="padding: 8px 0; color: #1a202c;">${data.timeline || 'Not specified'}</td>
            </tr>
          </table>
        </div>

        <div style="background: #e6fffa; border: 1px solid #81e6d9; padding: 15px; border-radius: 6px; margin-top: 20px;">
          <p style="margin: 0; color: #234e52; font-size: 14px;">
            <strong>Next Steps:</strong> Contact this seller to discuss their Minnesota property and provide a market analysis and selling strategy.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #718096; font-size: 12px;">
        <p>This lead was submitted through the MNUDA sell page.</p>
      </div>
    </div>
  `;
}

function createLoanEmailHTML(data: LoanLeadData) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #014463 0%, #1dd1f5 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold;">
          <span style="color: #014463;">MN</span><span style="color: #1dd1f5;">UDA</span>
        </h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">New Loan Lead - Minnesota Real Estate</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 20px;">Loan Information</h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 16px;">Contact Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500; width: 120px;">Name:</td>
              <td style="padding: 8px 0; color: #1a202c;">${data.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Email:</td>
              <td style="padding: 8px 0; color: #1a202c;">${data.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Phone:</td>
              <td style="padding: 8px 0; color: #1a202c;">${data.phone}</td>
            </tr>
          </table>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 16px;">Loan Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500; width: 120px;">Loan Type:</td>
              <td style="padding: 8px 0; color: #1a202c;">${data.loanType || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Property Value:</td>
              <td style="padding: 8px 0; color: #1a202c;">${data.propertyValue || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Timeline:</td>
              <td style="padding: 8px 0; color: #1a202c;">${data.timeline || 'Not specified'}</td>
            </tr>
          </table>
        </div>

        <div style="background: #e6fffa; border: 1px solid #81e6d9; padding: 15px; border-radius: 6px; margin-top: 20px;">
          <p style="margin: 0; color: #234e52; font-size: 14px;">
            <strong>Next Steps:</strong> Contact this client to discuss their Minnesota financing needs and provide pre-approval or refinance options.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #718096; font-size: 12px;">
        <p>This lead was submitted through the MNUDA loan page.</p>
      </div>
    </div>
  `;
}

function createGenericEmailHTML(data: BuyLeadData | SellLeadData | LoanLeadData, leadType: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #014463 0%, #1dd1f5 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold;">
          <span style="color: #014463;">MN</span><span style="color: #1dd1f5;">UDA</span>
        </h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">New ${leadType} Lead - Minnesota Real Estate</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 20px;">Lead Information</h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 16px;">Contact Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500; width: 120px;">Name:</td>
              <td style="padding: 8px 0; color: #1a202c;">${data.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Email:</td>
              <td style="padding: 8px 0; color: #1a202c;">${data.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Phone:</td>
              <td style="padding: 8px 0; color: #1a202c;">${data.phone}</td>
            </tr>
          </table>
        </div>

        <div style="background: #e6fffa; border: 1px solid #81e6d9; padding: 15px; border-radius: 6px; margin-top: 20px;">
          <p style="margin: 0; color: #234e52; font-size: 14px;">
            <strong>Next Steps:</strong> Contact this lead to discuss their Minnesota real estate needs.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #718096; font-size: 12px;">
        <p>This lead was submitted through the MNUDA ${leadType.toLowerCase()} page.</p>
      </div>
    </div>
  `;
}

// Text versions of emails
function createBuyEmailText(data: BuyLeadData) {
  return `
New Buy Lead - Minnesota Real Estate

Contact Details:
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone}

Buying Preferences:
Budget: ${data.budget || 'Not specified'}
Property Type: ${data.propertyType || 'Not specified'}
Timeline: ${data.timeline || 'Not specified'}

Next Steps: Contact this buyer to discuss their Minnesota property search and connect them with appropriate listings.

This lead was submitted through the MNUDA buy page.
  `;
}

function createSellEmailText(data: SellLeadData) {
  return `
New Sell Lead - Minnesota Real Estate

Contact Details:
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone}

Property Details:
Address: ${data.propertyAddress || 'Not provided'}
Property Type: ${data.propertyType || 'Not specified'}
Timeline: ${data.timeline || 'Not specified'}

Next Steps: Contact this seller to discuss their Minnesota property and provide a market analysis and selling strategy.

This lead was submitted through the MNUDA sell page.
  `;
}

function createLoanEmailText(data: LoanLeadData) {
  return `
New Loan Lead - Minnesota Real Estate

Contact Details:
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone}

Loan Details:
Loan Type: ${data.loanType || 'Not specified'}
Property Value: ${data.propertyValue || 'Not specified'}
Timeline: ${data.timeline || 'Not specified'}

Next Steps: Contact this client to discuss their Minnesota financing needs and provide pre-approval or refinance options.

This lead was submitted through the MNUDA loan page.
  `;
}

function createGenericEmailText(data: BuyLeadData | SellLeadData | LoanLeadData, leadType: string) {
  return `
New ${leadType} Lead - Minnesota Real Estate

Contact Details:
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone}

Next Steps: Contact this lead to discuss their Minnesota real estate needs.

This lead was submitted through the MNUDA ${leadType.toLowerCase()} page.
  `;
}
