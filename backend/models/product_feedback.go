package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProductFeedback struct {
	ID             uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ProductID      uuid.UUID `json:"product_id" gorm:"type:uuid;not null;index"`
	Source         string    `json:"source" gorm:"not null"`
	RawText        string    `json:"raw_text" gorm:"not null"`
	Theme          *string   `json:"theme,omitempty"`
	SentimentScore *float64  `json:"sentiment_score,omitempty" gorm:"type:decimal(5,2)"`
	ImpactLevel    *string   `json:"impact_level,omitempty"`
	Volume         *int      `json:"volume,omitempty" gorm:"default:1"`
	CreatedAt      time.Time `json:"created_at" gorm:"autoCreateTime"`
}

func (pf *ProductFeedback) BeforeCreate(tx *gorm.DB) error {
	if pf.ID == uuid.Nil {
		pf.ID = uuid.New()
	}
	return nil
}

type CreateProductFeedbackRequest struct {
	ProductID      uuid.UUID `json:"product_id" binding:"required"`
	Source         string    `json:"source" binding:"required"`
	RawText        string    `json:"raw_text" binding:"required"`
	Theme          *string   `json:"theme,omitempty"`
	SentimentScore *float64  `json:"sentiment_score,omitempty"`
	ImpactLevel    *string   `json:"impact_level,omitempty"`
	Volume         *int      `json:"volume,omitempty"`
}

type UpdateProductFeedbackRequest struct {
	Source         *string  `json:"source,omitempty"`
	RawText        *string  `json:"raw_text,omitempty"`
	Theme          *string  `json:"theme,omitempty"`
	SentimentScore *float64 `json:"sentiment_score,omitempty"`
	ImpactLevel    *string  `json:"impact_level,omitempty"`
	Volume         *int     `json:"volume,omitempty"`
}
