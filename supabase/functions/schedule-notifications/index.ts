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

    console.log('=== SCHEDULE NOTIFICATIONS REQUEST ===');
    console.log('User ID:', user.id);
    console.log('Email:', email);
    console.log('Mobile:', mobileNumber);
    console.log('Schedule days:', scheduleDays);

    // Get current date for comparison (using UTC)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    console.log('Current time:', now.toISOString());
    console.log('Today (UTC start):', today.toISOString());

    // Find the next upcoming receipt with due date (including today)
    const { data: upcomingReceipts, error: receiptError } = await supabase
      .from('receipts')
      .select('*')
      .eq('user_id', user.id)
      .not('due_date', 'is', null)
      .gte('due_date', today.toISOString().split('T')[0])
      .order('due_date', { ascending: true })
      .limit(1);

    if (receiptError) {
      console.error('Receipt fetch error:', receiptError);
      throw new Error(`Error fetching receipts: ${receiptError.message}`);
    }

    console.log('Found receipts:', upcomingReceipts?.length || 0);
    if (upcomingReceipts && upcomingReceipts.length > 0) {
      console.log('Next receipt:', {
        id: upcomingReceipts[0].id,
        vendor: upcomingReceipts[0].vendor,
        due_date: upcomingReceipts[0].due_date,
        amount: upcomingReceipts[0].amount
      });
    }

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
    
    // Parse due date correctly - due_date is stored as YYYY-MM-DD
    const dueDateParts = receipt.due_date.split('-');
    const dueDate = new Date(
      parseInt(dueDateParts[0]), 
      parseInt(dueDateParts[1]) - 1, 
      parseInt(dueDateParts[2])
    );
    
    console.log('Parsed due date:', dueDate.toISOString());
    console.log('Due date components:', { 
      year: dueDate.getFullYear(), 
      month: dueDate.getMonth(), 
      day: dueDate.getDate() 
    });
    
    let scheduledCount = 0;

    // Schedule notifications for each selected day
    for (const days of scheduleDays) {
      console.log(`\n--- Processing ${days} days before due date ---`);

      // Calculate scheduled send date by subtracting days from due date
      const scheduledSendDate = new Date(dueDate);
      scheduledSendDate.setDate(scheduledSendDate.getDate() - days);

      // Compute "today" (UTC, midnight) and "now"
      const nowTime = now.getTime();
      const todayTime = today.getTime();
      const dueDateTime = dueDate.getTime();
      const scheduledTime = scheduledSendDate.getTime();

      const caseInfo = {
        now: now.toISOString(),
        today: today.toISOString(),
        dueDate: dueDate.toISOString(),
        scheduledSend: scheduledSendDate.toISOString(),
      };
      console.log("Dates comparison snapshot:", caseInfo);

      // If the scheduled date is in the future (today or later), use it
      let shouldSchedule = false;
      let finalScheduledDate = scheduledSendDate;
      let message = "";

      if (scheduledTime >= todayTime) {
        // Normal scheduling: schedule for calculated date in the future
        shouldSchedule = true;
        message = "Scheduling notification for selected date (in future as expected)";
      } else if (nowTime <= dueDateTime) {
        // If scheduled send date is before today and due date is still in future or today,
        // schedule the notification to go out immediately ("catch-up" mode)
        shouldSchedule = true;
        finalScheduledDate = now;
        message = "Scheduled send date is past, but due date is still active - sending immediately";
      } else {
        // Scheduled date in past, due date already passed—skip
        shouldSchedule = false;
        message = `❌ Skipping schedule for ${days} days before: scheduled date is past and due date also passed`;
      }

      if (!shouldSchedule) {
        console.log(message);
        continue;
      }

      console.log(`✅ ${message}. Scheduling for: ${finalScheduledDate.toISOString()}`);

      // Create content for notifications
      const content = {
        receiptId: receipt.id,
        vendor: receipt.vendor,
        amount: receipt.amount,
        category: receipt.category,
        dueDate: receipt.due_date,
        daysBefore: days
      };

      try {
        // Schedule email notification
        console.log('Inserting email notification...');
        const { data: emailInsert, error: emailError } = await supabase
          .from('scheduled_notifications')
          .insert({
            user_id: user.id,
            receipt_id: receipt.id,
            notification_type: 'email',
            recipient: email,
            due_date: dueDate.toISOString(),
            schedule_days_before: days,
            scheduled_send_date: finalScheduledDate.toISOString(),
            content: content,
            status: 'scheduled'
          })
          .select();

        if (emailError) {
          console.error('❌ Error scheduling email:', emailError);
          throw emailError;
        } else {
          console.log('✅ Successfully scheduled email, ID:', emailInsert?.[0]?.id);
          scheduledCount++;
        }

        // Schedule SMS notification
        console.log('Inserting SMS notification...');
        const { data: smsInsert, error: smsError } = await supabase
          .from('scheduled_notifications')
          .insert({
            user_id: user.id,
            receipt_id: receipt.id,
            notification_type: 'sms',
            recipient: mobileNumber,
            due_date: dueDate.toISOString(),
            schedule_days_before: days,
            scheduled_send_date: finalScheduledDate.toISOString(),
            content: content,
            status: 'scheduled'
          })
          .select();

        if (smsError) {
          console.error('❌ Error scheduling SMS:', smsError);
          throw smsError;
        } else {
          console.log('✅ Successfully scheduled SMS, ID:', smsInsert?.[0]?.id);
          scheduledCount++;
        }

      } catch (insertError) {
        console.error(`❌ Error inserting notifications for ${days} days:`, insertError);
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
    console.error('❌ Error in schedule-notifications function:', error);
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
