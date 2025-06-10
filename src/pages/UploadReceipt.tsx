import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Upload, Check, Image, Loader2, Calendar } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { processReceiptImage } from "@/utils/ocrUtils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
const UploadReceipt = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "processing" | "success" | "error">("idle");
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
    category: "Uncategorized"
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDueDatePrompt, setShowDueDatePrompt] = useState(false);

  // Get current user id on component mount
  useEffect(() => {
    const checkUser = async () => {
      const {
        data
      } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      } else {
        toast({
          title: "Authentication required",
          description: "Please sign in to upload receipts",
          variant: "destructive"
        });
        navigate("/auth/login");
      }
    };
    checkUser();
  }, [navigate, toast]);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Create a preview
      const fileReader = new FileReader();
      fileReader.onload = e => {
        if (e.target?.result) {
          setPreview(e.target.result as string);
        }
      };
      fileReader.readAsDataURL(file);

      // Reset form status
      setUploadStatus("processing");
      try {
        // Run OCR processing if file is an image
        if (file.type.startsWith('image/')) {
          const ocrData = await processReceiptImage(file);
          setExtractedData({
            vendor: ocrData.vendor || "",
            date: ocrData.date || "",
            amount: ocrData.amount || "",
            dueDate: ocrData.dueDate || "",
            category: "Uncategorized" // Default category
          });

          // Check if due date was extracted, if not prompt user
          if (!ocrData.dueDate) {
            setShowDueDatePrompt(true);
          }
          toast({
            title: "Data extracted",
            description: "Review the extracted information before saving"
          });
        }
      } catch (ocrError) {
        console.error("OCR processing error:", ocrError);
        toast({
          title: "OCR processing error",
          description: "Failed to extract data automatically. Please fill in the details manually.",
          variant: "destructive"
        });
      } finally {
        setUploadStatus("idle");
      }
    }
  };
  const handleFieldChange = (field: string, value: string) => {
    setExtractedData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a receipt image to upload",
        variant: "destructive"
      });
      return;
    }
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload receipts",
        variant: "destructive"
      });
      navigate("/auth/login");
      return;
    }

    // Validate required fields
    if (!extractedData.vendor || !extractedData.date) {
      toast({
        title: "Missing information",
        description: "Please fill in at least the vendor and receipt date",
        variant: "destructive"
      });
      return;
    }
    try {
      setIsSubmitting(true);
      setUploadStatus("uploading");

      // Upload the image to Supabase storage
      const timestamp = Date.now();
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `receipt-${timestamp}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      const {
        error: uploadError,
        data: uploadData
      } = await supabase.storage.from('receipts').upload(filePath, selectedFile);
      if (uploadError) throw uploadError;

      // Get the public URL for the uploaded image
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('receipts').getPublicUrl(filePath);

      // Save to Supabase database
      const {
        error: insertError
      } = await supabase.from('receipts').insert({
        user_id: userId,
        vendor: extractedData.vendor,
        amount: parseFloat(extractedData.amount) || 0,
        receipt_date: extractedData.date,
        due_date: extractedData.dueDate || null,
        category: extractedData.category,
        payment_status: 'pending',
        image_url: publicUrl,
        notes: ''
      });
      if (insertError) throw insertError;
      setUploadStatus("success");
      toast({
        title: "Receipt saved successfully",
        description: "The receipt data has been saved to your account"
      });

      // Redirect after a delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error: any) {
      console.error("Error processing receipt:", error);
      setUploadStatus("error");
      toast({
        title: "Error saving receipt",
        description: error.message || "There was a problem saving your receipt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    handleSubmit(e);
  };
  const handleDueDateSubmit = () => {
    // Close the dialog
    setShowDueDatePrompt(false);
    // The state is already updated via handleFieldChange
    toast({
      title: "Due date added",
      description: "Thank you for providing the due date information."
    });
  };
  return <div className="container px-4 py-8">
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
                <input type="file" id="receipt-image" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isSubmitting} />
                
                {!preview ? <label htmlFor="receipt-image" className="flex flex-col items-center gap-2 cursor-pointer">
                    <Image className="h-10 w-10 text-muted-foreground" />
                    <span className="font-medium">Click to upload receipt image</span>
                    <span className="text-sm text-muted-foreground">
                      Support for JPEG, PNG, and HEIF
                    </span>
                  </label> : <div className="w-full">
                    <img src={preview} alt="Receipt preview" className="w-full max-h-[300px] object-contain mb-4" />
                    <div className="flex justify-center mt-2">
                      <label htmlFor="receipt-image" className="text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer">
                        <Upload className="h-4 w-4" />
                        Upload a different image
                      </label>
                    </div>
                  </div>}
              </div>

              {uploadStatus === "error" && <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    There was a problem processing your receipt. Please try a different image or upload again.
                  </AlertDescription>
                </Alert>}

              {uploadStatus === "uploading" && <div className="flex flex-col items-center justify-center gap-2 p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="font-medium">Uploading receipt...</p>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we save your receipt.
                  </p>
                </div>}

              {uploadStatus === "processing" && <div className="flex flex-col items-center justify-center gap-2 p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="font-medium">Processing receipt...</p>
                  <p className="text-sm text-muted-foreground">
                    Extracting information from your receipt using OCR...
                  </p>
                </div>}

              {uploadStatus === "success" && <Alert className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-600">Success</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Receipt data has been successfully saved. Redirecting to dashboard...
                  </AlertDescription>
                </Alert>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Receipt Information</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {selectedFile ? "Review and edit the extracted information before saving." : "Upload a receipt image or enter details manually."}
            </p>

            <form className="space-y-4">
              <div>
                <Label htmlFor="vendor">Vendor/Merchant <span className="text-red-500">*</span></Label>
                <Input id="vendor" value={extractedData.vendor} onChange={e => handleFieldChange("vendor", e.target.value)} disabled={isSubmitting} placeholder="Vendor name" required />
              </div>
              
              <div>
                <Label htmlFor="amount">Amount <span className="text-red-500">*</span></Label>
                <Input id="amount" value={extractedData.amount} onChange={e => handleFieldChange("amount", e.target.value)} disabled={isSubmitting} placeholder="0.00" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Receipt Date <span className="text-red-500">*</span></Label>
                  <Input id="date" type="date" value={extractedData.date} onChange={e => handleFieldChange("date", e.target.value)} disabled={isSubmitting} required />
                </div>
                <div>
                  
                  
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={extractedData.category} onValueChange={value => handleFieldChange("category", value)} disabled={isSubmitting}>
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
                <Button type="button" variant="outline" onClick={() => navigate("/dashboard")} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSaveClick} disabled={isSubmitting || uploadStatus === "uploading" || uploadStatus === "success"}>
                  {isSubmitting ? <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </> : <>Save Receipt</>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      
      {/* Due Date Dialog */}
      <Dialog open={showDueDatePrompt} onOpenChange={setShowDueDatePrompt}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Due Date Information</DialogTitle>
            <DialogDescription>
              We couldn't automatically extract a due date from your receipt. If this receipt has a due date or warranty expiration date, please enter it below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div className="grid flex-1">
                <Label htmlFor="manual-due-date" className="mb-1">
                  Due Date or Warranty Expiry
                </Label>
                <Input id="manual-due-date" type="date" value={extractedData.dueDate} onChange={e => handleFieldChange("dueDate", e.target.value)} />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDueDatePrompt(false)}>
              Skip
            </Button>
            <Button onClick={handleDueDateSubmit}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};
export default UploadReceipt;