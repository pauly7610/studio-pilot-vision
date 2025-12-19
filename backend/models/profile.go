package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Profile struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	Email     string    `json:"email" gorm:"not null"`
	FullName  *string   `json:"full_name,omitempty"`
	Role      UserRole  `json:"role" gorm:"type:varchar(30);not null;default:'viewer'"`
	Region    *string   `json:"region,omitempty"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

func (p *Profile) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

func (p *Profile) IsAdmin() bool {
	return p.Role == UserRoleVPProduct || p.Role == UserRoleStudioAmbassador
}

type CreateProfileRequest struct {
	ID       uuid.UUID `json:"id" binding:"required"`
	Email    string    `json:"email" binding:"required,email"`
	FullName *string   `json:"full_name,omitempty"`
	Role     *UserRole `json:"role,omitempty"`
	Region   *string   `json:"region,omitempty"`
}

type UpdateProfileRequest struct {
	FullName *string   `json:"full_name,omitempty"`
	Role     *UserRole `json:"role,omitempty"`
	Region   *string   `json:"region,omitempty"`
}
