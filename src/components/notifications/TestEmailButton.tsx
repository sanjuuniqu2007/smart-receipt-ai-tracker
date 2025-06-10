
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function TestEmailButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleTestEmail = async () => {
    setIsLoading(true);
    try {
      console.log('Sending test email notification...');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        throw new Error("You must be logged in to test email notifications");
      }

      const testReceiptData = {
        vendor: "Test Vendor",
        amount: 99.99,
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        category: "Test Category",
      };

      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          to: user.email,
          receiptId: "test-receipt-id",
          receiptData: testReceiptData
        }
      });

      if (error) {
        console.error('Test email error:', error);
        throw error;
      }

      console.log('Test email result:', data);

      toast({
        title: "Test Email Sent",
        description: `Test notification email sent to ${user.email}`,
      });

    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send test email",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleTestEmail}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Mail className="mr-2 h-4 w-4" />
      )}
      Test Email
    </Button>
  );
}
