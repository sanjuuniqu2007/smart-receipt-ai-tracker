
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Bell, Mail, Phone, AlertCircle, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface NotificationFormValues {
  phone_number: string;
  notify_days_before: number;
  notify_by_email: boolean;
  notify_by_sms: boolean;
  custom_days?: number;
}

export function NotificationSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showCustomDays, setShowCustomDays] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<NotificationFormValues>({
    defaultValues: {
      phone_number: "",
      notify_days_before: 7,
      notify_by_email: true,
      notify_by_sms: false,
      custom_days: undefined,
    },
  });

  // Fetch user preferences when the dialog opens
  useEffect(() => {
    if (open) {
      const fetchUserPreferences = async () => {
        setIsLoading(true);
        
        try {
          const { data: session } = await supabase.auth.getSession();
          
          if (session?.session?.user) {
            const { data: preferences, error } = await supabase
              .from('user_preferences')
              .select('*')
              .single();
              
            if (error && error.code !== 'PGRST116') {
              throw error;
            }
            
            if (preferences) {
              const customDays = ![1, 3, 7, 14, 30].includes(preferences.notify_days_before);
              setShowCustomDays(customDays);
              
              form.reset({
                phone_number: preferences.phone_number || "",
                notify_days_before: customDays ? 0 : preferences.notify_days_before || 7,
                custom_days: customDays ? preferences.notify_days_before : undefined,
                notify_by_email: preferences.notify_by.includes('email'),
                notify_by_sms: preferences.notify_by.includes('sms'),
              });
            }
          }
        } catch (error) {
          console.error('Error fetching user preferences:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load your notification preferences."
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchUserPreferences();
    }
  }, [open, form, toast]);

  const onSubmit = async (values: NotificationFormValues) => {
    setIsLoading(true);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.user) {
        throw new Error("You must be logged in to save preferences");
      }
      
      const notify_by = [];
      if (values.notify_by_email) notify_by.push('email');
      if (values.notify_by_sms) notify_by.push('sms');
      
      // Determine the final notify_days_before value
      let finalNotifyDays = values.notify_days_before;
      if (values.notify_days_before === 0 && values.custom_days) {
        finalNotifyDays = values.custom_days;
      }
      
      const preferencesData = {
        user_id: session.session.user.id,
        phone_number: values.phone_number,
        notify_days_before: finalNotifyDays,
        notify_by: notify_by,
      };
      
      // Use upsert to handle both insert and update cases
      const { error } = await supabase
        .from('user_preferences')
        .upsert(preferencesData);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Your notification preferences have been saved.",
      });
      
      setOpen(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save notification preferences. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDaysChange = (value: string) => {
    const days = parseInt(value);
    if (days === 0) {
      setShowCustomDays(true);
      form.setValue('notify_days_before', 0);
    } else {
      setShowCustomDays(false);
      form.setValue('notify_days_before', days);
      form.setValue('custom_days', undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Notification Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </DialogTitle>
          <DialogDescription>
            Configure how and when you want to receive notifications for upcoming receipt expiry dates.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="notify_days_before"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notify me before expiry</FormLabel>
                  <Select 
                    value={showCustomDays ? "0" : field.value.toString()} 
                    onValueChange={handleDaysChange}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timing" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 day before</SelectItem>
                      <SelectItem value="3">3 days before</SelectItem>
                      <SelectItem value="7">1 week before</SelectItem>
                      <SelectItem value="14">2 weeks before</SelectItem>
                      <SelectItem value="30">1 month before</SelectItem>
                      <SelectItem value="0">Custom (specify days)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    You'll receive notifications this many days before a receipt expiry date.
                  </FormDescription>
                </FormItem>
              )}
            />
            
            {showCustomDays && (
              <FormField
                control={form.control}
                name="custom_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom notification days</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="1"
                        max="365"
                        placeholder="Enter number of days" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter a custom number of days (1-365) before expiry to receive notifications.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <div className="space-y-4">
              <FormLabel>Notification methods</FormLabel>
              
              <FormField
                control={form.control}
                name="notify_by_email"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="flex items-center gap-2 cursor-pointer">
                        <Mail className="h-4 w-4" />
                        📩 Email notifications
                      </FormLabel>
                      <FormDescription>
                        Receive detailed email reminders with receipt information
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notify_by_sms"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="flex items-center gap-2 cursor-pointer">
                        <Phone className="h-4 w-4" />
                        📱 SMS notifications
                      </FormLabel>
                      <FormDescription>
                        Receive quick SMS reminders on your mobile phone
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              {form.watch("notify_by_sms") && (
                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone number for SMS</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+1 (555) 123-4567" 
                          {...field} 
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        Your phone number for receiving SMS notifications (include country code)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save preferences"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
