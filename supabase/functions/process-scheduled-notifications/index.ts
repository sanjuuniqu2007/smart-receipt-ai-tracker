
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Get current time
    const now = new Date();
    console.log("Processing scheduled notifications at:", now.toISOString());

    // Find notifications that should be sent now (within the last 5 minutes to account for cron timing)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    const { data: scheduledNotifications, error: fetchError } = await supabaseClient
      .from("scheduled_notifications")
      .select("*")
      .eq("status", "scheduled")
      .gte("scheduled_send_date", fiveMinutesAgo.toISOString())
      .lte("scheduled_send_date", now.toISOString());

    if (fetchError) {
      console.error("Error fetching scheduled notifications:", fetchError);
      throw new Error(`Failed to fetch scheduled notifications: ${fetchError.message}`);
    }

    if (!scheduledNotifications || scheduledNotifications.length === 0) {
      console.log("No notifications to process at this time");
      return new Response(
        JSON.stringify({ message: "No notifications to process", processedCount: 0 }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Found ${scheduledNotifications.length} notifications to process`);

    let processedCount = 0;
    let errorCount = 0;

    // Process each notification
    for (const notification of scheduledNotifications) {
      try {
        if (notification.notification_type === "email") {
          // Send email using Resend
          const emailContent = notification.content as any;
          
          const emailResponse = await resend.emails.send({
            from: "Receipt Tracker <notifications@resend.dev>",
            to: [notification.recipient],
            subject: emailContent.subject || "Receipt Due Date Reminder",
            html: `
              <h2>Receipt Due Date Reminder</h2>
              <p>${emailContent.message || `Your receipt is due on ${new Date(notification.due_date).toLocaleDateString()}.`}</p>
              <p><strong>Due Date:</strong> ${new Date(notification.due_date).toLocaleDateString()}</p>
              <p><strong>Days Before:</strong> ${notification.schedule_days_before}</p>
              <hr>
              <p><small>This is an automated reminder from Receipt Tracker.</small></p>
            `,
          });

          console.log("Email sent successfully:", emailResponse);

        } else if (notification.notification_type === "sms") {
          // Send SMS using Twilio
          const smsContent = notification.content as any;
          
          const twilioResponse = await fetch("https://api.twilio.com/2010-04-01/Accounts/" + Deno.env.get("TWILIO_ACCOUNT_SID") + "/Messages.json", {
            method: "POST",
            headers: {
              "Authorization": "Basic " + btoa(Deno.env.get("TWILIO_ACCOUNT_SID") + ":" + Deno.env.get("TWILIO_AUTH_TOKEN")),
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              From: Deno.env.get("TWILIO_PHONE_NUMBER") || "",
              To: notification.recipient,
              Body: smsContent.message || `Receipt reminder: Due on ${new Date(notification.due_date).toLocaleDateString()}`,
            }),
          });

          if (!twilioResponse.ok) {
            const errorText = await twilioResponse.text();
            throw new Error(`Twilio API error: ${errorText}`);
          }

          const twilioResult = await twilioResponse.json();
          console.log("SMS sent successfully:", twilioResult);
        }

        // Update notification status to 'sent'
        const { error: updateError } = await supabaseClient
          .from("scheduled_notifications")
          .update({
            status: "sent",
            sent_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq("id", notification.id);

        if (updateError) {
          console.error("Error updating notification status:", updateError);
        } else {
          processedCount++;
        }

      } catch (error: any) {
        console.error(`Error processing notification ${notification.id}:`, error);
        errorCount++;

        // Update notification status to 'failed' with error message
        await supabaseClient
          .from("scheduled_notifications")
          .update({
            status: "failed",
            error_message: error.message,
            updated_at: now.toISOString(),
          })
          .eq("id", notification.id);
      }
    }

    console.log(`Processing complete. Processed: ${processedCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        message: "Notification processing complete",
        processedCount,
        errorCount,
        totalFound: scheduledNotifications.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in process-scheduled-notifications function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
