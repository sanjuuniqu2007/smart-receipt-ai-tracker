
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function TestSMSButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleTestSMS = async () => {
    if (!phoneNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a phone number"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Sending test SMS notification...');
      
      const testReceiptData = {
        vendor: "Test Vendor",
        amount: 99.99,
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        category: "Test Category",
      };

      const { data, error } = await supabase.functions.invoke('send-notification-sms', {
        body: {
          to: phoneNumber,
          receiptId: "test-receipt-id",
          receiptData: testReceiptData
        }
      });

      if (error) {
        console.error('Test SMS error:', error);
        throw error;
      }

      console.log('Test SMS result:', data);

      toast({
        title: "Test SMS Sent",
        description: `Test notification SMS sent to ${phoneNumber}`,
      });

      setDialogOpen(false);
      setPhoneNumber("");

    } catch (error: any) {
      console.error('Error sending test SMS:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send test SMS",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageSquare className="mr-2 h-4 w-4" />
          Test SMS
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Test SMS Notification</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Include country code (e.g., +1 for US)
            </p>
          </div>
          <Button 
            onClick={handleTestSMS} 
            disabled={isLoading || !phoneNumber.trim()}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="mr-2 h-4 w-4" />
            )}
            Send Test SMS
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
