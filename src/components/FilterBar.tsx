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
import { Search, Filter, X, Download, FileSpreadsheet, FileText } from "lucide-react";
import { exportProductsToCSV, exportProductsToExcel, ExportProduct } from "@/lib/exportUtils";
import { toast } from "sonner";

export interface FilterState {
  search: string;
  productType: string;
  lifecycleStage: string;
  riskBand: string;
  readinessMin: number;
  readinessMax: number;
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
      readinessMin: 0,
      readinessMax: 100,
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

  return (
    <Card className="card-elegant animate-in">
      <CardContent className="pt-6 space-y-4">
        {/* Top Bar with Export and Results Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredProducts.length}</span> of{" "}
              <span className="font-semibold text-foreground">{totalProducts}</span> products
            </span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
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

        {/* Search and Quick Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Product Type */}
          <Select value={filters.productType} onValueChange={(value) => updateFilter("productType", value)}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Product Type" />
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
            <SelectTrigger className="w-full md:w-[200px]">
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
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
            </SelectContent>
          </Select>

          {/* Advanced Filters Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Advanced
          </Button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="pt-4 border-t space-y-4 animate-in">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium">
                  Readiness Score Range: {filters.readinessMin}% - {filters.readinessMax}%
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
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {activeFilterCount} applied
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="ml-auto gap-2">
              <X className="h-3 w-3" />
              Clear All
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
