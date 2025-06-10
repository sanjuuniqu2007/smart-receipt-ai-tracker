
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting scheduled notification check...');

    // Get current date
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day

    console.log(`Today's date: ${today.toISOString()}`);

    // Get all user preferences
    const { data: userPreferences, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*');

    if (prefsError) {
      throw new Error(`Error fetching user preferences: ${prefsError.message}`);
    }

    console.log(`Found ${userPreferences?.length || 0} users with preferences`);

    let totalNotificationsSent = 0;
    let errors: string[] = [];

    // Process each user
    for (const userPref of userPreferences || []) {
      try {
        console.log(`Processing notifications for user: ${userPref.user_id}, notify_days_before: ${userPref.notify_days_before}`);

        // Calculate the notification date range
        const notificationDate = new Date(today);
        notificationDate.setDate(today.getDate() + userPref.notify_days_before);
        
        const notificationDateStr = notificationDate.toISOString().split('T')[0];

        console.log(`Looking for receipts due on: ${notificationDateStr} for user ${userPref.user_id}`);

        // Get user's receipts that are due on the notification date and haven't been paid
        const { data: receipts, error: receiptsError } = await supabase
          .from('receipts')
          .select('*')
          .eq('user_id', userPref.user_id)
          .eq('due_date', notificationDateStr)
          .neq('payment_status', 'paid');

        if (receiptsError) {
          console.error(`Error fetching receipts for user ${userPref.user_id}:`, receiptsError);
          errors.push(`User ${userPref.user_id}: ${receiptsError.message}`);
          continue;
        }

        if (!receipts || receipts.length === 0) {
          console.log(`No receipts due on ${notificationDateStr} found for user ${userPref.user_id}`);
          continue;
        }

        console.log(`Found ${receipts.length} receipts due on ${notificationDateStr} for user ${userPref.user_id}`);

        // Get user email
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userPref.user_id);
        
        if (userError || !user?.email) {
          console.error(`Error getting user email for ${userPref.user_id}:`, userError);
          errors.push(`User ${userPref.user_id}: Could not get user email`);
          continue;
        }

        console.log(`User email: ${user.email}`);

        // Process each receipt
        for (const receipt of receipts) {
          console.log(`Processing receipt ${receipt.id} (${receipt.vendor}) for user ${userPref.user_id}`);

          // Check if we've already sent a notification for this receipt today
          const todayStr = today.toISOString().split('T')[0];
          const { data: existingNotifications } = await supabase
            .from('notification_history')
            .select('id')
            .eq('receipt_id', receipt.id)
            .gte('sent_at', `${todayStr}T00:00:00Z`)
            .lt('sent_at', `${todayStr}T23:59:59Z`);

          if (existingNotifications && existingNotifications.length > 0) {
            console.log(`Notification already sent for receipt ${receipt.id} today`);
            continue;
          }

          // Send notifications based on user preferences
          for (const notifyMethod of userPref.notify_by) {
            try {
              if (notifyMethod === 'email') {
                console.log(`Sending email notification for receipt ${receipt.id} to ${user.email}`);
                
                const emailResponse = await supabase.functions.invoke('send-notification-email', {
                  body: {
                    to: user.email,
                    receiptId: receipt.id,
                    receiptData: {
                      vendor: receipt.vendor,
                      amount: receipt.amount,
                      due_date: receipt.due_date,
                      category: receipt.category,
                    },
                  },
                });

                if (emailResponse.error) {
                  throw new Error(`Email failed: ${emailResponse.error.message}`);
                }

                console.log(`Email notification sent successfully for receipt ${receipt.id}`);
                totalNotificationsSent++;

                // Log successful notification
                await supabase
                  .from('notification_history')
                  .insert({
                    user_id: userPref.user_id,
                    receipt_id: receipt.id,
                    notification_type: 'email',
                    status: 'sent',
                    content: { to: user.email, subject: 'Receipt Expiry Reminder' },
                  });
              }

              if (notifyMethod === 'sms' && userPref.phone_number) {
                console.log(`Sending SMS notification for receipt ${receipt.id} to ${userPref.phone_number}`);
                
                const smsResponse = await supabase.functions.invoke('send-notification-sms', {
                  body: {
                    to: userPref.phone_number,
                    receiptId: receipt.id,
                    receiptData: {
                      vendor: receipt.vendor,
                      amount: receipt.amount,
                      due_date: receipt.due_date,
                    },
                  },
                });

                if (smsResponse.error) {
                  throw new Error(`SMS failed: ${smsResponse.error.message}`);
                }

                console.log(`SMS notification sent successfully for receipt ${receipt.id}`);
                totalNotificationsSent++;

                // Log successful notification
                await supabase
                  .from('notification_history')
                  .insert({
                    user_id: userPref.user_id,
                    receipt_id: receipt.id,
                    notification_type: 'sms',
                    status: 'sent',
                    content: { to: userPref.phone_number, message: 'Receipt expiry reminder' },
                  });
              }
            } catch (notificationError: any) {
              console.error(`Error sending ${notifyMethod} notification for receipt ${receipt.id}:`, notificationError);
              errors.push(`Receipt ${receipt.id} (${notifyMethod}): ${notificationError.message}`);

              // Log failed notification
              await supabase
                .from('notification_history')
                .insert({
                  user_id: userPref.user_id,
                  receipt_id: receipt.id,
                  notification_type: notifyMethod,
                  status: 'failed',
                  content: { error: notificationError.message },
                });
            }
          }
        }
      } catch (userError: any) {
        console.error(`Error processing user ${userPref.user_id}:`, userError);
        errors.push(`User ${userPref.user_id}: ${userError.message}`);
      }
    }

    const result = {
      success: true,
      message: `Scheduled notification check completed`,
      totalNotificationsSent,
      totalUsers: userPreferences?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    };

    console.log('Scheduled notification check completed:', result);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in scheduled-notifications function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});
