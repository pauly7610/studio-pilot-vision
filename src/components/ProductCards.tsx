import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowUpRight, AlertCircle, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Product {
  name: string;
  type: string;
  readiness: number;
  revenue: string;
  stage: string;
  risk: "LOW" | "MEDIUM" | "HIGH";
  prediction: number;
  id: string;
}

const products: Product[] = [
  {
    name: "Digital Wallet API",
    type: "Data & Services",
    readiness: 92,
    revenue: "$4.2M",
    stage: "Commercial",
    risk: "LOW",
    prediction: 94,
    id: "digital-wallet-api",
  },
  {
    name: "Fraud Detection ML",
    type: "Core Products",
    readiness: 78,
    revenue: "$3.8M",
    stage: "Pilot",
    risk: "MEDIUM",
    prediction: 71,
    id: "fraud-detection-ml",
  },
  {
    name: "Cross-Border Pay",
    type: "New Payment Flows",
    readiness: 95,
    revenue: "$5.1M",
    stage: "Commercial",
    risk: "LOW",
    prediction: 96,
    id: "cross-border-pay",
  },
  {
    name: "Loyalty Platform",
    type: "Partnerships",
    readiness: 62,
    revenue: "$2.3M",
    stage: "Early Pilot",
    risk: "HIGH",
    prediction: 58,
    id: "loyalty-platform",
  },
];

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

export const ProductCards = () => {
  const navigate = useNavigate();

  return (
    <Card className="card-elegant col-span-2 animate-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Portfolio Products</h3>
            <p className="text-sm text-muted-foreground mt-1">Active products with readiness and prediction scores</p>
          </div>
          <button className="text-primary hover:text-primary-glow transition-colors flex items-center gap-1 text-sm font-medium">
            View All
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.map((product, index) => (
          <div
            key={index}
            onClick={() => navigate(`/product/${product.id}`)}
            className="border rounded-lg p-4 hover:shadow-md transition-all duration-300 hover:border-primary/50 group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                  {product.name}
                </h4>
                <p className="text-sm text-muted-foreground">{product.type}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className={getRiskColor(product.risk)}>
                  {product.risk}
                </Badge>
                <Badge variant="outline" className={getStageColor(product.stage)}>
                  {product.stage}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Readiness Score</p>
                <div className="flex items-center gap-2">
                  <Progress value={product.readiness} className="h-2" />
                  <span className="text-sm font-semibold">{product.readiness}%</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Success Prediction</p>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-sm font-semibold">{product.prediction}%</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                <p className="text-lg font-bold text-primary">{product.revenue}</p>
              </div>
            </div>

            {product.risk === "HIGH" && (
              <div className="mt-3 pt-3 border-t flex items-start gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  <span className="font-medium text-destructive">Risk Alert:</span> Low readiness score requires
                  immediate governance review
                </p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
