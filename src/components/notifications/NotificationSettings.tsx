
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
import { Bell, Mail, Phone, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface NotificationFormValues {
  phone_number: string;
  notify_days_before: number;
  notify_by_email: boolean;
  notify_by_sms: boolean;
}

export function NotificationSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<NotificationFormValues>({
    defaultValues: {
      phone_number: "",
      notify_days_before: 7,
      notify_by_email: true,
      notify_by_sms: false,
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
              form.reset({
                phone_number: preferences.phone_number || "",
                notify_days_before: preferences.notify_days_before || 7,
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
      
      const preferencesData = {
        user_id: session.session.user.id,
        phone_number: values.phone_number,
        notify_days_before: values.notify_days_before,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" id="notification-settings-button">
          <Bell className="mr-2 h-4 w-4" />
          Notification Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Notification Preferences</DialogTitle>
          <DialogDescription>
            Configure how and when you want to receive notifications for upcoming due dates.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="notify_days_before"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notify me before due dates</FormLabel>
                  <Select 
                    value={field.value.toString()} 
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select days" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 day before</SelectItem>
                      <SelectItem value="3">3 days before</SelectItem>
                      <SelectItem value="7">1 week before</SelectItem>
                      <SelectItem value="14">2 weeks before</SelectItem>
                      <SelectItem value="30">1 month before</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    You'll receive notifications this many days before a receipt due date.
                  </FormDescription>
                </FormItem>
              )}
            />
            
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
                      <FormLabel className="flex items-center">
                        <Mail className="mr-2 h-4 w-4" />
                        Email notifications
                      </FormLabel>
                      <FormDescription>
                        Receive notifications via email
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
                      <FormLabel className="flex items-center">
                        <Phone className="mr-2 h-4 w-4" />
                        SMS notifications
                      </FormLabel>
                      <FormDescription>
                        Receive notifications via SMS
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
                      <FormLabel>Phone number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+1 (555) 123-4567" 
                          {...field} 
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        Your phone number for receiving SMS notifications
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <DialogFooter>
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
