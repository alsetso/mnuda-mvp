import { Resend } from "npm:resend"

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string)

function getOtpEmailHtml(userEmail: string, firstName: string, otpCode: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your MNUDA Access Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #ffffff;">
  <!-- Header with Logo -->
  <div style="background-color: #f8fafc; padding: 30px 0; text-align: center; border-bottom: 1px solid #e2e8f0;">
    <div style="max-width: 600px; margin: 0 auto; padding: 0 20px;">
      <div style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 50px;">
        <span style="font-size: 36px; font-weight: bold; color: #014463; letter-spacing: -0.5px;">MN</span>
        <span style="font-size: 36px; font-weight: bold; color: #1DD1F5; letter-spacing: -0.5px;">UDA</span>
      </div>
    </div>
  </div>
  
  <!-- Main Content -->
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
    <h1 style="font-size: 24px; font-weight: bold; color: #1e293b; margin: 0 0 20px 0; text-align: center;">
      Here is your one-time pin to login to MNUDA
    </h1>
    
    <!-- OTP Code Display -->
    <div style="text-align: center; margin: 40px 0;">
      <div style="background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 40px; display: inline-block;">
        <div style="font-size: 48px; font-weight: bold; color: #1e293b; letter-spacing: 8px; font-family: 'Courier New', monospace;">
          ${otpCode}
        </div>
      </div>
    </div>
    
    <p style="font-size: 14px; line-height: 1.6; color: #64748b; margin: 20px 0 0 0; text-align: center;">
      This code expires in 10 minutes.
    </p>
  </div>
  
  <!-- Footer -->
  <div style="background-color: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b;">
    <div style="max-width: 600px; margin: 0 auto;">
      <!-- Logo -->
      <div style="margin-bottom: 15px;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 30px;">
          <span style="font-size: 20px; font-weight: bold; color: #014463; letter-spacing: -0.5px;">MN</span>
          <span style="font-size: 20px; font-weight: bold; color: #1DD1F5; letter-spacing: -0.5px;">UDA</span>
        </div>
      </div>
      
      <p style="margin: 0 0 10px 0; font-size: 12px;">
        © ${new Date().getFullYear()} MNUDA. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`.trim()
}

function getMagicLinkEmailHtml(userEmail: string, firstName: string, magicLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your MNUDA Login Link</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #ffffff;">
  <!-- Header with Logo -->
  <div style="background-color: #f8fafc; padding: 30px 0; text-align: center; border-bottom: 1px solid #e2e8f0;">
    <div style="max-width: 600px; margin: 0 auto; padding: 0 20px;">
      <div style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 50px;">
        <span style="font-size: 36px; font-weight: bold; color: #014463; letter-spacing: -0.5px;">MN</span>
        <span style="font-size: 36px; font-weight: bold; color: #1DD1F5; letter-spacing: -0.5px;">UDA</span>
      </div>
    </div>
  </div>
  
  <!-- Main Content -->
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
    <h1 style="font-size: 24px; font-weight: bold; color: #1e293b; margin: 0 0 20px 0; text-align: center;">
      Click to login to MNUDA
    </h1>
    
    <p style="font-size: 16px; line-height: 1.6; color: #64748b; margin: 20px 0; text-align: center;">
      Hi ${firstName || 'there'},<br>
      Click the button below to securely login to your MNUDA account.
    </p>
    
    <!-- Magic Link Button -->
    <div style="text-align: center; margin: 40px 0;">
      <a href="${magicLink}" 
         style="display: inline-block; background-color: #1DD1F5; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: background-color 0.2s;">
        Login to MNUDA
      </a>
    </div>
    
    <p style="font-size: 14px; line-height: 1.6; color: #64748b; margin: 20px 0 0 0; text-align: center;">
      This link expires in 1 hour and can only be used once.
    </p>
    
    <p style="font-size: 12px; line-height: 1.6; color: #94a3b8; margin: 20px 0 0 0; text-align: center;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${magicLink}" style="color: #1DD1F5; word-break: break-all;">${magicLink}</a>
    </p>
  </div>
  
  <!-- Footer -->
  <div style="background-color: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b;">
    <div style="max-width: 600px; margin: 0 auto;">
      <!-- Logo -->
      <div style="margin-bottom: 15px;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 30px;">
          <span style="font-size: 20px; font-weight: bold; color: #014463; letter-spacing: -0.5px;">MN</span>
          <span style="font-size: 20px; font-weight: bold; color: #1DD1F5; letter-spacing: -0.5px;">UDA</span>
        </div>
      </div>
      
      <p style="margin: 0 0 10px 0; font-size: 12px;">
        © ${new Date().getFullYear()} MNUDA. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`.trim()
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("not allowed", { status: 400 })
  }

  const payload = await req.text()
  
  try {
    const parsedPayload = JSON.parse(payload)
    const user = parsedPayload.user
    const email_data = parsedPayload.email_data
    
    if (!user?.email || !email_data?.token) {
      throw new Error('Missing required fields')
    }

    const firstName = user.user_metadata?.first_name || 'there'
    
    // Send your custom branded email
    const { error } = await resend.emails.send({
      from: 'MNUDA <support@mnuda.com>',
      to: [user.email],
      subject: `One-Time Pin: ${email_data.token}`,
      html: getOtpEmailHtml(user.email, firstName, email_data.token)
    })

    if (error) throw error

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  })
})
