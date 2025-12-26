import { useState } from "react";
import { CheckCircle2, Circle, FileText, Code, Headphones, Package, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TransitionItem {
  id: string;
  category: "sales" | "tech" | "ops";
  name: string;
  description: string;
  complete: boolean;
  owner?: string;
  dueDate?: string;
}

interface TransitionReadinessProps {
  productId: string;
  productName: string;
  lifecycleStage: string;
  items?: TransitionItem[];
  compact?: boolean;
}

const defaultTransitionItems: TransitionItem[] = [
  // Sales
  { id: "s1", category: "sales", name: "Pitch Deck", description: "Customer-facing presentation", complete: true },
  { id: "s2", category: "sales", name: "FAQs Document", description: "Common questions and answers", complete: true },
  { id: "s3", category: "sales", name: "Pricing Guide", description: "Pricing tiers and packages", complete: false },
  { id: "s4", category: "sales", name: "Competitive Analysis", description: "Market positioning", complete: true },
  { id: "s5", category: "sales", name: "Case Studies", description: "Success stories from pilot", complete: false },
  
  // Tech
  { id: "t1", category: "tech", name: "API Documentation", description: "Full API reference", complete: true },
  { id: "t2", category: "tech", name: "Security Certifications", description: "SOC2, PCI-DSS compliance", complete: true },
  { id: "t3", category: "tech", name: "Integration Guide", description: "Step-by-step integration", complete: false },
  { id: "t4", category: "tech", name: "SDK/Libraries", description: "Client libraries published", complete: true },
  { id: "t5", category: "tech", name: "Performance SLAs", description: "Uptime and latency guarantees", complete: false },
  
  // Ops
  { id: "o1", category: "ops", name: "Support SOPs", description: "Standard operating procedures", complete: false },
  { id: "o2", category: "ops", name: "Escalation Matrix", description: "L1/L2/L3 support paths", complete: true },
  { id: "o3", category: "ops", name: "Runbooks", description: "Incident response procedures", complete: false },
  { id: "o4", category: "ops", name: "Monitoring Dashboards", description: "Operational visibility", complete: true },
  { id: "o5", category: "ops", name: "Training Materials", description: "Support team training", complete: false },
];

const categoryConfig = {
  sales: {
    label: "Sales Enablement",
    icon: FileText,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  tech: {
    label: "Technical Readiness",
    icon: Code,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  ops: {
    label: "Operations & Support",
    icon: Headphones,
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
  },
};

export const TransitionReadiness = ({
  productId,
  productName,
  lifecycleStage,
  items = defaultTransitionItems,
  compact = false,
}: TransitionReadinessProps) => {
  const [open, setOpen] = useState(false);

  // Only show for commercial/scaling products
  const isTransitionPhase = lifecycleStage === "commercial" || lifecycleStage === "pilot";
  
  // Calculate completion by category
  const salesItems = items.filter(i => i.category === "sales");
  const techItems = items.filter(i => i.category === "tech");
  const opsItems = items.filter(i => i.category === "ops");
  
  const salesComplete = salesItems.filter(i => i.complete).length;
  const techComplete = techItems.filter(i => i.complete).length;
  const opsComplete = opsItems.filter(i => i.complete).length;
  
  const totalComplete = items.filter(i => i.complete).length;
  const totalItems = items.length;
  const overallPercent = Math.round((totalComplete / totalItems) * 100);

  const isReadyForBAU = overallPercent >= 80;

  if (!isTransitionPhase && compact) {
    return null;
  }

  const renderCategorySection = (
    category: "sales" | "tech" | "ops",
    categoryItems: TransitionItem[],
    completeCount: number
  ) => {
    const config = categoryConfig[category];
    const CategoryIcon = config.icon;
    const percent = Math.round((completeCount / categoryItems.length) * 100);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CategoryIcon className={cn("h-4 w-4", config.color)} />
            <span className="font-medium text-sm">{config.label}</span>
          </div>
          <Badge variant="outline" className={cn(config.bgColor, "text-xs")}>
            {completeCount}/{categoryItems.length}
          </Badge>
        </div>
        <Progress value={percent} className="h-2" />
        <div className="space-y-1">
          {categoryItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 text-sm py-1"
            >
              {item.complete ? (
                <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className={item.complete ? "text-muted-foreground" : "font-medium"}>
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (compact) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <span className="inline-flex">
            <Badge
              variant="outline"
              className={cn(
                "cursor-pointer text-xs",
                isReadyForBAU
                  ? "bg-success/10 text-success border-success/30"
                  : "bg-warning/10 text-warning border-warning/30"
              )}
            >
              <Package className="h-3 w-3 mr-1" />
              BAU {overallPercent}%
            </Badge>
          </span>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Asset Transition Package — {productName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            {/* Overall Progress */}
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Transition Readiness</span>
                <Badge
                  variant="outline"
                  className={cn(
                    isReadyForBAU
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  )}
                >
                  {isReadyForBAU ? "Ready for BAU" : "In Progress"}
                </Badge>
              </div>
              <Progress value={overallPercent} className="h-3 mb-2" />
              <p className="text-sm text-muted-foreground">
                {totalComplete} of {totalItems} items complete ({overallPercent}%)
              </p>
            </div>

            {/* Category Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderCategorySection("sales", salesItems, salesComplete)}
              {renderCategorySection("tech", techItems, techComplete)}
              {renderCategorySection("ops", opsItems, opsComplete)}
            </div>

            {/* Next Steps */}
            <div className="p-4 rounded-lg border bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                <span className="font-semibold">Next Steps</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {items.filter(i => !i.complete).slice(0, 3).map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <Circle className="h-3 w-3" />
                    Complete: {item.name} ({categoryConfig[item.category].label})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Full view
  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <span className="font-semibold">Asset Transition Package</span>
        </div>
        <Badge
          variant="outline"
          className={cn(
            isReadyForBAU
              ? "bg-success/10 text-success"
              : "bg-warning/10 text-warning"
          )}
        >
          {isReadyForBAU ? "Ready for BAU" : `${overallPercent}% Complete`}
        </Badge>
      </div>

      <Progress value={overallPercent} className="h-2" />

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className={cn("p-3 rounded-lg", categoryConfig.sales.bgColor)}>
          <FileText className={cn("h-5 w-5 mx-auto mb-1", categoryConfig.sales.color)} />
          <div className="text-lg font-bold">{salesComplete}/{salesItems.length}</div>
          <div className="text-xs text-muted-foreground">Sales</div>
        </div>
        <div className={cn("p-3 rounded-lg", categoryConfig.tech.bgColor)}>
          <Code className={cn("h-5 w-5 mx-auto mb-1", categoryConfig.tech.color)} />
          <div className="text-lg font-bold">{techComplete}/{techItems.length}</div>
          <div className="text-xs text-muted-foreground">Tech</div>
        </div>
        <div className={cn("p-3 rounded-lg", categoryConfig.ops.bgColor)}>
          <Headphones className={cn("h-5 w-5 mx-auto mb-1", categoryConfig.ops.color)} />
          <div className="text-lg font-bold">{opsComplete}/{opsItems.length}</div>
          <div className="text-xs text-muted-foreground">Ops</div>
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
        View Full Checklist
      </Button>
    </div>
  );
};
