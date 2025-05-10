import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { processReceiptImage } from "@/utils/ocrUtils";

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
  const [userId, setUserId] = useState<string | null>(null);
  
  // Get current user id on component mount
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      } else {
        toast({
          title: "Authentication required",
          description: "Please sign in to upload receipts",
          variant: "destructive",
        });
        navigate("/auth/login");
      }
    };
    
    checkUser();
  }, [navigate, toast]);

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

    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload receipts",
        variant: "destructive",
      });
      navigate("/auth/login");
      return;
    }
    
    try {
      setUploadStatus("uploading");
      
      // Upload the image to Supabase storage
      const timestamp = Date.now();
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `receipt-${timestamp}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('receipts')
        .upload(filePath, selectedFile);
      
      if (uploadError) throw uploadError;
      
      // Get the public URL for the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath);
      
      setUploadStatus("processing");
      
      // Use OCR to extract data from the receipt if the file is an image
      let processedData = { ...extractedData };

      try {
        // Run OCR processing if file is an image
        if (selectedFile.type.startsWith('image/')) {
          const ocrData = await processReceiptImage(selectedFile);
          
          // Update with OCR data if available, otherwise keep user-entered data
          processedData = {
            vendor: ocrData.vendor || extractedData.vendor,
            date: ocrData.date || extractedData.date,
            amount: ocrData.amount || extractedData.amount,
            dueDate: ocrData.dueDate || extractedData.dueDate,
            category: extractedData.category, // Keep user-selected category
          };
          
          setExtractedData(processedData);
        }
      } catch (ocrError) {
        console.error("OCR processing error:", ocrError);
        // Continue with user-entered data if OCR fails
      }
      
      // Save to Supabase database
      const { error: insertError } = await supabase
        .from('receipts')
        .insert({
          user_id: userId,
          vendor: processedData.vendor,
          amount: parseFloat(processedData.amount) || 0,
          date: processedData.date,
          due_date: processedData.dueDate || null,
          category: processedData.category,
          payment_status: 'pending',
          image_url: publicUrl,
          notes: ''
        });
      
      if (insertError) throw insertError;
      
      setUploadStatus("success");
      
      toast({
        title: "Receipt processed successfully",
        description: "The receipt data has been extracted, saved and stored in your account",
        variant: "default",
      });
      
      // Redirect after a delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
      
    } catch (error: any) {
      console.error("Error processing receipt:", error);
      setUploadStatus("error");
      toast({
        title: "Error processing receipt",
        description: error.message || "There was a problem processing your receipt. Please try again.",
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
                  disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
                  placeholder="Vendor name"
                />
              </div>
              
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  value={extractedData.amount}
                  onChange={(e) => handleFieldChange("amount", e.target.value)}
                  disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
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
                    disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date (Optional)</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={extractedData.dueDate}
                    onChange={(e) => handleFieldChange("dueDate", e.target.value)}
                    disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={extractedData.category}
                  onValueChange={(value) => handleFieldChange("category", value)}
                  disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
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
                  disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
                  onClick={handleSubmit}
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
