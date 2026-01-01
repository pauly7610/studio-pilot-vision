"""
Product Snapshot Ingestion Pipeline
Weekly ingestion of product state, readiness, and predictions into Cognee.
"""

import asyncio
import os
import sys
from datetime import datetime, timedelta
from typing import Any, Optional

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_insights.cognee.cognee_client import get_cognee_client
from ai_insights.cognee.cognee_schema import (
    TimeWindowEntity,
    create_product_entity,
    create_risk_signal_entity,
)


class ProductSnapshotIngestion:
    """Handles weekly product state ingestion into Cognee."""

    def __init__(self):
        self.client = get_cognee_client()

    async def ingest_product_snapshot(
        self, products_data: list[dict[str, Any]], time_window_label: Optional[str] = None
    ) -> dict[str, Any]:
        """
        Ingest a snapshot of product states into Cognee.

        Args:
            products_data: List of product dictionaries from Supabase
            time_window_label: Optional time window label (e.g., "Q1 2025 Week 5")

        Returns:
            Ingestion summary with counts and statistics
        """
        await self.client.initialize()

        # Create time window
        time_window = await self._create_time_window(time_window_label)

        ingestion_stats = {
            "products_processed": 0,
            "risk_signals_created": 0,
            "relationships_created": 0,
            "errors": [],
            "timestamp": datetime.utcnow().isoformat(),
        }

        for product_data in products_data:
            try:
                # Extract product info
                product_id = product_data.get("id")
                name = product_data.get("name")
                lifecycle_stage = product_data.get("lifecycle_stage", "pilot")
                revenue_target = product_data.get("revenue_target", 0)
                region = product_data.get("region", "Unknown")
                owner_id = product_data.get("owner_id", "unknown")

                # Calculate data freshness confidence
                updated_at = product_data.get("updated_at")
                confidence = self._calculate_freshness_confidence(updated_at)

                # Create Product entity
                product_entity = create_product_entity(
                    product_id=product_id,
                    name=name,
                    lifecycle_stage=lifecycle_stage,
                    revenue_target=revenue_target,
                    region=region,
                    owner_id=owner_id,
                    confidence_score=confidence,
                )

                # Add product to Cognee
                await self.client.add_entity(
                    entity_type="Product",
                    entity_id=product_id,
                    properties=product_entity.model_dump(mode='json'),
                    metadata={
                        "confidence_score": confidence,
                        "data_freshness": datetime.utcnow().isoformat(),
                    },
                )

                # Create OCCURS_IN relationship to time window
                await self.client.add_relationship(
                    source_id=product_id,
                    relationship_type="OCCURS_IN",
                    target_id=time_window["id"],
                    properties={"is_snapshot": True, "temporal_position": "current"},
                )

                ingestion_stats["products_processed"] += 1
                ingestion_stats["relationships_created"] += 1

                # Process readiness data
                readiness_data = product_data.get("readiness", [])
                if readiness_data and len(readiness_data) > 0:
                    readiness = readiness_data[0]
                    await self._ingest_risk_signal(
                        product_id=product_id,
                        readiness=readiness,
                        prediction=product_data.get("prediction", [{}])[0],
                        time_window_id=time_window["id"],
                        stats=ingestion_stats,
                    )

            except Exception as e:
                ingestion_stats["errors"].append(
                    {"product_id": product_data.get("id"), "error": str(e)}
                )

        # Cognify the data (create embeddings and graph)
        await self.client.cognify()

        return ingestion_stats

    async def _create_time_window(self, label: Optional[str] = None) -> dict[str, str]:
        """Create or retrieve time window entity."""
        now = datetime.utcnow()

        # Calculate week boundaries
        start_of_week = now - timedelta(days=now.weekday())
        end_of_week = start_of_week + timedelta(days=6)

        # Generate label if not provided
        if not label:
            week_num = now.isocalendar()[1]
            quarter = f"Q{(now.month - 1) // 3 + 1}"
            label = f"{quarter} {now.year} Week {week_num}"

        time_window_id = f"tw_{now.year}_w{now.isocalendar()[1]}"

        time_window = TimeWindowEntity(
            id=time_window_id,
            window_type="week",
            start_date=start_of_week,
            end_date=end_of_week,
            label=label,
        )

        # Add to Cognee
        await self.client.add_entity(
            entity_type="TimeWindow",
            entity_id=time_window_id,
            properties=time_window.model_dump(mode='json'),
            metadata={"label": label},
        )

        return {"id": time_window_id, "label": label}

    async def _ingest_risk_signal(
        self,
        product_id: str,
        readiness: dict[str, Any],
        prediction: dict[str, Any],
        time_window_id: str,
        stats: dict[str, Any],
    ):
        """Ingest risk signal for a product."""
        risk_band = readiness.get("risk_band", "medium")
        readiness_score = readiness.get("readiness_score", 50.0)
        success_probability = prediction.get("success_probability", 0.5)

        # Create unique signal ID
        signal_id = f"risk_{product_id}_{int(datetime.utcnow().timestamp())}"

        # Create RiskSignal entity
        risk_signal = create_risk_signal_entity(
            signal_id=signal_id,
            product_id=product_id,
            risk_band=risk_band,
            readiness_score=readiness_score,
            success_probability=success_probability,
            signal_type="readiness",
            data_source="prediction_model",
            confidence_score=0.9,
        )

        # Add to Cognee
        await self.client.add_entity(
            entity_type="RiskSignal",
            entity_id=signal_id,
            properties=risk_signal.model_dump(mode='json'),
            metadata={"severity": risk_signal.severity, "confidence_score": 0.9},
        )

        # Create HAS_RISK relationship
        await self.client.add_relationship(
            source_id=product_id,
            relationship_type="HAS_RISK",
            target_id=signal_id,
            properties={
                "detected_at": datetime.utcnow().isoformat(),
                "severity_trend": "stable",  # TODO: Calculate from historical data
            },
        )

        # Create OCCURS_IN relationship for risk signal
        await self.client.add_relationship(
            source_id=signal_id,
            relationship_type="OCCURS_IN",
            target_id=time_window_id,
            properties={"is_snapshot": True},
        )

        stats["risk_signals_created"] += 1
        stats["relationships_created"] += 2

    def _calculate_freshness_confidence(self, updated_at: Optional[str]) -> float:
        """
        Calculate confidence score based on data freshness.

        Returns:
            Confidence score between 0.0 and 1.0
        """
        if not updated_at:
            return 0.5

        try:
            updated_time = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
            age_hours = (
                datetime.utcnow() - updated_time.replace(tzinfo=None)
            ).total_seconds() / 3600

            if age_hours < 24:
                return 1.0
            elif age_hours < 72:
                return 0.9
            elif age_hours < 168:  # 1 week
                return 0.7
            else:
                return 0.5
        except Exception:
            return 0.5


async def run_weekly_snapshot(products_data: list[dict[str, Any]]):
    """Run the weekly product snapshot ingestion."""
    ingestion = ProductSnapshotIngestion()

    print("Starting product snapshot ingestion...")
    stats = await ingestion.ingest_product_snapshot(products_data)

    print("\n✓ Product Snapshot Ingestion Complete")
    print(f"  Products processed: {stats['products_processed']}")
    print(f"  Risk signals created: {stats['risk_signals_created']}")
    print(f"  Relationships created: {stats['relationships_created']}")

    if stats["errors"]:
        print(f"  Errors: {len(stats['errors'])}")
        for error in stats["errors"]:
            print(f"    - {error['product_id']}: {error['error']}")

    return stats


# Example usage
if __name__ == "__main__":
    # Mock data for testing
    mock_products = [
        {
            "id": "prod_001",
            "name": "PayLink",
            "lifecycle_stage": "pilot",
            "revenue_target": 1500000,
            "region": "North America",
            "owner_id": "user_123",
            "updated_at": datetime.utcnow().isoformat(),
            "readiness": [{"risk_band": "high", "readiness_score": 45.0}],
            "prediction": [{"success_probability": 0.65}],
        },
        {
            "id": "prod_002",
            "name": "InstantPay",
            "lifecycle_stage": "scaling",
            "revenue_target": 2000000,
            "region": "North America",
            "owner_id": "user_456",
            "updated_at": datetime.utcnow().isoformat(),
            "readiness": [{"risk_band": "medium", "readiness_score": 72.0}],
            "prediction": [{"success_probability": 0.82}],
        },
    ]

    # Run ingestion
    asyncio.run(run_weekly_snapshot(mock_products))
