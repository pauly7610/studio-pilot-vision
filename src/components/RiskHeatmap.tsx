import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Product } from "@/hooks/useProducts";

interface RiskHeatmapProps {
  products: Product[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-1">{data.name}</p>
        <p className="text-sm text-muted-foreground">Revenue: ${data.revenue}M</p>
        <p className="text-sm text-muted-foreground">Risk Score: {data.risk}</p>
        <p className="text-sm text-muted-foreground">Readiness: {data.readiness}%</p>
        <p className="text-xs text-primary mt-1">{data.stage}</p>
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

export const RiskHeatmap = ({ products }: RiskHeatmapProps) => {
  // Transform products into chart data
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
      name: product.name,
      revenue: parseFloat(revenue.toFixed(2)),
      risk: Math.round(risk),
      readiness: Math.round(readinessScore),
      stage: getStageLabel(product.lifecycle_stage),
    };
  });

  return (
    <Card className="card-elegant col-span-2 animate-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Revenue vs Risk Analysis</CardTitle>
            <CardDescription>Portfolio positioning by commercial value and execution risk</CardDescription>
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
            <Tooltip content={<CustomTooltip />} />
            <Scatter name="Products" data={chartData}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getRiskColor(entry.risk)} opacity={0.8} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};