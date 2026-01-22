import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, X, Download, FileSpreadsheet, FileText, Layers } from "lucide-react";
import { exportProductsToCSV, exportProductsToExcel, ExportProduct } from "@/lib/exportUtils";
import { toast } from "sonner";

export interface FilterState {
  search: string;
  productType: string;
  lifecycleStage: string;
  riskBand: string;
  region: string;
  readinessMin: number;
  readinessMax: number;
  governanceTier: string;
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  activeFilterCount: number;
  filteredProducts: ExportProduct[];
  totalProducts: number;
}

export const FilterBar = ({ 
  filters, 
  onFilterChange, 
  activeFilterCount, 
  filteredProducts,
  totalProducts 
}: FilterBarProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleClearFilters = () => {
    onFilterChange({
      search: "",
      productType: "all",
      lifecycleStage: "all",
      riskBand: "all",
      region: "all",
      readinessMin: 0,
      readinessMax: 100,
      governanceTier: "all",
    });
  };

  const handleExportCSV = () => {
    if (filteredProducts.length === 0) {
      toast.error("No products to export");
      return;
    }
    exportProductsToCSV(filteredProducts);
    toast.success(`Exported ${filteredProducts.length} products to CSV`);
  };

  const handleExportExcel = () => {
    if (filteredProducts.length === 0) {
      toast.error("No products to export");
      return;
    }
    exportProductsToExcel(filteredProducts);
    toast.success(`Exported ${filteredProducts.length} products to Excel`);
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const [showFilters, setShowFilters] = useState(false);

  return (
    <Card className="card-elegant animate-in">
      <CardContent className="pt-4 sm:pt-6 space-y-3 sm:space-y-4">
        {/* Top Bar with Export and Results Count */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{filteredProducts.length}</span>
              <span className="hidden xs:inline"> of </span>
              <span className="xs:hidden">/</span>
              <span className="font-semibold text-foreground">{totalProducts}</span>
              <span className="hidden sm:inline"> products</span>
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mobile filter toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden gap-1.5"
            >
              <Filter className="h-4 w-4" />
              <span className="text-xs">Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search - Always visible */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-10 h-9 text-sm"
            aria-label="Search products by name"
          />
        </div>

        {/* Filters - Collapsible on mobile, always visible on desktop */}
        <div className={`${showFilters ? 'block' : 'hidden'} md:block space-y-3`}>
          {/* Filter Grid - 2 columns on mobile, row on desktop */}
          <div className="grid grid-cols-2 md:flex md:flex-row gap-2 sm:gap-3">
            {/* Product Type */}
            <Select value={filters.productType} onValueChange={(value) => updateFilter("productType", value)}>
              <SelectTrigger className="w-full md:w-[160px] h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="data_services">Data & Services</SelectItem>
                <SelectItem value="payment_flows">Payment Flows</SelectItem>
                <SelectItem value="core_products">Core Products</SelectItem>
                <SelectItem value="partnerships">Partnerships</SelectItem>
              </SelectContent>
            </Select>

            {/* Lifecycle Stage */}
            <Select value={filters.lifecycleStage} onValueChange={(value) => updateFilter("lifecycleStage", value)}>
              <SelectTrigger className="w-full md:w-[140px] h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="concept">Concept</SelectItem>
                <SelectItem value="early_pilot">Early Pilot</SelectItem>
                <SelectItem value="pilot">Pilot</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="sunset">Sunset</SelectItem>
              </SelectContent>
            </Select>

            {/* Risk Band */}
            <Select value={filters.riskBand} onValueChange={(value) => updateFilter("riskBand", value)}>
              <SelectTrigger className="w-full md:w-[130px] h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>

            {/* Region Filter */}
            <Select value={filters.region} onValueChange={(value) => updateFilter("region", value)}>
              <SelectTrigger className="w-full md:w-[130px] h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="North America">N. America</SelectItem>
                <SelectItem value="EMEA">EMEA</SelectItem>
                <SelectItem value="APAC">APAC</SelectItem>
                <SelectItem value="Africa">Africa</SelectItem>
                <SelectItem value="Global">Global</SelectItem>
              </SelectContent>
            </Select>

            {/* Governance Tier Filter */}
            <Select value={filters.governanceTier} onValueChange={(value) => updateFilter("governanceTier", value)}>
              <SelectTrigger className="w-full md:w-[150px] h-9 text-xs sm:text-sm col-span-2 md:col-span-1">
                <div className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  <SelectValue placeholder="Tier" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="tier_1">Tier 1</SelectItem>
                <SelectItem value="tier_2">Tier 2</SelectItem>
                <SelectItem value="tier_3">Tier 3</SelectItem>
              </SelectContent>
            </Select>

            {/* Advanced Filters Toggle - Desktop only */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="hidden md:flex gap-2 h-9"
            >
              <Filter className="h-4 w-4" />
              Advanced
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="pt-3 sm:pt-4 border-t space-y-3 sm:space-y-4 animate-in">
            <div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <label className="text-xs sm:text-sm font-medium">
                  Readiness: {filters.readinessMin}% - {filters.readinessMax}%
                </label>
              </div>
              <Slider
                value={[filters.readinessMin, filters.readinessMax]}
                onValueChange={([min, max]) => {
                  updateFilter("readinessMin", min);
                  updateFilter("readinessMax", max);
                }}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between mt-1.5 text-[10px] sm:text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
            <span className="text-xs sm:text-sm text-muted-foreground">Active:</span>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
              {activeFilterCount}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="ml-auto gap-1.5 h-7 text-xs">
              <X className="h-3 w-3" />
              Clear
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
