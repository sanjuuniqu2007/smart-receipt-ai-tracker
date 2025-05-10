
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Upload, Check, Image, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const UploadReceipt = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "processing" | "success" | "error"
  >("idle");
  const [extractedData, setExtractedData] = useState<{
    vendor: string;
    date: string;
    amount: string;
    dueDate: string;
    category: string;
  }>({
    vendor: "",
    date: "",
    amount: "",
    dueDate: "",
    category: "Uncategorized",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create a preview
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        if (e.target?.result) {
          setPreview(e.target.result as string);
        }
      };
      fileReader.readAsDataURL(file);
      
      // Reset form
      setUploadStatus("idle");
      setExtractedData({
        vendor: "",
        date: "",
        amount: "",
        dueDate: "",
        category: "Uncategorized",
      });
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setExtractedData((prev) => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a receipt image to upload",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Demo flow - in a real app, this would connect to Supabase
      setUploadStatus("uploading");
      
      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setUploadStatus("processing");
      
      // Simulate OCR processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Mock extracted data
      setExtractedData({
        vendor: "Demo Store",
        date: new Date().toISOString().split('T')[0],
        amount: "127.84",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: "Groceries",
      });
      
      setUploadStatus("success");
      
      toast({
        title: "Receipt processed successfully",
        description: "The receipt data has been extracted and saved",
        variant: "default",
      });
      
      // In a real app, we would save to Supabase here
      // Then redirect after a delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
      
    } catch (error) {
      setUploadStatus("error");
      toast({
        title: "Error processing receipt",
        description: "There was a problem processing your receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Upload Receipt</h1>
        <p className="text-muted-foreground">Upload a receipt image to extract and save the data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Receipt Image</h2>
            
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:bg-muted/50 transition-colors">
                <input
                  type="file"
                  id="receipt-image"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
                />
                
                {!preview ? (
                  <label
                    htmlFor="receipt-image"
                    className="flex flex-col items-center gap-2 cursor-pointer"
                  >
                    <Image className="h-10 w-10 text-muted-foreground" />
                    <span className="font-medium">Click to upload receipt image</span>
                    <span className="text-sm text-muted-foreground">
                      Support for JPEG, PNG, and HEIF
                    </span>
                  </label>
                ) : (
                  <div className="w-full">
                    <img
                      src={preview}
                      alt="Receipt preview"
                      className="w-full max-h-[300px] object-contain mb-4"
                    />
                    <div className="flex justify-center mt-2">
                      <label
                        htmlFor="receipt-image"
                        className="text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="h-4 w-4" />
                        Upload a different image
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {uploadStatus === "error" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    There was a problem processing your receipt. Please try a different image or upload again.
                  </AlertDescription>
                </Alert>
              )}

              {(uploadStatus === "uploading" || uploadStatus === "processing") && (
                <div className="flex flex-col items-center justify-center gap-2 p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="font-medium">
                    {uploadStatus === "uploading" ? "Uploading receipt..." : "Processing receipt..."}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {uploadStatus === "uploading"
                      ? "Please wait while we upload your receipt."
                      : "Extracting information from your receipt using OCR..."}
                  </p>
                </div>
              )}

              {uploadStatus === "success" && (
                <Alert className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-600">Success</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Receipt data has been successfully extracted and saved.
                  </AlertDescription>
                </Alert>
              )}
              
              {(uploadStatus === "idle" || uploadStatus === "success") && (
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedFile || uploadStatus === "success"}
                  className="w-full"
                >
                  {uploadStatus === "success" ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Processed Successfully
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Process Receipt
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Receipt Information</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Review and edit the extracted information from your receipt before saving.
            </p>

            <form className="space-y-4">
              <div>
                <Label htmlFor="vendor">Vendor/Merchant</Label>
                <Input
                  id="vendor"
                  value={extractedData.vendor}
                  onChange={(e) => handleFieldChange("vendor", e.target.value)}
                  disabled={uploadStatus !== "success"}
                  placeholder="Vendor name"
                />
              </div>
              
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  value={extractedData.amount}
                  onChange={(e) => handleFieldChange("amount", e.target.value)}
                  disabled={uploadStatus !== "success"}
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Receipt Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={extractedData.date}
                    onChange={(e) => handleFieldChange("date", e.target.value)}
                    disabled={uploadStatus !== "success"}
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date (Optional)</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={extractedData.dueDate}
                    onChange={(e) => handleFieldChange("dueDate", e.target.value)}
                    disabled={uploadStatus !== "success"}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={extractedData.category}
                  onValueChange={(value) => handleFieldChange("category", value)}
                  disabled={uploadStatus !== "success"}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
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
              
              <Separator className="my-6" />
              
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={uploadStatus !== "success"}
                  onClick={() => {
                    toast({
                      title: "Receipt saved",
                      description: "Your receipt has been saved successfully",
                    });
                    navigate("/dashboard");
                  }}
                >
                  Save Receipt
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadReceipt;
