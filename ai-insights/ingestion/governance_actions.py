"""
Governance Actions Ingestion Pipeline
Real-time ingestion of governance actions, escalations, and outcomes into Cognee.
"""

import asyncio
import os
import sys
from datetime import datetime
from typing import Any, Optional

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_insights.cognee.cognee_client import get_cognee_client
from ai_insights.cognee.cognee_schema import (
    ActionStatus,
    ActionTier,
    ActionType,
    GovernanceActionEntity,
    OutcomeEntity,
    OutcomeType,
)


class GovernanceActionIngestion:
    """Handles real-time governance action ingestion into Cognee."""

    def __init__(self):
        self.client = get_cognee_client()

    async def ingest_action(
        self, action_data: dict[str, Any], risk_signal_id: Optional[str] = None
    ) -> dict[str, Any]:
        """
        Ingest a governance action into Cognee.

        Args:
            action_data: Action data from Supabase
            risk_signal_id: Optional risk signal that triggered this action

        Returns:
            Ingestion result with action ID and relationships
        """
        await self.client.initialize()

        action_id = action_data.get("id")
        product_id = action_data.get("product_id")

        # Create GovernanceAction entity
        action_entity = GovernanceActionEntity(
            id=action_id,
            product_id=product_id,
            action_type=ActionType(action_data.get("action_type", "review")),
            tier=ActionTier(action_data.get("tier", "ambassador")),
            title=action_data.get("title", ""),
            description=action_data.get("description", ""),
            assigned_to=action_data.get("assigned_to", "unassigned"),
            created_at=datetime.fromisoformat(
                action_data.get("created_at", datetime.utcnow().isoformat())
            ),
            due_date=datetime.fromisoformat(
                action_data.get("due_date", datetime.utcnow().isoformat())
            ),
            completed_at=(
                datetime.fromisoformat(action_data["completed_at"])
                if action_data.get("completed_at")
                else None
            ),
            status=ActionStatus(action_data.get("status", "pending")),
            confidence_score=1.0,
        )

        # Add action to Cognee
        await self.client.add_entity(
            entity_type="GovernanceAction",
            entity_id=action_id,
            properties=action_entity.model_dump(mode='json'),
            metadata={"tier": action_entity.tier, "status": action_entity.status},
        )

        relationships_created = []

        # Create TRIGGERS relationship if risk signal provided
        if risk_signal_id:
            await self.client.add_relationship(
                source_id=risk_signal_id,
                relationship_type="TRIGGERS",
                target_id=action_id,
                properties={
                    "triggered_at": datetime.utcnow().isoformat(),
                    "auto_generated": action_data.get("auto_generated", False),
                },
            )
            relationships_created.append("TRIGGERS")

        # If action is completed, create outcome
        if action_entity.completed_at:
            outcome_id = await self._create_outcome(action_id=action_id, action_data=action_data)
            if outcome_id:
                relationships_created.append("RESULTS_IN")

        return {
            "action_id": action_id,
            "relationships_created": relationships_created,
            "timestamp": datetime.utcnow().isoformat(),
        }

    async def update_action_status(
        self, action_id: str, new_status: str, completed_at: Optional[datetime] = None
    ) -> dict[str, Any]:
        """
        Update action status and create outcome if completed.

        Args:
            action_id: Action identifier
            new_status: New status value
            completed_at: Completion timestamp if status is completed

        Returns:
            Update result
        """
        await self.client.initialize()

        # Get existing action
        action = await self.client.get_entity(action_id)

        if not action:
            return {"error": f"Action {action_id} not found"}

        # Update action properties
        updated_properties = action.get("properties", {})
        updated_properties["status"] = new_status

        if completed_at:
            updated_properties["completed_at"] = completed_at.isoformat()

        # Re-add entity with updated properties (creates new version)
        await self.client.add_entity(
            entity_type="GovernanceAction",
            entity_id=action_id,
            properties=updated_properties,
            metadata={"status": new_status, "updated_at": datetime.utcnow().isoformat()},
        )

        result = {
            "action_id": action_id,
            "new_status": new_status,
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Create outcome if completed
        if new_status == "completed" and completed_at:
            outcome_id = await self._create_outcome(
                action_id=action_id, action_data=updated_properties
            )
            result["outcome_id"] = outcome_id

        return result

    async def _create_outcome(self, action_id: str, action_data: dict[str, Any]) -> Optional[str]:
        """Create an outcome entity for a completed action."""
        try:
            outcome_id = f"outcome_{action_id}_{int(datetime.utcnow().timestamp())}"

            # Determine outcome type based on action type
            action_type = action_data.get("action_type", "review")
            if action_type == "mitigation":
                outcome_type = OutcomeType.RISK_MITIGATED
            elif action_type == "escalation":
                outcome_type = OutcomeType.RISK_MITIGATED  # Assume escalation helped
            else:
                outcome_type = OutcomeType.LAUNCH_SUCCESS  # Default positive outcome

            # Calculate time to outcome
            created_at = datetime.fromisoformat(
                action_data.get("created_at", datetime.utcnow().isoformat())
            )
            completed_at = datetime.fromisoformat(
                action_data.get("completed_at", datetime.utcnow().isoformat())
            )
            time_to_outcome_days = (completed_at - created_at).days

            # Create Outcome entity
            outcome_entity = OutcomeEntity(
                id=outcome_id,
                outcome_type=outcome_type,
                measured_at=completed_at,
                actual_value=1.0,  # Binary: action completed
                expected_value=1.0,
                variance_pct=0.0,
                confidence_score=0.8,
            )

            # Add to Cognee
            await self.client.add_entity(
                entity_type="Outcome",
                entity_id=outcome_id,
                properties=outcome_entity.model_dump(mode='json'),
                metadata={
                    "outcome_type": outcome_type.value,
                    "time_to_outcome_days": time_to_outcome_days,
                },
            )

            # Create RESULTS_IN relationship
            await self.client.add_relationship(
                source_id=action_id,
                relationship_type="RESULTS_IN",
                target_id=outcome_id,
                properties={"causal_confidence": 0.8, "time_to_outcome_days": time_to_outcome_days},
            )

            return outcome_id

        except Exception as e:
            print(f"Error creating outcome: {e}")
            return None

    async def ingest_batch_actions(self, actions_data: list[dict[str, Any]]) -> dict[str, Any]:
        """
        Ingest multiple governance actions in batch.

        Args:
            actions_data: List of action dictionaries

        Returns:
            Batch ingestion summary
        """
        await self.client.initialize()

        stats = {
            "actions_processed": 0,
            "outcomes_created": 0,
            "relationships_created": 0,
            "errors": [],
        }

        for action_data in actions_data:
            try:
                result = await self.ingest_action(action_data)
                stats["actions_processed"] += 1
                stats["relationships_created"] += len(result.get("relationships_created", []))

                if "outcome_id" in result:
                    stats["outcomes_created"] += 1

            except Exception as e:
                stats["errors"].append({"action_id": action_data.get("id"), "error": str(e)})

        # Cognify the batch
        await self.client.cognify_data(
            data=f"Governance actions batch: {len(actions_data)} actions",
            dataset_name="governance_actions",
        )

        return stats


async def run_action_ingestion(actions_data: list[dict[str, Any]]):
    """Run governance action ingestion."""
    ingestion = GovernanceActionIngestion()

    print("Starting governance action ingestion...")
    stats = await ingestion.ingest_batch_actions(actions_data)

    print("\n✓ Governance Action Ingestion Complete")
    print(f"  Actions processed: {stats['actions_processed']}")
    print(f"  Outcomes created: {stats['outcomes_created']}")
    print(f"  Relationships created: {stats['relationships_created']}")

    if stats["errors"]:
        print(f"  Errors: {len(stats['errors'])}")
        for error in stats["errors"]:
            print(f"    - {error['action_id']}: {error['error']}")

    return stats


# Example usage
if __name__ == "__main__":
    # Mock data for testing
    mock_actions = [
        {
            "id": "action_001",
            "product_id": "prod_001",
            "action_type": "escalation",
            "tier": "steerco",
            "title": "Escalate Stripe integration blocker",
            "description": "Partner dependency blocking Q1 launch",
            "assigned_to": "vp_product",
            "created_at": datetime.utcnow().isoformat(),
            "due_date": (datetime.utcnow()).isoformat(),
            "status": "in_progress",
            "auto_generated": True,
        },
        {
            "id": "action_002",
            "product_id": "prod_002",
            "action_type": "mitigation",
            "tier": "ambassador",
            "title": "Address readiness gaps",
            "description": "Improve documentation and testing coverage",
            "assigned_to": "pm_jane",
            "created_at": (datetime.utcnow()).isoformat(),
            "due_date": (datetime.utcnow()).isoformat(),
            "completed_at": datetime.utcnow().isoformat(),
            "status": "completed",
            "auto_generated": False,
        },
    ]

    # Run ingestion
    asyncio.run(run_action_ingestion(mock_actions))
