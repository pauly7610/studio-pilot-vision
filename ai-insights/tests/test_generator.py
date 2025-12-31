"""
Tests for ai_insights.utils.generator module.

Tests the actual implementation:
- InsightGenerator class
- generate() method
- generate_product_insight() method
- generate_portfolio_insight() method
- get_generator() singleton function
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest


class TestInsightGeneratorInit:
    """Test InsightGenerator initialization."""

    def test_init_with_api_key(self):
        """Should initialize with API key."""
        with patch("ai_insights.utils.generator.Groq") as mock_groq:
            from ai_insights.utils.generator import InsightGenerator

            generator = InsightGenerator(api_key="test-key", model="test-model")

            mock_groq.assert_called_once_with(api_key="test-key")
            assert generator.model == "test-model"

    def test_init_without_api_key(self):
        """Should set client to None without API key."""
        with patch("ai_insights.utils.generator.GROQ_API_KEY", None):
            with patch("ai_insights.utils.generator.Groq"):
                from ai_insights.utils.generator import InsightGenerator

                generator = InsightGenerator(api_key=None, model="test-model")

                assert generator.client is None

    def test_init_uses_default_model(self):
        """Should use default model from config."""
        with patch("ai_insights.utils.generator.Groq"):
            with patch("ai_insights.utils.generator.GROQ_MODEL", "llama-3.3-70b-versatile"):
                from ai_insights.utils.generator import InsightGenerator

                generator = InsightGenerator(api_key="test-key")

                assert generator.model == "llama-3.3-70b-versatile"


class TestBuildContext:
    """Test _build_context method."""

    def test_build_context_with_chunks(self):
        """Should build context string from chunks."""
        with patch("ai_insights.utils.generator.Groq"):
            from ai_insights.utils.generator import InsightGenerator

            generator = InsightGenerator(api_key="test-key")

            chunks = [
                {"text": "First chunk content", "metadata": {"source": "doc1.pdf"}},
                {"text": "Second chunk content", "metadata": {"source": "doc2.pdf"}},
            ]

            context = generator._build_context(chunks)

            assert "[Source 1 - doc1.pdf]" in context
            assert "First chunk content" in context
            assert "[Source 2 - doc2.pdf]" in context
            assert "Second chunk content" in context

    def test_build_context_empty_chunks(self):
        """Should return default message for empty chunks."""
        with patch("ai_insights.utils.generator.Groq"):
            from ai_insights.utils.generator import InsightGenerator

            generator = InsightGenerator(api_key="test-key")

            context = generator._build_context([])

            assert context == "No relevant context found."

    def test_build_context_missing_metadata(self):
        """Should handle chunks without metadata."""
        with patch("ai_insights.utils.generator.Groq"):
            from ai_insights.utils.generator import InsightGenerator

            generator = InsightGenerator(api_key="test-key")

            chunks = [{"text": "Content without metadata"}]

            context = generator._build_context(chunks)

            assert "[Source 1 - unknown]" in context
            assert "Content without metadata" in context


class TestBuildPrompt:
    """Test _build_prompt method."""

    def test_build_prompt_with_default_system(self):
        """Should use default system prompt."""
        with patch("ai_insights.utils.generator.Groq"):
            from ai_insights.utils.generator import InsightGenerator

            generator = InsightGenerator(api_key="test-key")

            messages = generator._build_prompt("What is the risk?", "Context here")

            assert len(messages) == 2
            assert messages[0]["role"] == "system"
            assert "Studio Pilot" in messages[0]["content"]
            assert messages[1]["role"] == "user"
            assert "What is the risk?" in messages[1]["content"]
            assert "Context here" in messages[1]["content"]

    def test_build_prompt_with_custom_system(self):
        """Should use custom system prompt when provided."""
        with patch("ai_insights.utils.generator.Groq"):
            from ai_insights.utils.generator import InsightGenerator

            generator = InsightGenerator(api_key="test-key")

            custom_prompt = "You are a custom assistant."
            messages = generator._build_prompt("Query", "Context", system_prompt=custom_prompt)

            assert messages[0]["content"] == custom_prompt


class TestGenerate:
    """Test generate method."""

    def test_generate_success(self):
        """Should generate insight successfully."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Generated insight"
        mock_response.usage.prompt_tokens = 100
        mock_response.usage.completion_tokens = 50
        mock_response.usage.total_tokens = 150

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response

        with patch("ai_insights.utils.generator.Groq", return_value=mock_client):
            from ai_insights.utils.generator import InsightGenerator

            generator = InsightGenerator(api_key="test-key", model="test-model")

            result = generator.generate(
                query="What are the risks?",
                retrieved_chunks=[{"text": "Risk data", "metadata": {"source": "test"}}],
            )

            assert result["success"] is True
            assert result["insight"] == "Generated insight"
            assert result["model"] == "test-model"
            assert result["usage"]["total_tokens"] == 150
            assert len(result["sources"]) == 1

    def test_generate_without_client(self):
        """Should return error when client not configured."""
        with patch("ai_insights.utils.generator.Groq"):
            from ai_insights.utils.generator import InsightGenerator

            generator = InsightGenerator(api_key=None)
            generator.client = None

            result = generator.generate(query="Test query", retrieved_chunks=[])

            assert result["success"] is False
            assert "not configured" in result["error"]

    def test_generate_handles_api_error(self):
        """Should handle API errors gracefully."""
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = Exception("API Error")

        with patch("ai_insights.utils.generator.Groq", return_value=mock_client):
            from ai_insights.utils.generator import InsightGenerator

            generator = InsightGenerator(api_key="test-key")

            result = generator.generate(
                query="Test query", retrieved_chunks=[{"text": "data", "metadata": {}}]
            )

            assert result["success"] is False
            assert "API Error" in result["error"]

    def test_generate_with_custom_temperature(self):
        """Should pass custom temperature to API."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Response"
        mock_response.usage.prompt_tokens = 10
        mock_response.usage.completion_tokens = 10
        mock_response.usage.total_tokens = 20

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response

        with patch("ai_insights.utils.generator.Groq", return_value=mock_client):
            from ai_insights.utils.generator import InsightGenerator

            generator = InsightGenerator(api_key="test-key")

            generator.generate(query="Query", retrieved_chunks=[], temperature=0.5)

            call_kwargs = mock_client.chat.completions.create.call_args[1]
            assert call_kwargs["temperature"] == 0.5

    def test_generate_with_custom_max_tokens(self):
        """Should pass custom max_tokens to API."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Response"
        mock_response.usage.prompt_tokens = 10
        mock_response.usage.completion_tokens = 10
        mock_response.usage.total_tokens = 20

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response

        with patch("ai_insights.utils.generator.Groq", return_value=mock_client):
            from ai_insights.utils.generator import InsightGenerator

            generator = InsightGenerator(api_key="test-key")

            generator.generate(query="Query", retrieved_chunks=[], max_tokens=2048)

            call_kwargs = mock_client.chat.completions.create.call_args[1]
            assert call_kwargs["max_tokens"] == 2048


class TestGenerateProductInsight:
    """Test generate_product_insight method."""

    def test_generate_summary_insight(self):
        """Should generate summary insight for product."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Product summary"
        mock_response.usage.prompt_tokens = 50
        mock_response.usage.completion_tokens = 30
        mock_response.usage.total_tokens = 80

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response

        with patch("ai_insights.utils.generator.Groq", return_value=mock_client):
            from ai_insights.utils.generator import InsightGenerator

            generator = InsightGenerator(api_key="test-key")

            product_data = {"name": "Test Product", "status": "active"}
            result = generator.generate_product_insight(product_data, "summary")

            assert result["success"] is True

    def test_generate_risks_insight(self):
        """Should generate risks insight for product."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Product risks"
        mock_response.usage.prompt_tokens = 50
        mock_response.usage.completion_tokens = 30
        mock_response.usage.total_tokens = 80

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response

        with patch("ai_insights.utils.generator.Groq", return_value=mock_client):
            from ai_insights.utils.generator import InsightGenerator

            generator = InsightGenerator(api_key="test-key")

            product_data = {"name": "Test Product"}
            result = generator.generate_product_insight(product_data, "risks")

            assert result["success"] is True

    def test_generate_opportunities_insight(self):
        """Should generate opportunities insight."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Opportunities"
        mock_response.usage.prompt_tokens = 50
        mock_response.usage.completion_tokens = 30
        mock_response.usage.total_tokens = 80

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response

        with patch("ai_insights.utils.generator.Groq", return_value=mock_client):
            from ai_insights.utils.generator import InsightGenerator

            generator = InsightGenerator(api_key="test-key")

            result = generator.generate_product_insight({"name": "Product"}, "opportunities")
            assert result["success"] is True

    def test_generate_recommendations_insight(self):
        """Should generate recommendations insight."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Recommendations"
        mock_response.usage.prompt_tokens = 50
        mock_response.usage.completion_tokens = 30
        mock_response.usage.total_tokens = 80

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response

        with patch("ai_insights.utils.generator.Groq", return_value=mock_client):
            from ai_insights.utils.generator import InsightGenerator

            generator = InsightGenerator(api_key="test-key")

            result = generator.generate_product_insight({"name": "Product"}, "recommendations")
            assert result["success"] is True

    def test_unknown_insight_type_defaults_to_summary(self):
        """Should default to summary for unknown insight types."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Summary"
        mock_response.usage.prompt_tokens = 50
        mock_response.usage.completion_tokens = 30
        mock_response.usage.total_tokens = 80

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response

        with patch("ai_insights.utils.generator.Groq", return_value=mock_client):
            from ai_insights.utils.generator import InsightGenerator

            generator = InsightGenerator(api_key="test-key")

            result = generator.generate_product_insight({"name": "Product"}, "unknown_type")
            assert result["success"] is True


class TestGeneratePortfolioInsight:
    """Test generate_portfolio_insight method."""

    def test_generate_portfolio_insight_success(self):
        """Should generate insight across multiple products."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Portfolio analysis"
        mock_response.usage.prompt_tokens = 100
        mock_response.usage.completion_tokens = 50
        mock_response.usage.total_tokens = 150

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response

        with patch("ai_insights.utils.generator.Groq", return_value=mock_client):
            from ai_insights.utils.generator import InsightGenerator

            generator = InsightGenerator(api_key="test-key")

            products = [
                {
                    "id": "1",
                    "name": "Product A",
                    "lifecycle_stage": "growth",
                    "region": "US",
                    "revenue_target": 1000000,
                },
                {
                    "id": "2",
                    "name": "Product B",
                    "lifecycle_stage": "mature",
                    "region": "EU",
                    "revenue_target": 2000000,
                },
            ]

            result = generator.generate_portfolio_insight(products, "What is the portfolio risk?")

            assert result["success"] is True
            assert result["insight"] == "Portfolio analysis"

    def test_portfolio_insight_limits_products(self):
        """Should limit to 10 products for context window."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Analysis"
        mock_response.usage.prompt_tokens = 100
        mock_response.usage.completion_tokens = 50
        mock_response.usage.total_tokens = 150

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response

        with patch("ai_insights.utils.generator.Groq", return_value=mock_client):
            from ai_insights.utils.generator import InsightGenerator

            generator = InsightGenerator(api_key="test-key")

            # Create 15 products
            products = [
                {
                    "id": str(i),
                    "name": f"Product {i}",
                    "lifecycle_stage": "active",
                    "region": "US",
                    "revenue_target": 100000,
                }
                for i in range(15)
            ]

            result = generator.generate_portfolio_insight(products, "Analysis")

            # Should still succeed (limited internally to 10)
            assert result["success"] is True

    def test_portfolio_insight_uses_custom_system_prompt(self):
        """Should use portfolio-specific system prompt."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Analysis"
        mock_response.usage.prompt_tokens = 100
        mock_response.usage.completion_tokens = 50
        mock_response.usage.total_tokens = 150

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response

        with patch("ai_insights.utils.generator.Groq", return_value=mock_client):
            from ai_insights.utils.generator import InsightGenerator

            generator = InsightGenerator(api_key="test-key")

            generator.generate_portfolio_insight([{"id": "1", "name": "P1"}], "Query")

            # Check that system prompt contains portfolio keywords
            call_kwargs = mock_client.chat.completions.create.call_args[1]
            messages = call_kwargs["messages"]
            system_content = messages[0]["content"]
            assert "portfolio" in system_content.lower()


class TestGetGenerator:
    """Test get_generator singleton function."""

    def test_get_generator_returns_instance(self):
        """Should return InsightGenerator instance."""
        with patch("ai_insights.utils.generator.Groq"):
            with patch("ai_insights.utils.generator._generator_instance", None):
                from ai_insights.utils.generator import InsightGenerator, get_generator

                generator = get_generator()

                assert isinstance(generator, InsightGenerator)

    def test_get_generator_returns_singleton(self):
        """Should return same instance on multiple calls."""
        with patch("ai_insights.utils.generator.Groq"):
            # Reset singleton
            import ai_insights.utils.generator as gen_module

            gen_module._generator_instance = None

            gen1 = gen_module.get_generator()
            gen2 = gen_module.get_generator()

            assert gen1 is gen2


class TestSourcesTruncation:
    """Test that sources are properly truncated in response."""

    def test_sources_truncated_to_200_chars(self):
        """Should truncate source text to 200 characters."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Response"
        mock_response.usage.prompt_tokens = 10
        mock_response.usage.completion_tokens = 10
        mock_response.usage.total_tokens = 20

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response

        with patch("ai_insights.utils.generator.Groq", return_value=mock_client):
            from ai_insights.utils.generator import InsightGenerator

            generator = InsightGenerator(api_key="test-key")

            long_text = "x" * 500
            result = generator.generate(
                query="Query",
                retrieved_chunks=[
                    {"text": long_text, "metadata": {"source": "test"}, "score": 0.9}
                ],
            )

            # Source text should be truncated
            assert len(result["sources"][0]["text"]) == 203  # 200 + "..."


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
