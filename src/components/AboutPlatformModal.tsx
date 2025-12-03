import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, CheckCircle, XCircle, Lightbulb } from "lucide-react";

export const AboutPlatformModal = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Info className="h-4 w-4" />
          About
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Lightbulb className="h-5 w-5 text-primary" />
            About This Platform
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Conceptual Portfolio Command Center for North America Studio
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* What This Is */}
          <div>
            <h3 className="font-semibold text-sm text-primary mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              What This Platform Demonstrates
            </h3>
            <ul className="text-sm text-muted-foreground space-y-2 ml-6">
              <li>• <strong>Portfolio Intelligence Dashboard</strong> — Real-time visibility into product health, risk, and readiness across the Studio portfolio</li>
              <li>• <strong>Predictive Analytics</strong> — AI-powered success predictions and revenue forecasting with confidence intervals</li>
              <li>• <strong>Governance Automation</strong> — Auto-flagging of at-risk products based on configurable business rules</li>
              <li>• <strong>Cross-functional Visibility</strong> — Stakeholder mapping, compliance tracking, and partner enablement status</li>
              <li>• <strong>Executive Insights</strong> — Automated weekly briefs with actionable recommendations</li>
            </ul>
          </div>

          {/* Decisions It Supports */}
          <div>
            <h3 className="font-semibold text-sm text-primary mb-2">
              Key Decisions It Supports
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="font-medium">Scale vs Kill</p>
                <p className="text-muted-foreground text-xs">Identify products ready to scale and those requiring sunset</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="font-medium">Resource Allocation</p>
                <p className="text-muted-foreground text-xs">Prioritize investments based on success probability</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="font-medium">Risk Mitigation</p>
                <p className="text-muted-foreground text-xs">Early intervention on failing pilots</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="font-medium">Stakeholder Reporting</p>
                <p className="text-muted-foreground text-xs">Automated executive updates</p>
              </div>
            </div>
          </div>

          {/* What This Is NOT */}
          <div>
            <h3 className="font-semibold text-sm text-destructive mb-2 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              What This Is NOT
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li>• Not a production-ready system — conceptual demonstration only</li>
              <li>• Not connected to live Mastercard data or systems</li>
              <li>• Not intended for actual business decisions without validation</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Built to demonstrate product intelligence capabilities for the VP Product, North America role
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};