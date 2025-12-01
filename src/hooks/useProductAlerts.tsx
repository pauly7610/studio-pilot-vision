import { useEffect, useRef } from "react";
import { Product } from "./useProducts";
import { toast } from "sonner";
import { AlertTriangle, TrendingDown, CheckCircle } from "lucide-react";

interface AlertThresholds {
  readinessScoreCritical: number;
  readinessScoreWarning: number;
  successProbabilityCritical: number;
}

const DEFAULT_THRESHOLDS: AlertThresholds = {
  readinessScoreCritical: 60,
  readinessScoreWarning: 75,
  successProbabilityCritical: 50,
};

export const useProductAlerts = (products: Product[], enabled: boolean = true) => {
  const previousProducts = useRef<Product[]>([]);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Skip on first load to avoid flooding with alerts
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      previousProducts.current = products;
      return;
    }

    if (!enabled || products.length === 0) return;

    // Check for threshold crossings
    products.forEach((product) => {
      const prevProduct = previousProducts.current.find((p) => p.id === product.id);
      if (!prevProduct) return;

      // Handle readiness as object (not array)
      const currentReadiness = product.readiness?.readiness_score || 
        (Array.isArray(product.readiness) && product.readiness[0]?.readiness_score) || 0;
      const prevReadiness = prevProduct.readiness?.readiness_score || 
        (Array.isArray(prevProduct.readiness) && prevProduct.readiness[0]?.readiness_score) || 0;

      const currentSuccess = (Array.isArray(product.prediction) ? product.prediction[0] : product.prediction)?.success_probability || 0;
      const prevSuccess = (Array.isArray(prevProduct.prediction) ? prevProduct.prediction[0] : prevProduct.prediction)?.success_probability || 0;

      const currentRisk = product.readiness?.risk_band || 
        (Array.isArray(product.readiness) && product.readiness[0]?.risk_band) || 'high';
      const prevRisk = prevProduct.readiness?.risk_band || 
        (Array.isArray(prevProduct.readiness) && prevProduct.readiness[0]?.risk_band) || 'high';

      // Critical: Readiness dropped below 60%
      if (
        currentReadiness < DEFAULT_THRESHOLDS.readinessScoreCritical &&
        prevReadiness >= DEFAULT_THRESHOLDS.readinessScoreCritical
      ) {
        toast.error(`${product.name}: Readiness dropped to ${Math.round(currentReadiness)}%`, {
          description: "Critical threshold crossed - immediate intervention required",
          icon: <AlertTriangle className="h-5 w-5" />,
          duration: 8000,
        });
      }

      // Warning: Readiness dropped below 75%
      if (
        currentReadiness < DEFAULT_THRESHOLDS.readinessScoreWarning &&
        prevReadiness >= DEFAULT_THRESHOLDS.readinessScoreWarning &&
        currentReadiness >= DEFAULT_THRESHOLDS.readinessScoreCritical
      ) {
        toast.warning(`${product.name}: Readiness declined to ${Math.round(currentReadiness)}%`, {
          description: "Monitor closely for further degradation",
          icon: <TrendingDown className="h-5 w-5" />,
          duration: 6000,
        });
      }

      // Critical: Success probability dropped below 50%
      if (
        currentSuccess < DEFAULT_THRESHOLDS.successProbabilityCritical &&
        prevSuccess >= DEFAULT_THRESHOLDS.successProbabilityCritical
      ) {
        toast.error(`${product.name}: Success probability at ${Math.round(currentSuccess)}%`, {
          description: "High risk of launch failure detected",
          icon: <AlertTriangle className="h-5 w-5" />,
          duration: 8000,
        });
      }

      // Risk band escalation
      if (currentRisk === 'high' && prevRisk !== 'high') {
        toast.error(`${product.name}: Escalated to HIGH risk band`, {
          description: "Governance review recommended",
          icon: <AlertTriangle className="h-5 w-5" />,
          duration: 8000,
        });
      }

      // Positive: Improvement to low risk
      if (currentRisk === 'low' && prevRisk !== 'low') {
        toast.success(`${product.name}: Improved to LOW risk band`, {
          description: "Product meeting launch readiness standards",
          icon: <CheckCircle className="h-5 w-5" />,
          duration: 5000,
        });
      }
    });

    previousProducts.current = products;
  }, [products, enabled]);
};
