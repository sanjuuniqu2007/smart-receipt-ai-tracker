
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    console.log('Processing scheduled notifications...');

    // Get notifications that should be sent now
    const now = new Date();
    const { data: notifications, error: fetchError } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_send_date', now.toISOString());

    if (fetchError) {
      throw new Error(`Error fetching notifications: ${fetchError.message}`);
    }

    console.log(`Found ${notifications?.length || 0} notifications to process`);

    let processedCount = 0;

    for (const notification of notifications || []) {
      try {
        const content = notification.content as any;
        const message = `Receipt Reminder: Your payment for ${content.vendor} (${content.category}) of $${content.amount} is due on ${new Date(content.dueDate).toLocaleDateString()}. Receipt ID: ${content.receiptId}`;

        if (notification.notification_type === 'email') {
          // Send email via Resend
          await resend.emails.send({
            from: 'Receipt Reminder <onboarding@resend.dev>',
            to: [notification.recipient],
            subject: `Payment Reminder - ${content.vendor}`,
            html: `
              <h2>Payment Due Reminder</h2>
              <p>This is a reminder that your payment is due soon:</p>
              <ul>
                <li><strong>Vendor:</strong> ${content.vendor}</li>
                <li><strong>Amount:</strong> $${content.amount}</li>
                <li><strong>Category:</strong> ${content.category}</li>
                <li><strong>Due Date:</strong> ${new Date(content.dueDate).toLocaleDateString()}</li>
                <li><strong>Receipt ID:</strong> ${content.receiptId}</li>
              </ul>
              <p>Please ensure your payment is made before the due date.</p>
            `
          });

        } else if (notification.notification_type === 'sms') {
          // Send SMS via Twilio
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
          const twilioResponse = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              From: twilioPhoneNumber,
              To: notification.recipient,
              Body: message
            })
          });

          if (!twilioResponse.ok) {
            const errorText = await twilioResponse.text();
            throw new Error(`Twilio API error: ${errorText}`);
          }
        }

        // Mark notification as sent
        await supabase
          .from('scheduled_notifications')
          .update({
            status: 'sent',
            sent_at: now.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('id', notification.id);

        processedCount++;
        console.log(`Successfully sent ${notification.notification_type} to ${notification.recipient}`);

      } catch (error: any) {
        console.error(`Error processing notification ${notification.id}:`, error);
        
        // Mark notification as failed
        await supabase
          .from('scheduled_notifications')
          .update({
            status: 'failed',
            error_message: error.message,
            updated_at: now.toISOString()
          })
          .eq('id', notification.id);
      }
    }

    console.log(`Processed ${processedCount} notifications successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processedCount,
        totalFound: notifications?.length || 0
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in process-scheduled-notifications function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);
