
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function TestScheduledNotifications() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleTestScheduledNotifications = async () => {
    setIsLoading(true);
    try {
      console.log('Triggering scheduled notifications check...');
      
      const { data, error } = await supabase.functions.invoke('scheduled-notifications', {
        body: { manual_trigger: true }
      });

      if (error) {
        throw error;
      }

      console.log('Scheduled notifications result:', data);

      toast({
        title: "Scheduled Notifications Check Complete",
        description: `Sent ${data.totalNotificationsSent} notifications to ${data.totalUsers} users. Check console for details.`,
      });

    } catch (error: any) {
      console.error('Error testing scheduled notifications:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to test scheduled notifications",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleTestScheduledNotifications}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Calendar className="mr-2 h-4 w-4" />
      )}
      Test Scheduled Notifications
    </Button>
  );
}
