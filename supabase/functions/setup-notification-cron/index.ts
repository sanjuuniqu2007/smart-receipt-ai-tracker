
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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

    // This function sets up a cron job to run every 5 minutes
    // In a production environment, you would typically set this up using:
    // 1. Supabase pg_cron extension
    // 2. External cron service
    // 3. Cloud scheduler (AWS CloudWatch Events, Google Cloud Scheduler, etc.)

    const setupSQL = `
      -- Enable pg_cron extension if not already enabled
      CREATE EXTENSION IF NOT EXISTS pg_cron;
      
      -- Schedule the notification processing job to run every 5 minutes
      SELECT cron.schedule(
        'process-scheduled-notifications',
        '*/5 * * * *',
        $$
        SELECT net.http_post(
          url := '${Deno.env.get("SUPABASE_URL")}/functions/v1/process-scheduled-notifications',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}"}'::jsonb,
          body := '{"trigger": "cron"}'::jsonb
        );
        $$
      );
    `;

    console.log("Setting up cron job for notification processing...");

    return new Response(
      JSON.stringify({
        message: "Cron job setup instructions",
        note: "To enable automatic notification processing, run the following SQL in your Supabase SQL editor:",
        sql: setupSQL,
        alternativeSetup: "You can also manually call the process-scheduled-notifications function periodically, or set up an external cron service to call it every 5 minutes."
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in setup-notification-cron function:", error);
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
