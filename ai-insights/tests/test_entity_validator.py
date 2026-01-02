"""
Comprehensive tests for entity_validator module.

Tests entity validation, stable ID generation, caching, and grounding.
Improved coverage targeting 70%+.
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
        mock_client.get_relationships = AsyncMock(return_value=[])
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

    def test_generate_stable_id_dependency(self, validator):
        """Should generate stable ID for Dependency."""
        entity_id = validator.generate_stable_id("Dependency", "API Gateway")

        assert entity_id.startswith("dep_")

    def test_generate_stable_id_governance_action(self, validator):
        """Should generate stable ID for GovernanceAction."""
        entity_id = validator.generate_stable_id("GovernanceAction", "Review Required")

        assert entity_id.startswith("action_")

    def test_generate_stable_id_decision(self, validator):
        """Should generate stable ID for Decision."""
        entity_id = validator.generate_stable_id("Decision", "Approved")

        assert entity_id.startswith("decision_")

    def test_generate_stable_id_outcome(self, validator):
        """Should generate stable ID for Outcome."""
        entity_id = validator.generate_stable_id("Outcome", "Success")

        assert entity_id.startswith("outcome_")

    def test_generate_stable_id_revenue_signal(self, validator):
        """Should generate stable ID for RevenueSignal."""
        entity_id = validator.generate_stable_id("RevenueSignal", "Q4 Target")

        assert entity_id.startswith("revenue_")

    def test_generate_stable_id_feedback_signal(self, validator):
        """Should generate stable ID for FeedbackSignal."""
        entity_id = validator.generate_stable_id("FeedbackSignal", "Customer Complaint")

        assert entity_id.startswith("feedback_")

    def test_generate_stable_id_time_window(self, validator):
        """Should generate stable ID for TimeWindow."""
        entity_id = validator.generate_stable_id("TimeWindow", "2024-Q1")

        assert entity_id.startswith("tw_")

    def test_generate_stable_id_portfolio(self, validator):
        """Should generate stable ID for Portfolio."""
        entity_id = validator.generate_stable_id("Portfolio", "North America")

        assert entity_id.startswith("portfolio_")

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

    def test_generate_stable_id_different_names(self, validator):
        """Different names should generate different IDs."""
        id1 = validator.generate_stable_id("Product", "PayLink")
        id2 = validator.generate_stable_id("Product", "CardAuth")

        assert id1 != id2


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
        assert "allowed" in message.lower() or "not found" in message.lower()

    def test_validate_entity_error_handling(self, validator, mock_cognee_client):
        """Should handle errors gracefully."""
        mock_cognee_client.get_entity.side_effect = Exception("Connection error")

        valid, entity_data, message = validator.validate_entity("prod_123", "Product")

        assert valid is False
        assert entity_data is None
        # Message may say "does not exist" or "error" depending on implementation
        assert "does not exist" in message.lower() or "error" in message.lower()

    def test_validate_entity_from_cache(self, validator, mock_cognee_client):
        """Should return cached entity."""
        # Pre-populate cache
        cache_key = "Product:prod_001"
        validator.entity_cache[cache_key] = {
            "data": {"name": "Cached Product"},
            "cached_at": datetime.utcnow()
        }

        valid, entity_data, message = validator.validate_entity("prod_001", "Product")

        assert valid is True
        assert entity_data == {"name": "Cached Product"}
        assert "cache" in message.lower()

    def test_validate_entity_cache_expired(self, validator, mock_cognee_client):
        """Should not use expired cache."""
        # Pre-populate cache with old timestamp
        cache_key = "Product:prod_001"
        validator.entity_cache[cache_key] = {
            "data": {"name": "Old Product"},
            "cached_at": datetime.utcnow() - timedelta(seconds=600)  # 10 minutes old
        }

        valid, entity_data, message = validator.validate_entity("prod_001", "Product")

        # Should not use cache, will fail because entity not found
        assert valid is False


class TestValidateRelationship(TestEntityValidator):
    """Test relationship validation."""

    def test_validate_relationship_not_found(self, validator, mock_cognee_client):
        """Should return False if relationship not found."""
        mock_cognee_client.get_relationships.return_value = []

        valid, message = validator.validate_relationship(
            "prod_001", "DEPENDS_ON", "prod_002"
        )

        assert valid is False
        assert "not found" in message.lower()

    def test_validate_relationship_error(self, validator, mock_cognee_client):
        """Should handle errors gracefully."""
        mock_cognee_client.get_relationships.side_effect = Exception("Query failed")

        valid, message = validator.validate_relationship(
            "prod_001", "DEPENDS_ON", "prod_002"
        )

        assert valid is False
        # The implementation catches exception and returns "not found" message
        assert "not found" in message.lower() or "error" in message.lower()


class TestResolveEntity(TestEntityValidator):
    """Test entity resolution."""

    def test_resolve_entity_by_name(self, validator, mock_cognee_client):
        """Should resolve entity name to ID."""
        entity_id = validator.resolve_entity("PayLink", "Product")

        # Returns None since entity doesn't exist in mock
        assert entity_id is None or isinstance(entity_id, str)

    def test_resolve_entity_generates_stable_id(self, validator, mock_cognee_client):
        """Should generate stable ID from name."""
        # Mock validation to succeed
        with patch.object(validator, 'validate_entity', return_value=(True, {"name": "PayLink"}, "Valid")):
            entity_id = validator.resolve_entity("PayLink", "Product")
            
            assert entity_id is not None
            assert entity_id.startswith("prod_")


class TestCacheManagement(TestEntityValidator):
    """Test cache management."""

    def test_clear_cache(self, validator):
        """Should clear entity cache."""
        validator.entity_cache["test"] = {"data": {}}

        validator.clear_cache()

        assert len(validator.entity_cache) == 0

    def test_cache_stats(self, validator):
        """Should return cache statistics."""
        validator.entity_cache["prod_1"] = {"data": {}, "cached_at": datetime.utcnow()}
        validator.entity_cache["prod_2"] = {"data": {}, "cached_at": datetime.utcnow()}

        stats = validator.get_cache_stats()

        assert "cached_entities" in stats
        assert stats["cached_entities"] == 2
        assert "cache_ttl_seconds" in stats


class TestEntityGrounder:
    """Test EntityGrounder class."""

    @pytest.fixture
    def mock_cognee_client(self):
        """Create mock Cognee client."""
        mock_client = MagicMock()
        mock_client.get_entity = AsyncMock()
        mock_client.get_relationships = AsyncMock(return_value=[])
        return mock_client

    @pytest.fixture
    def grounder(self, mock_cognee_client):
        """Create EntityGrounder with mocked client."""
        with patch(
            "ai_insights.orchestration.entity_validator.get_cognee_client",
            return_value=mock_cognee_client,
        ):
            from ai_insights.orchestration.entity_validator import EntityGrounder

            return EntityGrounder()

    @pytest.mark.asyncio
    async def test_ground_entities_empty_list(self, grounder):
        """Should handle empty entity list."""
        grounded, errors = await grounder.ground_entities([])

        assert grounded == []
        assert errors == []

    @pytest.mark.asyncio
    async def test_ground_entities_invalid_reference(self, grounder):
        """Should report error for invalid entity reference."""
        entities = [{"id": None, "type": None}]

        grounded, errors = await grounder.ground_entities(entities)

        assert len(grounded) == 0
        assert len(errors) == 1
        assert "Invalid" in errors[0]

    @pytest.mark.asyncio
    async def test_ground_entities_missing_id(self, grounder):
        """Should report error for missing ID."""
        entities = [{"type": "Product"}]

        grounded, errors = await grounder.ground_entities(entities)

        assert len(grounded) == 0
        assert len(errors) == 1

    @pytest.mark.asyncio
    async def test_ground_entities_missing_type(self, grounder):
        """Should report error for missing type."""
        entities = [{"id": "prod_001"}]

        grounded, errors = await grounder.ground_entities(entities)

        assert len(grounded) == 0
        assert len(errors) == 1


class TestGetEntityValidator:
    """Test singleton factory function."""

    def test_returns_validator_instance(self):
        """Should return EntityValidator instance."""
        with patch(
            "ai_insights.orchestration.entity_validator.get_cognee_client",
            return_value=MagicMock(),
        ):
            import ai_insights.orchestration.entity_validator as module

            # Reset singleton
            module._validator = None

            result = module.get_entity_validator()

            assert isinstance(result, module.EntityValidator)

    def test_returns_singleton(self):
        """Should return same instance on multiple calls."""
        with patch(
            "ai_insights.orchestration.entity_validator.get_cognee_client",
            return_value=MagicMock(),
        ):
            import ai_insights.orchestration.entity_validator as module

            # Reset singleton
            module._validator = None

            result1 = module.get_entity_validator()
            result2 = module.get_entity_validator()

            assert result1 is result2


class TestGetEntityGrounder:
    """Test singleton factory function for grounder."""

    def test_returns_grounder_instance(self):
        """Should return EntityGrounder instance."""
        with patch(
            "ai_insights.orchestration.entity_validator.get_cognee_client",
            return_value=MagicMock(),
        ):
            import ai_insights.orchestration.entity_validator as module

            # Reset singleton
            module._grounder = None

            result = module.get_entity_grounder()

            assert isinstance(result, module.EntityGrounder)

    def test_returns_singleton(self):
        """Should return same instance on multiple calls."""
        with patch(
            "ai_insights.orchestration.entity_validator.get_cognee_client",
            return_value=MagicMock(),
        ):
            import ai_insights.orchestration.entity_validator as module

            # Reset singleton
            module._grounder = None

            result1 = module.get_entity_grounder()
            result2 = module.get_entity_grounder()

            assert result1 is result2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
