package models

type LifecycleStage string

const (
	LifecycleConcept    LifecycleStage = "concept"
	LifecycleEarlyPilot LifecycleStage = "early_pilot"
	LifecyclePilot      LifecycleStage = "pilot"
	LifecycleCommercial LifecycleStage = "commercial"
	LifecycleSunset     LifecycleStage = "sunset"
)

type ProductType string

const (
	ProductTypeDataServices ProductType = "data_services"
	ProductTypePaymentFlows ProductType = "payment_flows"
	ProductTypeCoreProducts ProductType = "core_products"
	ProductTypePartnerships ProductType = "partnerships"
)

type RiskBand string

const (
	RiskBandLow    RiskBand = "low"
	RiskBandMedium RiskBand = "medium"
	RiskBandHigh   RiskBand = "high"
)

type ComplianceStatus string

const (
	ComplianceStatusPending    ComplianceStatus = "pending"
	ComplianceStatusInProgress ComplianceStatus = "in_progress"
	ComplianceStatusComplete   ComplianceStatus = "complete"
)

type UserRole string

const (
	UserRoleVPProduct        UserRole = "vp_product"
	UserRoleStudioAmbassador UserRole = "studio_ambassador"
	UserRoleRegionalLead     UserRole = "regional_lead"
	UserRoleSales            UserRole = "sales"
	UserRolePartnerOps       UserRole = "partner_ops"
	UserRoleViewer           UserRole = "viewer"
)

type ActionType string

const (
	ActionTypeIntervention ActionType = "intervention"
	ActionTypeReview       ActionType = "review"
	ActionTypeTraining     ActionType = "training"
	ActionTypeCompliance   ActionType = "compliance"
	ActionTypePartner      ActionType = "partner"
	ActionTypeOther        ActionType = "other"
)

type ActionStatus string

const (
	ActionStatusPending    ActionStatus = "pending"
	ActionStatusInProgress ActionStatus = "in_progress"
	ActionStatusCompleted  ActionStatus = "completed"
	ActionStatusCancelled  ActionStatus = "cancelled"
)

type ActionPriority string

const (
	ActionPriorityLow      ActionPriority = "low"
	ActionPriorityMedium   ActionPriority = "medium"
	ActionPriorityHigh     ActionPriority = "high"
	ActionPriorityCritical ActionPriority = "critical"
)
