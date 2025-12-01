import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  Shield,
  Rocket,
  DollarSign,
  Calendar,
  Target,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Mock product data - in real app, this would come from API
const productData: Record<string, any> = {
  "digital-wallet-api": {
    name: "Digital Wallet API",
    type: "Data & Services",
    readiness: 92,
    revenue: 4.2,
    stage: "Commercial",
    risk: "LOW",
    prediction: 94,
    launchDate: "2024-06-15",
    owner: "Sarah Johnson",
    compliance: {
      pci: { status: "complete", date: "2024-05-20" },
      gdpr: { status: "complete", date: "2024-05-18" },
      soc2: { status: "complete", date: "2024-05-25" },
      iso27001: { status: "in-progress", date: null },
    },
    partners: [
      { name: "Visa", enabled: true, onboarded: "2024-06-10" },
      { name: "Mastercard", enabled: true, onboarded: "2024-06-12" },
      { name: "AmEx", enabled: false, onboarded: null },
    ],
    sales: {
      trained: 45,
      total: 48,
      coverage: 94,
    },
    revenueHistory: [
      { month: "Jun", actual: 0.8, target: 0.5 },
      { month: "Jul", actual: 1.2, target: 1.0 },
      { month: "Aug", actual: 1.8, target: 1.5 },
      { month: "Sep", actual: 2.5, target: 2.0 },
      { month: "Oct", actual: 3.2, target: 2.8 },
      { month: "Nov", actual: 4.2, target: 3.5 },
    ],
    adoptionTrend: [
      { week: "W1", users: 120, transactions: 450 },
      { week: "W2", users: 280, transactions: 980 },
      { week: "W3", users: 520, transactions: 1850 },
      { week: "W4", users: 890, transactions: 3200 },
      { week: "W5", users: 1340, transactions: 4800 },
      { week: "W6", users: 1820, transactions: 6500 },
    ],
    readinessBreakdown: [
      { category: "Sales Training", score: 94 },
      { category: "Compliance", score: 92 },
      { category: "Partner Enable", score: 88 },
      { category: "Onboarding", score: 95 },
      { category: "Documentation", score: 90 },
    ],
  },
  "fraud-detection-ml": {
    name: "Fraud Detection ML",
    type: "Core Products",
    readiness: 78,
    revenue: 3.8,
    stage: "Pilot",
    risk: "MEDIUM",
    prediction: 71,
    launchDate: "2024-08-20",
    owner: "Michael Chen",
    compliance: {
      pci: { status: "complete", date: "2024-07-15" },
      gdpr: { status: "complete", date: "2024-07-18" },
      soc2: { status: "in-progress", date: null },
      iso27001: { status: "pending", date: null },
    },
    partners: [
      { name: "Visa", enabled: true, onboarded: "2024-08-15" },
      { name: "Mastercard", enabled: false, onboarded: null },
      { name: "AmEx", enabled: false, onboarded: null },
    ],
    sales: {
      trained: 32,
      total: 48,
      coverage: 67,
    },
    revenueHistory: [
      { month: "Aug", actual: 0.3, target: 0.4 },
      { month: "Sep", actual: 0.8, target: 1.0 },
      { month: "Oct", actual: 1.5, target: 1.8 },
      { month: "Nov", actual: 3.8, target: 2.5 },
    ],
    adoptionTrend: [
      { week: "W1", users: 45, transactions: 180 },
      { week: "W2", users: 120, transactions: 520 },
      { week: "W3", users: 280, transactions: 1100 },
      { week: "W4", users: 450, transactions: 1850 },
    ],
    readinessBreakdown: [
      { category: "Sales Training", score: 67 },
      { category: "Compliance", score: 75 },
      { category: "Partner Enable", score: 70 },
      { category: "Onboarding", score: 88 },
      { category: "Documentation", score: 92 },
    ],
  },
};

const getRiskColor = (risk: string) => {
  switch (risk) {
    case "LOW":
      return "bg-success/10 text-success border-success/20";
    case "MEDIUM":
      return "bg-warning/10 text-warning border-warning/20";
    case "HIGH":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getStageColor = (stage: string) => {
  if (stage === "Commercial") return "bg-primary/10 text-primary border-primary/20";
  if (stage === "Pilot") return "bg-chart-2/10 text-chart-2 border-chart-2/20";
  return "bg-muted text-muted-foreground border-border";
};

const getComplianceIcon = (status: string) => {
  switch (status) {
    case "complete":
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    case "in-progress":
      return <div className="h-4 w-4 rounded-full border-2 border-warning border-t-transparent animate-spin" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
  }
};

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const product = productId ? productData[productId] : null;

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center">
        <Card className="card-elegant max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested product could not be found.</p>
            <Button onClick={() => navigate("/")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
              <p className="text-sm text-muted-foreground">{product.type} • Owner: {product.owner}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className={getRiskColor(product.risk)}>
                {product.risk} RISK
              </Badge>
              <Badge variant="outline" className={getStageColor(product.stage)}>
                {product.stage}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-elegant">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Readiness Score</span>
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div className="text-3xl font-bold mb-2">{product.readiness}%</div>
              <Progress value={product.readiness} className="h-2" />
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Success Prediction</span>
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <div className="text-3xl font-bold text-success">{product.prediction}%</div>
              <p className="text-xs text-muted-foreground mt-2">ML Model Confidence</p>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Current Revenue</span>
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div className="text-3xl font-bold">${product.revenue}M</div>
              <p className="text-xs text-success mt-2">+28% vs target</p>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Launch Date</span>
                <Calendar className="h-4 w-4 text-chart-2" />
              </div>
              <div className="text-lg font-bold">{new Date(product.launchDate).toLocaleDateString()}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {Math.floor((Date.now() - new Date(product.launchDate).getTime()) / (1000 * 60 * 60 * 24))} days live
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="readiness" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="readiness">Readiness</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="partners">Partners</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Readiness Tab */}
          <TabsContent value="readiness" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Readiness Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={product.readinessBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="score" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-chart-2" />
                    Sales Training Coverage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Training Completion</span>
                      <span className="text-sm font-bold">
                        {product.sales.trained} / {product.sales.total}
                      </span>
                    </div>
                    <Progress value={product.sales.coverage} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-1">{product.sales.coverage}% coverage achieved</p>
                  </div>

                  <div className="pt-4 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Certified Reps</span>
                      <Badge variant="outline" className="bg-success/10 text-success">
                        {product.sales.trained}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pending Training</span>
                      <Badge variant="outline" className="bg-warning/10 text-warning">
                        {product.sales.total - product.sales.trained}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Target Coverage</span>
                      <Badge variant="outline">90%</Badge>
                    </div>
                  </div>

                  {product.sales.coverage < 90 && (
                    <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg border border-warning/20 mt-4">
                      <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        Below target coverage. {90 - product.sales.coverage}% additional training needed.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Compliance & Certification Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(product.compliance).map(([key, value]: [string, any]) => (
                    <div key={key} className="border rounded-lg p-4 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold uppercase text-sm">{key}</h4>
                        {getComplianceIcon(value.status)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Status:</span>
                          <Badge
                            variant="outline"
                            className={
                              value.status === "complete"
                                ? "bg-success/10 text-success border-success/20"
                                : value.status === "in-progress"
                                  ? "bg-warning/10 text-warning border-warning/20"
                                  : "bg-muted text-muted-foreground"
                            }
                          >
                            {value.status}
                          </Badge>
                        </div>
                        {value.date && (
                          <p className="text-xs text-muted-foreground">
                            Completed: {new Date(value.date).toLocaleDateString()}
                          </p>
                        )}
                        {!value.date && value.status !== "pending" && (
                          <p className="text-xs text-warning">In progress - ETA: 2-3 weeks</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Partners Tab */}
          <TabsContent value="partners" className="space-y-6">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  Partner Enablement Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {product.partners.map((partner: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{partner.name}</h4>
                          {partner.onboarded ? (
                            <p className="text-sm text-muted-foreground">
                              Onboarded: {new Date(partner.onboarded).toLocaleDateString()}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">Not yet onboarded</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {partner.enabled ? (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Enabled
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-muted text-muted-foreground">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Enablement</span>
                    <span className="text-sm font-bold">
                      {product.partners.filter((p: any) => p.enabled).length} / {product.partners.length}
                    </span>
                  </div>
                  <Progress
                    value={(product.partners.filter((p: any) => p.enabled).length / product.partners.length) * 100}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Revenue Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={product.revenueHistory}>
                      <defs>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="actual"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#colorActual)"
                        name="Actual ($M)"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="target"
                        stroke="hsl(var(--muted-foreground))"
                        strokeDasharray="5 5"
                        name="Target ($M)"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-success" />
                    Adoption Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={product.adoptionTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="users"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        name="Active Users"
                        dot={{ fill: "hsl(var(--primary))" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="transactions"
                        stroke="hsl(var(--success))"
                        strokeWidth={2}
                        name="Transactions"
                        dot={{ fill: "hsl(var(--success))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
