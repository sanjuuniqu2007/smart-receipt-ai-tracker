import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PREDEFINED_SCHEDULES = [
  { label: "1 day before", value: 1 },
  { label: "3 days before", value: 3 },
  { label: "7 days before", value: 7 },
  { label: "1 month before", value: 30 },
];

export function ScheduleNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [selectedSchedules, setSelectedSchedules] = useState<number[]>([]);
  const [customDays, setCustomDays] = useState("");
  const { toast } = useToast();

  const handleScheduleChange = (days: number, checked: boolean) => {
    if (checked) {
      setSelectedSchedules(prev => [...prev, days]);
    } else {
      setSelectedSchedules(prev => prev.filter(d => d !== days));
    }
  };

  const handleScheduleNotifications = async () => {
    if (!mobileNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a mobile number"
      });
      return;
    }

    const allSchedules = [...selectedSchedules];
    if (customDays && parseInt(customDays) > 0) {
      allSchedules.push(parseInt(customDays));
    }

    if (allSchedules.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one schedule option"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase.functions.invoke('schedule-notifications', {
        body: {
          email: user.email,
          mobileNumber: mobileNumber,
          scheduleDays: allSchedules
        }
      });

      if (error) throw error;

      toast({
        title: "Notifications Scheduled",
        description: `Successfully scheduled ${data.scheduledCount} notifications for the next upcoming receipt`
      });

      // Reset form
      setMobileNumber("");
      setSelectedSchedules([]);
      setCustomDays("");
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error scheduling notifications:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to schedule notifications"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerNotifications = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('trigger-notifications', {
        body: {}
      });

      if (error) throw error;

      toast({
        title: "Notifications Triggered",
        description: `Processed ${data.result?.processedCount || 0} notifications successfully`
      });
    } catch (error: any) {
      console.error('Error triggering notifications:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to trigger notifications"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="default">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Notifications
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Notifications</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="+1234567890"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
              />
            </div>

            <div>
              <Label>Schedule Days Before Due Date</Label>
              <div className="space-y-3 mt-2">
                {PREDEFINED_SCHEDULES.map((schedule) => (
                  <div key={schedule.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`schedule-${schedule.value}`}
                      checked={selectedSchedules.includes(schedule.value)}
                      onCheckedChange={(checked) => 
                        handleScheduleChange(schedule.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={`schedule-${schedule.value}`}>
                      {schedule.label}
                    </Label>
                  </div>
                ))}
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="custom-schedule"
                    checked={customDays !== "" && parseInt(customDays) > 0}
                    onCheckedChange={(checked) => {
                      if (!checked) setCustomDays("");
                    }}
                  />
                  <Label htmlFor="custom-schedule">Custom:</Label>
                  <Input
                    type="number"
                    placeholder="Days"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    className="w-20"
                    min="1"
                  />
                  <span className="text-sm text-muted-foreground">days before</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleScheduleNotifications} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="mr-2 h-4 w-4" />
              )}
              Schedule Notifications
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Button 
        variant="outline" 
        onClick={handleTriggerNotifications}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        Send Pending Notifications
      </Button>
    </div>
  );
}
