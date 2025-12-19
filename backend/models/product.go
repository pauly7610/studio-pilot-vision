package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Product struct {
	ID                uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Name              string         `json:"name" gorm:"not null"`
	ProductType       ProductType    `json:"product_type" gorm:"type:varchar(50);not null"`
	Region            string         `json:"region" gorm:"default:'North America'"`
	LifecycleStage    LifecycleStage `json:"lifecycle_stage" gorm:"type:varchar(50);not null"`
	LaunchDate        *time.Time     `json:"launch_date,omitempty"`
	RevenueTarget     *float64       `json:"revenue_target,omitempty" gorm:"type:decimal(10,2)"`
	OwnerEmail        string         `json:"owner_email" gorm:"not null"`
	SuccessMetric     *string        `json:"success_metric,omitempty"`
	GatingStatus      *string        `json:"gating_status,omitempty"`
	GatingStatusSince *time.Time     `json:"gating_status_since,omitempty"`
	GovernanceTier    *string        `json:"governance_tier,omitempty"`
	BudgetCode        *string        `json:"budget_code,omitempty"`
	PIIFlag           *bool          `json:"pii_flag,omitempty"`
	BusinessSponsor   *string        `json:"business_sponsor,omitempty"`
	EngineeringLead   *string        `json:"engineering_lead,omitempty"`
	CreatedAt         time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt         time.Time      `json:"updated_at" gorm:"autoUpdateTime"`

	// Relationships
	Readiness      *ProductReadiness       `json:"readiness,omitempty" gorm:"foreignKey:ProductID"`
	Prediction     *ProductPrediction      `json:"prediction,omitempty" gorm:"foreignKey:ProductID"`
	Compliance     []ProductCompliance     `json:"compliance,omitempty" gorm:"foreignKey:ProductID"`
	MarketEvidence []ProductMarketEvidence `json:"market_evidence,omitempty" gorm:"foreignKey:ProductID"`
	Partners       []ProductPartner        `json:"partners,omitempty" gorm:"foreignKey:ProductID"`
	Metrics        []ProductMetric         `json:"metrics,omitempty" gorm:"foreignKey:ProductID"`
	Training       *SalesTraining          `json:"training,omitempty" gorm:"foreignKey:ProductID"`
	Feedback       []ProductFeedback       `json:"feedback,omitempty" gorm:"foreignKey:ProductID"`
	Actions        []ProductAction         `json:"actions,omitempty" gorm:"foreignKey:ProductID"`
}

func (p *Product) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

type CreateProductRequest struct {
	Name           string         `json:"name" binding:"required"`
	ProductType    ProductType    `json:"product_type" binding:"required"`
	Region         string         `json:"region"`
	LifecycleStage LifecycleStage `json:"lifecycle_stage" binding:"required"`
	LaunchDate     *time.Time     `json:"launch_date,omitempty"`
	RevenueTarget  *float64       `json:"revenue_target,omitempty"`
	OwnerEmail     string         `json:"owner_email" binding:"required,email"`
	SuccessMetric  *string        `json:"success_metric,omitempty"`
	GovernanceTier *string        `json:"governance_tier,omitempty"`
	BudgetCode     *string        `json:"budget_code,omitempty"`
	PIIFlag        *bool          `json:"pii_flag,omitempty"`
}

type UpdateProductRequest struct {
	Name            *string         `json:"name,omitempty"`
	ProductType     *ProductType    `json:"product_type,omitempty"`
	Region          *string         `json:"region,omitempty"`
	LifecycleStage  *LifecycleStage `json:"lifecycle_stage,omitempty"`
	LaunchDate      *time.Time      `json:"launch_date,omitempty"`
	RevenueTarget   *float64        `json:"revenue_target,omitempty"`
	OwnerEmail      *string         `json:"owner_email,omitempty"`
	SuccessMetric   *string         `json:"success_metric,omitempty"`
	GatingStatus    *string         `json:"gating_status,omitempty"`
	GovernanceTier  *string         `json:"governance_tier,omitempty"`
	BudgetCode      *string         `json:"budget_code,omitempty"`
	PIIFlag         *bool           `json:"pii_flag,omitempty"`
	BusinessSponsor *string         `json:"business_sponsor,omitempty"`
	EngineeringLead *string         `json:"engineering_lead,omitempty"`
}
