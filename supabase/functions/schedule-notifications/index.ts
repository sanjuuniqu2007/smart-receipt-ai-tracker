
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduleRequest {
  email: string;
  mobileNumber: string;
  scheduleDays: number[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const { email, mobileNumber, scheduleDays }: ScheduleRequest = await req.json();

    console.log('Scheduling notifications for user:', user.id);
    console.log('Schedule days:', scheduleDays);
    console.log('Email:', email);
    console.log('Mobile:', mobileNumber);

    // Get current date in UTC for comparison
    const now = new Date();
    const todayUTC = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    console.log('Today UTC:', todayUTC.toISOString());

    // Find the next upcoming receipt with due date
    const { data: upcomingReceipts, error: receiptError } = await supabase
      .from('receipts')
      .select('*')
      .eq('user_id', user.id)
      .not('due_date', 'is', null)
      .gte('due_date', todayUTC.toISOString().split('T')[0])
      .order('due_date', { ascending: true })
      .limit(1);

    if (receiptError) {
      console.error('Receipt fetch error:', receiptError);
      throw new Error(`Error fetching receipts: ${receiptError.message}`);
    }

    console.log('Found receipts:', upcomingReceipts?.length || 0);

    if (!upcomingReceipts || upcomingReceipts.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No upcoming receipts with due dates found',
          scheduledCount: 0 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const receipt = upcomingReceipts[0];
    console.log('Processing receipt:', {
      id: receipt.id,
      vendor: receipt.vendor,
      due_date: receipt.due_date,
      amount: receipt.amount
    });
    
    // Parse due date as UTC date
    const dueDate = new Date(receipt.due_date + 'T00:00:00.000Z');
    console.log('Due date parsed:', dueDate.toISOString());
    
    let scheduledCount = 0;

    // Schedule notifications for each selected day
    for (const days of scheduleDays) {
      console.log(`\n--- Processing ${days} days before due date ---`);
      
      // Calculate scheduled send date by subtracting days from due date
      const scheduledSendDate = new Date(dueDate);
      scheduledSendDate.setUTCDate(scheduledSendDate.getUTCDate() - days);
      
      console.log('Scheduled send date:', scheduledSendDate.toISOString());
      console.log('Today:', todayUTC.toISOString());
      console.log('Is scheduled date >= today?', scheduledSendDate >= todayUTC);

      // Only schedule if the scheduled date is today or in the future
      if (scheduledSendDate < todayUTC) {
        console.log(`Skipping schedule for ${days} days before - date is in the past`);
        continue;
      }

      // Create content for notifications
      const content = {
        receiptId: receipt.id,
        vendor: receipt.vendor,
        amount: receipt.amount,
        category: receipt.category,
        dueDate: receipt.due_date,
        daysBefore: days
      };

      console.log('Scheduling notifications with content:', content);

      try {
        // Schedule email notification
        const { data: emailInsert, error: emailError } = await supabase
          .from('scheduled_notifications')
          .insert({
            user_id: user.id,
            receipt_id: receipt.id,
            notification_type: 'email',
            recipient: email,
            due_date: receipt.due_date,
            schedule_days_before: days,
            scheduled_send_date: scheduledSendDate.toISOString(),
            content: content,
            status: 'scheduled'
          })
          .select();

        if (emailError) {
          console.error('Error scheduling email:', emailError);
          throw emailError;
        } else {
          console.log(`Successfully scheduled email for ${days} days before, ID:`, emailInsert?.[0]?.id);
          scheduledCount++;
        }

        // Schedule SMS notification
        const { data: smsInsert, error: smsError } = await supabase
          .from('scheduled_notifications')
          .insert({
            user_id: user.id,
            receipt_id: receipt.id,
            notification_type: 'sms',
            recipient: mobileNumber,
            due_date: receipt.due_date,
            schedule_days_before: days,
            scheduled_send_date: scheduledSendDate.toISOString(),
            content: content,
            status: 'scheduled'
          })
          .select();

        if (smsError) {
          console.error('Error scheduling SMS:', smsError);
          throw smsError;
        } else {
          console.log(`Successfully scheduled SMS for ${days} days before, ID:`, smsInsert?.[0]?.id);
          scheduledCount++;
        }
      } catch (insertError) {
        console.error(`Error inserting notifications for ${days} days:`, insertError);
        // Continue with other days even if one fails
      }
    }

    console.log(`\n=== FINAL RESULT ===`);
    console.log(`Successfully scheduled ${scheduledCount} notifications total`);
    console.log(`Receipt: ${receipt.vendor} - $${receipt.amount} due ${receipt.due_date}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        scheduledCount,
        receiptDetails: {
          id: receipt.id,
          vendor: receipt.vendor,
          amount: receipt.amount,
          dueDate: receipt.due_date
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in schedule-notifications function:', error);
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
