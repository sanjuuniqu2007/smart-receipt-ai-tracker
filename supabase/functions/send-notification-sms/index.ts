
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  to: string;
  receiptId: string;
  receiptData: {
    vendor: string;
    amount: number;
    due_date: string;
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
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error('Twilio credentials are not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { to, receiptId, receiptData }: SMSRequest = await req.json();

    console.log('Sending SMS notification to:', to, 'for receipt:', receiptId);

    // Format the due date
    const dueDate = new Date(receiptData.due_date).toLocaleDateString();
    const amount = receiptData.amount.toFixed(2);

    // Create SMS content
    const smsMessage = `🧾 Receipt Reminder: Your receipt from ${receiptData.vendor} (₹${amount}) is expiring on ${dueDate}. Please check Smart Receipt Tracker for details.`;

    // Send SMS using Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const smsResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: twilioPhoneNumber,
        To: to,
        Body: smsMessage,
      }),
    });

    const smsResult = await smsResponse.json();

    if (!smsResponse.ok) {
      console.error('Error sending SMS:', smsResult);
      throw new Error(`Failed to send SMS: ${smsResult.message || 'Unknown error'}`);
    }

    console.log('SMS sent successfully:', smsResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'SMS sent successfully',
        messageSid: smsResult.sid 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in send-notification-sms function:', error);
    
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
