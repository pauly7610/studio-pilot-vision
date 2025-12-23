package models

import (
	"time"

	"github.com/google/uuid"
)

type EscalationLevel string

const (
	EscalationLevelNone             EscalationLevel = "none"
	EscalationLevelAmbassadorReview EscalationLevel = "ambassador_review"
	EscalationLevelExecSteerCo      EscalationLevel = "exec_steerco"
	EscalationLevelCritical         EscalationLevel = "critical"
)

type ProductEscalation struct {
	ID             uuid.UUID       `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	ProductID      uuid.UUID       `gorm:"type:uuid;not null" json:"product_id"`
	Level          EscalationLevel `gorm:"type:varchar(30);not null" json:"level"`
	Action         string          `gorm:"not null" json:"action"`
	Owner          string          `gorm:"not null" json:"owner"`
	NextMilestone  string          `json:"next_milestone,omitempty"`
	CyclesInStatus int             `gorm:"default:0" json:"cycles_in_status"`
	TriggeredAt    time.Time       `gorm:"autoCreateTime" json:"triggered_at"`
	ResolvedAt     *time.Time      `json:"resolved_at,omitempty"`
	Notes          *string         `json:"notes,omitempty"`
	CreatedAt      time.Time       `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt      time.Time       `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Product Product `gorm:"foreignKey:ProductID" json:"-"`
}

func (ProductEscalation) TableName() string {
	return "product_escalations"
}

type CreateEscalationRequest struct {
	ProductID      uuid.UUID       `json:"product_id" binding:"required"`
	Level          EscalationLevel `json:"level" binding:"required"`
	Action         string          `json:"action" binding:"required"`
	Owner          string          `json:"owner" binding:"required"`
	NextMilestone  *string         `json:"next_milestone,omitempty"`
	CyclesInStatus *int            `json:"cycles_in_status,omitempty"`
	Notes          *string         `json:"notes,omitempty"`
}

type UpdateEscalationRequest struct {
	Level          *EscalationLevel `json:"level,omitempty"`
	Action         *string          `json:"action,omitempty"`
	Owner          *string          `json:"owner,omitempty"`
	NextMilestone  *string          `json:"next_milestone,omitempty"`
	CyclesInStatus *int             `json:"cycles_in_status,omitempty"`
	ResolvedAt     *time.Time       `json:"resolved_at,omitempty"`
	Notes          *string          `json:"notes,omitempty"`
}

// EscalationResponse includes calculated fields
type EscalationResponse struct {
	ProductID      string `json:"product_id"`
	Level          string `json:"level"`
	Label          string `json:"label"`
	Action         string `json:"action"`
	Owner          string `json:"owner"`
	NextMilestone  string `json:"next_milestone"`
	CyclesInStatus int    `json:"cycles_in_status"`
	RequiresAction bool   `json:"requires_action"`
	TriggeredAt    string `json:"triggered_at,omitempty"`
}
