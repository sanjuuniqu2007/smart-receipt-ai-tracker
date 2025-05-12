
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  ReceiptText, 
  Search, 
  Upload, 
  PlusCircle, 
  Calendar, 
  DollarSign,
  Bell,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import { UpcomingDueReceipts } from "@/components/notifications/UpcomingDueReceipts";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Define Receipt interface for type safety
interface Receipt {
  id: string;
  vendor: string;
  receipt_date: string;
  amount: number;
  due_date?: string | null;
  category: string;
  image_url: string;
  payment_status: string;
}

const Dashboard = () => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [filterCategory, setFilterCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingDueCount, setUpcomingDueCount] = useState(0);
  const [showNotificationAlert, setShowNotificationAlert] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        setIsLoading(true);
        const { data: userData } = await supabase.auth.getSession();
        
        if (userData?.session?.user) {
          // Fetch receipts from Supabase
          const { data, error } = await supabase
            .from('receipts')
            .select('*')
            .order('receipt_date', { ascending: false });
          
          if (error) throw error;
          
          if (data) {
            setReceipts(data as Receipt[]);
            const dueReceipts = data.filter(r => r.due_date);
            setUpcomingDueCount(dueReceipts.length);
          }
          
          // Check if notification settings exist
          const { data: preferences } = await supabase
            .from('user_preferences')
            .select('*')
            .single();
            
          if (!preferences) {
            setShowNotificationAlert(true);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load receipts. Please try again later."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReceipts();
  }, [toast]);

  // Filter and sort receipts
  const filteredReceipts = receipts.filter(receipt => {
    // Filter by search term
    if (search && !receipt.vendor.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    // Filter by category
    if (filterCategory !== "all" && receipt.category !== filterCategory) {
      return false;
    }
    // Filter by tab
    if (activeTab === "upcoming" && !receipt.due_date) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    // Sort logic
    if (sortBy === "amount") {
      return b.amount - a.amount;
    } else if (sortBy === "vendor") {
      return a.vendor.localeCompare(b.vendor);
    } else {
      return new Date(b.receipt_date).getTime() - new Date(a.receipt_date).getTime();
    }
  });

  // Calculate total amount of filtered receipts
  const totalAmount = filteredReceipts.reduce((sum, receipt) => sum + (receipt.amount || 0), 0);

  return (
    <div className="container px-4 py-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Receipt Dashboard</h1>
          <p className="text-muted-foreground">Track and manage all your receipts in one place</p>
        </div>
        <div className="flex gap-2">
          <Link to="/upload">
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload New Receipt
            </Button>
          </Link>
          <NotificationSettings />
        </div>
      </div>

      {showNotificationAlert && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 cursor-pointer">
              <div className="flex">
                <AlertTriangle className="h-6 w-6 mr-2" />
                <div>
                  <p className="font-bold">Setup Notifications</p>
                  <p className="text-sm">Set up notifications to receive alerts for upcoming due dates.</p>
                </div>
              </div>
            </div>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Set Up Notifications</AlertDialogTitle>
              <AlertDialogDescription>
                Configure your notification preferences to receive alerts before receipts are due.
                This helps you stay on top of your payments and warranty deadlines.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowNotificationAlert(false)}>
                Later
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button onClick={() => {
                  setShowNotificationAlert(false);
                  // Open notification settings modal
                  document.getElementById("notification-settings-button")?.click();
                }}>
                  Set Up Now
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <ReceiptText className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Receipts</p>
              <p className="text-3xl font-bold">{receipts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
              <p className="text-3xl font-bold">
                ${totalAmount.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Upcoming Due Dates</p>
              <p className="text-3xl font-bold">
                {upcomingDueCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search receipts by vendor..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="amount">Sort by Amount</SelectItem>
                <SelectItem value="vendor">Sort by Vendor</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Groceries">Groceries</SelectItem>
                <SelectItem value="Utilities">Utilities</SelectItem>
                <SelectItem value="Dining">Dining</SelectItem>
                <SelectItem value="Entertainment">Entertainment</SelectItem>
                <SelectItem value="Travel">Travel</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Home Improvement">Home Improvement</SelectItem>
                <SelectItem value="Medical">Medical</SelectItem>
                <SelectItem value="Clothing">Clothing</SelectItem>
                <SelectItem value="Uncategorized">Uncategorized</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Receipts</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Due Dates</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading receipts...</span>
              </div>
            ) : filteredReceipts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReceipts.map((receipt) => (
                  <Card key={receipt.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-video bg-muted relative">
                      <img
                        src={receipt.image_url || "/placeholder.svg"}
                        alt={`Receipt from ${receipt.vendor}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-xl">{receipt.vendor}</h3>
                        <div className="bg-primary/10 text-primary text-sm px-2 py-1 rounded">
                          {receipt.category}
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <div className="flex justify-between">
                          <span>Date:</span>
                          <span className="font-medium text-foreground">
                            {new Date(receipt.receipt_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Amount:</span>
                          <span className="font-medium text-foreground">
                            ${receipt.amount.toFixed(2)}
                          </span>
                        </div>
                        {receipt.due_date && (
                          <div className="flex justify-between">
                            <span>Due Date:</span>
                            <span className="font-medium text-foreground">
                              {new Date(receipt.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ReceiptText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-1">No receipts found</h3>
                <p className="text-muted-foreground mb-4">
                  Try changing your search or filter criteria
                </p>
                <Link to="/upload">
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Upload Receipt
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
          <TabsContent value="upcoming" className="mt-6">
            <UpcomingDueReceipts receipts={filteredReceipts.filter(r => r.due_date)} />
          </TabsContent>
          <TabsContent value="notifications" className="mt-6">
            <div className="max-w-3xl mx-auto bg-card shadow rounded-lg p-6">
              <div className="flex items-center mb-6">
                <Bell className="h-6 w-6 mr-3 text-primary" />
                <h2 className="text-2xl font-semibold">Notification History</h2>
              </div>
              
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No notification history available yet.</p>
                <p className="max-w-md mx-auto mt-2">
                  When receipts are about to expire or reach their due date, you'll see notification 
                  records here.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
