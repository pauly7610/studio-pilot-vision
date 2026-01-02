"""LLM Generation Module using Groq"""

import os
from typing import Any, Optional

from groq import Groq

from ai_insights.config.config import GROQ_API_KEY, GROQ_MODEL


class InsightGenerator:
    """Generate insights using Groq's fast inference with Kimi-K2 or Llama models."""

    def __init__(
        self,
        api_key: str = None,
        model: str = GROQ_MODEL,
    ):
        # Read API key at runtime, not import time
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        self.client = Groq(api_key=self.api_key) if self.api_key else None
        self.model = model

    def _build_context(self, retrieved_chunks: list[dict[str, Any]]) -> str:
        """Build context string from retrieved chunks."""
        if not retrieved_chunks:
            return "No relevant context found."

        context_parts = []
        for i, chunk in enumerate(retrieved_chunks, 1):
            source = chunk.get("metadata", {}).get("source", "unknown")
            text = chunk.get("text", "")
            context_parts.append(f"[Source {i} - {source}]\n{text}")

        return "\n\n".join(context_parts)

    def _build_prompt(
        self,
        query: str,
        context: str,
        system_prompt: Optional[str] = None,
    ) -> list[dict[str, str]]:
        """Build chat messages for the LLM."""
        default_system = """You are an AI assistant for Studio Pilot, a product management platform for financial services.
Your role is to provide actionable insights about products, their performance, risks, and opportunities.

Based on the provided context, answer the user's question with:
1. Clear, concise insights
2. Specific data points when available
3. Actionable recommendations where appropriate
4. Risk considerations for financial products

If the context doesn't contain enough information to answer the question, say so clearly.
Do not make up information not present in the context."""

        messages = [
            {
                "role": "system",
                "content": system_prompt or default_system,
            },
            {
                "role": "user",
                "content": f"""Context:
{context}

Question: {query}

Please provide a helpful, accurate response based on the context above.""",
            },
        ]

        return messages

    def generate(
        self,
        query: str,
        retrieved_chunks: list[dict[str, Any]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> dict[str, Any]:
        """Generate insight based on query and retrieved context."""
        if not self.client:
            return {
                "success": False,
                "error": "Groq API key not configured",
                "insight": None,
            }

        context = self._build_context(retrieved_chunks)
        messages = self._build_prompt(query, context, system_prompt)

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )

            insight = response.choices[0].message.content

            return {
                "success": True,
                "insight": insight,
                "model": self.model,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens,
                },
                "sources": [
                    {
                        "text": c.get("text", "")[:200] + "...",
                        "metadata": c.get("metadata", {}),
                        "score": c.get("score", c.get("distance", 0)),
                    }
                    for c in retrieved_chunks
                ],
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "insight": None,
            }

    def generate_product_insight(
        self,
        product_data: dict[str, Any],
        insight_type: str = "summary",
    ) -> dict[str, Any]:
        """Generate specific insight types for a product."""
        prompts = {
            "summary": f"Provide a brief executive summary of the product: {product_data.get('name', 'Unknown')}",
            "risks": f"What are the key risks and concerns for the product: {product_data.get('name', 'Unknown')}?",
            "opportunities": f"What opportunities exist for the product: {product_data.get('name', 'Unknown')}?",
            "recommendations": f"What are the top 3 recommendations for the product: {product_data.get('name', 'Unknown')}?",
            "competitive": f"How does the product {product_data.get('name', 'Unknown')} compare to market alternatives?",
        }

        query = prompts.get(insight_type, prompts["summary"])

        # Create a pseudo-chunk from product data
        product_context = [
            {
                "text": str(product_data),
                "metadata": {"source": "product_data"},
            }
        ]

        return self.generate(query, product_context)

    def generate_portfolio_insight(
        self,
        products: list[dict[str, Any]],
        query: str,
    ) -> dict[str, Any]:
        """Generate insights across multiple products."""
        # Create context from all products
        product_chunks = []
        for p in products[:10]:  # Limit to 10 products for context window
            product_chunks.append(
                {
                    "text": f"Product: {p.get('name')}, Stage: {p.get('lifecycle_stage')}, Region: {p.get('region')}, Revenue Target: ${p.get('revenue_target', 0):,.0f}",
                    "metadata": {"source": "portfolio", "product_id": p.get("id")},
                }
            )

        system_prompt = """You are a portfolio analysis AI for Studio Pilot.
Analyze the portfolio of products and provide strategic insights.
Focus on:
- Portfolio health and balance
- Risk distribution
- Revenue potential
- Stage progression patterns
- Regional coverage"""

        return self.generate(query, product_chunks, system_prompt=system_prompt)


# Singleton instance
_generator_instance = None


def get_generator() -> InsightGenerator:
    """Get or create singleton generator instance."""
    global _generator_instance
    
    # Recreate if API key wasn't available initially but is now
    if _generator_instance is not None and _generator_instance.client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if api_key:
            _generator_instance = InsightGenerator(api_key=api_key)
    
    if _generator_instance is None:
        _generator_instance = InsightGenerator()
    
    return _generator_instance
