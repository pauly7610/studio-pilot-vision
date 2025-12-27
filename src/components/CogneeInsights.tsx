import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Search, Loader2, CheckCircle2, AlertCircle, TrendingDown, Lightbulb } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Source {
  entity_type: string;
  entity_name: string;
  confidence: number;
  time_range: string;
}

interface ReasoningStep {
  step: number;
  action: string;
  confidence: number;
  entities_found?: number;
}

interface RecommendedAction {
  action_type: string;
  tier: string;
  rationale: string;
  confidence: number;
}

interface Forecast {
  scenario: string;
  impact: string;
  probability: number;
  time_horizon: string;
}

interface CogneeResponse {
  success: boolean;
  query: string;
  answer: string;
  confidence: number;
  confidence_breakdown: {
    overall: number;
    components: {
      data_freshness: number;
      relationship_strength: number;
      historical_accuracy: number;
      entity_completeness: number;
    };
    explanation: string;
  };
  sources: Source[];
  reasoning_trace: ReasoningStep[];
  recommended_actions?: RecommendedAction[];
  forecast?: Forecast;
  error?: string;
}

export const CogneeInsights = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<CogneeResponse | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);

  const handleQuery = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      // Use new production-grade unified endpoint
      const res = await fetch("https://studio-pilot-vision.onrender.com/ai/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          context: {
            region: "North America",
          },
        }),
      });

      const data = await res.json();
      
      // Transform new response format to match component expectations
      const transformedData = {
        success: data.success,
        query: data.query,
        answer: data.answer,
        confidence: data.confidence?.overall || 0,
        confidence_breakdown: {
          overall: data.confidence?.overall || 0,
          components: {
            data_freshness: data.confidence?.data_freshness || 0,
            relationship_strength: data.confidence?.source_reliability || 0,
            historical_accuracy: data.confidence?.historical_accuracy || 0,
            entity_completeness: data.confidence?.entity_grounding || 0,
          },
          explanation: data.confidence?.explanation || "Production-grade confidence scoring",
        },
        sources: data.sources?.filter((s: { source_type: string }) => s.source_type === "memory") || [],
        reasoning_trace: data.reasoning_trace || [],
        recommended_actions: data.recommended_actions || [],
        forecast: data.forecast,
        timestamp: data.timestamp,
      };
      
      setResponse(transformedData);
    } catch (error) {
      console.error("Query error:", error);
      setResponse({
        success: false,
        query: query,
        answer: "",
        confidence: 0,
        confidence_breakdown: {
          overall: 0,
          components: {
            data_freshness: 0,
            relationship_strength: 0,
            historical_accuracy: 0,
            entity_completeness: 0,
          },
          explanation: "",
        },
        sources: [],
        reasoning_trace: [],
        error: "Failed to connect to AI backend",
      });
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-success";
    if (confidence >= 0.6) return "text-warning";
    return "text-destructive";
  };

  const getConfidenceBadgeVariant = (confidence: number): "default" | "secondary" | "destructive" | "outline" => {
    if (confidence >= 0.8) return "default";
    if (confidence >= 0.6) return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>Cognee Knowledge Graph Query</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Ask questions about your portfolio with AI-powered memory and reasoning
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="e.g., What's blocking Q1 revenue growth?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuery()}
              disabled={loading}
            />
            <Button onClick={handleQuery} disabled={loading || !query.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Query
                </>
              )}
            </Button>
          </div>

          {/* Example queries */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">Try:</span>
            {[
              "What's blocking Q1 revenue growth?",
              "Which products are high-risk?",
              "What actions should I prioritize?",
            ].map((example) => (
              <Button
                key={example}
                variant="outline"
                size="sm"
                onClick={() => setQuery(example)}
                disabled={loading}
                className="text-xs"
              >
                {example}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Response */}
      {response && (
        <div className="space-y-4">
          {/* Answer Card */}
          <Card className={response.success ? "border-primary/30" : "border-destructive/30"}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {response.success ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  <CardTitle className="text-lg">Answer</CardTitle>
                </div>
                {response.success && (
                  <Badge
                    variant={getConfidenceBadgeVariant(response.confidence)}
                    className="text-sm"
                  >
                    {(response.confidence * 100).toFixed(0)}% Confidence
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {response.success ? (
                <div className="space-y-4">
                  <p className="text-sm whitespace-pre-wrap">{response.answer}</p>

                  {/* Confidence Breakdown */}
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Confidence Breakdown</span>
                      <span className={`text-lg font-bold ${getConfidenceColor(response.confidence)}`}>
                        {(response.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(response.confidence_breakdown.components).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/_/g, " ")}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getConfidenceColor(value)} bg-current`}
                                style={{ width: `${value * 100}%` }}
                              />
                            </div>
                            <span className="w-10 text-right">{(value * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {response.confidence_breakdown.explanation}
                    </p>
                  </div>
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{response.error || "Query failed"}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Sources */}
          {response.success && response.sources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sources ({response.sources.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {response.sources.map((source, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {source.entity_type}
                          </Badge>
                          <span className="text-sm font-medium">{source.entity_name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{source.time_range}</p>
                      </div>
                      <Badge variant={getConfidenceBadgeVariant(source.confidence)}>
                        {(source.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reasoning Trace */}
          {response.success && response.reasoning_trace.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">How We Got This Answer</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReasoning(!showReasoning)}
                  >
                    {showReasoning ? "Hide" : "Show"} Details
                  </Button>
                </div>
              </CardHeader>
              {showReasoning && (
                <CardContent>
                  <div className="space-y-3">
                    {response.reasoning_trace.map((step) => (
                      <div key={step.step} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{step.action}</p>
                          {step.entities_found !== undefined && (
                            <p className="text-xs text-muted-foreground">
                              Found {step.entities_found} entities
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {(step.confidence * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Recommended Actions */}
          {response.success && response.recommended_actions && response.recommended_actions.length > 0 && (
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Recommended Actions</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {response.recommended_actions.map((action, idx) => (
                    <div key={idx} className="p-3 bg-background rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="capitalize">
                          {action.action_type} • {action.tier}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {(action.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                      <p className="text-sm">{action.rationale}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Forecast */}
          {response.success && response.forecast && (
            <Card className="border-warning/30 bg-gradient-to-br from-warning/5 to-transparent">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-warning" />
                  <CardTitle className="text-lg">Forecast (If No Action Taken)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Impact</span>
                    <span className="text-lg font-bold text-destructive">
                      {response.forecast.impact}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Probability</span>
                    <Badge variant="destructive">
                      {(response.forecast.probability * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Time Horizon</span>
                    <span className="text-sm font-medium">{response.forecast.time_horizon}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
