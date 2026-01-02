"""
Intent Classification Module
Hybrid approach: Heuristics + LLM fallback for ambiguous queries.

WHY: Keyword-only classification is brittle and fails on phrasing variations.
     LLM provides semantic understanding but adds latency.
     Hybrid approach gives us speed + accuracy.
"""

import os
from datetime import datetime
from enum import Enum
from typing import Optional

from groq import Groq


class QueryIntent(str, Enum):
    """Query intent types for routing decisions."""

    HISTORICAL = "historical"  # Past events, trends, "why did X happen"
    CAUSAL = "causal"  # Cause-effect, "what caused Y", relationships
    FACTUAL = "factual"  # Current state, definitions, "what is Z"
    MIXED = "mixed"  # Requires both historical + current context
    UNKNOWN = "unknown"  # Ambiguous, needs LLM classification


class IntentClassifier:
    """
    Hybrid intent classifier with heuristics + LLM fallback.

    Design decisions:
    1. Try fast heuristics first (keyword matching)
    2. If confidence < threshold, use LLM
    3. Always return intent + confidence score
    4. Log classification for debugging
    """

    # Confidence threshold for heuristic classification
    # Below this, we use LLM for better accuracy
    HEURISTIC_CONFIDENCE_THRESHOLD = 0.7

    # Keyword patterns for each intent type
    HISTORICAL_KEYWORDS = [
        "why did",
        "how did",
        "what happened",
        "what led to",
        "history of",
        "previously",
        "in the past",
        "last time",
        "trend",
        "pattern",
        "evolution",
        "changed over time",
        "used to",
        "before",
        "earlier",
        "prior",
    ]

    CAUSAL_KEYWORDS = [
        "caused",
        "because",
        "reason for",
        "what triggered",
        "what led to",
        "impact of",
        "resulted in",
        "consequence",
        "relationship between",
        "correlation",
        "influenced by",
        "due to",
        "as a result",
        "stems from",
    ]

    FACTUAL_KEYWORDS = [
        "what is",
        "current",
        "now",
        "today",
        "status of",
        "list",
        "show me",
        "how many",
        "which products",
        "definition",
        "describe",
        "tell me about",
        "currently",
        "at present",
        "right now",
    ]

    MIXED_KEYWORDS = [
        "compare",
        "versus",
        "vs",
        "difference between",
        "how does",
        "similar to",
        "different from",
        "compared to",
        "relative to",
    ]

    def __init__(self, api_key: str = None):
        """Initialize classifier with Groq client for LLM fallback."""
        # Read API key at runtime, not import time
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        self.groq_client = Groq(api_key=self.api_key) if self.api_key else None
        self.classification_history = []  # For debugging and calibration

    def classify(self, query: str) -> tuple[QueryIntent, float, str]:
        """
        Classify query intent with confidence score.

        Args:
            query: Natural language query

        Returns:
            Tuple of (intent, confidence, reasoning)

        WHY: Returning reasoning makes classification explainable
             for debugging and user transparency.
        """
        query_lower = query.lower()

        # Step 1: Try heuristic classification
        intent, confidence, reasoning = self._heuristic_classify(query_lower)

        # Step 2: If confidence is low, use LLM
        if confidence < self.HEURISTIC_CONFIDENCE_THRESHOLD:
            intent, confidence, reasoning = self._llm_classify(query)

        # Step 3: Log for calibration
        self._log_classification(query, intent, confidence, reasoning)

        return intent, confidence, reasoning

    def _heuristic_classify(self, query_lower: str) -> tuple[QueryIntent, float, str]:
        """
        Fast keyword-based classification.

        WHY: Handles 80% of queries instantly without LLM call.
             Saves latency and API costs.
        """
        # Count keyword matches for each intent
        historical_score = sum(1 for kw in self.HISTORICAL_KEYWORDS if kw in query_lower)
        causal_score = sum(1 for kw in self.CAUSAL_KEYWORDS if kw in query_lower)
        factual_score = sum(1 for kw in self.FACTUAL_KEYWORDS if kw in query_lower)
        mixed_score = sum(1 for kw in self.MIXED_KEYWORDS if kw in query_lower)

        # Calculate total matches
        total_matches = historical_score + causal_score + factual_score + mixed_score

        # If no matches, return UNKNOWN with low confidence
        if total_matches == 0:
            return QueryIntent.UNKNOWN, 0.3, "No keyword matches found"

        # If multiple intent types match, it's MIXED
        intent_types_matched = sum([historical_score > 0, causal_score > 0, factual_score > 0])

        if intent_types_matched > 1 or mixed_score > 0:
            confidence = min(0.8, 0.5 + (mixed_score * 0.1))
            return (
                QueryIntent.MIXED,
                confidence,
                f"Multiple intent signals: H={historical_score}, C={causal_score}, F={factual_score}",
            )

        # Determine primary intent
        max_score = max(historical_score, causal_score, factual_score)

        if historical_score == max_score:
            intent = QueryIntent.HISTORICAL
        elif causal_score == max_score:
            intent = QueryIntent.CAUSAL
        else:
            intent = QueryIntent.FACTUAL

        # Calculate confidence based on match strength
        # More matches = higher confidence
        confidence = min(0.9, 0.5 + (max_score * 0.15))

        reasoning = f"Heuristic: {intent.value} (score={max_score}, total={total_matches})"

        return intent, confidence, reasoning

    def _llm_classify(self, query: str) -> tuple[QueryIntent, float, str]:
        """
        LLM-based classification for ambiguous queries.

        WHY: Handles edge cases and semantic nuances that keywords miss.
             Only called when heuristics are uncertain.
        """
        # Guard: If no Groq client available, return MIXED with low confidence
        if not self.groq_client:
            return QueryIntent.MIXED, 0.5, "LLM unavailable (no API key)"
        
        try:
            # Construct classification prompt
            prompt = f"""Classify the following query into ONE of these intent types:

HISTORICAL: Questions about past events, trends, or "why did X happen"
CAUSAL: Questions about cause-effect relationships or "what caused Y"
FACTUAL: Questions about current state, definitions, or "what is Z"
MIXED: Questions requiring both historical context and current facts

Query: "{query}"

Respond with ONLY the intent type (HISTORICAL, CAUSAL, FACTUAL, or MIXED) and a confidence score (0.0-1.0).
Format: INTENT|CONFIDENCE|REASONING

Example: HISTORICAL|0.85|Query asks about past event"""

            # Call Groq LLM with updated model
            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",  # Updated to current production model
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,  # Low temperature for consistent classification
                max_tokens=100,
            )

            # Parse response
            result = response.choices[0].message.content.strip()
            parts = result.split("|")

            if len(parts) >= 3:
                intent_str = parts[0].strip().upper()
                confidence = float(parts[1].strip())
                reasoning = parts[2].strip()

                # Map string to enum
                intent_map = {
                    "HISTORICAL": QueryIntent.HISTORICAL,
                    "CAUSAL": QueryIntent.CAUSAL,
                    "FACTUAL": QueryIntent.FACTUAL,
                    "MIXED": QueryIntent.MIXED,
                }

                intent = intent_map.get(intent_str, QueryIntent.MIXED)

                return intent, confidence, f"LLM: {reasoning}"

            # Fallback if parsing fails
            return QueryIntent.MIXED, 0.5, "LLM classification parse failed"

        except Exception as e:
            # Fallback on LLM error
            return QueryIntent.MIXED, 0.4, f"LLM error: {str(e)}"

    def _log_classification(
        self, query: str, intent: QueryIntent, confidence: float, reasoning: str
    ):
        """
        Log classification for debugging and calibration.

        WHY: Allows us to track classification accuracy over time
             and tune thresholds based on real-world performance.
        """
        self.classification_history.append(
            {
                "query": query,
                "intent": intent.value,
                "confidence": confidence,
                "reasoning": reasoning,
                "timestamp": str(datetime.now()),
            }
        )

        # Keep only last 1000 classifications to prevent memory bloat
        if len(self.classification_history) > 1000:
            self.classification_history = self.classification_history[-1000:]

    def get_classification_stats(self) -> dict[str, any]:
        """
        Get classification statistics for monitoring.

        WHY: Helps identify if classification is working well
             or if thresholds need adjustment.
        """
        if not self.classification_history:
            return {"total": 0}

        from collections import Counter

        intents = [c["intent"] for c in self.classification_history]
        confidences = [c["confidence"] for c in self.classification_history]

        return {
            "total": len(self.classification_history),
            "intent_distribution": dict(Counter(intents)),
            "avg_confidence": sum(confidences) / len(confidences),
            "low_confidence_count": sum(1 for c in confidences if c < 0.7),
            "llm_fallback_rate": sum(
                1 for c in self.classification_history if "LLM:" in c["reasoning"]
            )
            / len(self.classification_history),
        }


# Global classifier instance
_classifier: Optional[IntentClassifier] = None


def get_intent_classifier() -> IntentClassifier:
    """Get or create global intent classifier instance."""
    global _classifier
    
    # Recreate if API key wasn't available initially but is now
    if _classifier is not None and _classifier.groq_client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if api_key:
            _classifier = IntentClassifier(api_key=api_key)
    
    if _classifier is None:
        _classifier = IntentClassifier()
    
    return _classifier
