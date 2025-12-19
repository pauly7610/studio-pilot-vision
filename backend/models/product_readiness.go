package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProductReadiness struct {
	ID                 uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ProductID          uuid.UUID `json:"product_id" gorm:"type:uuid;not null;uniqueIndex"`
	ComplianceComplete *bool     `json:"compliance_complete,omitempty" gorm:"default:false"`
	SalesTrainingPct   *float64  `json:"sales_training_pct,omitempty" gorm:"type:decimal(5,2);default:0"`
	PartnerEnabledPct  *float64  `json:"partner_enabled_pct,omitempty" gorm:"type:decimal(5,2);default:0"`
	OnboardingComplete *bool     `json:"onboarding_complete,omitempty" gorm:"default:false"`
	DocumentationScore *float64  `json:"documentation_score,omitempty" gorm:"type:decimal(5,2);default:0"`
	ReadinessScore     float64   `json:"readiness_score" gorm:"type:decimal(5,2);not null"`
	RiskBand           RiskBand  `json:"risk_band" gorm:"type:varchar(20);not null"`
	EvaluatedAt        time.Time `json:"evaluated_at" gorm:"autoCreateTime"`
}

func (pr *ProductReadiness) BeforeCreate(tx *gorm.DB) error {
	if pr.ID == uuid.Nil {
		pr.ID = uuid.New()
	}
	return nil
}

type CreateProductReadinessRequest struct {
	ProductID          uuid.UUID `json:"product_id" binding:"required"`
	ComplianceComplete *bool     `json:"compliance_complete,omitempty"`
	SalesTrainingPct   *float64  `json:"sales_training_pct,omitempty"`
	PartnerEnabledPct  *float64  `json:"partner_enabled_pct,omitempty"`
	OnboardingComplete *bool     `json:"onboarding_complete,omitempty"`
	DocumentationScore *float64  `json:"documentation_score,omitempty"`
	ReadinessScore     float64   `json:"readiness_score" binding:"required"`
	RiskBand           RiskBand  `json:"risk_band" binding:"required"`
}

type UpdateProductReadinessRequest struct {
	ComplianceComplete *bool     `json:"compliance_complete,omitempty"`
	SalesTrainingPct   *float64  `json:"sales_training_pct,omitempty"`
	PartnerEnabledPct  *float64  `json:"partner_enabled_pct,omitempty"`
	OnboardingComplete *bool     `json:"onboarding_complete,omitempty"`
	DocumentationScore *float64  `json:"documentation_score,omitempty"`
	ReadinessScore     *float64  `json:"readiness_score,omitempty"`
	RiskBand           *RiskBand `json:"risk_band,omitempty"`
}
