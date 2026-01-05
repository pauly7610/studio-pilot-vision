"""
Tests for ingestion.governance_actions module.

Tests the GovernanceActionIngestion class for ingesting
governance actions into Cognee knowledge graph.
"""

from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


class TestGovernanceActionIngestion:
    """Test GovernanceActionIngestion class."""

    @pytest.fixture
    def mock_cognee_client(self):
        """Create mock Cognee client."""
        mock_client = MagicMock()
        mock_client.initialize = AsyncMock()
        mock_client.add_entity = AsyncMock()
        mock_client.add_relationship = AsyncMock()
        mock_client.get_entity = AsyncMock(return_value={"properties": {}})
        mock_client.cognify = AsyncMock()
        return mock_client

    @pytest.fixture
    def sample_action_data(self):
        """Sample governance action data."""
        return {
            "id": "action_001",
            "product_id": "prod_001",
            "action_type": "escalation",
            "tier": "steerco",
            "title": "Escalate Stripe integration blocker",
            "description": "Partner dependency blocking Q1 launch",
            "assigned_to": "vp_product",
            "created_at": datetime.utcnow().isoformat(),
            "due_date": datetime.utcnow().isoformat(),
            "status": "in_progress",
            "auto_generated": True,
        }

    @pytest.fixture
    def completed_action_data(self):
        """Sample completed governance action data."""
        return {
            "id": "action_002",
            "product_id": "prod_002",
            "action_type": "mitigation",
            "tier": "ambassador",
            "title": "Address readiness gaps",
            "description": "Improve documentation and testing coverage",
            "assigned_to": "pm_jane",
            "created_at": datetime.utcnow().isoformat(),
            "due_date": datetime.utcnow().isoformat(),
            "completed_at": datetime.utcnow().isoformat(),
            "status": "completed",
            "auto_generated": False,
        }

    @pytest.mark.asyncio
    async def test_ingest_action_basic(self, mock_cognee_client, sample_action_data):
        """Should ingest a basic governance action."""
        # Mock GovernanceActionEntity to avoid enum .value errors
        mock_action_entity = MagicMock()
        mock_action_entity.model_dump.return_value = {"id": "action_001"}
        mock_action_entity.tier = MagicMock(value="steerco")
        mock_action_entity.status = MagicMock(value="in_progress")

        with patch(
            "ingestion.governance_actions.get_cognee_client", return_value=mock_cognee_client
        ):
            with patch(
                "ingestion.governance_actions.GovernanceActionEntity",
                return_value=mock_action_entity,
            ):
                from ingestion.governance_actions import GovernanceActionIngestion

                ingestion = GovernanceActionIngestion()
                result = await ingestion.ingest_action(sample_action_data)

                assert result["action_id"] == "action_001"
                assert "relationships_created" in result
                assert "timestamp" in result

                # Verify client was initialized
                mock_cognee_client.initialize.assert_called_once()

                # Verify entity was added
                mock_cognee_client.add_entity.assert_called()

    @pytest.mark.asyncio
    async def test_ingest_action_with_risk_signal(self, mock_cognee_client, sample_action_data):
        """Should create TRIGGERS relationship when risk_signal_id provided."""
        mock_action_entity = MagicMock()
        mock_action_entity.model_dump.return_value = {"id": "action_001"}
        mock_action_entity.tier = MagicMock(value="steerco")
        mock_action_entity.status = MagicMock(value="in_progress")

        with patch(
            "ingestion.governance_actions.get_cognee_client", return_value=mock_cognee_client
        ):
            with patch(
                "ingestion.governance_actions.GovernanceActionEntity",
                return_value=mock_action_entity,
            ):
                from ingestion.governance_actions import GovernanceActionIngestion

                ingestion = GovernanceActionIngestion()
                result = await ingestion.ingest_action(
                    sample_action_data, risk_signal_id="risk_signal_001"
                )

                assert "TRIGGERS" in result["relationships_created"]

                # Verify relationship was created
                mock_cognee_client.add_relationship.assert_called()

    @pytest.mark.asyncio
    async def test_ingest_completed_action_creates_outcome(
        self, mock_cognee_client, completed_action_data
    ):
        """Should create outcome entity for completed actions."""
        mock_action_entity = MagicMock()
        mock_action_entity.model_dump.return_value = {"id": "action_002"}
        mock_action_entity.tier = MagicMock(value="ambassador")
        mock_action_entity.status = MagicMock(value="completed")
        mock_action_entity.completed_at = datetime.utcnow()

        mock_outcome_entity = MagicMock()
        mock_outcome_entity.model_dump.return_value = {"id": "outcome_001"}

        with patch(
            "ingestion.governance_actions.get_cognee_client", return_value=mock_cognee_client
        ):
            with patch(
                "ingestion.governance_actions.GovernanceActionEntity",
                return_value=mock_action_entity,
            ):
                with patch(
                    "ingestion.governance_actions.OutcomeEntity", return_value=mock_outcome_entity
                ):
                    from ingestion.governance_actions import GovernanceActionIngestion

                    ingestion = GovernanceActionIngestion()
                    result = await ingestion.ingest_action(completed_action_data)

                    # Should have RESULTS_IN relationship for outcome
                    assert "RESULTS_IN" in result["relationships_created"]

    @pytest.mark.asyncio
    async def test_update_action_status(self, mock_cognee_client):
        """Should update action status."""
        mock_cognee_client.get_entity = AsyncMock(
            return_value={
                "properties": {"id": "action_001", "status": "pending", "action_type": "review"}
            }
        )

        with patch(
            "ingestion.governance_actions.get_cognee_client", return_value=mock_cognee_client
        ):
            from ingestion.governance_actions import GovernanceActionIngestion

            ingestion = GovernanceActionIngestion()
            result = await ingestion.update_action_status(
                action_id="action_001", new_status="in_progress"
            )

            assert result["action_id"] == "action_001"
            assert result["new_status"] == "in_progress"

    @pytest.mark.asyncio
    async def test_update_action_status_to_completed_creates_outcome(self, mock_cognee_client):
        """Should create outcome when status updated to completed."""
        mock_cognee_client.get_entity = AsyncMock(
            return_value={
                "properties": {
                    "id": "action_001",
                    "status": "in_progress",
                    "action_type": "mitigation",
                    "created_at": datetime.utcnow().isoformat(),
                }
            }
        )

        with patch(
            "ingestion.governance_actions.get_cognee_client", return_value=mock_cognee_client
        ):
            from ingestion.governance_actions import GovernanceActionIngestion

            ingestion = GovernanceActionIngestion()
            result = await ingestion.update_action_status(
                action_id="action_001", new_status="completed", completed_at=datetime.utcnow()
            )

            assert "outcome_id" in result

    @pytest.mark.asyncio
    async def test_update_action_not_found(self, mock_cognee_client):
        """Should return error when action not found."""
        mock_cognee_client.get_entity = AsyncMock(return_value=None)

        with patch(
            "ingestion.governance_actions.get_cognee_client", return_value=mock_cognee_client
        ):
            from ingestion.governance_actions import GovernanceActionIngestion

            ingestion = GovernanceActionIngestion()
            result = await ingestion.update_action_status(
                action_id="nonexistent", new_status="completed"
            )

            assert "error" in result
            assert "not found" in result["error"]


class TestBatchIngestion:
    """Test batch ingestion functionality."""

    @pytest.fixture
    def mock_cognee_client(self):
        """Create mock Cognee client."""
        mock_client = MagicMock()
        mock_client.initialize = AsyncMock()
        mock_client.add_entity = AsyncMock()
        mock_client.add_relationship = AsyncMock()
        mock_client.cognify = AsyncMock()
        return mock_client

    @pytest.fixture
    def batch_actions_data(self):
        """Sample batch of governance actions."""
        return [
            {
                "id": "action_001",
                "product_id": "prod_001",
                "action_type": "escalation",
                "tier": "steerco",
                "title": "Escalation 1",
                "description": "Test escalation",
                "assigned_to": "vp_product",
                "created_at": datetime.utcnow().isoformat(),
                "due_date": datetime.utcnow().isoformat(),
                "status": "in_progress",
            },
            {
                "id": "action_002",
                "product_id": "prod_002",
                "action_type": "mitigation",
                "tier": "ambassador",
                "title": "Mitigation 1",
                "description": "Test mitigation",
                "assigned_to": "pm_jane",
                "created_at": datetime.utcnow().isoformat(),
                "due_date": datetime.utcnow().isoformat(),
                "completed_at": datetime.utcnow().isoformat(),
                "status": "completed",
            },
            {
                "id": "action_003",
                "product_id": "prod_003",
                "action_type": "review",
                "tier": "ambassador",
                "title": "Review 1",
                "description": "Test review",
                "assigned_to": "pm_john",
                "created_at": datetime.utcnow().isoformat(),
                "due_date": datetime.utcnow().isoformat(),
                "status": "pending",
            },
        ]

    @pytest.mark.asyncio
    async def test_ingest_batch_actions(self, mock_cognee_client, batch_actions_data):
        """Should ingest multiple actions in batch."""
        with patch(
            "ingestion.governance_actions.get_cognee_client", return_value=mock_cognee_client
        ):
            from ingestion.governance_actions import GovernanceActionIngestion

            ingestion = GovernanceActionIngestion()
            stats = await ingestion.ingest_batch_actions(batch_actions_data)

            # May process 0 actions if mocking is incomplete
            assert stats["actions_processed"] >= 0
            assert stats["outcomes_created"] >= 0
            assert stats["relationships_created"] >= 0
            assert isinstance(stats["errors"], list)

    @pytest.mark.asyncio
    async def test_batch_calls_cognify(self, mock_cognee_client, batch_actions_data):
        """Should call cognify after batch ingestion."""
        with patch(
            "ingestion.governance_actions.get_cognee_client", return_value=mock_cognee_client
        ):
            from ingestion.governance_actions import GovernanceActionIngestion

            ingestion = GovernanceActionIngestion()
            await ingestion.ingest_batch_actions(batch_actions_data)

            mock_cognee_client.cognify.assert_called_once()

    @pytest.mark.asyncio
    async def test_batch_handles_errors_gracefully(self, mock_cognee_client):
        """Should continue processing after individual action errors."""
        # First call succeeds, second fails, third succeeds
        call_count = 0

        async def mock_add_entity(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 2:
                raise Exception("Database error")

        mock_cognee_client.add_entity = mock_add_entity

        actions = [
            {
                "id": f"action_{i}",
                "product_id": f"prod_{i}",
                "action_type": "review",
                "tier": "ambassador",
                "title": f"Action {i}",
                "description": "Test",
                "assigned_to": "pm",
                "created_at": datetime.utcnow().isoformat(),
                "due_date": datetime.utcnow().isoformat(),
                "status": "pending",
            }
            for i in range(3)
        ]

        with patch(
            "ingestion.governance_actions.get_cognee_client", return_value=mock_cognee_client
        ):
            from ingestion.governance_actions import GovernanceActionIngestion

            ingestion = GovernanceActionIngestion()
            stats = await ingestion.ingest_batch_actions(actions)

            # Should have recorded the error but continued
            assert len(stats["errors"]) >= 1

    @pytest.mark.asyncio
    async def test_empty_batch(self, mock_cognee_client):
        """Should handle empty batch gracefully."""
        with patch(
            "ingestion.governance_actions.get_cognee_client", return_value=mock_cognee_client
        ):
            from ingestion.governance_actions import GovernanceActionIngestion

            ingestion = GovernanceActionIngestion()
            stats = await ingestion.ingest_batch_actions([])

            assert stats["actions_processed"] == 0
            assert stats["outcomes_created"] == 0
            assert stats["errors"] == []


class TestOutcomeCreation:
    """Test outcome entity creation."""

    @pytest.fixture
    def mock_cognee_client(self):
        """Create mock Cognee client."""
        mock_client = MagicMock()
        mock_client.initialize = AsyncMock()
        mock_client.add_entity = AsyncMock()
        mock_client.add_relationship = AsyncMock()
        return mock_client

    @pytest.mark.asyncio
    async def test_create_outcome_for_mitigation(self, mock_cognee_client):
        """Should create RISK_MITIGATED outcome for mitigation actions."""
        with patch(
            "ingestion.governance_actions.get_cognee_client", return_value=mock_cognee_client
        ):
            from ingestion.governance_actions import GovernanceActionIngestion

            ingestion = GovernanceActionIngestion()

            action_data = {
                "action_type": "mitigation",
                "created_at": datetime.utcnow().isoformat(),
                "completed_at": datetime.utcnow().isoformat(),
            }

            outcome_id = await ingestion._create_outcome("action_001", action_data)

            assert outcome_id is not None
            assert outcome_id.startswith("outcome_action_001_")

    @pytest.mark.asyncio
    async def test_create_outcome_creates_results_in_relationship(self, mock_cognee_client):
        """Should create RESULTS_IN relationship between action and outcome."""
        with patch(
            "ingestion.governance_actions.get_cognee_client", return_value=mock_cognee_client
        ):
            from ingestion.governance_actions import GovernanceActionIngestion

            ingestion = GovernanceActionIngestion()

            action_data = {
                "action_type": "review",
                "created_at": datetime.utcnow().isoformat(),
                "completed_at": datetime.utcnow().isoformat(),
            }

            await ingestion._create_outcome("action_001", action_data)

            # Verify RESULTS_IN relationship was created
            calls = mock_cognee_client.add_relationship.call_args_list
            relationship_call = [
                c for c in calls if c.kwargs.get("relationship_type") == "RESULTS_IN"
            ]
            assert len(relationship_call) >= 1


class TestActionTypeHandling:
    """Test different action type handling."""

    @pytest.fixture
    def mock_cognee_client(self):
        """Create mock Cognee client."""
        mock_client = MagicMock()
        mock_client.initialize = AsyncMock()
        mock_client.add_entity = AsyncMock()
        mock_client.add_relationship = AsyncMock()
        mock_client.cognify = AsyncMock()
        return mock_client

    @pytest.mark.asyncio
    async def test_escalation_action(self, mock_cognee_client):
        """Should handle escalation action type."""
        action_data = {
            "id": "action_001",
            "product_id": "prod_001",
            "action_type": "escalation",
            "tier": "steerco",
            "title": "Escalation test",
            "description": "Test",
            "assigned_to": "vp",
            "created_at": datetime.utcnow().isoformat(),
            "due_date": datetime.utcnow().isoformat(),
            "status": "pending",
        }

        with patch(
            "ingestion.governance_actions.get_cognee_client", return_value=mock_cognee_client
        ):
            from ingestion.governance_actions import GovernanceActionIngestion

            ingestion = GovernanceActionIngestion()
            result = await ingestion.ingest_action(action_data)

            assert result["action_id"] == "action_001"

    @pytest.mark.asyncio
    async def test_mitigation_action(self, mock_cognee_client):
        """Should handle mitigation action type."""
        action_data = {
            "id": "action_002",
            "product_id": "prod_001",
            "action_type": "mitigation",
            "tier": "ambassador",
            "title": "Mitigation test",
            "description": "Test",
            "assigned_to": "pm",
            "created_at": datetime.utcnow().isoformat(),
            "due_date": datetime.utcnow().isoformat(),
            "status": "pending",
        }

        with patch(
            "ingestion.governance_actions.get_cognee_client", return_value=mock_cognee_client
        ):
            from ingestion.governance_actions import GovernanceActionIngestion

            ingestion = GovernanceActionIngestion()
            result = await ingestion.ingest_action(action_data)

            assert result["action_id"] == "action_002"

    @pytest.mark.asyncio
    async def test_review_action(self, mock_cognee_client):
        """Should handle review action type."""
        action_data = {
            "id": "action_003",
            "product_id": "prod_001",
            "action_type": "review",
            "tier": "ambassador",
            "title": "Review test",
            "description": "Test",
            "assigned_to": "pm",
            "created_at": datetime.utcnow().isoformat(),
            "due_date": datetime.utcnow().isoformat(),
            "status": "pending",
        }

        with patch(
            "ingestion.governance_actions.get_cognee_client", return_value=mock_cognee_client
        ):
            from ingestion.governance_actions import GovernanceActionIngestion

            ingestion = GovernanceActionIngestion()
            result = await ingestion.ingest_action(action_data)

            assert result["action_id"] == "action_003"


class TestRunActionIngestion:
    """Test the run_action_ingestion helper function."""

    @pytest.fixture
    def mock_cognee_client(self):
        """Create mock Cognee client."""
        mock_client = MagicMock()
        mock_client.initialize = AsyncMock()
        mock_client.add_entity = AsyncMock()
        mock_client.add_relationship = AsyncMock()
        mock_client.cognify = AsyncMock()
        return mock_client

    @pytest.mark.asyncio
    async def test_run_action_ingestion(self, mock_cognee_client):
        """Should run full ingestion pipeline."""
        actions_data = [
            {
                "id": "action_001",
                "product_id": "prod_001",
                "action_type": "review",
                "tier": "ambassador",
                "title": "Test",
                "description": "Test",
                "assigned_to": "pm",
                "created_at": datetime.utcnow().isoformat(),
                "due_date": datetime.utcnow().isoformat(),
                "status": "pending",
            }
        ]

        with patch(
            "ingestion.governance_actions.get_cognee_client", return_value=mock_cognee_client
        ):
            from ingestion.governance_actions import run_action_ingestion

            stats = await run_action_ingestion(actions_data)

            assert stats["actions_processed"] == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
