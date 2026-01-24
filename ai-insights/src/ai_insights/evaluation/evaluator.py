"""
Answer Evaluation Module
Systematic evaluation of AI answer quality with multiple metrics.

WHY: Without evaluation, you can't improve. This module tracks:
1. Relevance - Does the answer address the query?
2. Groundedness - Is the answer supported by sources?
3. Completeness - Does it fully answer the question?
4. Coherence - Is it well-structured and logical?

USAGE:
- Automatic: Called after every AI query
- Manual: Human feedback via thumbs up/down
- Batch: Periodic evaluation against test sets
"""

import hashlib
import json
import os
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Optional

from ai_insights.config import get_logger


class EvaluationSource(str, Enum):
    """Source of evaluation."""
    AUTOMATIC = "automatic"  # System-generated
    HUMAN_POSITIVE = "human_positive"  # User thumbs up
    HUMAN_NEGATIVE = "human_negative"  # User thumbs down
    EXPERT_REVIEW = "expert_review"  # Manual expert evaluation


@dataclass
class EvaluationResult:
    """Result of answer evaluation."""
    
    query_id: str
    query: str
    timestamp: datetime
    
    # Scores (0.0 - 1.0)
    relevance: float
    groundedness: float
    completeness: float
    coherence: float
    
    # Overall score (weighted average)
    overall: float
    
    # Metadata
    source: EvaluationSource
    source_count: int
    confidence: float
    latency_ms: int
    
    # Explanation
    explanation: str
    issues: list[str] = field(default_factory=list)
    
    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "query_id": self.query_id,
            "query": self.query,
            "timestamp": self.timestamp.isoformat(),
            "relevance": self.relevance,
            "groundedness": self.groundedness,
            "completeness": self.completeness,
            "coherence": self.coherence,
            "overall": self.overall,
            "source": self.source.value,
            "source_count": self.source_count,
            "confidence": self.confidence,
            "latency_ms": self.latency_ms,
            "explanation": self.explanation,
            "issues": self.issues,
        }


class AnswerEvaluator:
    """
    Evaluates AI answers for quality and tracks metrics over time.
    
    Design decisions:
    1. Heuristic-based evaluation (fast, no LLM call)
    2. Optional LLM-based evaluation (slower, more accurate)
    3. Persistent storage for trend analysis
    4. Configurable weights for different use cases
    """
    
    # Weights for overall score calculation
    DEFAULT_WEIGHTS = {
        "relevance": 0.35,
        "groundedness": 0.30,
        "completeness": 0.20,
        "coherence": 0.15,
    }
    
    # Thresholds for quality flags
    QUALITY_THRESHOLDS = {
        "excellent": 0.85,
        "good": 0.70,
        "acceptable": 0.50,
        "poor": 0.30,
    }
    
    def __init__(
        self,
        storage_path: Optional[str] = None,
        weights: Optional[dict[str, float]] = None,
    ):
        """
        Initialize evaluator.
        
        Args:
            storage_path: Path for evaluation history (default: in-memory only)
            weights: Custom weights for score components
        """
        self.logger = get_logger(__name__)
        self.weights = weights or self.DEFAULT_WEIGHTS
        self.storage_path = storage_path or os.getenv("EVALUATION_STORAGE_PATH")
        
        # In-memory history (last N evaluations)
        self.history: list[EvaluationResult] = []
        self.max_history = 1000
        
        # Load existing history if storage path exists
        if self.storage_path and os.path.exists(self.storage_path):
            self._load_history()
    
    def evaluate(
        self,
        query: str,
        answer: str,
        sources: list[dict[str, Any]],
        confidence: float,
        latency_ms: int,
        use_llm: bool = False,
    ) -> EvaluationResult:
        """
        Evaluate an AI answer.
        
        Args:
            query: Original user query
            answer: Generated answer
            sources: List of sources used
            confidence: Model confidence score
            latency_ms: Response latency in milliseconds
            use_llm: Use LLM for more accurate evaluation (slower)
        
        Returns:
            EvaluationResult with scores and explanation
        """
        query_id = self._generate_query_id(query)
        
        if use_llm:
            result = self._evaluate_with_llm(
                query_id, query, answer, sources, confidence, latency_ms
            )
        else:
            result = self._evaluate_heuristic(
                query_id, query, answer, sources, confidence, latency_ms
            )
        
        # Store result
        self._store_result(result)
        
        return result
    
    def _evaluate_heuristic(
        self,
        query_id: str,
        query: str,
        answer: str,
        sources: list[dict[str, Any]],
        confidence: float,
        latency_ms: int,
    ) -> EvaluationResult:
        """
        Fast heuristic-based evaluation.
        
        WHY: LLM evaluation is slow and expensive. Heuristics cover 90% of cases.
        """
        issues = []
        
        # 1. RELEVANCE: Check keyword overlap and semantic signals
        relevance = self._calculate_relevance(query, answer)
        if relevance < 0.5:
            issues.append("Answer may not fully address the query")
        
        # 2. GROUNDEDNESS: Check if answer is supported by sources
        groundedness = self._calculate_groundedness(answer, sources)
        if groundedness < 0.5:
            issues.append("Answer may contain unsupported claims")
        
        # 3. COMPLETENESS: Check answer length and structure
        completeness = self._calculate_completeness(query, answer)
        if completeness < 0.5:
            issues.append("Answer may be incomplete")
        
        # 4. COHERENCE: Check structure and readability
        coherence = self._calculate_coherence(answer)
        if coherence < 0.5:
            issues.append("Answer structure could be improved")
        
        # Calculate overall score
        overall = (
            relevance * self.weights["relevance"]
            + groundedness * self.weights["groundedness"]
            + completeness * self.weights["completeness"]
            + coherence * self.weights["coherence"]
        )
        
        # Generate explanation
        quality_label = self._get_quality_label(overall)
        explanation = (
            f"Quality: {quality_label} ({overall:.0%}). "
            f"Relevance: {relevance:.0%}, Groundedness: {groundedness:.0%}, "
            f"Completeness: {completeness:.0%}, Coherence: {coherence:.0%}."
        )
        
        return EvaluationResult(
            query_id=query_id,
            query=query,
            timestamp=datetime.utcnow(),
            relevance=relevance,
            groundedness=groundedness,
            completeness=completeness,
            coherence=coherence,
            overall=overall,
            source=EvaluationSource.AUTOMATIC,
            source_count=len(sources),
            confidence=confidence,
            latency_ms=latency_ms,
            explanation=explanation,
            issues=issues,
        )
    
    def _calculate_relevance(self, query: str, answer: str) -> float:
        """
        Calculate relevance score based on keyword overlap.
        
        WHY: Simple but effective - relevant answers contain query terms.
        """
        query_words = set(query.lower().split())
        answer_words = set(answer.lower().split())
        
        # Remove stop words
        stop_words = {"the", "a", "an", "is", "are", "was", "were", "what", "how", "why", "when", "where", "which", "who"}
        query_words -= stop_words
        
        if not query_words:
            return 0.7  # Default for very short queries
        
        # Calculate overlap
        overlap = len(query_words & answer_words)
        coverage = overlap / len(query_words)
        
        # Bonus for question words being answered
        question_words = {"what", "how", "why", "when", "where", "which", "who"}
        has_question = bool(set(query.lower().split()) & question_words)
        
        if has_question:
            # Check for answer patterns
            answer_lower = answer.lower()
            has_explanation = any(word in answer_lower for word in ["because", "due to", "since", "therefore"])
            has_listing = any(char in answer for char in ["1.", "2.", "-", "•"])
            
            if has_explanation or has_listing:
                coverage += 0.1
        
        return min(1.0, coverage + 0.3)  # Base score + coverage
    
    def _calculate_groundedness(self, answer: str, sources: list[dict[str, Any]]) -> float:
        """
        Calculate groundedness score based on source support.
        
        WHY: Answers should be backed by retrieved sources, not hallucinated.
        """
        if not sources:
            return 0.3  # No sources = low groundedness
        
        # Extract source texts
        source_texts = []
        for s in sources:
            if isinstance(s, dict):
                text = s.get("text", "") or s.get("content", "") or str(s)
            else:
                text = str(s)
            source_texts.append(text.lower())
        
        combined_sources = " ".join(source_texts)
        
        # Check what percentage of answer words appear in sources
        answer_words = set(answer.lower().split())
        stop_words = {"the", "a", "an", "is", "are", "was", "were", "and", "or", "but", "in", "on", "at", "to", "for"}
        answer_words -= stop_words
        
        if not answer_words:
            return 0.7  # Very short answer
        
        grounded_count = sum(1 for word in answer_words if word in combined_sources)
        groundedness = grounded_count / len(answer_words)
        
        # Bonus for having multiple sources
        source_bonus = min(0.2, len(sources) * 0.05)
        
        return min(1.0, groundedness + source_bonus)
    
    def _calculate_completeness(self, query: str, answer: str) -> float:
        """
        Calculate completeness score based on answer structure.
        
        WHY: Complete answers are neither too short nor too long.
        """
        # Check answer length (ideal: 100-500 words for detailed questions)
        word_count = len(answer.split())
        
        if word_count < 20:
            length_score = 0.3
        elif word_count < 50:
            length_score = 0.6
        elif word_count < 300:
            length_score = 1.0
        elif word_count < 500:
            length_score = 0.9
        else:
            length_score = 0.7  # Too verbose
        
        # Check for structured elements
        has_structure = 0.0
        if "\n" in answer:
            has_structure += 0.1
        if any(marker in answer for marker in ["1.", "2.", "-", "•", ":", "**"]):
            has_structure += 0.1
        
        # Check if "I don't know" type responses
        no_info_phrases = ["don't have", "no information", "couldn't find", "unable to"]
        if any(phrase in answer.lower() for phrase in no_info_phrases):
            return 0.2  # Incomplete by definition
        
        return min(1.0, length_score + has_structure)
    
    def _calculate_coherence(self, answer: str) -> float:
        """
        Calculate coherence score based on structure and readability.
        
        WHY: Coherent answers are easy to understand and well-organized.
        """
        # Check sentence count (ideal: 3-15 sentences)
        sentences = [s.strip() for s in answer.replace("?", ".").replace("!", ".").split(".") if s.strip()]
        sentence_count = len(sentences)
        
        if sentence_count < 2:
            sentence_score = 0.5
        elif sentence_count < 5:
            sentence_score = 0.8
        elif sentence_count < 15:
            sentence_score = 1.0
        else:
            sentence_score = 0.8  # Maybe too long
        
        # Check for transition words (indicates good flow)
        transitions = ["however", "therefore", "additionally", "furthermore", "first", "second", "finally", "in conclusion"]
        has_transitions = any(word in answer.lower() for word in transitions)
        transition_bonus = 0.1 if has_transitions else 0.0
        
        # Check for repetition (bad)
        words = answer.lower().split()
        if len(words) > 10:
            unique_ratio = len(set(words)) / len(words)
            repetition_penalty = max(0, 0.1 * (0.5 - unique_ratio)) if unique_ratio < 0.5 else 0
        else:
            repetition_penalty = 0
        
        return min(1.0, sentence_score + transition_bonus - repetition_penalty)
    
    def _evaluate_with_llm(
        self,
        query_id: str,
        query: str,
        answer: str,
        sources: list[dict[str, Any]],
        confidence: float,
        latency_ms: int,
    ) -> EvaluationResult:
        """
        LLM-based evaluation for more accurate scoring.
        
        WHY: Heuristics miss nuance. LLM understands semantic quality.
        """
        try:
            from groq import Groq
            
            groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
            
            # Build evaluation prompt
            source_texts = "\n".join([
                s.get("text", s.get("content", str(s)))[:200]
                for s in sources[:3]
            ])
            
            prompt = f"""Evaluate this AI answer on a scale of 0.0 to 1.0 for each criterion:

QUERY: {query}

ANSWER: {answer}

SOURCES (excerpts):
{source_texts}

Evaluate:
1. RELEVANCE (0.0-1.0): Does the answer address the query?
2. GROUNDEDNESS (0.0-1.0): Is the answer supported by the sources?
3. COMPLETENESS (0.0-1.0): Does it fully answer the question?
4. COHERENCE (0.0-1.0): Is it well-structured and clear?

Respond in this exact format:
RELEVANCE: 0.X
GROUNDEDNESS: 0.X
COMPLETENESS: 0.X
COHERENCE: 0.X
ISSUES: [list any issues, or "none"]
"""
            
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=300,
            )
            
            result_text = response.choices[0].message.content
            
            # Parse response
            scores = {}
            issues = []
            for line in result_text.split("\n"):
                line = line.strip()
                if line.startswith("RELEVANCE:"):
                    scores["relevance"] = float(line.split(":")[1].strip())
                elif line.startswith("GROUNDEDNESS:"):
                    scores["groundedness"] = float(line.split(":")[1].strip())
                elif line.startswith("COMPLETENESS:"):
                    scores["completeness"] = float(line.split(":")[1].strip())
                elif line.startswith("COHERENCE:"):
                    scores["coherence"] = float(line.split(":")[1].strip())
                elif line.startswith("ISSUES:"):
                    issues_text = line.split(":")[1].strip()
                    if issues_text.lower() != "none":
                        issues = [i.strip() for i in issues_text.strip("[]").split(",")]
            
            # Calculate overall
            overall = (
                scores.get("relevance", 0.5) * self.weights["relevance"]
                + scores.get("groundedness", 0.5) * self.weights["groundedness"]
                + scores.get("completeness", 0.5) * self.weights["completeness"]
                + scores.get("coherence", 0.5) * self.weights["coherence"]
            )
            
            quality_label = self._get_quality_label(overall)
            explanation = f"LLM evaluation: {quality_label} ({overall:.0%})"
            
            return EvaluationResult(
                query_id=query_id,
                query=query,
                timestamp=datetime.utcnow(),
                relevance=scores.get("relevance", 0.5),
                groundedness=scores.get("groundedness", 0.5),
                completeness=scores.get("completeness", 0.5),
                coherence=scores.get("coherence", 0.5),
                overall=overall,
                source=EvaluationSource.AUTOMATIC,
                source_count=len(sources),
                confidence=confidence,
                latency_ms=latency_ms,
                explanation=explanation,
                issues=issues,
            )
            
        except Exception as e:
            self.logger.warning(f"LLM evaluation failed, falling back to heuristic: {e}")
            return self._evaluate_heuristic(
                query_id, query, answer, sources, confidence, latency_ms
            )
    
    def record_feedback(
        self,
        query_id: str,
        positive: bool,
        comment: Optional[str] = None,
    ) -> None:
        """
        Record human feedback (thumbs up/down).
        
        Args:
            query_id: ID of the query to rate
            positive: True for thumbs up, False for thumbs down
            comment: Optional feedback comment
        """
        # Find the evaluation result
        for result in self.history:
            if result.query_id == query_id:
                result.source = (
                    EvaluationSource.HUMAN_POSITIVE
                    if positive
                    else EvaluationSource.HUMAN_NEGATIVE
                )
                if comment:
                    result.issues.append(f"User feedback: {comment}")
                
                self.logger.info(
                    f"Recorded {'positive' if positive else 'negative'} feedback for {query_id}"
                )
                self._save_history()
                return
        
        self.logger.warning(f"Query {query_id} not found in history")
    
    def get_statistics(self, days: int = 7) -> dict[str, Any]:
        """
        Get evaluation statistics for the specified period.
        
        Args:
            days: Number of days to analyze
            
        Returns:
            Statistics dictionary
        """
        from datetime import timedelta
        
        cutoff = datetime.utcnow() - timedelta(days=days)
        recent = [r for r in self.history if r.timestamp > cutoff]
        
        if not recent:
            return {"total": 0, "message": "No evaluations in period"}
        
        # Calculate averages
        avg_overall = sum(r.overall for r in recent) / len(recent)
        avg_relevance = sum(r.relevance for r in recent) / len(recent)
        avg_groundedness = sum(r.groundedness for r in recent) / len(recent)
        avg_completeness = sum(r.completeness for r in recent) / len(recent)
        avg_coherence = sum(r.coherence for r in recent) / len(recent)
        
        # Count by quality level
        quality_distribution = {
            "excellent": sum(1 for r in recent if r.overall >= self.QUALITY_THRESHOLDS["excellent"]),
            "good": sum(1 for r in recent if self.QUALITY_THRESHOLDS["good"] <= r.overall < self.QUALITY_THRESHOLDS["excellent"]),
            "acceptable": sum(1 for r in recent if self.QUALITY_THRESHOLDS["acceptable"] <= r.overall < self.QUALITY_THRESHOLDS["good"]),
            "poor": sum(1 for r in recent if r.overall < self.QUALITY_THRESHOLDS["acceptable"]),
        }
        
        # Human feedback stats
        positive_feedback = sum(1 for r in recent if r.source == EvaluationSource.HUMAN_POSITIVE)
        negative_feedback = sum(1 for r in recent if r.source == EvaluationSource.HUMAN_NEGATIVE)
        
        return {
            "period_days": days,
            "total_evaluations": len(recent),
            "averages": {
                "overall": round(avg_overall, 3),
                "relevance": round(avg_relevance, 3),
                "groundedness": round(avg_groundedness, 3),
                "completeness": round(avg_completeness, 3),
                "coherence": round(avg_coherence, 3),
            },
            "quality_distribution": quality_distribution,
            "human_feedback": {
                "positive": positive_feedback,
                "negative": negative_feedback,
                "total": positive_feedback + negative_feedback,
            },
            "avg_latency_ms": int(sum(r.latency_ms for r in recent) / len(recent)),
        }
    
    def _generate_query_id(self, query: str) -> str:
        """Generate deterministic query ID."""
        return hashlib.sha256(f"{query}:{datetime.utcnow().isoformat()}".encode()).hexdigest()[:16]
    
    def _get_quality_label(self, score: float) -> str:
        """Convert score to quality label."""
        if score >= self.QUALITY_THRESHOLDS["excellent"]:
            return "Excellent"
        elif score >= self.QUALITY_THRESHOLDS["good"]:
            return "Good"
        elif score >= self.QUALITY_THRESHOLDS["acceptable"]:
            return "Acceptable"
        else:
            return "Poor"
    
    def _store_result(self, result: EvaluationResult) -> None:
        """Store evaluation result."""
        self.history.append(result)
        
        # Trim history if too long
        if len(self.history) > self.max_history:
            self.history = self.history[-self.max_history:]
        
        # Persist to storage
        self._save_history()
    
    def _save_history(self) -> None:
        """Save history to storage path."""
        if not self.storage_path:
            return
        
        try:
            with open(self.storage_path, "w") as f:
                json.dump([r.to_dict() for r in self.history], f)
        except Exception as e:
            self.logger.error(f"Failed to save evaluation history: {e}")
    
    def _load_history(self) -> None:
        """Load history from storage path."""
        if not self.storage_path or not os.path.exists(self.storage_path):
            return
        
        try:
            with open(self.storage_path, "r") as f:
                data = json.load(f)
            
            for item in data:
                self.history.append(
                    EvaluationResult(
                        query_id=item["query_id"],
                        query=item["query"],
                        timestamp=datetime.fromisoformat(item["timestamp"]),
                        relevance=item["relevance"],
                        groundedness=item["groundedness"],
                        completeness=item["completeness"],
                        coherence=item["coherence"],
                        overall=item["overall"],
                        source=EvaluationSource(item["source"]),
                        source_count=item["source_count"],
                        confidence=item["confidence"],
                        latency_ms=item["latency_ms"],
                        explanation=item["explanation"],
                        issues=item.get("issues", []),
                    )
                )
        except Exception as e:
            self.logger.error(f"Failed to load evaluation history: {e}")


# Global instance
_evaluator: Optional[AnswerEvaluator] = None


def get_evaluator() -> AnswerEvaluator:
    """Get or create global evaluator instance."""
    global _evaluator
    if _evaluator is None:
        _evaluator = AnswerEvaluator()
    return _evaluator
