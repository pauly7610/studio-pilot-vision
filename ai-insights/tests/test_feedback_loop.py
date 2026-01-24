"""
Tests for ai_insights.orchestration.feedback_loop module.

Tests the RAG → Cognee feedback loop functionality.
"""

import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch


class TestRAGFinding:
    """Tests for RAGFinding dataclass."""

    def test_finding_creation(self):
        """Should create finding with all fields."""
        from ai_insights.orchestration.feedback_loop import RAGFinding

        finding = RAGFinding(
            id="finding_123",
            content="Test finding content",
            source="doc_456",
            confidence=0.9,
            timestamp=datetime.utcnow(),
            query_context="What is X?",
            entity_references=["prod_1", "prod_2"],
        )
        
        assert finding.id == "finding_123"
        assert finding.confidence == 0.9
        assert finding.verified is False
        assert finding.verification_count == 1

    def test_finding_to_dict(self):
        """Should convert to dictionary."""
        from ai_insights.orchestration.feedback_loop import RAGFinding

        finding = RAGFinding(
            id="finding_123",
            content="Test content",
            source="doc_456",
            confidence=0.9,
            timestamp=datetime.utcnow(),
            query_context="context",
        )
        
        d = finding.to_dict()
        assert d["id"] == "finding_123"
        assert d["confidence"] == 0.9
        assert d["verified"] is False


class TestFeedbackLoop:
    """Tests for FeedbackLoop class."""

    def test_feedback_loop_initialization(self):
        """Should initialize with empty state."""
        from ai_insights.orchestration.feedback_loop import FeedbackLoop

        loop = FeedbackLoop()
        assert len(loop._pending) == 0
        assert loop._stats["findings_received"] == 0

    @pytest.mark.asyncio
    async def test_add_finding_high_confidence(self):
        """Should accept high-confidence findings."""
        from ai_insights.orchestration.feedback_loop import FeedbackLoop

        loop = FeedbackLoop()
        
        finding_id = await loop.add_finding(
            content="Product X has feature Y",
            source="doc_123",
            confidence=0.9,
            query_context="What features does X have?",
        )
        
        assert finding_id is not None
        assert loop._stats["findings_received"] == 1
        assert len(loop._pending) == 1

    @pytest.mark.asyncio
    async def test_add_finding_low_confidence_rejected(self):
        """Should reject low-confidence findings."""
        from ai_insights.orchestration.feedback_loop import FeedbackLoop

        loop = FeedbackLoop()
        
        finding_id = await loop.add_finding(
            content="Maybe X does Y",
            source="doc_123",
            confidence=0.5,  # Below threshold (0.8)
            query_context="context",
        )
        
        assert finding_id is None
        assert loop._stats["findings_rejected"] == 1
        assert len(loop._pending) == 0

    @pytest.mark.asyncio
    async def test_add_finding_deduplication(self):
        """Should deduplicate identical findings."""
        from ai_insights.orchestration.feedback_loop import FeedbackLoop

        loop = FeedbackLoop()
        
        # Add same finding twice
        id1 = await loop.add_finding(
            content="Product X has feature Y",
            source="doc_123",
            confidence=0.85,
            query_context="context 1",
        )
        
        id2 = await loop.add_finding(
            content="Product X has feature Y",
            source="doc_456",
            confidence=0.9,
            query_context="context 2",
        )
        
        assert id1 == id2  # Same ID
        assert len(loop._pending) == 1
        assert loop._stats["findings_deduplicated"] == 1
        
        # Verification count should increase
        assert loop._pending[id1].verification_count == 2

    @pytest.mark.asyncio
    async def test_finding_becomes_verified(self):
        """Should mark finding as verified after threshold."""
        from ai_insights.orchestration.feedback_loop import FeedbackLoop

        loop = FeedbackLoop()
        loop.VERIFICATION_THRESHOLD = 2  # Need 2 sources
        
        # Add same finding twice
        finding_id = await loop.add_finding(
            content="Product X has feature Y",
            source="doc_1",
            confidence=0.85,
            query_context="context",
        )
        
        # Not verified yet
        assert loop._pending[finding_id].verified is False
        
        # Add again
        await loop.add_finding(
            content="Product X has feature Y",
            source="doc_2",
            confidence=0.9,
            query_context="context",
        )
        
        # Now verified
        assert loop._pending[finding_id].verified is True

    def test_generate_finding_id_stable(self):
        """Should generate stable IDs for same content."""
        from ai_insights.orchestration.feedback_loop import FeedbackLoop

        loop = FeedbackLoop()
        
        id1 = loop._generate_finding_id("content", ["entity_1"])
        id2 = loop._generate_finding_id("content", ["entity_1"])
        id3 = loop._generate_finding_id("different", ["entity_1"])
        
        assert id1 == id2  # Same content = same ID
        assert id1 != id3  # Different content = different ID

    def test_get_statistics(self):
        """Should return correct statistics."""
        from ai_insights.orchestration.feedback_loop import FeedbackLoop

        loop = FeedbackLoop()
        loop._stats = {
            "findings_received": 10,
            "findings_persisted": 3,
            "findings_deduplicated": 2,
            "findings_rejected": 5,
        }
        
        stats = loop.get_statistics()
        assert stats["findings_received"] == 10
        assert stats["findings_persisted"] == 3
        assert stats["pending_count"] == 0


class TestFeedbackLoopProcessing:
    """Tests for feedback loop processing."""

    @pytest.mark.asyncio
    async def test_process_pending_no_client(self):
        """Should handle missing Cognee client."""
        from ai_insights.orchestration.feedback_loop import FeedbackLoop

        loop = FeedbackLoop()
        
        result = await loop.process_pending(None)
        assert result == 0

    @pytest.mark.asyncio
    async def test_process_pending_no_verified(self):
        """Should skip if no verified findings."""
        from ai_insights.orchestration.feedback_loop import FeedbackLoop

        loop = FeedbackLoop()
        
        # Add unverified finding
        await loop.add_finding(
            content="test",
            source="doc_1",
            confidence=0.9,
            query_context="context",
        )
        
        mock_client = MagicMock()
        result = await loop.process_pending(mock_client)
        
        assert result == 0  # Nothing to process


class TestGetFeedbackLoop:
    """Tests for get_feedback_loop singleton function."""

    def test_get_feedback_loop_returns_instance(self):
        """Should return feedback loop instance."""
        from ai_insights.orchestration.feedback_loop import get_feedback_loop

        loop = get_feedback_loop()
        assert loop is not None

    def test_get_feedback_loop_singleton(self):
        """Should return same instance on multiple calls."""
        from ai_insights.orchestration import feedback_loop as fb_module
        
        # Reset singleton
        fb_module._feedback_loop = None
        
        l1 = fb_module.get_feedback_loop()
        l2 = fb_module.get_feedback_loop()
        
        assert l1 is l2
