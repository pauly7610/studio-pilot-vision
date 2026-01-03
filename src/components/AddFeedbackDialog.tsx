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
import { Plus, Loader2, MessageSquarePlus } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useCreateFeedback } from "@/hooks/useProductFeedback";

const SOURCE_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "teams", label: "Teams / Slack" },
  { value: "customer_survey", label: "Customer Survey" },
  { value: "support_ticket", label: "Support Ticket" },
  { value: "field_report", label: "Field Report" },
  { value: "sales_feedback", label: "Sales Feedback" },
  { value: "meeting_notes", label: "Meeting Notes" },
  { value: "other", label: "Other" },
];

const THEME_OPTIONS = [
  { value: "usability", label: "Usability" },
  { value: "performance", label: "Performance" },
  { value: "feature_request", label: "Feature Request" },
  { value: "bug_report", label: "Bug Report" },
  { value: "pricing", label: "Pricing" },
  { value: "documentation", label: "Documentation" },
  { value: "integration", label: "Integration" },
  { value: "general", label: "General" },
];

const IMPACT_OPTIONS = [
  { value: "HIGH", label: "High - Critical for adoption" },
  { value: "MEDIUM", label: "Medium - Important but not blocking" },
  { value: "LOW", label: "Low - Nice to have" },
];

const SENTIMENT_OPTIONS = [
  { value: "0.8", label: "😊 Very Positive" },
  { value: "0.4", label: "🙂 Positive" },
  { value: "0", label: "😐 Neutral" },
  { value: "-0.4", label: "🙁 Negative" },
  { value: "-0.8", label: "😠 Very Negative" },
];

interface AddFeedbackDialogProps {
  triggerButton?: React.ReactNode;
  defaultProductId?: string;
}

export function AddFeedbackDialog({ triggerButton, defaultProductId }: AddFeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState(defaultProductId || "");
  const [source, setSource] = useState("");
  const [theme, setTheme] = useState("");
  const [impactLevel, setImpactLevel] = useState("MEDIUM");
  const [sentimentScore, setSentimentScore] = useState("0");
  const [rawText, setRawText] = useState("");

  const { data: products, isLoading: productsLoading } = useProducts();
  const createFeedback = useCreateFeedback();

  const resetForm = () => {
    setProductId(defaultProductId || "");
    setSource("");
    setTheme("");
    setImpactLevel("MEDIUM");
    setSentimentScore("0");
    setRawText("");
  };

  const handleSubmit = () => {
    if (!productId || !source || !rawText.trim()) {
      return;
    }

    createFeedback.mutate(
      {
        product_id: productId,
        source,
        raw_text: rawText.trim(),
        theme: theme || undefined,
        sentiment_score: parseFloat(sentimentScore),
        impact_level: impactLevel as "HIGH" | "MEDIUM" | "LOW",
        volume: 1,
      },
      {
        onSuccess: () => {
          resetForm();
          setOpen(false);
        },
      }
    );
  };

  const isValid = productId && source && rawText.trim();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="default" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5" />
            Log New Feedback
          </DialogTitle>
          <DialogDescription>
            Record feedback from emails, Teams messages, meetings, or any other source. 
            This will be automatically synced to the AI knowledge graph.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Product Selection */}
          <div className="space-y-2">
            <Label htmlFor="product">Product *</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger id="product">
                <SelectValue placeholder={productsLoading ? "Loading..." : "Select a product"} />
              </SelectTrigger>
              <SelectContent>
                {products?.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Source Selection */}
          <div className="space-y-2">
            <Label htmlFor="source">Source *</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger id="source">
                <SelectValue placeholder="Where did this feedback come from?" />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Feedback Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Feedback Content *</Label>
            <Textarea
              id="content"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste or type the feedback here... (e.g., 'Customer says the checkout flow is confusing and wants a simpler 3-step process')"
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Theme and Sentiment Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {THEME_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sentiment">Sentiment</Label>
              <Select value={sentimentScore} onValueChange={setSentimentScore}>
                <SelectTrigger id="sentiment">
                  <SelectValue placeholder="How do they feel?" />
                </SelectTrigger>
                <SelectContent>
                  {SENTIMENT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Impact Level */}
          <div className="space-y-2">
            <Label htmlFor="impact">Impact Level</Label>
            <Select value={impactLevel} onValueChange={setImpactLevel}>
              <SelectTrigger id="impact">
                <SelectValue placeholder="How critical is this?" />
              </SelectTrigger>
              <SelectContent>
                {IMPACT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || createFeedback.isPending}
          >
            {createFeedback.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Feedback
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

