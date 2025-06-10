import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { TestEmailButton } from "@/components/notifications/TestEmailButton";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import { supabase } from "@/integrations/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/receipts/columns";
import { TestScheduledNotifications } from "@/components/notifications/TestScheduledNotifications";

export function Dashboard() {
  const [receipts, setReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReceipts = async () => {
      setIsLoading(true);
      try {
        const { data: session } = await supabase.auth.getSession();

        if (session?.session?.user) {
          const { data, error } = await supabase
            .from('receipts')
            .select('*')
            .eq('user_id', session.session.user.id);

          if (error) {
            throw error;
          }

          setReceipts(data || []);
        }
      } catch (error) {
        console.error('Error fetching receipts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReceipts();
  }, []);

  return (
    <div className="container py-10">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <div className="flex items-center gap-2">
              <NotificationSettings />
              <TestEmailButton />
              <TestScheduledNotifications />
            </div>
          </div>
      <div className="py-4">
        {isLoading ? (
          <div className="flex items-center justify-center">
            <Calendar className="mr-2 h-4 w-4 animate-spin" /> Loading receipts...
          </div>
        ) : (
          <DataTable columns={columns} data={receipts} />
        )}
      </div>
      <Link to="/upload">
        <Button>Upload Receipt</Button>
      </Link>
    </div>
  );
}
