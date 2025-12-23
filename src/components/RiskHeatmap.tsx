import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Product } from "@/hooks/useProducts";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface RiskHeatmapProps {
  products: Product[];
  onHighlightProduct?: (productId: string) => void;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border-2 border-primary/20 rounded-lg p-4 shadow-xl max-w-xs">
        <p className="font-bold text-lg mb-2">{data.name}</p>
        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Revenue Target:</span>
            <span className="text-sm font-semibold text-chart-3">${data.revenue}M</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Risk Score:</span>
            <span className={`text-sm font-semibold ${data.risk >= 60 ? 'text-destructive' : data.risk >= 30 ? 'text-warning' : 'text-success'}`}>
              {data.risk}/100
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Readiness:</span>
            <span className="text-sm font-semibold text-primary">{data.readiness}%</span>
          </div>
        </div>
        <div className="pt-2 border-t border-border">
          <p className="text-xs font-medium text-primary mb-1">{data.stage}</p>
        </div>
      </div>
    );
  }
  return null;
};

const getRiskColor = (risk: number) => {
  if (risk < 30) return "hsl(var(--success))";
  if (risk < 60) return "hsl(var(--warning))";
  return "hsl(var(--destructive))";
};

const getStageLabel = (stage: string) => {
  const labels: Record<string, string> = {
    concept: "Concept",
    early_pilot: "Early Pilot",
    pilot: "Pilot",
    commercial: "Commercial",
    sunset: "Sunset",
  };
  return labels[stage] || stage;
};

export const RiskHeatmap = ({ products, onHighlightProduct }: RiskHeatmapProps) => {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Transform products into chart data with product IDs
  const chartData = products.map((product) => {
    // Handle readiness as either object or array
    let readinessScore = 0;
    if (product.readiness) {
      if (Array.isArray(product.readiness)) {
        readinessScore = product.readiness[0]?.readiness_score || 0;
      } else {
        readinessScore = product.readiness.readiness_score || 0;
      }
    }
    
    // Calculate risk as inverse of readiness (higher readiness = lower risk)
    const risk = 100 - readinessScore;
    
    // Revenue in millions
    const revenue = product.revenue_target ? product.revenue_target / 1_000_000 : 0;
    
    return {
      id: product.id,
      name: product.name,
      revenue: parseFloat(revenue.toFixed(2)),
      risk: Math.round(risk),
      readiness: Math.round(readinessScore),
      stage: getStageLabel(product.lifecycle_stage),
    };
  });

  const handleScatterClick = (data: any) => {
    if (!data || !data.payload) return;
    const entry = data.payload;
    setSelectedProduct(entry);
  };

  return (
    <Card className="card-elegant col-span-2 animate-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Revenue vs Risk Analysis</CardTitle>
            <CardDescription>Portfolio positioning by commercial value and execution risk • Click to drill down</CardDescription>
          </div>
          <p className="text-xs text-muted-foreground">
            Updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              type="number" 
              dataKey="revenue" 
              name="Revenue"
              unit="M"
              label={{ value: 'Revenue ($M)', position: 'bottom', fill: 'hsl(var(--foreground))' }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              type="number" 
              dataKey="risk" 
              name="Risk"
              label={{ value: 'Risk Score', angle: -90, position: 'left', fill: 'hsl(var(--foreground))' }}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter 
              name="Products" 
              data={chartData}
              onClick={handleScatterClick}
              style={{ cursor: 'pointer' }}
              aria-label="Product portfolio scatter plot - click to highlight"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getRiskColor(entry.risk)} 
                  opacity={selectedProduct?.id === entry.id ? 1 : 0.75}
                  stroke={selectedProduct?.id === entry.id ? "hsl(var(--primary))" : "none"}
                  strokeWidth={selectedProduct?.id === entry.id ? 3 : 0}
                  className="hover:opacity-100 transition-all"
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* Persistent Selected Product Tooltip */}
        {selectedProduct && (
          <div className="mt-4 p-4 border-2 border-primary/30 rounded-lg bg-card/50 backdrop-blur-sm animate-in fade-in-50 duration-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-bold text-lg mb-3">{selectedProduct.name}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Revenue Target</p>
                    <p className="text-sm font-semibold text-chart-3">${selectedProduct.revenue}M</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Risk Score</p>
                    <p className={`text-sm font-semibold ${
                      selectedProduct.risk >= 60 ? 'text-destructive' : 
                      selectedProduct.risk >= 30 ? 'text-warning' : 
                      'text-success'
                    }`}>
                      {selectedProduct.risk}/100
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Readiness</p>
                    <p className="text-sm font-semibold text-primary">{selectedProduct.readiness}%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Stage</p>
                    <p className="text-sm font-semibold">{selectedProduct.stage}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close product preview"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};