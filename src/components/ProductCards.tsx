import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpRight, AlertCircle, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterState } from "./FilterBar";
import { useMemo, useEffect } from "react";

const getProductTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    data_services: "Data & Services",
    payment_flows: "Payment Flows",
    core_products: "Core Products",
    partnerships: "Partnerships",
  };
  return typeMap[type] || type;
};

const getStageLabel = (stage: string) => {
  const stageMap: Record<string, string> = {
    concept: "Concept",
    early_pilot: "Early Pilot",
    pilot: "Pilot",
    commercial: "Commercial",
    sunset: "Sunset",
  };
  return stageMap[stage] || stage;
};

const getRiskColor = (risk: string) => {
  switch (risk) {
    case "LOW":
      return "bg-success/10 text-success border-success/20";
    case "MEDIUM":
      return "bg-warning/10 text-warning border-warning/20";
    case "HIGH":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getStageColor = (stage: string) => {
  if (stage === "Commercial") return "bg-primary/10 text-primary border-primary/20";
  if (stage === "Pilot") return "bg-chart-2/10 text-chart-2 border-chart-2/20";
  return "bg-muted text-muted-foreground border-border";
};

export const ProductCards = ({ 
  filters, 
  onFilteredProductsChange,
  selectedProducts = [],
  onToggleProduct
}: { 
  filters: FilterState;
  onFilteredProductsChange: (filtered: any[], total: number) => void;
  selectedProducts?: string[];
  onToggleProduct?: (productId: string) => void;
}) => {
  const navigate = useNavigate();
  const { data: products, isLoading } = useProducts();

  // Filter products based on filter state
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter((product) => {
      const readiness = Array.isArray(product.readiness) ? product.readiness[0] : product.readiness;
      
      // Search filter
      if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Product type filter
      if (filters.productType !== "all" && product.product_type !== filters.productType) {
        return false;
      }

      // Lifecycle stage filter
      if (filters.lifecycleStage !== "all" && product.lifecycle_stage !== filters.lifecycleStage) {
        return false;
      }

      // Risk band filter
      if (filters.riskBand !== "all" && readiness?.risk_band !== filters.riskBand) {
        return false;
      }

      // Readiness score range filter
      const readinessScore = readiness?.readiness_score || 0;
      if (readinessScore < filters.readinessMin || readinessScore > filters.readinessMax) {
        return false;
      }

      return true;
    });
  }, [products, filters]);

  // Update parent component with filtered products
  useEffect(() => {
    if (products) {
      onFilteredProductsChange(filteredProducts, products.length);
    }
  }, [filteredProducts, products, onFilteredProductsChange]);

  if (isLoading) {
    return (
      <Card className="card-elegant col-span-2 animate-in">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elegant col-span-2 animate-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Portfolio Products</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Showing {filteredProducts.length} of {products?.length || 0} products
            </p>
          </div>
          <button className="text-primary hover:text-primary-glow transition-colors flex items-center gap-1 text-sm font-medium">
            View All
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-semibold mb-2">No products found</h4>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters to see more results
            </p>
          </div>
        ) : (
          filteredProducts.map((product, index) => {
          const readiness = Array.isArray(product.readiness) ? product.readiness[0] : product.readiness;
          const prediction = Array.isArray(product.prediction) ? product.prediction[0] : product.prediction;
          const isSelected = selectedProducts.includes(product.id);
          
          return (
            <div
              key={index}
              className={`border rounded-lg p-4 hover:shadow-md transition-all duration-300 hover:border-primary/50 group relative ${
                isSelected ? "ring-2 ring-primary border-primary" : ""
              }`}
            >
              {onToggleProduct && (
                <div 
                  className="absolute top-4 right-4 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleProduct(product.id);
                  }}
                >
                  <Checkbox
                    checked={isSelected}
                    className="bg-card border-2"
                  />
                </div>
              )}
              <div 
                onClick={() => navigate(`/product/${product.id}`)}
                className="cursor-pointer"
              >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                    {product.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">{getProductTypeLabel(product.product_type)}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className={getRiskColor(readiness?.risk_band?.toUpperCase() || "MEDIUM")}>
                    {readiness?.risk_band?.toUpperCase() || "MEDIUM"}
                  </Badge>
                  <Badge variant="outline" className={getStageColor(product.lifecycle_stage)}>
                    {getStageLabel(product.lifecycle_stage)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Readiness Score</p>
                  <div className="flex items-center gap-2">
                    <Progress value={readiness?.readiness_score || 0} className="h-2" />
                    <span className="text-sm font-semibold">{readiness?.readiness_score || 0}%</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Success Prediction</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-sm font-semibold">{prediction?.success_probability || 0}%</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Target Revenue</p>
                  <p className="text-lg font-bold text-primary">
                    ${product.revenue_target ? (product.revenue_target / 1000000).toFixed(1) : 0}M
                  </p>
                </div>
              </div>

              {readiness?.risk_band === "high" && (
                <div className="mt-3 pt-3 border-t flex items-start gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-destructive">Risk Alert:</span> Low readiness score requires
                    immediate governance review
                  </p>
                </div>
              )}
              </div>
            </div>
          );
        })
        )}
      </CardContent>
    </Card>
  );
};
