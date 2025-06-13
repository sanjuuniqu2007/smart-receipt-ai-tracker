import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Calendar, DollarSign, FileText, Search, Filter, TrendingUp, MoreVertical, Eye, Edit, Trash2, Download, Plus, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import { UpcomingDueReceipts } from "@/components/notifications/UpcomingDueReceipts";
import { ReceiptDetailModal } from "@/components/receipts/ReceiptDetailModal";
import { TestNotificationButton } from "@/components/notifications/TestNotificationButton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Receipt, NotificationHistory } from "@/types/database.types";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { TestEmailButton } from "@/components/notifications/TestEmailButton";
import { TestSMSButton } from "@/components/notifications/TestSMSButton";
import { ScheduleNotifications } from "@/components/notifications/ScheduleNotifications";

const Dashboard = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReceiptIds, setSelectedReceiptIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchReceipts();
    fetchNotificationHistory();
  }, []);
  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.from('receipts').select('*').order('receipt_date', {
        ascending: false
      });
      if (error) throw error;
      setReceipts(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch receipts."
      });
    } finally {
      setLoading(false);
    }
  };
  const fetchNotificationHistory = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('notification_history').select('*').order('sent_at', {
        ascending: false
      });
      if (error) throw error;
      setNotificationHistory(data || []);
    } catch (error: any) {
      console.error("Error fetching notification history:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch notification history."
      });
    }
  };

  // Add new functions for bulk operations
  const handleSelectReceipt = (receiptId: string, checked: boolean) => {
    if (checked) {
      setSelectedReceiptIds(prev => [...prev, receiptId]);
    } else {
      setSelectedReceiptIds(prev => prev.filter(id => id !== receiptId));
    }
  };
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReceiptIds(filteredReceipts.map(r => r.id));
    } else {
      setSelectedReceiptIds([]);
    }
  };
  const handleBulkDelete = async () => {
    if (selectedReceiptIds.length === 0) return;
    try {
      const {
        error
      } = await supabase.from('receipts').delete().in('id', selectedReceiptIds);
      if (error) throw error;
      toast({
        title: "Success",
        description: `${selectedReceiptIds.length} receipt(s) deleted successfully.`
      });

      // Refresh receipts
      fetchReceipts();
      setSelectedReceiptIds([]);
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete receipts."
      });
    }
  };
  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = receipt.vendor?.toLowerCase().includes(search.toLowerCase()) || receipt.category?.toLowerCase().includes(search.toLowerCase()) || receipt.notes?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || receipt.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || receipt.payment_status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });
  const totalReceipts = receipts.length;
  const totalAmount = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  const paidReceipts = receipts.filter(receipt => receipt.payment_status === 'paid').length;
  const pendingReceipts = receipts.filter(receipt => receipt.payment_status === 'pending').length;
  const overdueReceiptsCount = receipts.filter(receipt => receipt.payment_status === 'overdue').length;

  // Chart data
  const categoryData = receipts.reduce((acc: any, receipt) => {
    const category = receipt.category || 'Other';
    acc[category] = (acc[category] || 0) + receipt.amount;
    return acc;
  }, {});
  const chartData = Object.entries(categoryData).map(([category, amount]) => ({
    name: category,
    amount: amount as number
  }));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#a45de2'];
  const pieData = Object.entries(categoryData).map(([category, amount], index) => ({
    name: category,
    value: amount as number,
    color: COLORS[index % COLORS.length]
  }));

  // Monthly spending data
  const monthlySpendingData = receipts.reduce((acc: any, receipt) => {
    const month = new Date(receipt.receipt_date).toLocaleString('default', {
      month: 'short'
    });
    acc[month] = (acc[month] || 0) + receipt.amount;
    return acc;
  }, {});
  const monthlyChartData = Object.entries(monthlySpendingData).map(([month, amount]) => ({
    month,
    amount: amount as number
  }));
  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Track and manage your receipts</p>
        </div>
        
        <div className="flex items-center gap-3">
          <TestEmailButton />
          <TestSMSButton />
          <TestNotificationButton />
          <ScheduleNotifications />
          <NotificationSettings />
          <Link to="/upload">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Receipt
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total Receipts</span>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-2xl font-bold">{totalReceipts}</span>
            <span className="text-sm text-green-500">Receipts</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total Amount</span>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-2xl font-bold">${totalAmount.toFixed(2)}</span>
            <span className="text-sm text-red-500">Amount</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Paid Receipts</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-2xl font-bold">{paidReceipts}</span>
            <span className="text-sm text-green-500">Paid</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Pending Receipts</span>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-2xl font-bold">{pendingReceipts}</span>
            <span className="text-sm text-red-500">Pending</span>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="receipts">All Receipts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="upcoming">Due Soon</TabsTrigger>
        </TabsList>

        <TabsContent value="receipts" className="space-y-6">
          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="Search receipts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Food">Food</SelectItem>
                <SelectItem value="Transportation">Transportation</SelectItem>
                <SelectItem value="Entertainment">Entertainment</SelectItem>
                <SelectItem value="Shopping">Shopping</SelectItem>
                <SelectItem value="Utilities">Utilities</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedReceiptIds.length > 0 && <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedReceiptIds.length} receipt(s) selected
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedReceiptIds([])}>
                  Clear Selection
                </Button>
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Selected
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedReceiptIds.length} selected receipt(s)? 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground">
                        Delete {selectedReceiptIds.length} Receipt(s)
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>}

          {/* Receipts Grid */}
          <div className="space-y-4">
            {/* Select All Checkbox */}
            {filteredReceipts.length > 0 && <div className="flex items-center gap-2 p-2">
                <Checkbox checked={filteredReceipts.length > 0 && selectedReceiptIds.length === filteredReceipts.length} onCheckedChange={handleSelectAll} />
                <Label className="text-sm text-muted-foreground">
                  Select all ({filteredReceipts.length} receipts)
                </Label>
              </div>}

            {filteredReceipts.length === 0 ? <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-1">No receipts found</h3>
                <p className="text-muted-foreground mb-4">
                  {search || categoryFilter !== "all" || statusFilter !== "all" ? "Try adjusting your filters or search terms" : "Start by uploading your first receipt"}
                </p>
                <Link to="/upload">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Receipt
                  </Button>
                </Link>
              </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReceipts.map(receipt => <Card key={receipt.id} className="group hover:shadow-lg transition-all duration-200 relative">
                    <div className="absolute top-4 left-4 z-10">
                      <Checkbox checked={selectedReceiptIds.includes(receipt.id)} onCheckedChange={checked => handleSelectReceipt(receipt.id, checked as boolean)} className="bg-background border-2" />
                    </div>
                    
                    <CardContent className="p-0">
                      <div className="relative h-48 bg-muted">
                        <img src={receipt.image_url || "/placeholder.svg"} alt={`Receipt from ${receipt.vendor}`} className="w-full h-full object-cover rounded-t-lg" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-t-lg" />
                        
                        <div className="absolute top-4 right-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                          setSelectedReceipt(receipt);
                          setDetailModalOpen(true);
                        }}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      <div className="p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-lg">{receipt.vendor}</h3>
                            <p className="text-sm text-muted-foreground">{receipt.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">${receipt.amount?.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(receipt.receipt_date).toLocaleDateString()}
                          </div>
                          {receipt.due_date && <div className="flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              Due {new Date(receipt.due_date).toLocaleDateString()}
                            </div>}
                        </div>

                        <div className="flex items-center justify-between">
                          <Badge variant={receipt.payment_status === 'paid' ? 'default' : 'secondary'}>
                            {receipt.payment_status}
                          </Badge>
                          
                          <NotificationBadge receiptId={receipt.id} notifications={notificationHistory} />
                        </div>

                        {receipt.notes && <p className="text-sm text-muted-foreground line-clamp-2">
                            {receipt.notes}
                          </p>}
                      </div>
                    </CardContent>
                  </Card>)}
              </div>}
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Upcoming Due Receipts</h2>
            <UpcomingDueReceipts receipts={receipts.filter(r => r.due_date)} />
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="col-span-1 md:col-span-1">
              <CardContent>
                <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-1 md:col-span-1">
              <CardContent>
                <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardContent>
              <h3 className="text-lg font-semibold mb-4">Monthly Spending Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="amount" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Receipt Detail Modal */}
      <ReceiptDetailModal receipt={selectedReceipt} open={detailModalOpen} onOpenChange={setDetailModalOpen} />
    </div>
  );
};

export default Dashboard;
