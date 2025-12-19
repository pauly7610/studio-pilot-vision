package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProductCompliance struct {
	ID                uuid.UUID        `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ProductID         uuid.UUID        `json:"product_id" gorm:"type:uuid;not null;index"`
	CertificationType string           `json:"certification_type" gorm:"not null"`
	Status            ComplianceStatus `json:"status" gorm:"type:varchar(20);not null"`
	CompletedDate     *time.Time       `json:"completed_date,omitempty" gorm:"type:date"`
	ExpiryDate        *time.Time       `json:"expiry_date,omitempty" gorm:"type:date"`
	Notes             *string          `json:"notes,omitempty"`
	CreatedAt         time.Time        `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt         time.Time        `json:"updated_at" gorm:"autoUpdateTime"`
}

func (pc *ProductCompliance) BeforeCreate(tx *gorm.DB) error {
	if pc.ID == uuid.Nil {
		pc.ID = uuid.New()
	}
	return nil
}

type CreateProductComplianceRequest struct {
	ProductID         uuid.UUID        `json:"product_id" binding:"required"`
	CertificationType string           `json:"certification_type" binding:"required"`
	Status            ComplianceStatus `json:"status" binding:"required"`
	CompletedDate     *time.Time       `json:"completed_date,omitempty"`
	ExpiryDate        *time.Time       `json:"expiry_date,omitempty"`
	Notes             *string          `json:"notes,omitempty"`
}

type UpdateProductComplianceRequest struct {
	CertificationType *string           `json:"certification_type,omitempty"`
	Status            *ComplianceStatus `json:"status,omitempty"`
	CompletedDate     *time.Time        `json:"completed_date,omitempty"`
	ExpiryDate        *time.Time        `json:"expiry_date,omitempty"`
	Notes             *string           `json:"notes,omitempty"`
}
