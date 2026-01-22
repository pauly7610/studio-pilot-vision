import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Search, Loader2, CheckCircle2, AlertCircle, TrendingDown, Lightbulb, Zap, Database, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { parseMarkdown } from "@/lib/markdownUtils";
import { AISyncIndicator } from "@/components/AISyncIndicator";
import { useStreamingAIQuery, getPhaseDescription } from "@/hooks/useStreamingAIQuery";

// Backend API URL - uses environment variable with fallback to production
const AI_INSIGHTS_URL = import.meta.env.VITE_AI_INSIGHTS_URL || "https://studio-pilot-vision.onrender.com";

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
  const [showReasoning, setShowReasoning] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true);
  
  // Streaming query hook
  const { state: streamState, isLoading: streamLoading, query: streamQuery, reset: resetStream, getMetrics } = useStreamingAIQuery();
  
  // Non-streaming state (fallback)
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<CogneeResponse | null>(null);

  // Convert streaming result to CogneeResponse format for display
  const streamingResponse: CogneeResponse | null = streamState.mergedResult ? {
    success: true,
    query: query,
    answer: streamState.mergedResult.answer || "",
    confidence: streamState.mergedResult.confidence || 0,
    confidence_breakdown: {
      overall: streamState.mergedResult.confidence_breakdown?.overall || streamState.mergedResult.confidence || 0,
      components: {
        data_freshness: streamState.mergedResult.confidence_breakdown?.data_freshness || 0,
        relationship_strength: streamState.mergedResult.confidence_breakdown?.source_reliability || 0,
        historical_accuracy: streamState.mergedResult.confidence_breakdown?.historical_accuracy || 0,
        entity_completeness: streamState.mergedResult.confidence_breakdown?.entity_grounding || 0,
      },
      explanation: streamState.mergedResult.confidence_breakdown?.explanation || "Streaming response",
    },
    sources: streamState.mergedResult.sources?.map(s => ({
      entity_type: s.entity_type,
      entity_name: s.entity_name || s.entity_id,
      confidence: s.confidence,
      time_range: "",
    })) || [],
    reasoning_trace: streamState.mergedResult.reasoning_trace || [],
    recommended_actions: streamState.mergedResult.recommended_actions,
    forecast: streamState.mergedResult.forecast,
  } : streamState.phase === "error" ? {
    success: false,
    query: query,
    answer: "",
    confidence: 0,
    confidence_breakdown: {
      overall: 0,
      components: { data_freshness: 0, relationship_strength: 0, historical_accuracy: 0, entity_completeness: 0 },
      explanation: "",
    },
    sources: [],
    reasoning_trace: [],
    error: streamState.error || "Query failed",
  } : null;

  // Use streaming response if streaming is enabled, otherwise use regular response
  const displayResponse = useStreaming ? streamingResponse : response;
  const isLoading = useStreaming ? streamLoading : loading;

  const handleQuery = async () => {
    if (!query.trim()) return;

    if (useStreaming) {
      // Use streaming endpoint
      resetStream();
      await streamQuery(query, { region: "North America" }, { includePartial: true });
    } else {
      // Fallback to non-streaming endpoint
      setLoading(true);
      setResponse(null);

      try {
        const res = await fetch(`${AI_INSIGHTS_URL}/ai/query`, {
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
        
        if (data.error || !data.success) {
          setResponse({
            success: false,
            query: query,
            answer: data.error || "Query processing failed",
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
            reasoning_trace: data.reasoning_trace || [],
            error: data.error || "Unknown error",
          });
          return;
        }
        
        const transformedData = {
          success: true,
          query: data.query || query,
          answer: data.answer || "No answer provided",
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
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
              <CardTitle className="text-base sm:text-lg truncate">AI Insights</CardTitle>
            </div>
            <AISyncIndicator compact />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            <span className="hidden sm:inline">Ask questions about your portfolio with production-grade AI orchestration</span>
            <span className="sm:hidden">AI-powered portfolio analysis</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 pt-0">
          {/* Query input - stack on mobile */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Ask about your portfolio..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuery()}
              disabled={isLoading}
              className="flex-1 h-10 text-sm"
            />
            <Button 
              onClick={handleQuery} 
              disabled={isLoading || !query.trim()}
              className="h-10 sm:w-auto w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span className="truncate">{useStreaming ? getPhaseDescription(streamState.phase) : "Thinking..."}</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Query
                </>
              )}
            </Button>
          </div>

          {/* Example queries - horizontal scroll on mobile */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Quick queries:</span>
              <Button
                variant={useStreaming ? "default" : "outline"}
                size="sm"
                onClick={() => setUseStreaming(!useStreaming)}
                className="text-xs h-7"
              >
                <Zap className={`h-3 w-3 mr-1 ${useStreaming ? "text-yellow-300" : ""}`} />
                {useStreaming ? "Stream" : "Standard"}
              </Button>
            </div>
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
              <div className="flex gap-2 min-w-max sm:flex-wrap">
                {[
                  "Blocking Q1 growth?",
                  "High-risk products?",
                  "Priority actions?",
                ].map((example) => (
                  <Button
                    key={example}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery(example)}
                    disabled={isLoading}
                    className="text-xs h-7 whitespace-nowrap"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Streaming Progress Indicator */}
      {useStreaming && streamState.phase !== "idle" && streamState.phase !== "complete" && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="py-3 sm:py-4">
            <div className="space-y-2 sm:space-y-3">
              {/* Phase indicator */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                  <span className="text-xs sm:text-sm font-medium truncate">{getPhaseDescription(streamState.phase)}</span>
                </div>
                {streamState.intent && (
                  <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0">
                    <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">Intent: </span>{streamState.intent.intent}
                  </Badge>
                )}
              </div>
              
              {/* Progress steps - simplified on mobile */}
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide">
                <div className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded text-[10px] sm:text-xs whitespace-nowrap ${
                  streamState.intent ? "bg-green-500/20 text-green-600" : 
                  streamState.phase === "classifying" ? "bg-primary/20 text-primary animate-pulse" : 
                  "bg-muted text-muted-foreground"
                }`}>
                  <Brain className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span className="hidden xs:inline">Intent</span>
                  {streamState.intent && <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                </div>
                
                <div className="h-px w-2 sm:w-4 bg-border shrink-0" />
                
                <div className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded text-[10px] sm:text-xs whitespace-nowrap ${
                  streamState.cogneeResult ? "bg-green-500/20 text-green-600" :
                  streamState.phase === "querying" ? "bg-primary/20 text-primary animate-pulse" :
                  "bg-muted text-muted-foreground"
                }`}>
                  <Database className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span className="hidden xs:inline">Knowledge</span>
                  {streamState.cogneeResult && <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                </div>
                
                <div className="h-px w-4 bg-border" />
                
                <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                  streamState.ragResult ? "bg-green-500/20 text-green-600" :
                  streamState.phase === "querying" ? "bg-primary/20 text-primary animate-pulse" :
                  "bg-muted text-muted-foreground"
                }`}>
                  <Search className="h-3 w-3" />
                  RAG
                  {streamState.ragResult && <CheckCircle2 className="h-3 w-3" />}
                </div>
                
                <div className="h-px w-4 bg-border" />
                
                <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                  streamState.mergedResult ? "bg-green-500/20 text-green-600" :
                  streamState.phase === "merging" ? "bg-primary/20 text-primary animate-pulse" :
                  "bg-muted text-muted-foreground"
                }`}>
                  <Sparkles className="h-3 w-3" />
                  Merge
                  {streamState.mergedResult && <CheckCircle2 className="h-3 w-3" />}
                </div>
              </div>
              
              {/* Partial results preview */}
              {(streamState.cogneeResult?.answer || streamState.ragResult?.answer) && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  <span className="font-medium">Partial result: </span>
                  {(streamState.cogneeResult?.answer || streamState.ragResult?.answer || "").slice(0, 150)}...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics (when streaming complete) */}
      {useStreaming && streamState.phase === "complete" && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-yellow-500" />
            Intent: {getMetrics()?.intentLatencyMs}ms
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            Total: {getMetrics()?.totalLatencyMs}ms
          </span>
        </div>
      )}

      {/* Response */}
      {displayResponse && (
        <div className="space-y-4">
          {/* Answer Card */}
          <Card className={displayResponse.success ? "border-primary/30" : "border-destructive/30"}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {displayResponse.success ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  <CardTitle className="text-lg">Answer</CardTitle>
                </div>
                {displayResponse.success && (
                  <Badge
                    variant={getConfidenceBadgeVariant(displayResponse.confidence)}
                    className="text-sm"
                  >
                    {(displayResponse.confidence * 100).toFixed(0)}% Confidence
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {displayResponse.success ? (
                <div className="space-y-4">
                  {parseMarkdown(displayResponse.answer)}

                  {/* Confidence Breakdown */}
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Confidence Breakdown</span>
                      <span className={`text-lg font-bold ${getConfidenceColor(displayResponse.confidence)}`}>
                        {(displayResponse.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(displayResponse.confidence_breakdown.components).map(([key, value]) => (
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
                      {displayResponse.confidence_breakdown.explanation}
                    </p>
                  </div>
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{displayResponse.error || "Query failed"}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Sources */}
          {displayResponse.success && displayResponse.sources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sources ({displayResponse.sources.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {displayResponse.sources.map((source, idx) => (
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
          {displayResponse.success && displayResponse.reasoning_trace.length > 0 && (
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
                    {displayResponse.reasoning_trace.map((step) => (
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
          {displayResponse.success && displayResponse.recommended_actions && displayResponse.recommended_actions.length > 0 && (
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Recommended Actions</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {displayResponse.recommended_actions.map((action, idx) => (
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
          {displayResponse.success && displayResponse.forecast && (
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
                      {displayResponse.forecast.impact}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Probability</span>
                    <Badge variant="destructive">
                      {(displayResponse.forecast.probability * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Time Horizon</span>
                    <span className="text-sm font-medium">{displayResponse.forecast.time_horizon}</span>
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
