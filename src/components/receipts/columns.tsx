
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const columns = [
  {
    accessorKey: "merchant_name",
    header: "Merchant",
  },
  {
    accessorKey: "total_amount",
    header: "Amount",
    cell: ({ row }: { row: { original: any } }) => {
      const amount = parseFloat(row.original.total_amount);
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);

      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "purchase_date",
    header: "Purchase Date",
    cell: ({ row }: { row: { original: any } }) => {
      return format(new Date(row.original.purchase_date), "PPP");
    },
  },
  {
    accessorKey: "warranty_expiry",
    header: "Warranty Expiry",
    cell: ({ row }: { row: { original: any } }) => {
      if (!row.original.warranty_expiry) return "N/A";
      
      const expiryDate = new Date(row.original.warranty_expiry);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      return (
        <div className="flex items-center gap-2">
          <span>{format(expiryDate, "PPP")}</span>
          {daysUntilExpiry <= 30 && (
            <Badge variant={daysUntilExpiry <= 7 ? "destructive" : "secondary"}>
              {daysUntilExpiry <= 0 ? "Expired" : `${daysUntilExpiry} days`}
            </Badge>
          )}
        </div>
      );
    },
  },
];
