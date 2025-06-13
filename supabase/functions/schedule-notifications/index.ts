
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ScheduleRequest {
  email?: string;
  phoneNumber?: string;
  dueDate: string;
  schedules: Array<{ days: number }>;
  receiptId?: string;
}

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

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Get user from JWT
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);
    
    if (userError || !user) {
      throw new Error("Invalid user token");
    }

    const {
      email,
      phoneNumber,
      dueDate,
      schedules,
      receiptId,
    }: ScheduleRequest = await req.json();

    console.log("Received schedule request:", {
      email,
      phoneNumber,
      dueDate,
      schedules,
      receiptId,
      userId: user.id,
    });

    if (!email && !phoneNumber) {
      throw new Error("At least one contact method (email or phone) is required");
    }

    if (!dueDate || !schedules || schedules.length === 0) {
      throw new Error("Due date and at least one schedule are required");
    }

    const dueDateObj = new Date(dueDate);
    if (isNaN(dueDateObj.getTime())) {
      throw new Error("Invalid due date format");
    }

    const scheduledNotifications = [];

    // Create scheduled notifications for each schedule and contact method
    for (const schedule of schedules) {
      const scheduledSendDate = new Date(dueDateObj);
      scheduledSendDate.setDate(scheduledSendDate.getDate() - schedule.days);

      // Schedule email notification if email is provided
      if (email) {
        const emailNotification = {
          user_id: user.id,
          receipt_id: receiptId || null,
          notification_type: "email",
          recipient: email,
          due_date: dueDateObj.toISOString(),
          schedule_days_before: schedule.days,
          scheduled_send_date: scheduledSendDate.toISOString(),
          content: {
            subject: "Receipt Due Date Reminder",
            message: `This is a reminder that your receipt is due on ${dueDateObj.toLocaleDateString()}.`,
            dueDate: dueDateObj.toISOString(),
            daysBefore: schedule.days,
          },
        };

        scheduledNotifications.push(emailNotification);
      }

      // Schedule SMS notification if phone number is provided
      if (phoneNumber) {
        const smsNotification = {
          user_id: user.id,
          receipt_id: receiptId || null,
          notification_type: "sms",
          recipient: phoneNumber,
          due_date: dueDateObj.toISOString(),
          schedule_days_before: schedule.days,
          scheduled_send_date: scheduledSendDate.toISOString(),
          content: {
            message: `Receipt reminder: Due on ${dueDateObj.toLocaleDateString()}. ${schedule.days} day${schedule.days > 1 ? 's' : ''} to go!`,
            dueDate: dueDateObj.toISOString(),
            daysBefore: schedule.days,
          },
        };

        scheduledNotifications.push(smsNotification);
      }
    }

    // Insert all scheduled notifications into the database
    const { data: insertedNotifications, error: insertError } = await supabaseClient
      .from("scheduled_notifications")
      .insert(scheduledNotifications)
      .select();

    if (insertError) {
      console.error("Error inserting scheduled notifications:", insertError);
      throw new Error(`Failed to schedule notifications: ${insertError.message}`);
    }

    console.log(`Successfully scheduled ${insertedNotifications?.length || 0} notifications`);

    return new Response(
      JSON.stringify({
        success: true,
        scheduledCount: insertedNotifications?.length || 0,
        notifications: insertedNotifications,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in schedule-notifications function:", error);
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
