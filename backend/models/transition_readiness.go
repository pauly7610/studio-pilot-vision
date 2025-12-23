package models

import (
	"time"

	"github.com/google/uuid"
)

type TransitionCategory string

const (
	TransitionCategorySales TransitionCategory = "sales"
	TransitionCategoryTech  TransitionCategory = "tech"
	TransitionCategoryOps   TransitionCategory = "ops"
)

type TransitionItem struct {
	ID          uuid.UUID          `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	ProductID   uuid.UUID          `gorm:"type:uuid;not null" json:"product_id"`
	Category    TransitionCategory `gorm:"type:varchar(20);not null" json:"category"`
	Name        string             `gorm:"not null" json:"name"`
	Description *string            `json:"description,omitempty"`
	Complete    bool               `gorm:"default:false" json:"complete"`
	CompletedAt *time.Time         `json:"completed_at,omitempty"`
	CompletedBy *string            `json:"completed_by,omitempty"`
	Owner       *string            `json:"owner,omitempty"`
	DueDate     *time.Time         `json:"due_date,omitempty"`
	CreatedAt   time.Time          `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time          `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Product Product `gorm:"foreignKey:ProductID" json:"-"`
}

func (TransitionItem) TableName() string {
	return "transition_items"
}

type CreateTransitionItemRequest struct {
	ProductID   uuid.UUID          `json:"product_id" binding:"required"`
	Category    TransitionCategory `json:"category" binding:"required"`
	Name        string             `json:"name" binding:"required"`
	Description *string            `json:"description,omitempty"`
	Owner       *string            `json:"owner,omitempty"`
	DueDate     *time.Time         `json:"due_date,omitempty"`
}

type UpdateTransitionItemRequest struct {
	Name        *string    `json:"name,omitempty"`
	Description *string    `json:"description,omitempty"`
	Complete    *bool      `json:"complete,omitempty"`
	CompletedBy *string    `json:"completed_by,omitempty"`
	Owner       *string    `json:"owner,omitempty"`
	DueDate     *time.Time `json:"due_date,omitempty"`
}

// TransitionReadinessResponse for API
type TransitionReadinessResponse struct {
	ProductID      string           `json:"product_id"`
	ProductName    string           `json:"product_name"`
	OverallPercent int              `json:"overall_percent"`
	IsReadyForBAU  bool             `json:"is_ready_for_bau"`
	SalesComplete  int              `json:"sales_complete"`
	SalesTotal     int              `json:"sales_total"`
	TechComplete   int              `json:"tech_complete"`
	TechTotal      int              `json:"tech_total"`
	OpsComplete    int              `json:"ops_complete"`
	OpsTotal       int              `json:"ops_total"`
	PendingItems   []TransitionItem `json:"pending_items"`
}
