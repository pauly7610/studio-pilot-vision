import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Users, Activity, AlertCircle, Zap } from "lucide-react";
import { ProductMetric } from "@/hooks/useProductMetrics";
import { format, addMonths } from "date-fns";
import { forecastWithConfidence, calculateGrowthVelocity } from "@/lib/forecasting";

interface HistoricalPerformanceProps {
  metrics: ProductMetric[];
  revenueTarget?: number | null;
}

const calculateTrend = (data: ProductMetric[], field: keyof ProductMetric) => {
  if (data.length < 2) return { direction: "neutral", velocity: 0, change: 0 };
  
  const latest = data[data.length - 1];
  const previous = data[data.length - 2];
  
  const latestValue = latest[field] as number | null;
  const previousValue = previous[field] as number | null;
  
  if (!latestValue || !previousValue) return { direction: "neutral", velocity: 0, change: 0 };
  
  const change = latestValue - previousValue;
  const percentChange = (change / previousValue) * 100;
  
  return {
    direction: change > 0 ? "up" : change < 0 ? "down" : "neutral",
    velocity: Math.abs(percentChange),
    change: percentChange,
  };
};

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const formatNumber = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toFixed(0);
};

export const HistoricalPerformance = ({ metrics, revenueTarget }: HistoricalPerformanceProps) => {
  if (!metrics || metrics.length === 0) {
    return (
      <Card className="card-elegant">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Historical Data</h3>
            <p className="text-sm text-muted-foreground">
              Historical performance metrics are not yet available for this product.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate trends
  const revenueTrend = calculateTrend(metrics, "actual_revenue");
  const adoptionTrend = calculateTrend(metrics, "adoption_rate");
  const usersTrend = calculateTrend(metrics, "active_users");

  // Generate forecasts
  const revenueForecast = forecastWithConfidence(
    metrics.map((m) => ({ value: m.actual_revenue || 0 })),
    3,
    0.95
  );
  const usersForecast = forecastWithConfidence(
    metrics.map((m) => ({ value: m.active_users || 0 })),
    3,
    0.95
  );
  const adoptionForecast = forecastWithConfidence(
    metrics.map((m) => ({ value: m.adoption_rate || 0 })),
    3,
    0.95
  );

  // Calculate growth velocities
  const revenueVelocity = calculateGrowthVelocity(metrics.map((m) => ({ value: m.actual_revenue || 0 })));
  const usersVelocity = calculateGrowthVelocity(metrics.map((m) => ({ value: m.active_users || 0 })));

  // Format data for charts (historical + forecast)
  const lastDate = new Date(metrics[metrics.length - 1].date);
  
  const chartData = metrics.map((m) => ({
    date: format(new Date(m.date), "MMM yyyy"),
    revenue: m.actual_revenue || 0,
    target: revenueTarget || 0,
    adoption: m.adoption_rate || 0,
    users: m.active_users || 0,
    transactions: m.transaction_volume || 0,
    churn: m.churn_rate || 0,
    isPrediction: false,
  }));

  // Add forecast data points
  const forecastData = revenueForecast.predictions.map((pred, i) => ({
    date: format(addMonths(lastDate, i + 1), "MMM yyyy"),
    revenue: pred.y,
    revenueUpper: pred.upper,
    revenueLower: pred.lower,
    target: revenueTarget || 0,
    adoption: adoptionForecast.predictions[i]?.y || 0,
    adoptionUpper: adoptionForecast.predictions[i]?.upper || 0,
    adoptionLower: adoptionForecast.predictions[i]?.lower || 0,
    users: usersForecast.predictions[i]?.y || 0,
    usersUpper: usersForecast.predictions[i]?.upper || 0,
    usersLower: usersForecast.predictions[i]?.lower || 0,
    isPrediction: true,
  }));

  const combinedData = [...chartData, ...forecastData];

  // Latest metrics
  const latest = metrics[metrics.length - 1];
  const nextPeriodRevenue = revenueForecast.predictions[0]?.y || 0;

  return (
    <div className="space-y-6">
      {/* AI Forecast Summary */}
      <Card className="card-elegant bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                AI-Powered Forecast
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  95% Confidence
                </Badge>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Next Period Revenue Projection</p>
                  <p className="text-lg font-bold">{formatCurrency(nextPeriodRevenue)}</p>
                  <p className="text-xs text-muted-foreground">
                    Range: {formatCurrency(revenueForecast.predictions[0]?.lower || 0)} -{" "}
                    {formatCurrency(revenueForecast.predictions[0]?.upper || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Revenue Velocity</p>
                  <p className="text-lg font-bold flex items-center gap-1">
                    {revenueVelocity.velocity > 0 ? "+" : ""}
                    {revenueVelocity.velocity.toFixed(1)}%
                    {revenueVelocity.trend === "accelerating" && (
                      <TrendingUp className="h-4 w-4 text-success" />
                    )}
                    {revenueVelocity.trend === "decelerating" && (
                      <TrendingDown className="h-4 w-4 text-warning" />
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{revenueVelocity.trend}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Model Accuracy (R²)</p>
                  <p className="text-lg font-bold">{(revenueForecast.r2 * 100).toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">
                    {revenueForecast.r2 > 0.8 ? "High confidence" : "Moderate confidence"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trend Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-elegant">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Revenue Velocity</span>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">
                {formatCurrency(latest.actual_revenue || 0)}
              </div>
              {revenueTrend.direction !== "neutral" && (
                <Badge
                  variant="outline"
                  className={
                    revenueTrend.direction === "up"
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  }
                >
                  {revenueTrend.direction === "up" ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {revenueTrend.velocity.toFixed(1)}%
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {revenueTrend.change > 0 ? "+" : ""}
              {revenueTrend.change.toFixed(1)}% vs previous period
            </p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Adoption Momentum</span>
              <Activity className="h-4 w-4 text-chart-2" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{(latest.adoption_rate || 0).toFixed(1)}%</div>
              {adoptionTrend.direction !== "neutral" && (
                <Badge
                  variant="outline"
                  className={
                    adoptionTrend.direction === "up"
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  }
                >
                  {adoptionTrend.direction === "up" ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {adoptionTrend.velocity.toFixed(1)}%
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {adoptionTrend.change > 0 ? "+" : ""}
              {adoptionTrend.change.toFixed(1)}% rate change
            </p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">User Growth</span>
              <Users className="h-4 w-4 text-warning" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{formatNumber(latest.active_users || 0)}</div>
              {usersTrend.direction !== "neutral" && (
                <Badge
                  variant="outline"
                  className={
                    usersTrend.direction === "up"
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  }
                >
                  {usersTrend.direction === "up" ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {usersTrend.velocity.toFixed(1)}%
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {usersTrend.change > 0 ? "+" : ""}
              {usersTrend.change.toFixed(1)}% active users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue vs Target Chart with Forecast */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Revenue Trajectory & Forecast
            <Badge variant="outline" className="text-xs">3-Month Projection</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={combinedData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => {
                  if (name.includes("Upper") || name.includes("Lower")) {
                    return [formatCurrency(value), name];
                  }
                  return [formatCurrency(value), name];
                }}
              />
              <Legend />
              
              {/* Historical revenue */}
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Historical Revenue"
                strokeWidth={2}
                connectNulls
              />
              
              {/* Forecast with confidence interval */}
              <Area
                type="monotone"
                dataKey="revenueUpper"
                stroke="transparent"
                fill="hsl(var(--chart-2))"
                fillOpacity={0.1}
                name="Upper Confidence"
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="revenueLower"
                stroke="transparent"
                fill="hsl(var(--chart-2))"
                fillOpacity={0.1}
                name="Lower Confidence"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--chart-2))"
                strokeDasharray="3 3"
                name="Projected Revenue"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              
              {revenueTarget && (
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="hsl(var(--destructive))"
                  strokeDasharray="5 5"
                  name="Target"
                  dot={false}
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Shaded area represents 95% confidence interval • Dashed line shows projected trend
          </p>
        </CardContent>
      </Card>

      {/* Adoption & User Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-chart-2" />
              Adoption Rate Evolution & Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Legend />
                
                {/* Historical */}
                <Line
                  type="monotone"
                  dataKey="adoption"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
                  name="Historical Rate"
                  connectNulls
                />
                
                {/* Forecast */}
                <Line
                  type="monotone"
                  dataKey="adoption"
                  stroke="hsl(var(--warning))"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={false}
                  name="Projected Rate"
                  connectNulls
                />
                
                {/* Confidence bands */}
                <Area
                  type="monotone"
                  dataKey="adoptionUpper"
                  stroke="transparent"
                  fill="hsl(var(--warning))"
                  fillOpacity={0.1}
                  connectNulls
                />
                <Area
                  type="monotone"
                  dataKey="adoptionLower"
                  stroke="transparent"
                  fill="hsl(var(--warning))"
                  fillOpacity={0.1}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-warning" />
              User Growth Projection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={combinedData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => formatNumber(value)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => formatNumber(value)}
                />
                <Legend />
                
                {/* Historical users */}
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="hsl(var(--warning))"
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                  name="Historical Users"
                  strokeWidth={2}
                  connectNulls
                />
                
                {/* Forecast confidence bands */}
                <Area
                  type="monotone"
                  dataKey="usersUpper"
                  stroke="transparent"
                  fill="hsl(var(--success))"
                  fillOpacity={0.1}
                  connectNulls
                />
                <Area
                  type="monotone"
                  dataKey="usersLower"
                  stroke="transparent"
                  fill="hsl(var(--success))"
                  fillOpacity={0.1}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="hsl(var(--success))"
                  strokeDasharray="3 3"
                  name="Projected Users"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
