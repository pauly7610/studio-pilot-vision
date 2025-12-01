import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Product } from "@/hooks/useProducts";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Target } from "lucide-react";

interface AdvancedAnalyticsProps {
  products: Product[];
}

export function AdvancedAnalytics({ products }: AdvancedAnalyticsProps) {
  // Readiness Score Distribution (group by ranges)
  const readinessDistribution = () => {
    const ranges = [
      { label: "0-20%", min: 0, max: 20, count: 0 },
      { label: "21-40%", min: 21, max: 40, count: 0 },
      { label: "41-60%", min: 41, max: 60, count: 0 },
      { label: "61-80%", min: 61, max: 80, count: 0 },
      { label: "81-100%", min: 81, max: 100, count: 0 },
    ];

    products.forEach((product) => {
      const readiness = Array.isArray(product.readiness) ? product.readiness[0] : product.readiness;
      const score = readiness?.readiness_score || 0;
      const range = ranges.find((r) => score >= r.min && score <= r.max);
      if (range) range.count++;
    });

    return ranges.map(r => ({ name: r.label, count: r.count }));
  };

  // Risk Level Breakdown by Product Type
  const riskByProductType = () => {
    const data: any = {};
    
    products.forEach((product) => {
      const readiness = Array.isArray(product.readiness) ? product.readiness[0] : product.readiness;
      const type = product.product_type.replace(/_/g, " ");
      const risk = readiness?.risk_band || "unknown";

      if (!data[type]) {
        data[type] = { name: type, low: 0, medium: 0, high: 0 };
      }
      
      if (risk === "low") data[type].low++;
      else if (risk === "medium") data[type].medium++;
      else if (risk === "high") data[type].high++;
    });

    return Object.values(data);
  };

  // Revenue Projections by Product Type
  const revenueByType = () => {
    const data: any = {};

    products.forEach((product) => {
      const type = product.product_type.replace(/_/g, " ");
      const revenue = product.revenue_target || 0;

      if (!data[type]) {
        data[type] = { name: type, revenue: 0, count: 0 };
      }

      data[type].revenue += revenue;
      data[type].count++;
    });

    return Object.values(data).map((item: any) => ({
      name: item.name,
      revenue: (item.revenue / 1000000).toFixed(1), // Convert to millions
      avgRevenue: (item.revenue / item.count / 1000000).toFixed(1),
    }));
  };

  // Stage Progression Metrics
  const stageDistribution = () => {
    const stages: any = {
      concept: { name: "Concept", value: 0, color: "hsl(var(--chart-5))" },
      early_pilot: { name: "Early Pilot", value: 0, color: "hsl(var(--chart-4))" },
      pilot: { name: "Pilot", value: 0, color: "hsl(var(--chart-2))" },
      commercial: { name: "Commercial", value: 0, color: "hsl(var(--chart-3))" },
      sunset: { name: "Sunset", value: 0, color: "hsl(var(--muted))" },
    };

    products.forEach((product) => {
      if (stages[product.lifecycle_stage]) {
        stages[product.lifecycle_stage].value++;
      }
    });

    return Object.values(stages).filter((stage: any) => stage.value > 0);
  };

  // Success Probability Distribution
  const successProbabilityData = () => {
    const ranges = [
      { label: "0-20%", min: 0, max: 0.2, count: 0 },
      { label: "21-40%", min: 0.21, max: 0.4, count: 0 },
      { label: "41-60%", min: 0.41, max: 0.6, count: 0 },
      { label: "61-80%", min: 0.61, max: 0.8, count: 0 },
      { label: "81-100%", min: 0.81, max: 1.0, count: 0 },
    ];

    products.forEach((product) => {
      const prediction = Array.isArray(product.prediction) ? product.prediction[0] : product.prediction;
      const prob = prediction?.success_probability || 0;
      const range = ranges.find((r) => prob >= r.min && prob <= r.max);
      if (range) range.count++;
    });

    return ranges.map(r => ({ name: r.label, count: r.count }));
  };

  const readinessData = readinessDistribution();
  const riskData = riskByProductType();
  const revenueData = revenueByType();
  const stageData = stageDistribution();
  const successData = successProbabilityData();

  const COLORS = {
    primary: "hsl(var(--primary))",
    chart2: "hsl(var(--chart-2))",
    chart3: "hsl(var(--chart-3))",
    chart4: "hsl(var(--chart-4))",
    chart5: "hsl(var(--chart-5))",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Detailed insights for {products.length} products
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 text-primary">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm font-medium">{products.length} Products</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Readiness Score Distribution */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Readiness Score Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={readinessData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Bar dataKey="count" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stage Distribution Pie */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-chart-3" />
              Lifecycle Stage Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill={COLORS.primary}
                  dataKey="value"
                >
                  {stageData.map((entry: any, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Level by Product Type */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-destructive" />
              Risk Level Breakdown by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 11 }}
                  angle={-15}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Legend />
                <Bar dataKey="low" stackId="risk" fill={COLORS.chart3} name="Low Risk" />
                <Bar dataKey="medium" stackId="risk" fill={COLORS.chart4} name="Medium Risk" />
                <Bar dataKey="high" stackId="risk" fill="hsl(var(--destructive))" name="High Risk" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Projections */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-chart-3" />
              Revenue Projections by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 11 }}
                  angle={-15}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  label={{ value: 'Revenue (M)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  formatter={(value: any) => [`$${value}M`, '']}
                />
                <Bar dataKey="revenue" fill={COLORS.chart3} radius={[8, 8, 0, 0]} name="Total Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Success Probability Distribution */}
        <Card className="card-elegant lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-chart-3" />
              Success Probability Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={successData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke={COLORS.chart3}
                  fill={COLORS.chart3}
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-elegant">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Avg Readiness</p>
              <p className="text-3xl font-bold text-primary">
                {products.length > 0
                  ? (
                      products.reduce((acc, p) => {
                        const r = Array.isArray(p.readiness) ? p.readiness[0] : p.readiness;
                        return acc + (r?.readiness_score || 0);
                      }, 0) / products.length
                    ).toFixed(1)
                  : 0}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">High Risk Products</p>
              <p className="text-3xl font-bold text-destructive">
                {products.filter((p) => {
                  const r = Array.isArray(p.readiness) ? p.readiness[0] : p.readiness;
                  return r?.risk_band === "high";
                }).length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Revenue Target</p>
              <p className="text-3xl font-bold text-chart-3">
                $
                {(
                  products.reduce((acc, p) => acc + (p.revenue_target || 0), 0) / 1000000
                ).toFixed(1)}M
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Commercial Products</p>
              <p className="text-3xl font-bold text-chart-2">
                {products.filter((p) => p.lifecycle_stage === "commercial").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}