import { useState } from "react";
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
import { ReceiptText, Search, Upload, PlusCircle, Calendar, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Mock data for initial UI development
const mockReceipts = [
  {
    id: "r1",
    vendor: "Walmart",
    date: "2023-05-10",
    amount: 127.84,
    dueDate: "2023-06-10",
    category: "Groceries",
    imageUrl: "/placeholder.svg",
  },
  {
    id: "r2",
    vendor: "Amazon",
    date: "2023-05-15",
    amount: 79.99,
    category: "Electronics",
    imageUrl: "/placeholder.svg",
  },
  {
    id: "r3",
    vendor: "Home Depot",
    date: "2023-05-18",
    amount: 245.67,
    dueDate: "2023-06-18",
    category: "Home Improvement",
    imageUrl: "/placeholder.svg",
  },
  {
    id: "r4",
    vendor: "Costco",
    date: "2023-05-22",
    amount: 312.45,
    category: "Groceries",
    imageUrl: "/placeholder.svg",
  },
];

const Dashboard = () => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [filterCategory, setFilterCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  // For demonstration purposes only
  const receipts = mockReceipts.filter(receipt => {
    // Filter by search term
    if (search && !receipt.vendor.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    // Filter by category
    if (filterCategory !== "all" && receipt.category !== filterCategory) {
      return false;
    }
    // Filter by tab
    if (activeTab === "upcoming" && !receipt.dueDate) {
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
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  return (
    <div className="container px-4 py-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Receipt Dashboard</h1>
          <p className="text-muted-foreground">Track and manage all your receipts in one place</p>
        </div>
        <Link to="/upload">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload New Receipt
          </Button>
        </Link>
      </div>

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
                ${receipts.reduce((sum, receipt) => sum + receipt.amount, 0).toFixed(2)}
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
                {receipts.filter(r => r.dueDate).length}
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
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Home Improvement">Home Improvement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Receipts</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Payments</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-6">
            {receipts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {receipts.map((receipt) => (
                  <Card key={receipt.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-video bg-muted relative">
                      <img
                        src={receipt.imageUrl}
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
                            {new Date(receipt.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Amount:</span>
                          <span className="font-medium text-foreground">
                            ${receipt.amount.toFixed(2)}
                          </span>
                        </div>
                        {receipt.dueDate && (
                          <div className="flex justify-between">
                            <span>Due Date:</span>
                            <span className="font-medium text-foreground">
                              {new Date(receipt.dueDate).toLocaleDateString()}
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
            {receipts.filter(r => r.dueDate).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {receipts
                  .filter(r => r.dueDate)
                  .map((receipt) => (
                    <Card key={receipt.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="aspect-video bg-muted relative">
                        <img
                          src={receipt.imageUrl}
                          alt={`Receipt from ${receipt.vendor}`}
                          className="object-cover w-full h-full"
                        />
                        <div className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full">
                          Due: {new Date(receipt.dueDate as string).toLocaleDateString()}
                        </div>
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
                              {new Date(receipt.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Amount:</span>
                            <span className="font-medium text-foreground">
                              ${receipt.amount.toFixed(2)}
                            </span>
                          </div>
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
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-1">No upcoming payments</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any receipts with upcoming due dates
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
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
