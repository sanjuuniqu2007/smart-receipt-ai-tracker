
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, FileText, MapPin } from "lucide-react";
import { Receipt } from "@/types/database.types";

interface ReceiptDetailModalProps {
  receipt: Receipt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiptDetailModal({ receipt, open, onOpenChange }: ReceiptDetailModalProps) {
  if (!receipt) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Receipt Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Receipt Image */}
          <div className="aspect-video bg-muted relative rounded-lg overflow-hidden">
            <img
              src={receipt.image_url || "/placeholder.svg"}
              alt={`Receipt from ${receipt.vendor}`}
              className="object-cover w-full h-full"
            />
          </div>

          {/* Receipt Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Receipt ID</p>
                  <p className="font-medium">{receipt.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Vendor</p>
                  <p className="font-medium">{receipt.vendor}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Purchase Date</p>
                  <p className="font-medium">
                    {new Date(receipt.receipt_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-medium text-lg">${receipt.amount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {receipt.due_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-medium">
                      {new Date(receipt.due_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-1">Category</p>
                <Badge variant="secondary">{receipt.category}</Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
                <Badge variant={receipt.payment_status === 'paid' ? 'default' : 'secondary'}>
                  {receipt.payment_status}
                </Badge>
              </div>

              {receipt.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm bg-muted p-2 rounded">{receipt.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
