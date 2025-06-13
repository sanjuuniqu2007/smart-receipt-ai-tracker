
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScheduleOption {
  id: string;
  label: string;
  days: number;
  isCustom?: boolean;
}

const defaultScheduleOptions: ScheduleOption[] = [
  { id: "1day", label: "1 day before", days: 1 },
  { id: "3days", label: "3 days before", days: 3 },
  { id: "1week", label: "1 week before", days: 7 },
  { id: "1month", label: "1 month before", days: 30 },
];

export function ScheduleNotifications() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [customDays, setCustomDays] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [receiptId, setReceiptId] = useState("");
  const { toast } = useToast();

  const handleOptionChange = (optionId: string, checked: boolean) => {
    if (checked) {
      setSelectedOptions(prev => [...prev, optionId]);
    } else {
      setSelectedOptions(prev => prev.filter(id => id !== optionId));
    }
  };

  const handleSchedule = async () => {
    if (!email && !phoneNumber) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide at least an email or phone number."
      });
      return;
    }

    if (!dueDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a due date."
      });
      return;
    }

    if (selectedOptions.length === 0 && !useCustom) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one notification schedule."
      });
      return;
    }

    if (useCustom && (!customDays || parseInt(customDays) <= 0)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid number of days for custom schedule."
      });
      return;
    }

    setLoading(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error("You must be logged in to schedule notifications");
      }

      // Prepare schedule data
      const schedules = [];
      
      // Add predefined schedules
      for (const optionId of selectedOptions) {
        const option = defaultScheduleOptions.find(o => o.id === optionId);
        if (option) {
          schedules.push({ days: option.days });
        }
      }

      // Add custom schedule if specified
      if (useCustom && customDays) {
        schedules.push({ days: parseInt(customDays) });
      }

      const payload = {
        email: email || null,
        phoneNumber: phoneNumber || null,
        dueDate,
        schedules,
        receiptId: receiptId || null,
      };

      console.log("Scheduling notifications with payload:", payload);

      // Call the edge function to schedule notifications
      const { data, error } = await supabase.functions.invoke('schedule-notifications', {
        body: payload,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Scheduled ${data.scheduledCount} notification(s) successfully.`
      });

      // Reset form
      setEmail("");
      setPhoneNumber("");
      setDueDate("");
      setSelectedOptions([]);
      setCustomDays("");
      setUseCustom(false);
      setReceiptId("");
      setOpen(false);

    } catch (error: any) {
      console.error("Error scheduling notifications:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to schedule notifications."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-2">
          <Clock className="h-4 w-4" />
          Schedule Notifications
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Notifications
          </DialogTitle>
          <DialogDescription>
            Schedule email and SMS notifications to be sent before a due date. 
            Select multiple intervals to receive reminders at different times.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Contact Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Optional Receipt ID */}
          <div className="space-y-2">
            <Label htmlFor="receiptId">Receipt ID (Optional)</Label>
            <Input
              id="receiptId"
              placeholder="Receipt ID to link notifications to"
              value={receiptId}
              onChange={(e) => setReceiptId(e.target.value)}
            />
          </div>

          {/* Schedule Options */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Notification Schedule</h4>
            <div className="space-y-3">
              {defaultScheduleOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.id}
                    checked={selectedOptions.includes(option.id)}
                    onCheckedChange={(checked) => handleOptionChange(option.id, checked as boolean)}
                  />
                  <Label htmlFor={option.id} className="text-sm font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
              
              {/* Custom Schedule */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="custom"
                  checked={useCustom}
                  onCheckedChange={(checked) => setUseCustom(checked as boolean)}
                />
                <Label htmlFor="custom" className="text-sm font-normal">
                  Custom:
                </Label>
                {useCustom && (
                  <div className="flex items-center space-x-1">
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      placeholder="7"
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">days before</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={loading}>
            {loading ? "Scheduling..." : "Schedule Notifications"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
