package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProductMarketEvidence struct {
	ID                   uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ProductID            uuid.UUID `json:"product_id" gorm:"type:uuid;not null;index"`
	MeasurementDate      time.Time `json:"measurement_date" gorm:"type:date;not null;default:CURRENT_DATE"`
	MerchantAdoptionRate *float64  `json:"merchant_adoption_rate,omitempty" gorm:"type:decimal(5,2)"`
	SentimentScore       *float64  `json:"sentiment_score,omitempty" gorm:"type:decimal(5,2)"`
	SampleSize           *int      `json:"sample_size,omitempty"`
	Notes                *string   `json:"notes,omitempty"`
	CreatedAt            time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt            time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

func (pme *ProductMarketEvidence) BeforeCreate(tx *gorm.DB) error {
	if pme.ID == uuid.Nil {
		pme.ID = uuid.New()
	}
	return nil
}

type CreateProductMarketEvidenceRequest struct {
	ProductID            uuid.UUID  `json:"product_id" binding:"required"`
	MeasurementDate      *time.Time `json:"measurement_date,omitempty"`
	MerchantAdoptionRate *float64   `json:"merchant_adoption_rate,omitempty"`
	SentimentScore       *float64   `json:"sentiment_score,omitempty"`
	SampleSize           *int       `json:"sample_size,omitempty"`
	Notes                *string    `json:"notes,omitempty"`
}

type UpdateProductMarketEvidenceRequest struct {
	MeasurementDate      *time.Time `json:"measurement_date,omitempty"`
	MerchantAdoptionRate *float64   `json:"merchant_adoption_rate,omitempty"`
	SentimentScore       *float64   `json:"sentiment_score,omitempty"`
	SampleSize           *int       `json:"sample_size,omitempty"`
	Notes                *string    `json:"notes,omitempty"`
}
