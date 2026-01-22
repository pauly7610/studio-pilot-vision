import { PortfolioMetrics } from "@/components/PortfolioMetrics";
import { RiskMetrics } from "@/components/RiskMetrics";
import { AIInsightsPanel } from "@/components/AIInsightsPanel";
import { RiskHeatmap } from "@/components/RiskHeatmap";
import { ProductCards } from "@/components/ProductCards";
import { ExecutiveBrief } from "@/components/ExecutiveBrief";
import { FeedbackIntelligence } from "@/components/FeedbackIntelligence";
import { FeedbackActionsTracker } from "@/components/FeedbackActionsTracker";
import { FeedbackAnalytics } from "@/components/FeedbackAnalytics";
import { PortfolioActionTracker } from "@/components/PortfolioActionTracker";
import { RegionalPerformance } from "@/components/RegionalPerformance";
import { FilterBar, FilterState } from "@/components/FilterBar";
import { ComparisonModal } from "@/components/ComparisonModal";
import { AdvancedAnalytics } from "@/components/AdvancedAnalytics";
import { GovernanceRules } from "@/components/GovernanceRules";
import { AboutPlatformModal } from "@/components/AboutPlatformModal";
import { EvidenceBasedScaling } from "@/components/EvidenceBasedScaling";
import { PilotPhaseHeader } from "@/components/PilotPhaseHeader";
import { BusinessCaseCalculator } from "@/components/BusinessCaseCalculator";
import { CogneeInsights } from "@/components/CogneeInsights";
import { AIErrorBoundary } from "@/components/AIErrorBoundary";
import { AddProductDialog } from "@/components/AddProductDialog";
import { BulkDocumentUpload } from "@/components/BulkDocumentUpload";
import { CommandPalette, CommandPaletteTrigger } from "@/components/CommandPalette";
import { SyncStatusIndicator } from "@/components/SyncStatusIndicator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, GitCompare, BarChart3, LayoutGrid, RefreshCw, FileText, Globe, MessageSquareWarning, ClipboardList, Store, Download, Brain, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AccessibilityToolbar } from "@/components/AccessibilityToolbar";
import { useState, useRef } from "react";
import { useProducts, Product } from "@/hooks/useProducts";
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
    filtered: Product[];
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
        <div className="container mx-auto px-3 sm:px-6 py-2 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Logo & Title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <img 
                src="/mastercard-logo.svg" 
                alt="Mastercard" 
                className="h-7 sm:h-10 w-auto shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-base sm:text-2xl font-bold tracking-tight truncate">Studio Intelligence</h1>
                <p className="text-[10px] sm:text-sm text-muted-foreground hidden sm:block">North America Portfolio Command Center</p>
              </div>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <CommandPaletteTrigger />
              <SyncStatusIndicator />
              <AccessibilityToolbar />
              <AboutPlatformModal />
              <AddProductDialog />
              <BulkDocumentUpload />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => exportQuarterlyReport(filteredProductsData.filtered)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Q{Math.ceil((new Date().getMonth() + 1) / 3)} Portfolio Report (PDF)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    const data = JSON.stringify(filteredProductsData.filtered, null, 2);
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `portfolio-data-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Raw Data (JSON)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
              <div className="text-right hidden lg:block">
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

            {/* Mobile Actions - Condensed Menu */}
            <div className="flex md:hidden items-center gap-1 shrink-0">
              <SyncStatusIndicator />
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleRefresh}
                className="h-8 w-8"
                aria-label="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <CommandPaletteTrigger className="w-full justify-start" />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => exportQuarterlyReport(filteredProductsData.filtered)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export Q{Math.ceil((new Date().getMonth() + 1) / 3)} Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    const data = JSON.stringify(filteredProductsData.filtered, null, 2);
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `portfolio-data-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="p-0">
                    <AboutPlatformModal />
                  </DropdownMenuItem>
                  <DropdownMenuItem className="p-0">
                    <AddProductDialog />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-8" role="main">
        {/* Metrics Overview */}
        <section aria-label="Portfolio overview metrics">
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Portfolio Snapshot</h2>
          <PortfolioMetrics totalProducts={totalProducts} highRiskProducts={highRiskProducts} />
        </section>

        {/* Risk Metrics - Revenue at Risk, Escalation Cost, Decision Impact */}
        {filteredProductsData.filtered.length > 0 && (
          <section aria-label="Risk metrics and impact analysis">
            <h2 className="text-lg font-semibold mb-4 text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Risk Intelligence
            </h2>
            <RiskMetrics products={filteredProductsData.filtered} />
          </section>
        )}

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
          <div className="flex flex-col gap-3">
            {/* Scrollable tabs container for mobile */}
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
              <TabsList className="inline-flex gap-1 h-auto p-1 min-w-max sm:flex-wrap">
                <TabsTrigger value="dashboard" className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm">
                  <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline sm:inline">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="actions" className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm">
                  <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline sm:inline">Actions</span>
                </TabsTrigger>
                <TabsTrigger value="scaling" className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm">
                  <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline sm:inline">Scaling</span>
                </TabsTrigger>
                <TabsTrigger value="regional" className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm">
                  <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline sm:inline">Regional</span>
                </TabsTrigger>
                <TabsTrigger value="feedback" className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm">
                  <MessageSquareWarning className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline sm:inline">Feedback</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm">
                  <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline sm:inline">Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="ai-insights" className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm">
                  <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline sm:inline">AI</span>
                </TabsTrigger>
                <TabsTrigger value="business-case" className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm">
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline sm:inline">Case</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportQuarterlyReport(filteredProductsData.filtered)}
              className="gap-2 shrink-0 self-start hidden sm:flex"
            >
              <FileText className="h-4 w-4" />
              Export Q{Math.ceil((new Date().getMonth() + 1) / 3)} Report
            </Button>
          </div>

          <TabsContent value="dashboard" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            {/* Primary Analytics Grid */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6" aria-label="Risk analysis and executive brief">
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
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" 
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

          <TabsContent value="actions" className="mt-4 sm:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <PortfolioActionTracker />
              <div className="space-y-4 sm:space-y-6">
                <GovernanceRules products={filteredProductsData.filtered} />
                <ExecutiveBrief products={filteredProductsData.filtered} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="regional" className="mt-4 sm:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <RegionalPerformance products={filteredProductsData.filtered} />
              <div className="space-y-4 sm:space-y-6">
                <GovernanceRules products={filteredProductsData.filtered} />
                <ExecutiveBrief products={filteredProductsData.filtered} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scaling" className="mt-4 sm:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <EvidenceBasedScaling />
              <div className="space-y-4 sm:space-y-6">
                <GovernanceRules products={filteredProductsData.filtered} />
                <ExecutiveBrief products={filteredProductsData.filtered} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="mt-4 sm:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <FeedbackActionsTracker />
              <FeedbackIntelligence />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-4 sm:mt-6">
            <AdvancedAnalytics products={filteredProductsData.filtered} />
          </TabsContent>

          <TabsContent value="ai-insights" className="mt-4 sm:mt-6">
            <AIErrorBoundary fallbackTitle="AI Insights">
              <CogneeInsights />
            </AIErrorBoundary>
          </TabsContent>

          <TabsContent value="business-case" className="mt-4 sm:mt-6">
            <BusinessCaseCalculator />
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

      {/* Global Command Palette */}
      <CommandPalette />
    </div>
  );
};

export default Index;
