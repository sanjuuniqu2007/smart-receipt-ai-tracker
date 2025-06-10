
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  receiptId: string;
  receiptData: {
    vendor: string;
    amount: number;
    due_date: string;
    category: string;
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { to, receiptId, receiptData }: EmailRequest = await req.json();

    console.log('Sending notification email to:', to, 'for receipt:', receiptId);

    // Format the due date
    const dueDate = new Date(receiptData.due_date).toLocaleDateString();
    const amount = receiptData.amount.toFixed(2);

    // Create email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt Expiry Reminder</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .content { padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
            .button { 
              display: inline-block; 
              background: #007bff; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
            }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; }
            .amount { font-size: 1.2em; font-weight: bold; color: #28a745; }
            .due-date { font-size: 1.1em; font-weight: bold; color: #dc3545; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧾 Upcoming Receipt Expiry – Action Needed</h1>
            </div>
            
            <div class="content">
              <p>Hi there!</p>
              
              <p>Just a quick reminder that your receipt is set to expire soon and may require your attention.</p>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p><strong>Receipt Details:</strong></p>
                <p>📍 <strong>Vendor:</strong> ${receiptData.vendor}</p>
                <p>📂 <strong>Category:</strong> ${receiptData.category}</p>
                <p>💰 <strong>Amount:</strong> <span class="amount">₹${amount}</span></p>
                <p>📅 <strong>Due Date:</strong> <span class="due-date">${dueDate}</span></p>
              </div>
              
              <p>Take action now to avoid any issues:</p>
              
              <a href="${supabaseUrl.replace('.supabase.co', '.vercel.app')}/dashboard" class="button">
                🔍 View Receipt Details
              </a>
              
              <p>If you've already taken care of this receipt, you can safely ignore this reminder.</p>
            </div>
            
            <div class="footer">
              <p>Best regards,<br><strong>Smart Receipt Tracker Team</strong></p>
              <p><small>This is an automated reminder. Please do not reply to this email.</small></p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Smart Receipt Tracker <noreply@yourdomain.com>',
        to: [to],
        subject: 'Upcoming Receipt Expiry – Action Needed',
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('Error sending email:', emailResult);
      throw new Error(`Failed to send email: ${emailResult.message || 'Unknown error'}`);
    }

    console.log('Email sent successfully:', emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        emailId: emailResult.id 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in send-notification-email function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});
