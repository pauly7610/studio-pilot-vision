import { PortfolioMetrics } from "@/components/PortfolioMetrics";
import { RiskHeatmap } from "@/components/RiskHeatmap";
import { ProductCards } from "@/components/ProductCards";
import { ExecutiveBrief } from "@/components/ExecutiveBrief";
import { FeedbackIntelligence } from "@/components/FeedbackIntelligence";
import { FeedbackActionsTracker } from "@/components/FeedbackActionsTracker";
import { PortfolioActionTracker } from "@/components/PortfolioActionTracker";
import { RegionalPerformance } from "@/components/RegionalPerformance";
import { FilterBar, FilterState } from "@/components/FilterBar";
import { ComparisonModal } from "@/components/ComparisonModal";
import { AdvancedAnalytics } from "@/components/AdvancedAnalytics";
import { GovernanceRules } from "@/components/GovernanceRules";
import { AboutPlatformModal } from "@/components/AboutPlatformModal";
import { EvidenceBasedScaling } from "@/components/EvidenceBasedScaling";
import { PilotPhaseHeader } from "@/components/PilotPhaseHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, GitCompare, BarChart3, LayoutGrid, RefreshCw, FileText, Globe, MessageSquareWarning, ClipboardList, Store } from "lucide-react";
import { AccessibilityToolbar } from "@/components/AccessibilityToolbar";
import { useState, useRef } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useProductAlerts } from "@/hooks/useProductAlerts";
import { useQueryClient } from "@tanstack/react-query";
import { exportQuarterlyReport } from "@/lib/quarterlyReportExport";

const Index = () => {
  const queryClient = useQueryClient();
  const { data: allProducts } = useProducts();
  
  // Calculate actual metrics from data
  const totalProducts = allProducts?.length || 0;
  const highRiskProducts = allProducts?.filter(p => {
    const readiness = Array.isArray(p.readiness) ? p.readiness[0] : p.readiness;
    return readiness?.risk_band === 'high';
  }).length || 0;
  
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    productType: "all",
    lifecycleStage: "all",
    riskBand: "all",
    region: "all",
    readinessMin: 0,
    readinessMax: 100,
    governanceTier: "all",
  });

  const [filteredProductsData, setFilteredProductsData] = useState<{
    filtered: any[];
    total: number;
  }>({ filtered: [], total: 0 });

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const productCardsRef = useRef<HTMLDivElement>(null);

  const handleToggleProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        // Limit to 3 products
        if (prev.length >= 3) {
          return [...prev.slice(1), productId];
        }
        return [...prev, productId];
      }
    });
  };

  const selectedProductsData = (allProducts || []).filter((p) => 
    selectedProducts.includes(p.id)
  );

  const activeFilterCount = [
    filters.search !== "",
    filters.productType !== "all",
    filters.lifecycleStage !== "all",
    filters.riskBand !== "all",
    filters.region !== "all",
    filters.readinessMin !== 0 || filters.readinessMax !== 100,
    filters.governanceTier !== "all",
  ].filter(Boolean).length;

  // Enable real-time alerts for threshold crossings
  useProductAlerts(filteredProductsData.filtered, true);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["product-metrics"] });
  };

  const handleHighlightProduct = (productId: string) => {
    setHighlightedProductId(productId);
    
    // Auto-scroll to product cards section
    setTimeout(() => {
      productCardsRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
      
      // Clear highlight after 3 seconds
      setTimeout(() => setHighlightedProductId(null), 3000);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-sm" role="banner">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/mastercard-logo.svg" 
                alt="Mastercard" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Studio Intelligence Platform</h1>
                <p className="text-sm text-muted-foreground">North America Portfolio Command Center</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AccessibilityToolbar />
              <AboutPlatformModal />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="gap-2"
                aria-label="Refresh dashboard data"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Refresh
              </Button>
              <div className="text-right">
                <p className="text-sm font-medium">VP Product, North America</p>
                <p className="text-xs text-muted-foreground" aria-label="Last updated time">
                  Data updated: {new Date().toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: 'numeric', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-8" role="main">
        {/* Metrics Overview */}
        <section aria-label="Portfolio overview metrics">
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Portfolio Snapshot</h2>
          <PortfolioMetrics totalProducts={totalProducts} highRiskProducts={highRiskProducts} />
        </section>

        {/* Filter Bar */}
        <section aria-label="Product filters and comparison">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 w-full">
              <FilterBar 
                filters={filters} 
                onFilterChange={setFilters} 
                activeFilterCount={activeFilterCount}
                filteredProducts={filteredProductsData.filtered}
                totalProducts={filteredProductsData.total}
              />
            </div>
            {selectedProducts.length >= 2 && (
              <Button 
                onClick={() => setComparisonOpen(true)}
                className="shrink-0 w-full sm:w-auto gap-2"
                aria-label={`Compare ${selectedProducts.length} selected products`}
              >
                <GitCompare className="w-4 h-4" aria-hidden="true" />
                Compare Selected ({selectedProducts.length})
              </Button>
            )}
          </div>
          
          {/* Comparison hint */}
          {selectedProducts.length === 1 && (
            <p className="text-xs text-muted-foreground mt-2 text-center" role="status" aria-live="polite">
              Select one more product to enable comparison
            </p>
          )}
        </section>

        {/* Tabbed View - Dashboard, Regional, Feedback, Analytics */}
        <Tabs defaultValue="dashboard" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <TabsList className="grid w-full max-w-4xl grid-cols-6">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="actions" className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">Actions</span>
              </TabsTrigger>
              <TabsTrigger value="scaling" className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                <span className="hidden sm:inline">Scaling</span>
              </TabsTrigger>
              <TabsTrigger value="regional" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">Regional</span>
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex items-center gap-2">
                <MessageSquareWarning className="w-4 h-4" />
                <span className="hidden sm:inline">Feedback</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            </TabsList>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportQuarterlyReport(filteredProductsData.filtered)}
              className="gap-2 shrink-0"
            >
              <FileText className="h-4 w-4" />
              Export Q{Math.ceil((new Date().getMonth() + 1) / 3)} Report
            </Button>
          </div>

          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {/* Primary Analytics Grid */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6" aria-label="Risk analysis and executive brief">
              <RiskHeatmap 
                products={filteredProductsData.filtered} 
                onHighlightProduct={handleHighlightProduct}
              />
              <ExecutiveBrief products={filteredProductsData.filtered} />
            </section>

            {/* Pilot Phase Header - February 2025 Commencement */}
            <section aria-label="Pilot phase status">
              <PilotPhaseHeader 
                region="APAC - Singapore"
                startDate="February 3, 2025"
                phase="pilot"
              />
            </section>

            {/* Governance Rules */}
            <section aria-label="Governance rules">
              <GovernanceRules products={filteredProductsData.filtered} />
            </section>

            {/* Products Grid */}
            <section 
              ref={productCardsRef}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6" 
              aria-label="Product portfolio"
            >
              <ProductCards 
                filters={filters} 
                onFilteredProductsChange={(filtered, total) => {
                  setFilteredProductsData({ filtered, total });
                }}
                selectedProducts={selectedProducts}
                onToggleProduct={handleToggleProduct}
                highlightedProductId={highlightedProductId}
              />
              <FeedbackIntelligence />
            </section>
          </TabsContent>

          <TabsContent value="actions" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PortfolioActionTracker />
              <div className="space-y-6">
                <GovernanceRules products={filteredProductsData.filtered} />
                <ExecutiveBrief products={filteredProductsData.filtered} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="regional" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RegionalPerformance products={filteredProductsData.filtered} />
              <div className="space-y-6">
                <GovernanceRules products={filteredProductsData.filtered} />
                <ExecutiveBrief products={filteredProductsData.filtered} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scaling" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EvidenceBasedScaling />
              <div className="space-y-6">
                <GovernanceRules products={filteredProductsData.filtered} />
                <ExecutiveBrief products={filteredProductsData.filtered} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FeedbackActionsTracker />
              <FeedbackIntelligence />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AdvancedAnalytics products={filteredProductsData.filtered} />
          </TabsContent>
        </Tabs>

        {/* Comparison Modal */}
        <ComparisonModal
          open={comparisonOpen}
          onOpenChange={setComparisonOpen}
          products={selectedProductsData}
        />

        {/* Footer */}
        <footer className="pt-8 pb-4 text-center" role="contentinfo">
          <p className="text-xs text-muted-foreground">
            Mastercard Studio Intelligence Platform (MSIP) • Predictive Portfolio Intelligence v1.0
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Powered by AI-driven decision intelligence • Services → Foundry → Studio
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
