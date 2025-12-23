import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpRight, AlertCircle, TrendingUp, ArrowUpDown, User, Users, MapPin, Shield, Clock, FileCheck, Scale, AlertTriangle, Target, Layers, CreditCard, Banknote, Zap, Bitcoin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { useProductMetrics } from "@/hooks/useProductMetrics";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterState } from "./FilterBar";
import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import { TrendSparkline } from "./TrendSparkline";
import { RiskBadge } from "./RiskBadge";
import { DataHealthScore } from "./DataHealthScore";
import { MomentumIndicator } from "./MomentumIndicator";
import { DependencyBadges, Dependency } from "./DependencyBadges";
import { ConfidenceScore } from "./ConfidenceScore";
import { MerchantSignal } from "./MerchantSignal";
import { EscalationPath } from "./EscalationPath";
import { TransitionReadiness } from "./TransitionReadiness";
import { DataFreshness } from "./DataFreshness";
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

type GatingStatus = "pii_privacy_review" | "franchise_compliance" | "regional_legal" | "ready_for_market" | "pending";

const getGatingStatusFromProduct = (gatingStatus: string | undefined, gatingStatusSince: string | undefined): { 
  status: GatingStatus; 
  label: string; 
  icon: typeof Shield;
  isBottleneck: boolean;
  weeksInStatus: number;
} => {
  const weeksInStatus = gatingStatusSince 
    ? Math.floor((Date.now() - new Date(gatingStatusSince).getTime()) / (1000 * 60 * 60 * 24 * 7))
    : 0;
  
  // Check if it's been more than 4 weeks in a legal/privacy review status
  const isBottleneck = weeksInStatus >= 4 && 
    (gatingStatus === "PII/Privacy Review" || gatingStatus === "Regional Legal");
  
  switch (gatingStatus) {
    case "PII/Privacy Review":
      return { status: "pii_privacy_review", label: "PII/Privacy Review", icon: Shield, isBottleneck, weeksInStatus };
    case "Franchise Compliance":
      return { status: "franchise_compliance", label: "Franchise Compliance", icon: Scale, isBottleneck, weeksInStatus };
    case "Regional Legal":
      return { status: "regional_legal", label: "Regional Legal", icon: MapPin, isBottleneck, weeksInStatus };
    case "Ready for Market":
      return { status: "ready_for_market", label: "Ready for Market", icon: FileCheck, isBottleneck: false, weeksInStatus };
    default:
      return { status: "pending", label: "Pending Review", icon: Clock, isBottleneck: false, weeksInStatus };
  }
};

const getGatingStatusColor = (status: GatingStatus) => {
  switch (status) {
    case "ready_for_market":
      return "bg-success/10 text-success border-success/30";
    case "pii_privacy_review":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "franchise_compliance":
      return "bg-chart-2/10 text-chart-2 border-chart-2/30";
    case "regional_legal":
      return "bg-warning/10 text-warning border-warning/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

const getSuccessMetricLabel = (metric: string | undefined, region: string) => {
  if (metric) return metric;
  // Default based on region - regional pilots vs global builds
  const regionalMarkets = ["Latin America", "Asia Pacific", "Europe", "Middle East"];
  return regionalMarkets.some(r => region?.includes(r)) 
    ? "Local Revenue Growth" 
    : "Scalability/Standardization";
};

type GovernanceTier = "tier_1" | "tier_2" | "tier_3";

const getGovernanceTierLabel = (tier: string | undefined): { label: string; shortLabel: string; color: string } => {
  switch (tier) {
    case "tier_1":
      return { label: "Tier 1: Regional Ideation", shortLabel: "T1", color: "bg-muted text-muted-foreground border-border" };
    case "tier_2":
      return { label: "Tier 2: Global Build/Studio", shortLabel: "T2", color: "bg-primary/10 text-primary border-primary/30" };
    case "tier_3":
      return { label: "Tier 3: Strategic Scale", shortLabel: "T3", color: "bg-success/10 text-success border-success/30" };
    default:
      return { label: "Unassigned", shortLabel: "—", color: "bg-muted text-muted-foreground border-border" };
  }
};

type RailType = "card" | "a2a" | "real_time" | "crypto";

const getRailTypeConfig = (railType: string | undefined): { label: string; icon: typeof CreditCard; color: string } => {
  switch (railType) {
    case "card":
      return { label: "Card", icon: CreditCard, color: "bg-chart-1/10 text-chart-1 border-chart-1/30" };
    case "a2a":
      return { label: "A2A", icon: Banknote, color: "bg-chart-2/10 text-chart-2 border-chart-2/30" };
    case "real_time":
      return { label: "Real-Time", icon: Zap, color: "bg-chart-3/10 text-chart-3 border-chart-3/30" };
    case "crypto":
      return { label: "Crypto", icon: Bitcoin, color: "bg-chart-4/10 text-chart-4 border-chart-4/30" };
    default:
      return { label: "Unknown", icon: CreditCard, color: "bg-muted text-muted-foreground border-border" };
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
  const productRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Scroll to highlighted product when highlightedProductId changes
  useEffect(() => {
    if (highlightedProductId) {
      const productElement = productRefs.current.get(highlightedProductId);
      if (productElement) {
        productElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }
  }, [highlightedProductId]);

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

      // Governance tier filter
      if (filters.governanceTier !== "all" && product.governance_tier !== filters.governanceTier) {
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
                    const gating = getGatingStatusFromProduct(product.gating_status, product.gating_status_since);
                    const GatingIcon = gating.icon;
                    const successMetric = getSuccessMetricLabel(product.success_metric, product.region);
                    const governanceTier = getGovernanceTierLabel(product.governance_tier);
                    const isSelected = selectedProducts.includes(product.id);
                    
                    // Get partner rail types
                    const partnerRails = (product.partners || [])
                      .filter((p: any) => p.rail_type)
                      .map((p: any) => ({ ...p, railConfig: getRailTypeConfig(p.rail_type) }));
                    
                    // Use memoized sparkline data
                    const readinessTrend = getSparklineData(product.id, readiness?.readiness_score || 0, 'readiness');
                    const revenueTrend = getSparklineData(product.id, (product.revenue_target || 0) / 1000000, 'revenue');
                    
                    const isHighlighted = highlightedProductId === product.id;
                    
                    return (
                      <div
                        key={product.id}
                        ref={(el) => {
                          if (el) {
                            productRefs.current.set(product.id, el);
                          }
                        }}
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
                            <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end items-center">
                              {/* Bottleneck Warning - 4+ weeks in Legal/Privacy */}
                              {gating.isBottleneck && (
                                <div className="flex items-center gap-1 text-warning" title={`${gating.weeksInStatus} weeks in ${gating.label}`}>
                                  <AlertTriangle className="h-4 w-4 animate-pulse" />
                                  <span className="text-xs font-medium">{gating.weeksInStatus}w</span>
                                </div>
                              )}
                              <Badge variant="outline" className={`${getGatingStatusColor(gating.status)} font-medium text-xs`}>
                                <GatingIcon className="h-3 w-3 mr-1" />
                                {gating.label}
                              </Badge>
                              {/* Governance Tier Badge */}
                              <Badge variant="outline" className={`${governanceTier.color} font-medium text-xs`} title={governanceTier.label}>
                                <Layers className="h-3 w-3 mr-1" />
                                {governanceTier.shortLabel}
                              </Badge>
                              {/* Bottleneck Warning - 4+ weeks in Legal/Privacy */}
                              {gating.isBottleneck && (
                                <div className="flex items-center gap-1 text-warning" title={`${gating.weeksInStatus} weeks in ${gating.label}`}>
                                  <AlertTriangle className="h-4 w-4 animate-pulse" />
                                  <span className="text-xs font-medium">{gating.weeksInStatus}w</span>
                                </div>
                              )}
                              <Badge variant="outline" className={`${getGatingStatusColor(gating.status)} font-medium text-xs`}>
                                <GatingIcon className="h-3 w-3 mr-1" />
                                {gating.label}
                              </Badge>
                              <RiskBadge risk={readiness?.risk_band || "medium"} />
                              <Badge variant="outline" className={`${getStageColor(product.lifecycle_stage)} font-medium`}>
                                {getLifecycleIcon(product.lifecycle_stage)} {getStageLabel(product.lifecycle_stage)}
                              </Badge>
                            </div>
                          </div>

                          {/* Rail Types Row (if has partner integrations) */}
                          {partnerRails.length > 0 && (
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                              <span className="text-xs text-muted-foreground">Rail Integration:</span>
                              <div className="flex gap-1.5 flex-wrap">
                                {partnerRails.slice(0, 4).map((partner: any, idx: number) => {
                                  const RailIcon = partner.railConfig.icon;
                                  return (
                                    <Badge 
                                      key={idx} 
                                      variant="outline" 
                                      className={`${partner.railConfig.color} text-xs`}
                                      title={`${partner.partner_name}: ${partner.railConfig.label}`}
                                    >
                                      <RailIcon className="h-3 w-3 mr-1" />
                                      {partner.railConfig.label}
                                    </Badge>
                                  );
                                })}
                                {partnerRails.length > 4 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{partnerRails.length - 4} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Success Metric & Stakeholders Row */}
                          <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground mb-3 pb-3 border-b">
                            <div className="flex items-center gap-4">
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
                            <div className="flex items-center gap-3">
                              {/* Data Health Score */}
                              <DataHealthScore 
                                product={{
                                  owner_email: product.owner_email,
                                  region: product.region,
                                  budget_code: product.budget_code,
                                  pii_flag: product.pii_flag,
                                  gating_status: product.gating_status,
                                  success_metric: product.success_metric,
                                }}
                                compact
                              />
                              {/* Merchant Signal - Customer Feedback */}
                              <MerchantSignal 
                                feedback={(product as any).feedback || []}
                                compact
                              />
                              {/* Data Freshness - Central Sync Status */}
                              <DataFreshness
                                lastUpdated={product.updated_at}
                                dataContractComplete={Boolean(product.owner_email && product.region && product.budget_code && product.gating_status)}
                                mandatoryFieldsFilled={[product.owner_email, product.region, product.budget_code, product.pii_flag, product.gating_status, product.success_metric].filter(Boolean).length}
                                totalMandatoryFields={6}
                                compact
                              />
                              {/* Escalation Path - Governance Trigger */}
                              <EscalationPath
                                riskBand={readiness?.risk_band || 'medium'}
                                gatingStatus={product.gating_status}
                                gatingStatusSince={product.gating_status_since}
                                lifecycleStage={product.lifecycle_stage}
                                compact
                              />
                              {/* Transition Readiness - BAU Handover */}
                              {(product.lifecycle_stage === 'commercial' || product.lifecycle_stage === 'pilot') && (
                                <TransitionReadiness
                                  productId={product.id}
                                  productName={product.name}
                                  lifecycleStage={product.lifecycle_stage}
                                  compact
                                />
                              )}
                              <div className="flex items-center gap-1 text-primary" title="Primary Success Metric">
                                <Target className="h-3 w-3" />
                                <span className="text-xs font-medium">{successMetric}</span>
                              </div>
                            </div>
                          </div>

                          {/* Dependencies Row - Blocker Flags */}
                          {(() => {
                            // Generate mock dependencies based on product characteristics
                            const seed = product.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                            const hasDeps = seed % 3 !== 0;
                            if (!hasDeps) return null;
                            
                            const mockDependencies: Dependency[] = [];
                            
                            // Add internal dependencies based on gating status
                            if (product.gating_status === 'PII/Privacy Review') {
                              mockDependencies.push({
                                id: `${product.id}-privacy`,
                                name: 'Privacy Review',
                                type: 'internal',
                                category: 'privacy',
                                status: 'pending',
                              });
                            }
                            if (product.gating_status === 'Regional Legal') {
                              mockDependencies.push({
                                id: `${product.id}-legal`,
                                name: 'Legal Approval',
                                type: 'internal',
                                category: 'legal',
                                status: gating.weeksInStatus >= 4 ? 'blocked' : 'pending',
                                blockedSince: gating.weeksInStatus >= 4 ? new Date(Date.now() - gating.weeksInStatus * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
                              });
                            }
                            
                            // Add external dependency for partner products
                            if (partnerRails.length > 0 && seed % 2 === 0) {
                              mockDependencies.push({
                                id: `${product.id}-partner`,
                                name: partnerRails[0]?.partner_name || 'Partner API',
                                type: 'external',
                                category: 'partner_rail',
                                status: seed % 5 === 0 ? 'blocked' : 'pending',
                                blockedSince: seed % 5 === 0 ? new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() : undefined,
                                notes: 'Waiting on partner API update',
                              });
                            }
                            
                            if (mockDependencies.length === 0) return null;
                            
                            return (
                              <div className="mb-3 pb-3 border-b">
                                <DependencyBadges dependencies={mockDependencies} compact />
                              </div>
                            );
                          })()}

                          <div className="grid grid-cols-5 gap-3">
                            {/* Readiness with Momentum Indicator */}
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
                                {/* Momentum Arrow */}
                                <MomentumIndicator
                                  data={readinessTrend}
                                  currentValue={readiness?.readiness_score || 0}
                                  previousValue={readinessTrend[readinessTrend.length - 2]?.value}
                                  label="Readiness"
                                  compact
                                />
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

                            {/* Forecast with Confidence Score */}
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Forecast</p>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-primary">
                                  ${product.revenue_target ? (product.revenue_target / 1000000).toFixed(1) : 0}M
                                </span>
                                <ConfidenceScore
                                  score={(product as any).revenue_confidence || (50 + (product.id.charCodeAt(0) % 40))}
                                  label="Revenue Confidence"
                                  showLabel={false}
                                  size="sm"
                                  associatedValue={`$${product.revenue_target ? (product.revenue_target / 1000000).toFixed(1) : 0}M`}
                                  associatedValueLabel="Revenue Forecast"
                                  justification={(product as any).revenue_confidence_justification}
                                />
                              </div>
                            </div>

                            {/* TTM Delta */}
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">TTM Velocity</p>
                              {(() => {
                                // Mock TTM data
                                const seed = product.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                                const ttmDelta = ((seed % 15) - 7); // -7 to +7 days
                                const isImproving = ttmDelta < 0;
                                return (
                                  <div className="flex items-center gap-1">
                                    <span className={`text-sm font-semibold ${isImproving ? 'text-success' : ttmDelta > 3 ? 'text-destructive' : 'text-warning'}`}>
                                      {ttmDelta > 0 ? '+' : ''}{ttmDelta}d
                                    </span>
                                    <span className="text-xs text-muted-foreground">vs last wk</span>
                                  </div>
                                );
                              })()}
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
