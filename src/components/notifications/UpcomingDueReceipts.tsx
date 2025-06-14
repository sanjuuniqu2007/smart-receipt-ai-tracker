
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Receipt } from "@/types/database.types";

interface UpcomingDueReceiptsProps {
  receipts: Receipt[];
  onViewDetails?: (receipt: Receipt) => void;
}

// Helper function to get days until due
function getDaysUntilDue(dueDate: string): number {
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Helper function to get badge variant based on days remaining
function getBadgeVariant(days: number): "default" | "secondary" | "destructive" {
  if (days < 0) return "destructive";
  if (days <= 7) return "default";
  return "secondary";
}

export function UpcomingDueReceipts({ receipts, onViewDetails }: UpcomingDueReceiptsProps) {
  // Sort by due date (closest first)
  const sortedReceipts = [...receipts]
    .filter(r => r.due_date)
    .sort((a, b) => {
      const dateA = new Date(a.due_date!).getTime();
      const dateB = new Date(b.due_date!).getTime();
      return dateA - dateB;
    });
    
  const today = new Date();
  const next7Days = new Date();
  next7Days.setDate(today.getDate() + 7);
    
  // Group receipts by urgency
  const overdueReceipts = sortedReceipts.filter(
    r => new Date(r.due_date!) < today
  );
  
  const nextWeekReceipts = sortedReceipts.filter(
    r => {
      const dueDate = new Date(r.due_date!);
      return dueDate >= today && dueDate <= next7Days;
    }
  );

  if (sortedReceipts.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      {overdueReceipts.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Overdue Payments</AlertTitle>
          <AlertDescription>
            You have {overdueReceipts.length} overdue payment{overdueReceipts.length > 1 ? 's' : ''} that require your immediate attention.
          </AlertDescription>
        </Alert>
      )}
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendor</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedReceipts.map((receipt) => {
            const daysRemaining = getDaysUntilDue(receipt.due_date!);
            const badgeVariant = getBadgeVariant(daysRemaining);
            
            return (
              <TableRow key={receipt.id}>
                <TableCell className="font-medium">{receipt.vendor}</TableCell>
                <TableCell>{receipt.category}</TableCell>
                <TableCell>${receipt.amount.toFixed(2)}</TableCell>
                <TableCell>{new Date(receipt.due_date!).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant={badgeVariant}>
                    {daysRemaining < 0 
                      ? `Overdue by ${Math.abs(daysRemaining)} days` 
                      : daysRemaining === 0 
                        ? "Due today" 
                        : `Due in ${daysRemaining} days`}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onViewDetails?.(receipt)}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {nextWeekReceipts.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-amber-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                <span className="font-medium">Attention:</span> You have {nextWeekReceipts.length} payment{nextWeekReceipts.length > 1 ? 's' : ''} due within the next 7 days.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
