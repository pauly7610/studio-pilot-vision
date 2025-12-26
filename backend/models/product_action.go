package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProductAction struct {
	ID               uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ProductID        uuid.UUID      `json:"product_id" gorm:"type:uuid;not null;index"`
	LinkedFeedbackID *uuid.UUID     `json:"linked_feedback_id,omitempty" gorm:"type:uuid;index"`
	ActionType       ActionType     `json:"action_type" gorm:"type:varchar(50);not null"`
	Title            string         `json:"title" gorm:"not null"`
	Description      *string        `json:"description,omitempty"`
	AssignedTo       *string        `json:"assigned_to,omitempty"`
	Status           ActionStatus   `json:"status" gorm:"type:varchar(20);not null;default:'pending'"`
	Priority         ActionPriority `json:"priority" gorm:"type:varchar(20);not null;default:'medium'"`
	DueDate          *time.Time     `json:"due_date,omitempty" gorm:"type:date"`
	CompletedAt      *time.Time     `json:"completed_at,omitempty"`
	CreatedBy        *string        `json:"created_by,omitempty"`
	CreatedAt        time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt        time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
}

func (pa *ProductAction) BeforeCreate(tx *gorm.DB) error {
	if pa.ID == uuid.Nil {
		pa.ID = uuid.New()
	}
	return nil
}

type CreateProductActionRequest struct {
	ProductID        uuid.UUID       `json:"product_id" binding:"required"`
	LinkedFeedbackID *uuid.UUID      `json:"linked_feedback_id,omitempty"`
	ActionType       ActionType      `json:"action_type" binding:"required"`
	Title            string          `json:"title" binding:"required"`
	Description      *string         `json:"description,omitempty"`
	AssignedTo       *string         `json:"assigned_to,omitempty"`
	Status           *ActionStatus   `json:"status,omitempty"`
	Priority         *ActionPriority `json:"priority,omitempty"`
	DueDate          *time.Time      `json:"due_date,omitempty"`
}

type UpdateProductActionRequest struct {
	LinkedFeedbackID *uuid.UUID      `json:"linked_feedback_id,omitempty"`
	ActionType       *ActionType     `json:"action_type,omitempty"`
	Title            *string         `json:"title,omitempty"`
	Description      *string         `json:"description,omitempty"`
	AssignedTo       *string         `json:"assigned_to,omitempty"`
	Status           *ActionStatus   `json:"status,omitempty"`
	Priority         *ActionPriority `json:"priority,omitempty"`
	DueDate          *time.Time      `json:"due_date,omitempty"`
	CompletedAt      *time.Time      `json:"completed_at,omitempty"`
}
