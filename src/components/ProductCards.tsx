import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpRight, AlertCircle, TrendingUp, ArrowUpDown, User, Users, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { useProductMetrics } from "@/hooks/useProductMetrics";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterState } from "./FilterBar";
import { useMemo, useEffect, useState, useCallback } from "react";
import { TrendSparkline } from "./TrendSparkline";
import { RiskBadge } from "./RiskBadge";
import { useAccessibility } from "@/contexts/AccessibilityContext";

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
  switch (stage) {
    case "commercial":
      return "bg-success/10 text-success border-success/20";
    case "pilot":
      return "bg-chart-2/10 text-chart-2 border-chart-2/20";
    case "early_pilot":
      return "bg-primary/10 text-primary border-primary/20";
    case "concept":
      return "bg-muted text-muted-foreground border-border";
    case "sunset":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

const getLifecycleIcon = (stage: string) => {
  switch (stage) {
    case "commercial": return "🚀";
    case "pilot": return "🧪";
    case "early_pilot": return "🔬";
    case "concept": return "💡";
    case "sunset": return "🌅";
    default: return "📦";
  }
};

type SortOption = "name" | "readiness" | "risk" | "revenue" | "prediction";
type GroupOption = "none" | "stage" | "type" | "risk";

export const ProductCards = ({ 
  filters, 
  onFilteredProductsChange,
  selectedProducts = [],
  onToggleProduct,
  highlightedProductId
}: { 
  filters: FilterState;
  onFilteredProductsChange: (filtered: any[], total: number) => void;
  selectedProducts?: string[];
  onToggleProduct?: (productId: string) => void;
  highlightedProductId?: string | null;
}) => {
  const navigate = useNavigate();
  const { announceToScreenReader } = useAccessibility();
  const { data: products, isLoading } = useProducts();
  const [sortBy, setSortBy] = useState<SortOption>("readiness");
  const [groupBy, setGroupBy] = useState<GroupOption>("none");

  // Fetch metrics for all products to show sparklines
  const productsWithMetrics = useMemo(() => {
    if (!products) return [];
    return products;
  }, [products]);

  // Memoize sparkline data generation to prevent rerenders
  const getSparklineData = useCallback((productId: string, baseValue: number, type: 'readiness' | 'revenue') => {
    // Use product ID as seed for consistent random values
    const seed = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (index: number) => {
      const x = Math.sin(seed + index) * 10000;
      return x - Math.floor(x);
    };

    if (type === 'readiness') {
      return Array.from({ length: 6 }, (_, i) => ({
        value: Math.max(0, Math.min(100, baseValue + (random(i) - 0.5) * 15 - i * 2))
      })).reverse();
    } else {
      return Array.from({ length: 6 }, (_, i) => ({
        value: Math.max(0, baseValue + (random(i) - 0.3) * 5 - i * 0.5)
      })).reverse();
    }
  }, []);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    if (!productsWithMetrics) return [];

    // First filter
    let filtered = productsWithMetrics.filter((product) => {
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

      // Region filter
      if (filters.region !== "all" && product.region !== filters.region) {
        return false;
      }

      // Readiness score range filter
      const readinessScore = readiness?.readiness_score || 0;
      if (readinessScore < filters.readinessMin || readinessScore > filters.readinessMax) {
        return false;
      }

      return true;
    });

    // Then sort
    const sorted = [...filtered].sort((a, b) => {
      const aReadiness = Array.isArray(a.readiness) ? a.readiness[0] : a.readiness;
      const bReadiness = Array.isArray(b.readiness) ? b.readiness[0] : b.readiness;
      const aPrediction = Array.isArray(a.prediction) ? a.prediction[0] : a.prediction;
      const bPrediction = Array.isArray(b.prediction) ? b.prediction[0] : b.prediction;

      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "readiness":
          return (bReadiness?.readiness_score || 0) - (aReadiness?.readiness_score || 0);
        case "risk":
          const riskOrder = { high: 3, medium: 2, low: 1 };
          return (riskOrder[bReadiness?.risk_band as keyof typeof riskOrder] || 0) - 
                 (riskOrder[aReadiness?.risk_band as keyof typeof riskOrder] || 0);
        case "revenue":
          return (b.revenue_target || 0) - (a.revenue_target || 0);
        case "prediction":
          return (bPrediction?.success_probability || 0) - (aPrediction?.success_probability || 0);
        default:
          return 0;
      }
    });

    return sorted;
  }, [productsWithMetrics, filters, sortBy]);

  // Group products if grouping is enabled
  const groupedProducts = useMemo(() => {
    if (groupBy === "none") {
      return { "All Products": filteredAndSortedProducts };
    }

    const groups: Record<string, any[]> = {};
    
    filteredAndSortedProducts.forEach((product) => {
      const readiness = Array.isArray(product.readiness) ? product.readiness[0] : product.readiness;
      let groupKey = "";

      switch (groupBy) {
        case "stage":
          groupKey = getStageLabel(product.lifecycle_stage);
          break;
        case "type":
          groupKey = getProductTypeLabel(product.product_type);
          break;
        case "risk":
          groupKey = `${(readiness?.risk_band || "unknown").toUpperCase()} Risk`;
          break;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(product);
    });

    return groups;
  }, [filteredAndSortedProducts, groupBy]);

  // Update parent component with filtered products
  useEffect(() => {
    if (productsWithMetrics) {
      onFilteredProductsChange(filteredAndSortedProducts, productsWithMetrics.length);
    }
  }, [filteredAndSortedProducts, productsWithMetrics, onFilteredProductsChange]);

  if (isLoading) {
    return (
      <Card className="card-elegant lg:col-span-2 animate-in">
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
    <div className="lg:col-span-2 space-y-4">
      <Card className="card-elegant">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Product Portfolio</h2>
              <Badge variant="outline" className="text-sm" aria-label={`${filteredAndSortedProducts.length} products displayed`}>
                {filteredAndSortedProducts.length} Products
              </Badge>
            </div>
            
            {/* Sort and Group Controls */}
            <div className="flex flex-wrap gap-3" role="group" aria-label="Sort and group controls">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="w-[180px] h-9" aria-label="Sort products by">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="readiness">Readiness Score</SelectItem>
                    <SelectItem value="prediction">Success Prediction</SelectItem>
                    <SelectItem value="risk">Risk Level</SelectItem>
                    <SelectItem value="revenue">Revenue Target</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupOption)}>
                <SelectTrigger className="w-[180px] h-9" aria-label="Group products by">
                  <SelectValue placeholder="Group by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Grouping</SelectItem>
                  <SelectItem value="stage">Lifecycle Stage</SelectItem>
                  <SelectItem value="type">Product Type</SelectItem>
                  <SelectItem value="risk">Risk Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {filteredAndSortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-semibold mb-2">No products found</h4>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters to see more results
              </p>
            </div>
          ) : (
            Object.entries(groupedProducts).map(([groupName, groupProducts]) => (
              <div key={groupName}>
                {groupBy !== "none" && (
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    {groupName}
                    <Badge variant="outline" className="text-xs">{groupProducts.length}</Badge>
                  </h3>
                )}
                <div className="space-y-4">
                  {groupProducts.map((product) => {
                    const readiness = Array.isArray(product.readiness) ? product.readiness[0] : product.readiness;
                    const prediction = Array.isArray(product.prediction) ? product.prediction[0] : product.prediction;
                    const isSelected = selectedProducts.includes(product.id);
                    
                    // Use memoized sparkline data
                    const readinessTrend = getSparklineData(product.id, readiness?.readiness_score || 0, 'readiness');
                    const revenueTrend = getSparklineData(product.id, (product.revenue_target || 0) / 1000000, 'revenue');
                    
                    const isHighlighted = highlightedProductId === product.id;
                    
                    return (
                      <div
                        key={product.id}
                        className={`border rounded-lg p-4 hover:shadow-md transition-all duration-300 hover:border-primary/50 group relative ${
                          isSelected ? "ring-2 ring-primary border-primary" : ""
                        } ${
                          isHighlighted ? "ring-4 ring-primary/50 shadow-2xl shadow-primary/20 scale-[1.02] animate-in" : ""
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
                              aria-label={`Select ${product.name} for comparison`}
                            />
                          </div>
                        )}
                        <div 
                          onClick={() => {
                            navigate(`/product/${product.id}`);
                            announceToScreenReader(`Navigating to ${product.name} details`);
                          }}
                          className="cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              navigate(`/product/${product.id}`);
                              announceToScreenReader(`Navigating to ${product.name} details`);
                            }
                          }}
                          aria-label={`View details for ${product.name}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 pr-8">
                              <h4 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                                {product.name}
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{getProductTypeLabel(product.product_type)}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {product.region || "North America"}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <RiskBadge risk={readiness?.risk_band || "medium"} />
                              <Badge variant="outline" className={`${getStageColor(product.lifecycle_stage)} font-medium`}>
                                {getLifecycleIcon(product.lifecycle_stage)} {getStageLabel(product.lifecycle_stage)}
                              </Badge>
                            </div>
                          </div>

                          {/* Stakeholders Row */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3 pb-3 border-b">
                            <div className="flex items-center gap-1" title="Product Owner">
                              <User className="h-3 w-3" />
                              <span className="truncate max-w-[100px]">{product.owner_email?.split('@')[0] || 'Unassigned'}</span>
                            </div>
                            <div className="flex items-center gap-1" title="Engineering Lead">
                              <Users className="h-3 w-3" />
                              <span>{(product as any).engineering_lead || 'TBD'}</span>
                            </div>
                            <div className="flex items-center gap-1" title="Business Sponsor">
                              <span className="text-primary">$</span>
                              <span className="truncate max-w-[120px]">{(product as any).business_sponsor || 'TBD'}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Readiness</p>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <Progress 
                                    value={readiness?.readiness_score || 0} 
                                    className="h-2 flex-1" 
                                    aria-label={`Readiness: ${readiness?.readiness_score || 0}%`}
                                  />
                                  <span className="text-sm font-semibold">{readiness?.readiness_score || 0}%</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Success Prob.</p>
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-success" aria-hidden="true" />
                                <span className="text-sm font-semibold">
                                  {Math.round((prediction?.success_probability || 0) * 100)}%
                                </span>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Forecast</p>
                              <p className="text-sm font-bold text-primary">
                                ${product.revenue_target ? (product.revenue_target / 1000000).toFixed(1) : 0}M
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Actual vs Target</p>
                              {(() => {
                                // Mock actual revenue based on lifecycle stage (seeded by product ID for consistency)
                                const targetRev = product.revenue_target || 0;
                                const seed = product.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                                const seededRandom = ((Math.sin(seed) * 10000) % 1 + 1) % 1; // 0-1 range
                                const actualPercent = product.lifecycle_stage === 'commercial' ? 0.85 + seededRandom * 0.3 :
                                                      product.lifecycle_stage === 'pilot' ? 0.3 + seededRandom * 0.4 :
                                                      product.lifecycle_stage === 'early_pilot' ? 0.1 + seededRandom * 0.2 : 0;
                                const actualRev = targetRev * actualPercent;
                                const delta = targetRev > 0 ? ((actualRev / targetRev) * 100) - 100 : 0;
                                const isPositive = delta >= 0;
                                return (
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm font-semibold">${(actualRev / 1000000).toFixed(1)}M</span>
                                    <span className={`text-xs ${isPositive ? 'text-success' : 'text-destructive'}`}>
                                      ({isPositive ? '+' : ''}{delta.toFixed(0)}%)
                                    </span>
                                  </div>
                                );
                              })()}
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
                          
                          <div className="mt-4 pt-3 border-t flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              Updated: {product.updated_at ? new Date(product.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                            </p>
                            <div className="flex items-center gap-1 text-sm text-primary font-medium group-hover:gap-2 transition-all">
                              View Details
                              <ArrowUpRight className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
