"""
Cognee Schema Definitions
Pydantic models for all entities and relationships in the knowledge graph.
"""

from typing import Optional, List, Literal
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


# Enums for type safety
class LifecycleStage(str, Enum):
    CONCEPT = "concept"
    PILOT = "pilot"
    SCALING = "scaling"
    MATURE = "mature"
    SUNSET = "sunset"


class RiskBand(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class DependencyType(str, Enum):
    INTERNAL = "internal"
    EXTERNAL = "external"
    PARTNER = "partner"


class DependencyStatus(str, Enum):
    ON_TRACK = "on_track"
    DELAYED = "delayed"
    BLOCKED = "blocked"
    RESOLVED = "resolved"


class ActionType(str, Enum):
    ESCALATION = "escalation"
    MITIGATION = "mitigation"
    DECISION = "decision"
    REVIEW = "review"


class ActionTier(str, Enum):
    AMBASSADOR = "ambassador"
    STEERCO = "steerco"
    CRITICAL = "critical"


class ActionStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class DecisionType(str, Enum):
    SCALE = "scale"
    PIVOT = "pivot"
    SUNSET = "sunset"
    INVEST = "invest"
    DEFER = "defer"


class OutcomeType(str, Enum):
    LAUNCH_SUCCESS = "launch_success"
    LAUNCH_DELAY = "launch_delay"
    REVENUE_HIT = "revenue_hit"
    REVENUE_BEAT = "revenue_beat"
    RISK_MITIGATED = "risk_mitigated"
    RISK_REALIZED = "risk_realized"


class SignalType(str, Enum):
    READINESS = "readiness"
    DEPENDENCY = "dependency"
    REVENUE = "revenue"
    TIMELINE = "timeline"
    FEEDBACK = "feedback"


class Severity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class ImpactSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Sentiment(str, Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"


class FeedbackSource(str, Enum):
    CUSTOMER = "customer"
    INTERNAL = "internal"
    PARTNER = "partner"


class WindowType(str, Enum):
    WEEK = "week"
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"


# Entity Models

class ProductEntity(BaseModel):
    """Product entity in the knowledge graph."""
    id: str
    name: str
    lifecycle_stage: LifecycleStage
    revenue_target: float
    region: str
    owner_id: str
    created_at: datetime
    confidence_score: float = Field(ge=0.0, le=1.0, default=1.0)
    data_freshness: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        use_enum_values = True


class PortfolioEntity(BaseModel):
    """Portfolio entity grouping multiple products."""
    id: str
    name: str
    region: str
    time_window_id: str
    total_revenue_target: float
    product_count: int
    confidence_score: float = Field(ge=0.0, le=1.0, default=1.0)
    
    class Config:
        use_enum_values = True


class RiskSignalEntity(BaseModel):
    """Risk signal entity indicating product health."""
    id: str
    product_id: str
    risk_band: RiskBand
    readiness_score: float = Field(ge=0.0, le=100.0)
    success_probability: float = Field(ge=0.0, le=1.0)
    detected_at: datetime
    severity: Severity
    signal_type: SignalType
    confidence_score: float = Field(ge=0.0, le=1.0, default=1.0)
    data_source: str
    
    class Config:
        use_enum_values = True


class DependencyEntity(BaseModel):
    """Dependency entity representing blockers or requirements."""
    id: str
    product_id: str
    dependency_type: DependencyType
    dependency_name: str
    status: DependencyStatus
    blocker_since: Optional[datetime] = None
    estimated_resolution: Optional[datetime] = None
    impact_severity: ImpactSeverity
    confidence_score: float = Field(ge=0.0, le=1.0, default=1.0)
    
    class Config:
        use_enum_values = True


class GovernanceActionEntity(BaseModel):
    """Governance action entity for escalations and mitigations."""
    id: str
    product_id: str
    action_type: ActionType
    tier: ActionTier
    title: str
    description: str
    assigned_to: str
    created_at: datetime
    due_date: datetime
    completed_at: Optional[datetime] = None
    status: ActionStatus
    confidence_score: float = Field(ge=0.0, le=1.0, default=1.0)
    
    class Config:
        use_enum_values = True


class DecisionEntity(BaseModel):
    """Decision entity capturing executive decisions."""
    id: str
    decision_type: DecisionType
    rationale: str
    decision_maker: str
    decided_at: datetime
    context_summary: str
    expected_outcome: str
    confidence_score: float = Field(ge=0.0, le=1.0, default=1.0)
    
    class Config:
        use_enum_values = True


class OutcomeEntity(BaseModel):
    """Outcome entity measuring results."""
    id: str
    outcome_type: OutcomeType
    measured_at: datetime
    actual_value: float
    expected_value: float
    variance_pct: float
    confidence_score: float = Field(ge=0.0, le=1.0, default=1.0)
    
    class Config:
        use_enum_values = True


class RevenueSignalEntity(BaseModel):
    """Revenue signal entity for financial tracking."""
    id: str
    product_id: str
    signal_type: Literal["forecast", "actual", "at_risk"]
    amount: float
    period: str
    recorded_at: datetime
    confidence_score: float = Field(ge=0.0, le=1.0, default=1.0)


class FeedbackSignalEntity(BaseModel):
    """Feedback signal entity from customers/users."""
    id: str
    product_id: str
    source: FeedbackSource
    sentiment: Sentiment
    theme: str
    content: str
    received_at: datetime
    confidence_score: float = Field(ge=0.0, le=1.0, default=1.0)
    
    class Config:
        use_enum_values = True


class TimeWindowEntity(BaseModel):
    """Time window entity for temporal organization."""
    id: str
    window_type: WindowType
    start_date: datetime
    end_date: datetime
    label: str
    
    class Config:
        use_enum_values = True


# Relationship Models

class Relationship(BaseModel):
    """Base relationship model."""
    source_id: str
    relationship_type: str
    target_id: str
    properties: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    confidence_score: float = Field(ge=0.0, le=1.0, default=1.0)


class HasRiskRelationship(Relationship):
    """Product → HAS_RISK → RiskSignal"""
    relationship_type: Literal["HAS_RISK"] = "HAS_RISK"
    severity_trend: Optional[Literal["improving", "stable", "declining"]] = None


class DependsOnRelationship(Relationship):
    """Product → DEPENDS_ON → Dependency"""
    relationship_type: Literal["DEPENDS_ON"] = "DEPENDS_ON"
    criticality: Optional[ImpactSeverity] = None


class BelongsToRelationship(Relationship):
    """Product → BELONGS_TO → Portfolio"""
    relationship_type: Literal["BELONGS_TO"] = "BELONGS_TO"
    added_at: Optional[datetime] = None
    priority_rank: Optional[int] = None


class TriggersRelationship(Relationship):
    """RiskSignal → TRIGGERS → GovernanceAction"""
    relationship_type: Literal["TRIGGERS"] = "TRIGGERS"
    triggered_at: Optional[datetime] = None
    auto_generated: bool = False
    trigger_threshold: Optional[float] = None


class ResultsInRelationship(Relationship):
    """GovernanceAction → RESULTS_IN → Outcome"""
    relationship_type: Literal["RESULTS_IN"] = "RESULTS_IN"
    causal_confidence: float = Field(ge=0.0, le=1.0, default=0.5)
    time_to_outcome_days: Optional[int] = None


class ImpactsRelationship(Relationship):
    """Outcome → IMPACTS → RevenueSignal"""
    relationship_type: Literal["IMPACTS"] = "IMPACTS"
    impact_type: Optional[Literal["positive", "negative", "neutral"]] = None
    magnitude: Optional[float] = None


class ReferencesRelationship(Relationship):
    """Decision → REFERENCES → (Product|RiskSignal|Outcome)"""
    relationship_type: Literal["REFERENCES"] = "REFERENCES"
    reference_type: Optional[Literal["primary", "supporting", "context"]] = None
    weight: float = Field(ge=0.0, le=1.0, default=0.5)


class ReceivesRelationship(Relationship):
    """Product → RECEIVES → FeedbackSignal"""
    relationship_type: Literal["RECEIVES"] = "RECEIVES"
    feedback_volume: int = 1
    sentiment_score: float = Field(ge=-1.0, le=1.0, default=0.0)


class OccursInRelationship(Relationship):
    """Any Entity → OCCURS_IN → TimeWindow"""
    relationship_type: Literal["OCCURS_IN"] = "OCCURS_IN"
    temporal_position: Optional[Literal["start", "middle", "end"]] = None
    is_snapshot: bool = False


# Helper functions for entity creation

def create_product_entity(
    product_id: str,
    name: str,
    lifecycle_stage: str,
    revenue_target: float,
    region: str,
    owner_id: str,
    confidence_score: float = 1.0
) -> ProductEntity:
    """Create a Product entity."""
    return ProductEntity(
        id=product_id,
        name=name,
        lifecycle_stage=LifecycleStage(lifecycle_stage),
        revenue_target=revenue_target,
        region=region,
        owner_id=owner_id,
        created_at=datetime.utcnow(),
        confidence_score=confidence_score,
        data_freshness=datetime.utcnow()
    )


def create_risk_signal_entity(
    signal_id: str,
    product_id: str,
    risk_band: str,
    readiness_score: float,
    success_probability: float,
    signal_type: str = "readiness",
    data_source: str = "prediction_model",
    confidence_score: float = 1.0
) -> RiskSignalEntity:
    """Create a RiskSignal entity."""
    # Determine severity based on risk band and readiness
    if risk_band == "high" or readiness_score < 50:
        severity = Severity.CRITICAL
    elif risk_band == "medium" or readiness_score < 70:
        severity = Severity.WARNING
    else:
        severity = Severity.INFO
    
    return RiskSignalEntity(
        id=signal_id,
        product_id=product_id,
        risk_band=RiskBand(risk_band),
        readiness_score=readiness_score,
        success_probability=success_probability,
        detected_at=datetime.utcnow(),
        severity=severity,
        signal_type=SignalType(signal_type),
        confidence_score=confidence_score,
        data_source=data_source
    )


def create_dependency_entity(
    dependency_id: str,
    product_id: str,
    dependency_type: str,
    dependency_name: str,
    status: str,
    impact_severity: str = "medium",
    confidence_score: float = 1.0
) -> DependencyEntity:
    """Create a Dependency entity."""
    return DependencyEntity(
        id=dependency_id,
        product_id=product_id,
        dependency_type=DependencyType(dependency_type),
        dependency_name=dependency_name,
        status=DependencyStatus(status),
        impact_severity=ImpactSeverity(impact_severity),
        confidence_score=confidence_score
    )
