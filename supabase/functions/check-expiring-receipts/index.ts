
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

    console.log('Starting daily receipt expiry check...');

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all user preferences
    const { data: userPreferences, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*');

    if (prefsError) {
      throw new Error(`Error fetching user preferences: ${prefsError.message}`);
    }

    let totalNotificationsSent = 0;
    let errors: string[] = [];

    // Process each user
    for (const userPref of userPreferences || []) {
      try {
        console.log(`Processing notifications for user: ${userPref.user_id}`);

        // Calculate the date range for notifications
        // If user wants 1 day before notification, we check receipts expiring tomorrow
        const notificationStartDate = new Date(today);
        notificationStartDate.setDate(today.getDate() + userPref.notify_days_before);
        
        const notificationEndDate = new Date(notificationStartDate);
        notificationEndDate.setDate(notificationStartDate.getDate() + 1);

        console.log(`Checking receipts expiring between ${notificationStartDate.toISOString().split('T')[0]} and ${notificationEndDate.toISOString().split('T')[0]} for user ${userPref.user_id}`);

        // Get user's receipts that are expiring within the notification window
        const { data: receipts, error: receiptsError } = await supabase
          .from('receipts')
          .select('*')
          .eq('user_id', userPref.user_id)
          .gte('due_date', notificationStartDate.toISOString().split('T')[0])
          .lt('due_date', notificationEndDate.toISOString().split('T')[0])
          .neq('payment_status', 'paid'); // Only notify for unpaid receipts

        if (receiptsError) {
          console.error(`Error fetching receipts for user ${userPref.user_id}:`, receiptsError);
          errors.push(`User ${userPref.user_id}: ${receiptsError.message}`);
          continue;
        }

        if (!receipts || receipts.length === 0) {
          console.log(`No expiring receipts found for user ${userPref.user_id}`);
          continue;
        }

        console.log(`Found ${receipts.length} expiring receipts for user ${userPref.user_id}`);

        // Get user email
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userPref.user_id);
        
        if (userError || !user?.email) {
          console.error(`Error getting user email for ${userPref.user_id}:`, userError);
          errors.push(`User ${userPref.user_id}: Could not get user email`);
          continue;
        }

        // Process each expiring receipt
        for (const receipt of receipts) {
          console.log(`Processing receipt ${receipt.id} for user ${userPref.user_id}`);

          // Check if we've already sent a notification for this receipt today
          const { data: existingNotifications } = await supabase
            .from('notification_history')
            .select('id')
            .eq('receipt_id', receipt.id)
            .gte('sent_at', today.toISOString())
            .lt('sent_at', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());

          if (existingNotifications && existingNotifications.length > 0) {
            console.log(`Notification already sent for receipt ${receipt.id} today`);
            continue;
          }

          // Send notifications based on user preferences
          for (const notifyMethod of userPref.notify_by) {
            try {
              if (notifyMethod === 'email') {
                console.log(`Sending email notification for receipt ${receipt.id}`);
                
                // Send email notification
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

                console.log(`Email notification sent for receipt ${receipt.id}`);
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
                console.log(`Sending SMS notification for receipt ${receipt.id}`);
                
                // Send SMS notification
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

                console.log(`SMS notification sent for receipt ${receipt.id}`);
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
      message: `Daily notification check completed`,
      totalNotificationsSent,
      totalUsers: userPreferences?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    };

    console.log('Daily notification check completed:', result);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in check-expiring-receipts function:', error);
    
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
