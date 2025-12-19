package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SalesTraining struct {
	ID               uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ProductID        uuid.UUID  `json:"product_id" gorm:"type:uuid;not null;uniqueIndex"`
	TotalReps        int        `json:"total_reps" gorm:"not null;default:0"`
	TrainedReps      int        `json:"trained_reps" gorm:"not null;default:0"`
	CoveragePct      *float64   `json:"coverage_pct,omitempty" gorm:"type:decimal(5,2)"`
	LastTrainingDate *time.Time `json:"last_training_date,omitempty" gorm:"type:date"`
	UpdatedAt        time.Time  `json:"updated_at" gorm:"autoUpdateTime"`
}

func (st *SalesTraining) BeforeCreate(tx *gorm.DB) error {
	if st.ID == uuid.Nil {
		st.ID = uuid.New()
	}
	st.calculateCoverage()
	return nil
}

func (st *SalesTraining) BeforeUpdate(tx *gorm.DB) error {
	st.calculateCoverage()
	return nil
}

func (st *SalesTraining) calculateCoverage() {
	if st.TotalReps > 0 {
		coverage := float64(st.TrainedReps) / float64(st.TotalReps) * 100
		st.CoveragePct = &coverage
	} else {
		zero := float64(0)
		st.CoveragePct = &zero
	}
}

type CreateSalesTrainingRequest struct {
	ProductID        uuid.UUID  `json:"product_id" binding:"required"`
	TotalReps        int        `json:"total_reps"`
	TrainedReps      int        `json:"trained_reps"`
	LastTrainingDate *time.Time `json:"last_training_date,omitempty"`
}

type UpdateSalesTrainingRequest struct {
	TotalReps        *int       `json:"total_reps,omitempty"`
	TrainedReps      *int       `json:"trained_reps,omitempty"`
	LastTrainingDate *time.Time `json:"last_training_date,omitempty"`
}
