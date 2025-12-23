package models

import (
	"time"

	"github.com/google/uuid"
)

type ProductReadinessHistory struct {
	ID             uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	ProductID      uuid.UUID `gorm:"type:uuid;not null" json:"product_id"`
	ReadinessScore int       `gorm:"not null" json:"readiness_score"`
	RiskBand       *string   `gorm:"size:20" json:"risk_band,omitempty"`
	RecordedAt     time.Time `gorm:"autoCreateTime" json:"recorded_at"`
	WeekNumber     *int      `json:"week_number,omitempty"`
	Year           *int      `json:"year,omitempty"`

	// Relationships
	Product Product `gorm:"foreignKey:ProductID" json:"-"`
}

func (ProductReadinessHistory) TableName() string {
	return "product_readiness_history"
}

type CreateReadinessHistoryRequest struct {
	ProductID      uuid.UUID `json:"product_id" binding:"required"`
	ReadinessScore int       `json:"readiness_score" binding:"required"`
	RiskBand       *string   `json:"risk_band,omitempty"`
	WeekNumber     *int      `json:"week_number,omitempty"`
	Year           *int      `json:"year,omitempty"`
}
