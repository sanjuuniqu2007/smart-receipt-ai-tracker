
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, AlertCircle } from "lucide-react";
import { NotificationHistory } from "@/types/database.types";

interface NotificationBadgeProps {
  receiptId: string;
  notifications?: NotificationHistory[];
}

export function NotificationBadge({ receiptId, notifications = [] }: NotificationBadgeProps) {
  const receiptNotifications = notifications.filter(n => n.receipt_id === receiptId);
  
  if (receiptNotifications.length === 0) {
    return null;
  }

  const hasFailedNotifications = receiptNotifications.some(n => n.status === 'failed');
  const hasSentNotifications = receiptNotifications.some(n => n.status === 'sent');
  const hasPendingNotifications = receiptNotifications.some(n => n.status === 'pending');

  if (hasFailedNotifications) {
    return (
      <Badge variant="destructive" className="gap-1 text-xs">
        <AlertCircle className="h-3 w-3" />
        Notification Failed
      </Badge>
    );
  }

  if (hasPendingNotifications) {
    return (
      <Badge variant="secondary" className="gap-1 text-xs">
        <Bell className="h-3 w-3" />
        Reminder Scheduled
      </Badge>
    );
  }

  if (hasSentNotifications) {
    return (
      <Badge variant="default" className="gap-1 text-xs">
        <CheckCircle className="h-3 w-3" />
        Notification Sent
      </Badge>
    );
  }

  return null;
}
