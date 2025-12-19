package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProductPartner struct {
	ID                uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ProductID         uuid.UUID  `json:"product_id" gorm:"type:uuid;not null;index"`
	PartnerName       string     `json:"partner_name" gorm:"not null"`
	Enabled           *bool      `json:"enabled,omitempty" gorm:"default:false"`
	OnboardedDate     *time.Time `json:"onboarded_date,omitempty" gorm:"type:date"`
	IntegrationStatus *string    `json:"integration_status,omitempty"`
	RailType          *string    `json:"rail_type,omitempty"`
	CreatedAt         time.Time  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt         time.Time  `json:"updated_at" gorm:"autoUpdateTime"`
}

func (pp *ProductPartner) BeforeCreate(tx *gorm.DB) error {
	if pp.ID == uuid.Nil {
		pp.ID = uuid.New()
	}
	return nil
}

type CreateProductPartnerRequest struct {
	ProductID         uuid.UUID  `json:"product_id" binding:"required"`
	PartnerName       string     `json:"partner_name" binding:"required"`
	Enabled           *bool      `json:"enabled,omitempty"`
	OnboardedDate     *time.Time `json:"onboarded_date,omitempty"`
	IntegrationStatus *string    `json:"integration_status,omitempty"`
	RailType          *string    `json:"rail_type,omitempty"`
}

type UpdateProductPartnerRequest struct {
	PartnerName       *string    `json:"partner_name,omitempty"`
	Enabled           *bool      `json:"enabled,omitempty"`
	OnboardedDate     *time.Time `json:"onboarded_date,omitempty"`
	IntegrationStatus *string    `json:"integration_status,omitempty"`
	RailType          *string    `json:"rail_type,omitempty"`
}
