// supabase/functions/send-admin-notification/index.ts

// @ts-ignore: Deno runtime import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface Restaurant {
  id: string;
  name: string;
  contact_name: string | null;
  email: string;
  phone: string | null;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  cuisine_type: string;
  created_at: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { record } = await req.json();

    // Get restaurant details
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', record.id)
      .single();

    if (error || !restaurant) {
      throw new Error('Restaurant not found');
    }

    // Get admin emails from environment variable
    const adminEmailsString = Deno.env.get('ADMIN_EMAILS');
    if (!adminEmailsString) {
      console.warn('ADMIN_EMAILS not configured, using default');
    }

    const adminEmails = (adminEmailsString || 'support@smartbites.food')
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email.includes('@'));

    if (adminEmails.length === 0) {
      throw new Error('No valid admin emails configured');
    }

    console.log(
      `Sending notifications to ${adminEmails.length} admins:`,
      adminEmails
    );

    const emailHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lato:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          line-height: 1.6; 
          color: #253031;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container { 
          max-width: 600px; 
          margin: 40px auto; 
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
          background: linear-gradient(135deg, #FF8866 0%, #FF6B4A 100%);
          color: white; 
          padding: 32px 24px; 
          text-align: center;
        }
        .header h1 {
          font-family: 'Lato', sans-serif;
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .content { 
          background: white;
          padding: 32px 24px;
        }
        .restaurant-name {
          font-family: 'Lato', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #253031;
          margin: 0 0 24px 0;
          padding-bottom: 16px;
          border-bottom: 2px solid #d9d3c3;
        }
        .detail { 
          margin: 0 0 16px 0;
          padding: 16px;
          background: #fafafa;
          border-radius: 4px;
        }
        .label { 
          font-weight: 600;
          color: #253031;
          display: inline-block;
          min-width: 100px;
          margin-right: 8px;
        }
        .value {
          color: #4a5568;
        }
        .button-container {
          text-align: center;
          margin: 32px 0;
        }
        .button { 
          display: inline-block; 
          padding: 14px 32px; 
          background: #FF8866;
          color: white !important;
          text-decoration: none; 
          border-radius: 8px;
          font-weight: 600;
          font-size: 15px;
          transition: background 0.3s ease;
          box-shadow: 0 2px 4px rgba(255, 136, 102, 0.3);
        }
        .button:hover {
          background: #FF6B4A;
        }
        .next-steps {
          margin-top: 32px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #d9d3c3;
        }
        .next-steps-title {
          font-family: 'Lato', sans-serif;
          font-weight: 700;
          color: #253031;
          margin: 0 0 12px 0;
          font-size: 16px;
        }
        .next-steps ul {
          margin: 0;
          padding-left: 20px;
          color: #4a5568;
        }
        .next-steps li {
          margin-bottom: 8px;
        }
        .footer {
          text-align: center;
          padding: 24px;
          background: #fafafa;
          border-top: 1px solid #d9d3c3;
          color: #6b7280;
          font-size: 13px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 New Restaurant Registration</h1>
        </div>
        
        <div class="content">
          <h2 class="restaurant-name">${restaurant.name}</h2>
          
          <div class="detail">
            <span class="label">Contact:</span>
            <span class="value">${
              restaurant.contact_name || 'Not provided'
            }</span>
          </div>
          
          <div class="detail">
            <span class="label">Email:</span>
            <span class="value">${restaurant.email}</span>
          </div>
          
          <div class="detail">
            <span class="label">Phone:</span>
            <span class="value">${restaurant.phone || 'Not provided'}</span>
          </div>
          
          <div class="detail">
            <span class="label">Location:</span>
            <span class="value">${restaurant.address}<br>${restaurant.city}, ${
      restaurant.state
    } ${restaurant.zip_code}</span>
          </div>
          
          <div class="detail">
            <span class="label">Cuisine:</span>
            <span class="value">${restaurant.cuisine_type}</span>
          </div>
          
          <div class="detail">
            <span class="label">Registered:</span>
            <span class="value">${new Date(
              restaurant.created_at
            ).toLocaleString('en-US', {
              dateStyle: 'full',
              timeStyle: 'short',
            })}</span>
          </div>
          
          <div class="button-container">
            <a href="https://smartbites.food/admin" class="button">
              Review in Admin Portal →
            </a>
          </div>
          
          <div class="next-steps">
            <p class="next-steps-title">Next Steps:</p>
            <ul>
              <li>Review restaurant details and documents</li>
              <li>Approve menu items</li>
              <li>Verify gallery images</li>
              <li>Update status to 'approved'</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p style="margin: 0;">SmartBites Admin Notification System</p>
          <p style="margin: 8px 0 0 0;">This is an automated notification. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
  </html>
`;

    const emailText = `
New Restaurant Registration!

Restaurant: ${restaurant.name}
Contact: ${restaurant.contact_name || 'Not provided'}
Email: ${restaurant.email}
Phone: ${restaurant.phone || 'Not provided'}
Location: ${restaurant.address}, ${restaurant.city}, ${restaurant.state} ${
      restaurant.zip_code
    }
Cuisine: ${restaurant.cuisine_type}
Registered: ${new Date(restaurant.created_at).toLocaleString()}

Review in admin portal: https://smartbites.food/admin

Next Steps:
• Review restaurant details and documents
• Approve menu items
• Verify gallery images
• Update status to 'approved'
`;

    // Send email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SmartBites Notifications <noreply@smartbites.food>',
        to: adminEmails,
        subject: `🎉 New Restaurant: ${restaurant.name}`,
        html: emailHtml,
        text: emailText,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      throw new Error(`Resend API error: ${errorText}`);
    }

    const result = await resendResponse.json();
    console.log('Email sent successfully:', result);

    return new Response(JSON.stringify({ success: true, emailId: result.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
