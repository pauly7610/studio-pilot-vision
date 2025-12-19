package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProductPrediction struct {
	ID                 uuid.UUID       `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ProductID          uuid.UUID       `json:"product_id" gorm:"type:uuid;not null;index"`
	SuccessProbability *float64        `json:"success_probability,omitempty" gorm:"type:decimal(5,2)"`
	RevenueProbability *float64        `json:"revenue_probability,omitempty" gorm:"type:decimal(5,2)"`
	FailureRisk        *float64        `json:"failure_risk,omitempty" gorm:"type:decimal(5,2)"`
	ModelVersion       string          `json:"model_version" gorm:"not null"`
	Features           json.RawMessage `json:"features,omitempty" gorm:"type:jsonb"`
	ScoredAt           time.Time       `json:"scored_at" gorm:"autoCreateTime"`
}

func (pp *ProductPrediction) BeforeCreate(tx *gorm.DB) error {
	if pp.ID == uuid.Nil {
		pp.ID = uuid.New()
	}
	return nil
}

type CreateProductPredictionRequest struct {
	ProductID          uuid.UUID       `json:"product_id" binding:"required"`
	SuccessProbability *float64        `json:"success_probability,omitempty"`
	RevenueProbability *float64        `json:"revenue_probability,omitempty"`
	FailureRisk        *float64        `json:"failure_risk,omitempty"`
	ModelVersion       string          `json:"model_version" binding:"required"`
	Features           json.RawMessage `json:"features,omitempty"`
}

type UpdateProductPredictionRequest struct {
	SuccessProbability *float64        `json:"success_probability,omitempty"`
	RevenueProbability *float64        `json:"revenue_probability,omitempty"`
	FailureRisk        *float64        `json:"failure_risk,omitempty"`
	ModelVersion       *string         `json:"model_version,omitempty"`
	Features           json.RawMessage `json:"features,omitempty"`
}
