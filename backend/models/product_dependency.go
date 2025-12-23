package models

import (
	"time"

	"github.com/google/uuid"
)

type DependencyType string
type DependencyStatus string
type DependencyCategory string

const (
	DependencyTypeInternal DependencyType = "internal"
	DependencyTypeExternal DependencyType = "external"
)

const (
	DependencyStatusBlocked  DependencyStatus = "blocked"
	DependencyStatusPending  DependencyStatus = "pending"
	DependencyStatusResolved DependencyStatus = "resolved"
)

const (
	// Internal categories
	DependencyCategoryLegal       DependencyCategory = "legal"
	DependencyCategoryCyber       DependencyCategory = "cyber"
	DependencyCategoryCompliance  DependencyCategory = "compliance"
	DependencyCategoryPrivacy     DependencyCategory = "privacy"
	DependencyCategoryEngineering DependencyCategory = "engineering"
	DependencyCategoryOps         DependencyCategory = "ops"
	// External categories
	DependencyCategoryPartnerRail DependencyCategory = "partner_rail"
	DependencyCategoryVendor      DependencyCategory = "vendor"
	DependencyCategoryAPI         DependencyCategory = "api"
	DependencyCategoryIntegration DependencyCategory = "integration"
	DependencyCategoryRegulatory  DependencyCategory = "regulatory"
)

type ProductDependency struct {
	ID           uuid.UUID          `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	ProductID    uuid.UUID          `gorm:"type:uuid;not null" json:"product_id"`
	Name         string             `gorm:"size:255;not null" json:"name"`
	Type         DependencyType     `gorm:"type:varchar(20);not null" json:"type"`
	Category     DependencyCategory `gorm:"type:varchar(50);not null" json:"category"`
	Status       DependencyStatus   `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	BlockedSince *time.Time         `json:"blocked_since,omitempty"`
	ResolvedAt   *time.Time         `json:"resolved_at,omitempty"`
	Notes        *string            `json:"notes,omitempty"`
	CreatedAt    time.Time          `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time          `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Product Product `gorm:"foreignKey:ProductID" json:"-"`
}

func (ProductDependency) TableName() string {
	return "product_dependencies"
}

type CreateProductDependencyRequest struct {
	ProductID uuid.UUID          `json:"product_id" binding:"required"`
	Name      string             `json:"name" binding:"required"`
	Type      DependencyType     `json:"type" binding:"required"`
	Category  DependencyCategory `json:"category" binding:"required"`
	Status    *DependencyStatus  `json:"status,omitempty"`
	Notes     *string            `json:"notes,omitempty"`
}

type UpdateProductDependencyRequest struct {
	Name         *string             `json:"name,omitempty"`
	Type         *DependencyType     `json:"type,omitempty"`
	Category     *DependencyCategory `json:"category,omitempty"`
	Status       *DependencyStatus   `json:"status,omitempty"`
	BlockedSince *time.Time          `json:"blocked_since,omitempty"`
	ResolvedAt   *time.Time          `json:"resolved_at,omitempty"`
	Notes        *string             `json:"notes,omitempty"`
}
