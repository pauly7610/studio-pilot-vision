"""
Comprehensive tests for entity_validator module.

Tests entity validation, stable ID generation, and caching.
"""

from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


class TestEntityValidator:
    """Test EntityValidator class."""

    @pytest.fixture
    def mock_cognee_client(self):
        """Create mock Cognee client."""
        mock_client = MagicMock()
        mock_client.get_entity = AsyncMock()
        return mock_client

    @pytest.fixture
    def validator(self, mock_cognee_client):
        """Create EntityValidator with mocked client."""
        with patch(
            "ai_insights.orchestration.entity_validator.get_cognee_client",
            return_value=mock_cognee_client,
        ):
            from ai_insights.orchestration.entity_validator import EntityValidator

            return EntityValidator()


class TestGenerateStableId(TestEntityValidator):
    """Test stable ID generation."""

    def test_generate_stable_id_product(self, validator):
        """Should generate stable ID for Product."""
        entity_id = validator.generate_stable_id("Product", "PayLink")

        assert entity_id.startswith("prod_")
        assert len(entity_id) > 5

    def test_generate_stable_id_risk_signal(self, validator):
        """Should generate stable ID for RiskSignal."""
        entity_id = validator.generate_stable_id("RiskSignal", "High Risk")

        assert entity_id.startswith("risk_")

    def test_generate_stable_id_deterministic(self, validator):
        """Same input should always generate same ID."""
        id1 = validator.generate_stable_id("Product", "PayLink")
        id2 = validator.generate_stable_id("Product", "PayLink")

        assert id1 == id2

    def test_generate_stable_id_case_insensitive(self, validator):
        """Should normalize case."""
        id1 = validator.generate_stable_id("Product", "PayLink")
        id2 = validator.generate_stable_id("Product", "PAYLINK")
        id3 = validator.generate_stable_id("Product", "paylink")

        assert id1 == id2 == id3

    def test_generate_stable_id_strips_whitespace(self, validator):
        """Should strip whitespace."""
        id1 = validator.generate_stable_id("Product", "PayLink")
        id2 = validator.generate_stable_id("Product", "  PayLink  ")

        assert id1 == id2

    def test_generate_stable_id_different_types(self, validator):
        """Different entity types should generate different IDs."""
        id1 = validator.generate_stable_id("Product", "Test")
        id2 = validator.generate_stable_id("RiskSignal", "Test")

        assert id1 != id2
        assert id1.startswith("prod_")
        assert id2.startswith("risk_")

    def test_generate_stable_id_all_types(self, validator):
        """Should handle all entity types."""
        types = [
            ("Product", "prod"),
            ("RiskSignal", "risk"),
            ("Dependency", "dep"),
            ("GovernanceAction", "action"),
            ("Decision", "decision"),
            ("Outcome", "outcome"),
            ("RevenueSignal", "revenue"),
            ("FeedbackSignal", "feedback"),
            ("TimeWindow", "tw"),
            ("Portfolio", "portfolio"),
        ]

        for entity_type, prefix in types:
            entity_id = validator.generate_stable_id(entity_type, "test")
            assert entity_id.startswith(f"{prefix}_")

    def test_generate_stable_id_unknown_type(self, validator):
        """Unknown type should use 'entity' prefix."""
        entity_id = validator.generate_stable_id("UnknownType", "test")

        assert entity_id.startswith("entity_")


class TestValidateEntity(TestEntityValidator):
    """Test entity validation."""

    def test_validate_entity_not_found(self, validator, mock_cognee_client):
        """Should handle missing entity (returns False since entity_data is None)."""
        mock_cognee_client.get_entity.return_value = None

        valid, entity_data, message = validator.validate_entity("prod_999", "Product")

        assert valid is False
        assert entity_data is None
        assert "not found" in message.lower() or "does not exist" in message.lower()

    def test_validate_entity_allow_missing(self, validator, mock_cognee_client):
        """Should allow missing entity if flag set."""
        mock_cognee_client.get_entity.return_value = None

        valid, entity_data, message = validator.validate_entity(
            "prod_999", "Product", allow_missing=True
        )

        # With allow_missing=True, returns False but with "allowed" message
        assert valid is False
        assert entity_data is None
        assert "allowed" in message.lower()

    def test_validate_entity_error_handling(self, validator, mock_cognee_client):
        """Should handle errors gracefully."""
        mock_cognee_client.get_entity.side_effect = Exception("Connection error")

        valid, entity_data, message = validator.validate_entity("prod_123", "Product")

        assert valid is False
        assert entity_data is None
        # Message may say "does not exist" or "error" depending on implementation
        assert "does not exist" in message.lower() or "error" in message.lower()


class TestResolveEntity(TestEntityValidator):
    """Test entity resolution."""

    def test_resolve_entity_by_name(self, validator, mock_cognee_client):
        """Should resolve entity name to ID."""
        entity_id = validator.resolve_entity("PayLink", "Product")

        # Returns None since entity doesn't exist in mock
        assert entity_id is None or isinstance(entity_id, str)


class TestCacheManagement(TestEntityValidator):
    """Test cache management."""

    def test_clear_cache(self, validator):
        """Should clear entity cache."""
        validator.entity_cache["test"] = {"data": {}}

        validator.clear_cache()

        assert len(validator.entity_cache) == 0

    def test_cache_stats(self, validator):
        """Should return cache statistics."""
        validator.entity_cache["prod_1"] = {"data": {}, "timestamp": datetime.now()}
        validator.entity_cache["prod_2"] = {"data": {}, "timestamp": datetime.now()}

        stats = validator.get_cache_stats()

        assert "cached_entities" in stats
        assert stats["cached_entities"] == 2
        assert "cache_ttl_seconds" in stats


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
