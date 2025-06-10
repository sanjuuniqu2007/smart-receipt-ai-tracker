
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function TestNotificationButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleTestNotifications = async () => {
    setIsLoading(true);
    try {
      console.log('Triggering manual notification check...');
      const { data, error } = await supabase.functions.invoke('check-expiring-receipts', {
        body: { manual_trigger: true }
      });

      if (error) {
        throw error;
      }

      console.log('Notification check result:', data);
      toast({
        title: "Notification Check Complete",
        description: `Sent ${data.totalNotificationsSent} notifications. Check console for details.`
      });
    } catch (error: any) {
      console.error('Error testing notifications:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to test notifications"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleTestNotifications}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Bell className="mr-2 h-4 w-4" />
      )}
      Test Notifications
    </Button>
  );
}
