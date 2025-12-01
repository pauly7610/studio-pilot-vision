import { PortfolioMetrics } from "@/components/PortfolioMetrics";
import { RiskHeatmap } from "@/components/RiskHeatmap";
import { ProductCards } from "@/components/ProductCards";
import { ExecutiveBrief } from "@/components/ExecutiveBrief";
import { FeedbackIntelligence } from "@/components/FeedbackIntelligence";
import { FilterBar, FilterState } from "@/components/FilterBar";
import { Sparkles } from "lucide-react";
import { useState } from "react";

const Index = () => {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    productType: "all",
    lifecycleStage: "all",
    riskBand: "all",
    readinessMin: 0,
    readinessMax: 100,
  });

  const activeFilterCount = [
    filters.search !== "",
    filters.productType !== "all",
    filters.lifecycleStage !== "all",
    filters.riskBand !== "all",
    filters.readinessMin !== 0 || filters.readinessMax !== 100,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Mastercard Studio Intelligence</h1>
                <p className="text-sm text-muted-foreground">North America Portfolio Command Center</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-medium">VP Product, North America</p>
                <p className="text-xs text-muted-foreground">Last updated: 2 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Metrics Overview */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Portfolio Snapshot</h2>
          <PortfolioMetrics />
        </section>

        {/* Filter Bar */}
        <section>
          <FilterBar filters={filters} onFilterChange={setFilters} activeFilterCount={activeFilterCount} />
        </section>

        {/* Primary Analytics Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RiskHeatmap />
          <ExecutiveBrief />
        </section>

        {/* Products & Feedback Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ProductCards filters={filters} />
          <FeedbackIntelligence />
        </section>

        {/* Footer */}
        <footer className="pt-8 pb-4 text-center">
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
