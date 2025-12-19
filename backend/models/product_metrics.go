package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProductMetric struct {
	ID                uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ProductID         uuid.UUID `json:"product_id" gorm:"type:uuid;not null;index"`
	Date              time.Time `json:"date" gorm:"type:date;not null"`
	ActualRevenue     *float64  `json:"actual_revenue,omitempty" gorm:"type:decimal(10,2)"`
	AdoptionRate      *float64  `json:"adoption_rate,omitempty" gorm:"type:decimal(5,2)"`
	ActiveUsers       *int      `json:"active_users,omitempty"`
	TransactionVolume *int      `json:"transaction_volume,omitempty"`
	ChurnRate         *float64  `json:"churn_rate,omitempty" gorm:"type:decimal(5,2)"`
	CreatedAt         time.Time `json:"created_at" gorm:"autoCreateTime"`
}

func (pm *ProductMetric) BeforeCreate(tx *gorm.DB) error {
	if pm.ID == uuid.Nil {
		pm.ID = uuid.New()
	}
	return nil
}

type CreateProductMetricRequest struct {
	ProductID         uuid.UUID `json:"product_id" binding:"required"`
	Date              time.Time `json:"date" binding:"required"`
	ActualRevenue     *float64  `json:"actual_revenue,omitempty"`
	AdoptionRate      *float64  `json:"adoption_rate,omitempty"`
	ActiveUsers       *int      `json:"active_users,omitempty"`
	TransactionVolume *int      `json:"transaction_volume,omitempty"`
	ChurnRate         *float64  `json:"churn_rate,omitempty"`
}

type UpdateProductMetricRequest struct {
	Date              *time.Time `json:"date,omitempty"`
	ActualRevenue     *float64   `json:"actual_revenue,omitempty"`
	AdoptionRate      *float64   `json:"adoption_rate,omitempty"`
	ActiveUsers       *int       `json:"active_users,omitempty"`
	TransactionVolume *int       `json:"transaction_volume,omitempty"`
	ChurnRate         *float64   `json:"churn_rate,omitempty"`
}
