"""
Evaluation Metrics Module
Prometheus-compatible metrics for AI answer quality monitoring.

WHY: Metrics enable dashboards, alerting, and trend analysis.
     Prometheus format integrates with Grafana for visualization.
"""

import time
from typing import Any, Optional

from ai_insights.config import get_logger


class EvaluationMetrics:
    """
    Prometheus-compatible metrics for evaluation tracking.
    
    Metrics exposed:
    - ai_answer_quality_score: Histogram of overall scores
    - ai_answer_latency_seconds: Histogram of response times
    - ai_answer_quality_by_dimension: Gauges for each dimension
    - ai_human_feedback_total: Counter of thumbs up/down
    - ai_evaluation_errors_total: Counter of evaluation failures
    """
    
    # Class-level metrics (shared across instances to avoid duplicates)
    _class_metrics: dict = {}
    _class_initialized: bool = False
    
    def __init__(self):
        self.logger = get_logger(__name__)
        self._prometheus_available = False
        self._metrics = EvaluationMetrics._class_metrics
        
        if not EvaluationMetrics._class_initialized:
            self._init_prometheus()
            EvaluationMetrics._class_initialized = True
        else:
            self._prometheus_available = bool(self._metrics)
    
    def _init_prometheus(self):
        """Initialize Prometheus metrics if available."""
        try:
            from prometheus_client import Counter, Histogram, Gauge
            
            # Overall quality score distribution
            self._metrics["quality_score"] = Histogram(
                "ai_answer_quality_score",
                "Distribution of AI answer quality scores",
                buckets=[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
            )
            
            # Response latency
            self._metrics["latency"] = Histogram(
                "ai_answer_latency_seconds",
                "AI answer generation latency in seconds",
                buckets=[0.1, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0],
            )
            
            # Quality by dimension
            self._metrics["relevance"] = Gauge(
                "ai_answer_relevance_score",
                "Current average relevance score (rolling)",
            )
            self._metrics["groundedness"] = Gauge(
                "ai_answer_groundedness_score",
                "Current average groundedness score (rolling)",
            )
            self._metrics["completeness"] = Gauge(
                "ai_answer_completeness_score",
                "Current average completeness score (rolling)",
            )
            self._metrics["coherence"] = Gauge(
                "ai_answer_coherence_score",
                "Current average coherence score (rolling)",
            )
            
            # Human feedback counters
            self._metrics["feedback_positive"] = Counter(
                "ai_human_feedback_positive_total",
                "Total positive human feedback (thumbs up)",
            )
            self._metrics["feedback_negative"] = Counter(
                "ai_human_feedback_negative_total",
                "Total negative human feedback (thumbs down)",
            )
            
            # Error counter
            self._metrics["evaluation_errors"] = Counter(
                "ai_evaluation_errors_total",
                "Total evaluation errors",
                ["error_type"],
            )
            
            # Query counter by intent
            self._metrics["queries_by_intent"] = Counter(
                "ai_queries_total",
                "Total AI queries by intent type",
                ["intent"],
            )
            
            self._prometheus_available = True
            self.logger.info("Prometheus metrics initialized successfully")
            
        except ImportError:
            self.logger.warning("prometheus_client not installed - metrics disabled")
            self._prometheus_available = False
    
    def record_evaluation(
        self,
        overall: float,
        relevance: float,
        groundedness: float,
        completeness: float,
        coherence: float,
        latency_ms: int,
        intent: Optional[str] = None,
    ):
        """
        Record evaluation metrics.
        
        Args:
            overall: Overall quality score (0-1)
            relevance: Relevance score (0-1)
            groundedness: Groundedness score (0-1)
            completeness: Completeness score (0-1)
            coherence: Coherence score (0-1)
            latency_ms: Response latency in milliseconds
            intent: Query intent type
        """
        if not self._prometheus_available:
            return
        
        try:
            # Record overall score histogram
            self._metrics["quality_score"].observe(overall)
            
            # Record latency
            self._metrics["latency"].observe(latency_ms / 1000)
            
            # Update dimension gauges (rolling average would need more state)
            self._metrics["relevance"].set(relevance)
            self._metrics["groundedness"].set(groundedness)
            self._metrics["completeness"].set(completeness)
            self._metrics["coherence"].set(coherence)
            
            # Record query by intent
            if intent:
                self._metrics["queries_by_intent"].labels(intent=intent).inc()
            
        except Exception as e:
            self.logger.error(f"Failed to record metrics: {e}")
    
    def record_feedback(self, positive: bool):
        """Record human feedback metric."""
        if not self._prometheus_available:
            return
        
        try:
            if positive:
                self._metrics["feedback_positive"].inc()
            else:
                self._metrics["feedback_negative"].inc()
        except Exception as e:
            self.logger.error(f"Failed to record feedback metric: {e}")
    
    def record_error(self, error_type: str):
        """Record evaluation error."""
        if not self._prometheus_available:
            return
        
        try:
            self._metrics["evaluation_errors"].labels(error_type=error_type).inc()
        except Exception as e:
            self.logger.error(f"Failed to record error metric: {e}")
    
    def get_metrics_text(self) -> str:
        """
        Get metrics in Prometheus text format.
        
        Returns:
            Prometheus metrics text
        """
        if not self._prometheus_available:
            return "# Prometheus metrics not available\n"
        
        try:
            from prometheus_client import generate_latest
            return generate_latest().decode("utf-8")
        except Exception as e:
            return f"# Error generating metrics: {e}\n"


# Global instance
_metrics: Optional[EvaluationMetrics] = None


def get_evaluation_metrics() -> EvaluationMetrics:
    """Get or create global metrics instance."""
    global _metrics
    if _metrics is None:
        _metrics = EvaluationMetrics()
    return _metrics
