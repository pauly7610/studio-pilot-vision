import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const products = [
  { name: "Digital Wallet API", revenue: 4.2, risk: 25, readiness: 92, stage: "Commercial" },
  { name: "Fraud Detection ML", revenue: 3.8, risk: 45, readiness: 78, stage: "Pilot" },
  { name: "Cross-Border Pay", revenue: 5.1, risk: 15, readiness: 95, stage: "Commercial" },
  { name: "Loyalty Platform", revenue: 2.3, risk: 68, readiness: 62, stage: "Early Pilot" },
  { name: "Instant Settlement", revenue: 3.5, risk: 38, readiness: 85, stage: "Pilot" },
  { name: "Crypto Gateway", revenue: 1.8, risk: 82, readiness: 55, stage: "Early Pilot" },
  { name: "Identity Verify", revenue: 4.5, risk: 20, readiness: 90, stage: "Commercial" },
  { name: "Smart Routing", revenue: 2.9, risk: 52, readiness: 72, stage: "Pilot" },
  { name: "Merchant Portal", revenue: 3.2, risk: 35, readiness: 88, stage: "Pilot" },
  { name: "Analytics Suite", revenue: 4.8, risk: 18, readiness: 94, stage: "Commercial" },
];

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

export const RiskHeatmap = () => {
  return (
    <Card className="card-elegant col-span-2 animate-in">
      <CardHeader>
        <CardTitle className="text-xl">Revenue vs Risk Analysis</CardTitle>
        <CardDescription>Portfolio positioning by commercial value and execution risk</CardDescription>
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
            <Scatter name="Products" data={products}>
              {products.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getRiskColor(entry.risk)} opacity={0.8} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
