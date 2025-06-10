
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    console.log('Starting SMS notification function...');
    
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    console.log('Twilio environment check:', {
      hasAccountSid: !!twilioAccountSid,
      hasAuthToken: !!twilioAuthToken,
      hasPhoneNumber: !!twilioPhoneNumber
    });

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error('Twilio environment variables missing');
      throw new Error('Twilio configuration is incomplete');
    }

    const requestBody = await req.json();
    console.log('SMS request body received:', requestBody);

    const { to, receiptId, receiptData }: SMSRequest = requestBody;

    if (!to || !receiptData) {
      throw new Error('Missing required SMS parameters');
    }

    console.log('Sending SMS notification to:', to, 'for receipt:', receiptId);

    // Format the due date and create message
    const dueDate = new Date(receiptData.due_date).toLocaleDateString();
    const amount = receiptData.amount.toFixed(2);
    
    const message = `🧾 Receipt Reminder: Your ${receiptData.vendor} receipt ($${amount}) is due on ${dueDate}. Please take action if needed.`;

    console.log('Preparing to send SMS via Twilio...');

    // Send SMS using Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append('From', twilioPhoneNumber);
    formData.append('To', to);
    formData.append('Body', message);

    const smsResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const smsResult = await smsResponse.json();
    console.log('Twilio API response status:', smsResponse.status);
    console.log('Twilio API response:', smsResult);

    if (!smsResponse.ok) {
      console.error('Error sending SMS via Twilio:', smsResult);
      throw new Error(`Failed to send SMS: ${smsResult.message || smsResponse.statusText}`);
    }

    console.log('SMS sent successfully via Twilio:', smsResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'SMS sent successfully',
        smsId: smsResult.sid 
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
