import { useState, useEffect } from "react";
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
import { Pencil, Loader2, Save } from "lucide-react";
import { useUpdateProduct, Product } from "@/hooks/useProducts";

const PRODUCT_TYPES = [
  { value: "payment_flows", label: "Payment Flows" },
  { value: "core_products", label: "Core Products" },
  { value: "data_services", label: "Data & Services" },
  { value: "partnerships", label: "Partnerships" },
];

const REGIONS = [
  { value: "North America", label: "North America" },
  { value: "Europe", label: "Europe" },
  { value: "APAC", label: "APAC" },
  { value: "Latin America", label: "Latin America" },
  { value: "Global", label: "Global" },
];

const LIFECYCLE_STAGES = [
  { value: "concept", label: "Concept" },
  { value: "early_pilot", label: "Early Pilot" },
  { value: "pilot", label: "Pilot" },
  { value: "scaling", label: "Scaling" },
  { value: "mature", label: "Mature" },
  { value: "sunset", label: "Sunset" },
];

const GOVERNANCE_TIERS = [
  { value: "ambassador", label: "Ambassador" },
  { value: "steerco", label: "SteerCo" },
  { value: "critical", label: "Critical" },
];

interface EditProductDialogProps {
  product: Product;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function EditProductDialog({ product, trigger, onSuccess }: EditProductDialogProps) {
  const [open, setOpen] = useState(false);

  // Form state - initialize with product data
  const [name, setName] = useState(product.name);
  const [productType, setProductType] = useState(product.product_type);
  const [region, setRegion] = useState(product.region);
  const [lifecycleStage, setLifecycleStage] = useState(product.lifecycle_stage);
  const [ownerEmail, setOwnerEmail] = useState(product.owner_email);
  const [launchDate, setLaunchDate] = useState(
    product.launch_date ? new Date(product.launch_date).toISOString().split('T')[0] : ""
  );
  const [revenueTarget, setRevenueTarget] = useState(
    product.revenue_target?.toString() || ""
  );
  const [successMetric, setSuccessMetric] = useState(product.success_metric || "");
  const [governanceTier, setGovernanceTier] = useState(product.governance_tier || "");
  const [budgetCode, setBudgetCode] = useState(product.budget_code || "");
  const [piiFlag, setPiiFlag] = useState(product.pii_flag || false);

  const updateProduct = useUpdateProduct();

  // Reset form when product changes or dialog opens
  useEffect(() => {
    if (open) {
      setName(product.name);
      setProductType(product.product_type);
      setRegion(product.region);
      setLifecycleStage(product.lifecycle_stage);
      setOwnerEmail(product.owner_email);
      setLaunchDate(
        product.launch_date ? new Date(product.launch_date).toISOString().split('T')[0] : ""
      );
      setRevenueTarget(product.revenue_target?.toString() || "");
      setSuccessMetric(product.success_metric || "");
      setGovernanceTier(product.governance_tier || "");
      setBudgetCode(product.budget_code || "");
      setPiiFlag(product.pii_flag || false);
    }
  }, [open, product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updates: any = {
      id: product.id,
      name: name.trim(),
      product_type: productType,
      region,
      lifecycle_stage: lifecycleStage,
      owner_email: ownerEmail.trim(),
    };

    if (launchDate) updates.launch_date = launchDate;
    if (revenueTarget) updates.revenue_target = parseFloat(revenueTarget);
    if (successMetric) updates.success_metric = successMetric.trim();
    if (governanceTier) updates.governance_tier = governanceTier;
    if (budgetCode) updates.budget_code = budgetCode.trim();
    updates.pii_flag = piiFlag;

    await updateProduct.mutateAsync(updates);
    setOpen(false);
    if (onSuccess) onSuccess();
  };

  const hasChanges = () => {
    return (
      name !== product.name ||
      productType !== product.product_type ||
      region !== product.region ||
      lifecycleStage !== product.lifecycle_stage ||
      ownerEmail !== product.owner_email ||
      launchDate !== (product.launch_date ? new Date(product.launch_date).toISOString().split('T')[0] : "") ||
      revenueTarget !== (product.revenue_target?.toString() || "") ||
      successMetric !== (product.success_metric || "") ||
      governanceTier !== (product.governance_tier || "") ||
      budgetCode !== (product.budget_code || "") ||
      piiFlag !== (product.pii_flag || false)
    );
  };

  const canSubmit = name.trim() && productType && region && lifecycleStage && ownerEmail.trim() && hasChanges();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4 mr-2" />
            Edit Product
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update product information. Changes will be reflected across all dashboards.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="text-sm font-semibold text-foreground border-b pb-2">
                Basic Information
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">
                    Product Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Mastercard Send"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="product-type">
                      Product Type <span className="text-destructive">*</span>
                    </Label>
                    <Select value={productType} onValueChange={setProductType} required>
                      <SelectTrigger id="product-type">
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

                  <div className="grid gap-2">
                    <Label htmlFor="region">
                      Region <span className="text-destructive">*</span>
                    </Label>
                    <Select value={region} onValueChange={setRegion} required>
                      <SelectTrigger id="region">
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS.map((reg) => (
                          <SelectItem key={reg.value} value={reg.value}>
                            {reg.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="lifecycle-stage">
                      Lifecycle Stage <span className="text-destructive">*</span>
                    </Label>
                    <Select value={lifecycleStage} onValueChange={setLifecycleStage} required>
                      <SelectTrigger id="lifecycle-stage">
                        <SelectValue placeholder="Select stage" />
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

                  <div className="grid gap-2">
                    <Label htmlFor="launch-date">Launch Date</Label>
                    <Input
                      id="launch-date"
                      type="date"
                      value={launchDate}
                      onChange={(e) => setLaunchDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="owner-email">
                    Product Owner Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="owner-email"
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="owner@mastercard.com"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Financial & Metrics */}
            <div className="space-y-4">
              <div className="text-sm font-semibold text-foreground border-b pb-2">
                Financial & Metrics
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="revenue-target">Revenue Target ($)</Label>
                    <Input
                      id="revenue-target"
                      type="number"
                      min="0"
                      step="0.01"
                      value={revenueTarget}
                      onChange={(e) => setRevenueTarget(e.target.value)}
                      placeholder="1000000"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="budget-code">Budget Code</Label>
                    <Input
                      id="budget-code"
                      value={budgetCode}
                      onChange={(e) => setBudgetCode(e.target.value)}
                      placeholder="e.g., BU-2024-001"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="success-metric">Success Metric</Label>
                  <Textarea
                    id="success-metric"
                    value={successMetric}
                    onChange={(e) => setSuccessMetric(e.target.value)}
                    placeholder="e.g., Transaction volume, user adoption rate, revenue growth"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Governance */}
            <div className="space-y-4">
              <div className="text-sm font-semibold text-foreground border-b pb-2">
                Governance
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="governance-tier">Governance Tier</Label>
                  <Select value={governanceTier} onValueChange={setGovernanceTier}>
                    <SelectTrigger id="governance-tier">
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

                <div className="flex items-center space-x-2">
                  <Switch
                    id="pii-flag"
                    checked={piiFlag}
                    onCheckedChange={setPiiFlag}
                  />
                  <Label htmlFor="pii-flag" className="font-normal">
                    Contains PII (Personally Identifiable Information)
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={updateProduct.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || updateProduct.isPending}
            >
              {updateProduct.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
