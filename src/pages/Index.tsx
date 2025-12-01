import { PortfolioMetrics } from "@/components/PortfolioMetrics";
import { RiskHeatmap } from "@/components/RiskHeatmap";
import { ProductCards } from "@/components/ProductCards";
import { ExecutiveBrief } from "@/components/ExecutiveBrief";
import { FeedbackIntelligence } from "@/components/FeedbackIntelligence";
import { FilterBar, FilterState } from "@/components/FilterBar";
import { ComparisonModal } from "@/components/ComparisonModal";
import { AdvancedAnalytics } from "@/components/AdvancedAnalytics";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, GitCompare, BarChart3, LayoutGrid, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useProductAlerts } from "@/hooks/useProductAlerts";
import { useQueryClient } from "@tanstack/react-query";

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
    readinessMin: 0,
    readinessMax: 100,
  });

  const [filteredProductsData, setFilteredProductsData] = useState<{
    filtered: any[];
    total: number;
  }>({ filtered: [], total: 0 });

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);

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
    filters.readinessMin !== 0 || filters.readinessMax !== 100,
  ].filter(Boolean).length;

  // Enable real-time alerts for threshold crossings
  useProductAlerts(filteredProductsData.filtered, true);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["product-metrics"] });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-sm" role="banner">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center" aria-hidden="true">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Mastercard Studio Intelligence</h1>
                <p className="text-sm text-muted-foreground">North America Portfolio Command Center</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
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

        {/* Tabbed View - Dashboard vs Analytics */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Advanced Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {/* Primary Analytics Grid */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6" aria-label="Risk analysis and executive brief">
              <RiskHeatmap products={filteredProductsData.filtered} />
              <ExecutiveBrief products={filteredProductsData.filtered} />
            </section>

            {/* Products & Feedback Grid */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6" aria-label="Product portfolio and customer feedback">
              <ProductCards 
                filters={filters} 
                onFilteredProductsChange={(filtered, total) => {
                  setFilteredProductsData({ filtered, total });
                }}
                selectedProducts={selectedProducts}
                onToggleProduct={handleToggleProduct}
              />
              <FeedbackIntelligence />
            </section>
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
