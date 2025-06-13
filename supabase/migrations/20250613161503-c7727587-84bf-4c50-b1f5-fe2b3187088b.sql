
-- Create a table to store scheduled notifications
CREATE TABLE public.scheduled_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  receipt_id UUID REFERENCES public.receipts(id),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'sms')),
  recipient TEXT NOT NULL, -- email address or phone number
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  schedule_days_before INTEGER NOT NULL,
  scheduled_send_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed', 'cancelled')),
  content JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Add Row Level Security
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own scheduled notifications" 
  ON public.scheduled_notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled notifications" 
  ON public.scheduled_notifications 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled notifications" 
  ON public.scheduled_notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled notifications" 
  ON public.scheduled_notifications 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for efficient querying of scheduled notifications
CREATE INDEX idx_scheduled_notifications_send_date ON public.scheduled_notifications(scheduled_send_date) WHERE status = 'scheduled';
CREATE INDEX idx_scheduled_notifications_user_receipt ON public.scheduled_notifications(user_id, receipt_id);
