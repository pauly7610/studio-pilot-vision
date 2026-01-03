import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2, Package, Upload, FileText, CheckCircle2 } from "lucide-react";
import { useCreateProduct, CreateProductInput } from "@/hooks/useProducts";
import { useUploadDocument, useJobStatus } from "@/hooks/useAIInsights";
import { cn } from "@/lib/utils";

const PRODUCT_TYPES = [
  { value: "payment_gateway", label: "Payment Gateway" },
  { value: "card_processing", label: "Card Processing" },
  { value: "fraud_detection", label: "Fraud Detection" },
  { value: "merchant_services", label: "Merchant Services" },
  { value: "analytics", label: "Analytics & BI" },
  { value: "compliance", label: "Compliance Tool" },
  { value: "integration", label: "Integration/API" },
  { value: "other", label: "Other" },
];

const REGIONS = [
  { value: "north_america", label: "North America" },
  { value: "europe", label: "Europe" },
  { value: "apac", label: "APAC" },
  { value: "latam", label: "Latin America" },
  { value: "global", label: "Global" },
];

const LIFECYCLE_STAGES = [
  { value: "concept", label: "Concept" },
  { value: "development", label: "Development" },
  { value: "pilot", label: "Pilot" },
  { value: "launch", label: "Launch" },
  { value: "growth", label: "Growth" },
  { value: "mature", label: "Mature" },
  { value: "sunset", label: "Sunset" },
];

const GOVERNANCE_TIERS = [
  { value: "tier_1", label: "Tier 1 - Strategic" },
  { value: "tier_2", label: "Tier 2 - Important" },
  { value: "tier_3", label: "Tier 3 - Standard" },
];

interface AddProductDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: (productId: string, productName: string) => void;
}

export function AddProductDialog({ trigger, onSuccess }: AddProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  
  // Form state
  const [name, setName] = useState("");
  const [productType, setProductType] = useState("");
  const [region, setRegion] = useState("");
  const [lifecycleStage, setLifecycleStage] = useState("concept");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [launchDate, setLaunchDate] = useState("");
  const [revenueTarget, setRevenueTarget] = useState("");
  const [successMetric, setSuccessMetric] = useState("");
  const [governanceTier, setGovernanceTier] = useState("");
  const [budgetCode, setBudgetCode] = useState("");
  const [piiFlag, setPiiFlag] = useState(false);

  // Document upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [uploadJobId, setUploadJobId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const createProduct = useCreateProduct();
  const uploadDocument = useUploadDocument();
  const { data: uploadStatus } = useJobStatus(uploadJobId);

  const isUploading = uploadJobId && uploadStatus && !["completed", "failed"].includes(uploadStatus.status);
  const uploadComplete = uploadStatus?.status === "completed";

  const resetForm = () => {
    setName("");
    setProductType("");
    setRegion("");
    setLifecycleStage("concept");
    setOwnerEmail("");
    setLaunchDate("");
    setRevenueTarget("");
    setSuccessMetric("");
    setGovernanceTier("");
    setBudgetCode("");
    setPiiFlag(false);
    setSelectedFile(null);
    setCreatedProductId(null);
    setUploadJobId(null);
    setActiveTab("details");
  };

  const handleFileSelect = (file: File) => {
    const allowedTypes = [".pdf", ".txt", ".md", ".docx"];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!allowedTypes.includes(ext)) {
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleCreateProduct = async () => {
    if (!name.trim() || !productType || !region || !ownerEmail.trim()) {
      return;
    }

    const input: CreateProductInput = {
      name: name.trim(),
      product_type: productType,
      region,
      lifecycle_stage: lifecycleStage,
      owner_email: ownerEmail.trim(),
      launch_date: launchDate || undefined,
      revenue_target: revenueTarget ? parseFloat(revenueTarget) : undefined,
      success_metric: successMetric || undefined,
      governance_tier: governanceTier || undefined,
      budget_code: budgetCode || undefined,
      pii_flag: piiFlag,
    };

    try {
      const product = await createProduct.mutateAsync(input);
      setCreatedProductId(product.id);
      
      // If there's a file to upload, do it now
      if (selectedFile) {
        setActiveTab("document");
        const result = await uploadDocument.mutateAsync({
          file: selectedFile,
          productId: product.id,
          productName: product.name,
        });
        setUploadJobId(result.job_id);
      } else {
        // No document, close dialog
        if (onSuccess) onSuccess(product.id, product.name);
        setOpen(false);
        resetForm();
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleFinish = () => {
    if (createdProductId && onSuccess) {
      onSuccess(createdProductId, name);
    }
    setOpen(false);
    resetForm();
  };

  const isValid = name.trim() && productType && region && ownerEmail.trim();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {createdProductId ? "Product Created!" : "Create New Product"}
          </DialogTitle>
          <DialogDescription>
            {createdProductId 
              ? "Your product has been created. You can now upload supporting documents."
              : "Add a new product to the portfolio. All fields marked with * are required."
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details" disabled={!!createdProductId}>
              Product Details
            </TabsTrigger>
            <TabsTrigger value="document" disabled={!createdProductId && !selectedFile}>
              Document Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., PayLink Express"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner">Owner Email *</Label>
                <Input
                  id="owner"
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="product.owner@company.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Product Type *</Label>
                <Select value={productType} onValueChange={setProductType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Region *</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Lifecycle Stage</Label>
                <Select value={lifecycleStage} onValueChange={setLifecycleStage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LIFECYCLE_STAGES.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Optional fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="launchDate">Target Launch Date</Label>
                <Input
                  id="launchDate"
                  type="date"
                  value={launchDate}
                  onChange={(e) => setLaunchDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="revenueTarget">Revenue Target ($)</Label>
                <Input
                  id="revenueTarget"
                  type="number"
                  value={revenueTarget}
                  onChange={(e) => setRevenueTarget(e.target.value)}
                  placeholder="e.g., 1000000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="successMetric">Success Metric</Label>
              <Textarea
                id="successMetric"
                value={successMetric}
                onChange={(e) => setSuccessMetric(e.target.value)}
                placeholder="e.g., 10,000 active merchants within 6 months of launch"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Governance Tier</Label>
                <Select value={governanceTier} onValueChange={setGovernanceTier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {GOVERNANCE_TIERS.map((tier) => (
                      <SelectItem key={tier.value} value={tier.value}>
                        {tier.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="budgetCode">Budget Code</Label>
                <Input
                  id="budgetCode"
                  value={budgetCode}
                  onChange={(e) => setBudgetCode(e.target.value)}
                  placeholder="e.g., PROD-2024-001"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="pii"
                checked={piiFlag}
                onCheckedChange={setPiiFlag}
              />
              <Label htmlFor="pii">Contains PII (Personal Identifiable Information)</Label>
            </div>

            {/* Document preview section */}
            <div className="pt-4 border-t">
              <Label className="text-sm font-medium">Optional: Attach Document</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Upload a PDF, spec doc, or requirements file to train the AI about this product.
              </p>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
                onClick={() => document.getElementById("file-input")?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all",
                  isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
                  selectedFile && "border-primary/50 bg-primary/5"
                )}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,.txt,.md,.docx"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-medium">{selectedFile.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Upload className="h-5 w-5" />
                    <span>Drag & drop or click to select (PDF, TXT, MD, DOCX)</span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="document" className="space-y-4 py-4">
            {createdProductId && (
              <div className="space-y-4">
                {isUploading && uploadStatus && (
                  <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="font-medium">Uploading document...</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadStatus.progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {uploadStatus.status.replace(/_/g, " ")}...
                    </p>
                  </div>
                )}

                {uploadComplete && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="font-medium text-green-700 dark:text-green-400">
                          Document uploaded successfully!
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {uploadStatus?.chroma_ingested} chunks added to AI knowledge base
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!selectedFile && !uploadJobId && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No document selected</p>
                    <p className="text-sm">You can upload documents later from the product detail page.</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          {!createdProductId ? (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateProduct}
                disabled={!isValid || createProduct.isPending}
              >
                {createProduct.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Product {selectedFile && "& Upload"}
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleFinish} disabled={isUploading}>
              {uploadComplete ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Done
                </>
              ) : isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Finish"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

