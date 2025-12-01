import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useProduct } from "@/hooks/useProducts";
import { format } from "date-fns";


const getRiskColor = (risk: string) => {
  const riskUpper = risk?.toUpperCase();
  switch (riskUpper) {
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

const getProductTypeLabel = (type: string) => {
  switch (type) {
    case "data_services":
      return "Data & Services";
    case "payment_flows":
      return "New Payment Flows";
    case "core_products":
      return "Core Products";
    case "partnerships":
      return "Partnerships";
    default:
      return type;
  }
};

const getStageLabel = (stage: string) => {
  switch (stage) {
    case "pilot":
      return "Pilot";
    case "mvp":
      return "MVP";
    case "commercial":
      return "Commercial";
    case "sunset":
      return "Sunset";
    default:
      return stage;
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
  const { data: product, isLoading, error } = useProduct(productId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-6 py-4">
            <Skeleton className="h-8 w-64" />
          </div>
        </header>
        <main className="container mx-auto px-6 py-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="card-elegant">
                <CardContent className="pt-6">
                  <Skeleton className="h-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!product || error) {
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

  // Transform database data into component format
  const readiness = Array.isArray(product.readiness) ? product.readiness[0] : product.readiness;
  const prediction = product.predictions?.[0];
  const training = Array.isArray(product.training) ? product.training[0] : product.training;
  const compliance = product.compliance || [];
  const partners = product.partners || [];
  const feedback = product.feedback || [];

  const readinessScore = readiness?.readiness_score || 0;
  const successProbability = prediction?.success_probability || 0;
  const riskBand = readiness?.risk_band || "medium";

  // Calculate readiness breakdown
  const readinessBreakdown = [
    { category: "Sales Training", score: readiness?.sales_training_pct || 0 },
    { category: "Compliance", score: readiness?.compliance_complete ? 100 : 50 },
    { category: "Partner Enable", score: readiness?.partner_enabled_pct || 0 },
    { category: "Onboarding", score: readiness?.onboarding_complete ? 100 : 0 },
    { category: "Documentation", score: readiness?.documentation_score || 0 },
  ];

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
              <p className="text-sm text-muted-foreground">
                {getProductTypeLabel(product.product_type)} • Owner: {product.owner_email}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className={getRiskColor(riskBand)}>
                {riskBand.toUpperCase()} RISK
              </Badge>
              <Badge variant="outline" className={getStageColor(product.lifecycle_stage)}>
                {getStageLabel(product.lifecycle_stage)}
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
              <div className="text-3xl font-bold mb-2">{Math.round(readinessScore)}%</div>
              <Progress value={readinessScore} className="h-2" />
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Success Prediction</span>
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <div className="text-3xl font-bold text-success">{Math.round(successProbability)}%</div>
              <p className="text-xs text-muted-foreground mt-2">
                {prediction?.model_version || "ML Model Confidence"}
              </p>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Current Revenue</span>
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div className="text-3xl font-bold">
                ${product.revenue_target ? (product.revenue_target / 1000000).toFixed(1) : 0}M
              </div>
              <p className="text-xs text-muted-foreground mt-2">Target Revenue</p>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Launch Date</span>
                <Calendar className="h-4 w-4 text-chart-2" />
              </div>
              <div className="text-lg font-bold">
                {product.launch_date ? format(new Date(product.launch_date), "MMM dd, yyyy") : "TBD"}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {product.launch_date
                  ? `${Math.floor((Date.now() - new Date(product.launch_date).getTime()) / (1000 * 60 * 60 * 24))} days live`
                  : "Not launched"}
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
                    <BarChart data={readinessBreakdown}>
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
                  {training ? (
                    <>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Training Completion</span>
                          <span className="text-sm font-bold">
                            {training.trained_reps} / {training.total_reps}
                          </span>
                        </div>
                        <Progress value={training.coverage_pct || 0} className="h-3" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.round(training.coverage_pct || 0)}% coverage achieved
                        </p>
                      </div>

                      <div className="pt-4 border-t space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Certified Reps</span>
                          <Badge variant="outline" className="bg-success/10 text-success">
                            {training.trained_reps}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Pending Training</span>
                          <Badge variant="outline" className="bg-warning/10 text-warning">
                            {training.total_reps - training.trained_reps}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Target Coverage</span>
                          <Badge variant="outline">90%</Badge>
                        </div>
                        {training.last_training_date && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Last Training</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(training.last_training_date), "MMM dd, yyyy")}
                            </span>
                          </div>
                        )}
                      </div>

                      {(training.coverage_pct || 0) < 90 && (
                        <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg border border-warning/20 mt-4">
                          <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-muted-foreground">
                            Below target coverage. {Math.round(90 - (training.coverage_pct || 0))}% additional training
                            needed.
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No training data available</p>
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
                {compliance.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {compliance.map((cert: any) => (
                      <div key={cert.id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold uppercase text-sm">{cert.certification_type}</h4>
                          {getComplianceIcon(cert.status)}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Status:</span>
                            <Badge
                              variant="outline"
                              className={
                                cert.status === "complete"
                                  ? "bg-success/10 text-success border-success/20"
                                  : cert.status === "in_progress"
                                    ? "bg-warning/10 text-warning border-warning/20"
                                    : "bg-muted text-muted-foreground"
                              }
                            >
                              {cert.status.replace("_", " ")}
                            </Badge>
                          </div>
                          {cert.completed_date && (
                            <p className="text-xs text-muted-foreground">
                              Completed: {format(new Date(cert.completed_date), "MMM dd, yyyy")}
                            </p>
                          )}
                          {cert.expiry_date && (
                            <p className="text-xs text-muted-foreground">
                              Expires: {format(new Date(cert.expiry_date), "MMM dd, yyyy")}
                            </p>
                          )}
                          {cert.notes && (
                            <p className="text-xs text-muted-foreground mt-2">{cert.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No compliance data available</p>
                )}
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
                {partners.length > 0 ? (
                  <div className="space-y-4">
                    {partners.map((partner: any) => (
                      <div key={partner.id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{partner.partner_name}</h4>
                            {partner.onboarded_date ? (
                              <p className="text-sm text-muted-foreground">
                                Onboarded: {format(new Date(partner.onboarded_date), "MMM dd, yyyy")}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground">Not yet onboarded</p>
                            )}
                            {partner.integration_status && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Integration: {partner.integration_status}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              className={
                                partner.enabled
                                  ? "bg-success/10 text-success border-success/20"
                                  : "bg-muted text-muted-foreground"
                              }
                            >
                              {partner.enabled ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No partner data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Customer Feedback Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent>
                {feedback.length > 0 ? (
                  <div className="space-y-4">
                    {feedback.map((item: any) => (
                      <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {item.source}
                              </Badge>
                              {item.theme && (
                                <Badge variant="outline" className="text-xs bg-primary/10">
                                  {item.theme}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm">{item.raw_text}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {item.sentiment_score !== null && (
                              <Badge
                                variant="outline"
                                className={
                                  item.sentiment_score > 0.3
                                    ? "bg-success/10 text-success"
                                    : item.sentiment_score < -0.3
                                      ? "bg-destructive/10 text-destructive"
                                      : "bg-warning/10 text-warning"
                                }
                              >
                                {item.sentiment_score > 0.3
                                  ? "Positive"
                                  : item.sentiment_score < -0.3
                                    ? "Negative"
                                    : "Neutral"}
                              </Badge>
                            )}
                            {item.impact_level && (
                              <span className="text-xs text-muted-foreground">Impact: {item.impact_level}</span>
                            )}
                          </div>
                        </div>
                        {item.volume > 1 && (
                          <p className="text-xs text-muted-foreground mt-2">Similar feedback: {item.volume} times</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No feedback data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
