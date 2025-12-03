import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface Product {
  id: string;
  name: string;
  region: string;
  revenue_target: number | null;
  readiness?: any;
  prediction?: any;
}

interface RegionalPerformanceProps {
  products: Product[];
}

const REGION_COLORS: Record<string, string> = {
  "North America": "hsl(var(--primary))",
  "US": "hsl(var(--chart-1))",
  "Canada": "hsl(var(--chart-2))",
  "LATAM": "hsl(var(--chart-3))",
  "Global": "hsl(var(--chart-4))",
};

const chartConfig = {
  products: { label: "Products" },
  revenue: { label: "Revenue ($M)" },
  readiness: { label: "Avg Readiness" },
};

export const RegionalPerformance = ({ products }: RegionalPerformanceProps) => {
  const regionalData = useMemo(() => {
    const regionMap = new Map<string, {
      count: number;
      totalRevenue: number;
      totalReadiness: number;
      highRisk: number;
      avgSuccess: number;
      totalSuccess: number;
    }>();

    products.forEach((p) => {
      const region = p.region || "North America";
      const readiness = Array.isArray(p.readiness) ? p.readiness[0] : p.readiness;
      const prediction = Array.isArray(p.prediction) ? p.prediction[0] : p.prediction;
      
      const existing = regionMap.get(region) || {
        count: 0,
        totalRevenue: 0,
        totalReadiness: 0,
        highRisk: 0,
        avgSuccess: 0,
        totalSuccess: 0,
      };

      existing.count += 1;
      existing.totalRevenue += (p.revenue_target || 0) / 1_000_000;
      existing.totalReadiness += readiness?.readiness_score || 0;
      existing.totalSuccess += prediction?.success_probability || 0;
      if (readiness?.risk_band === "high") existing.highRisk += 1;

      regionMap.set(region, existing);
    });

    return Array.from(regionMap.entries()).map(([region, data]) => ({
      region,
      products: data.count,
      revenue: Math.round(data.totalRevenue * 10) / 10,
      avgReadiness: Math.round(data.totalReadiness / data.count),
      avgSuccess: Math.round(data.totalSuccess / data.count),
      highRisk: data.highRisk,
      fill: REGION_COLORS[region] || "hsl(var(--muted))",
    }));
  }, [products]);

  const comparisonData = useMemo(() => {
    const usData = regionalData.find(r => r.region === "US");
    const canadaData = regionalData.find(r => r.region === "Canada");
    
    if (!usData && !canadaData) return null;

    return {
      us: usData || { products: 0, revenue: 0, avgReadiness: 0, avgSuccess: 0, highRisk: 0 },
      canada: canadaData || { products: 0, revenue: 0, avgReadiness: 0, avgSuccess: 0, highRisk: 0 },
    };
  }, [regionalData]);

  const getTrendIcon = (usVal: number, caVal: number) => {
    if (usVal > caVal) return <TrendingUp className="h-3 w-3 text-success" />;
    if (usVal < caVal) return <TrendingDown className="h-3 w-3 text-destructive" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <Card className="card-elegant animate-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Regional Performance
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          North America portfolio distribution and performance by region
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Regional Distribution Chart */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Product Distribution</h4>
          <ChartContainer config={chartConfig} className="h-[180px] w-full">
            <PieChart>
              <Pie
                data={regionalData}
                dataKey="products"
                nameKey="region"
                cx="50%"
                cy="50%"
                outerRadius={60}
                innerRadius={30}
                label={({ region, products }) => `${region}: ${products}`}
                labelLine={false}
              >
                {regionalData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltipContent />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => <span className="text-xs">{value}</span>}
              />
            </PieChart>
          </ChartContainer>
        </div>

        {/* Revenue by Region Bar Chart */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Revenue Target by Region ($M)</h4>
          <ChartContainer config={chartConfig} className="h-[140px] w-full">
            <BarChart data={regionalData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="region" 
                width={80}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                {regionalData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>

        {/* US vs Canada Comparison */}
        {comparisonData && (comparisonData.us.products > 0 || comparisonData.canada.products > 0) && (
          <div>
            <h4 className="text-sm font-semibold mb-3">US vs Canada Comparison</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="font-medium text-muted-foreground">Metric</div>
              <div className="font-medium text-center">
                <Badge variant="outline" className="bg-chart-1/10">US</Badge>
              </div>
              <div className="font-medium text-center">
                <Badge variant="outline" className="bg-chart-2/10">Canada</Badge>
              </div>

              <div className="py-2 border-t">Products</div>
              <div className="py-2 border-t text-center font-semibold">
                {comparisonData.us.products}
              </div>
              <div className="py-2 border-t text-center font-semibold">
                {comparisonData.canada.products}
              </div>

              <div className="py-2 border-t flex items-center gap-1">
                Revenue ($M)
                {getTrendIcon(comparisonData.us.revenue, comparisonData.canada.revenue)}
              </div>
              <div className="py-2 border-t text-center font-semibold">
                ${comparisonData.us.revenue.toFixed(1)}
              </div>
              <div className="py-2 border-t text-center font-semibold">
                ${comparisonData.canada.revenue.toFixed(1)}
              </div>

              <div className="py-2 border-t flex items-center gap-1">
                Avg Readiness
                {getTrendIcon(comparisonData.us.avgReadiness, comparisonData.canada.avgReadiness)}
              </div>
              <div className="py-2 border-t text-center font-semibold">
                {comparisonData.us.avgReadiness}%
              </div>
              <div className="py-2 border-t text-center font-semibold">
                {comparisonData.canada.avgReadiness}%
              </div>

              <div className="py-2 border-t flex items-center gap-1">
                Avg Success Prob
                {getTrendIcon(comparisonData.us.avgSuccess, comparisonData.canada.avgSuccess)}
              </div>
              <div className="py-2 border-t text-center font-semibold">
                {comparisonData.us.avgSuccess}%
              </div>
              <div className="py-2 border-t text-center font-semibold">
                {comparisonData.canada.avgSuccess}%
              </div>

              <div className="py-2 border-t">High Risk</div>
              <div className="py-2 border-t text-center">
                <Badge variant="outline" className="bg-destructive/10 text-destructive text-xs">
                  {comparisonData.us.highRisk}
                </Badge>
              </div>
              <div className="py-2 border-t text-center">
                <Badge variant="outline" className="bg-destructive/10 text-destructive text-xs">
                  {comparisonData.canada.highRisk}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Regional Summary Cards */}
        <div className="grid grid-cols-2 gap-2">
          {regionalData.slice(0, 4).map((region) => (
            <div
              key={region.region}
              className="p-2.5 rounded-lg border bg-card/50"
              style={{ borderLeftColor: region.fill, borderLeftWidth: 3 }}
            >
              <p className="text-xs font-semibold">{region.region}</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-bold">{region.avgReadiness}%</span>
                <span className="text-xs text-muted-foreground">readiness</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {region.products} products • ${region.revenue}M
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
