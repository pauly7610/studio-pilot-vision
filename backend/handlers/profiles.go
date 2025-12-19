package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pauly7610/studio-pilot-vision/backend/database"
	"github.com/pauly7610/studio-pilot-vision/backend/models"
)

type ProfilesHandler struct{}

func NewProfilesHandler() *ProfilesHandler {
	return &ProfilesHandler{}
}

// GetProfile retrieves a profile by ID
func (h *ProfilesHandler) GetProfile(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid profile ID")
		return
	}

	var profile models.Profile
	result := database.DB.First(&profile, "id = ?", id)

	if result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Profile not found")
		return
	}

	respondWithData(c, http.StatusOK, profile)
}

// GetCurrentProfile retrieves the current user's profile
func (h *ProfilesHandler) GetCurrentProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		respondWithError(c, http.StatusUnauthorized, "User not authenticated")
		return
	}

	id, err := uuid.Parse(userID.(string))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var profile models.Profile
	result := database.DB.First(&profile, "id = ?", id)

	if result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Profile not found")
		return
	}

	respondWithData(c, http.StatusOK, profile)
}

// CreateProfile creates a new profile
func (h *ProfilesHandler) CreateProfile(c *gin.Context) {
	var req models.CreateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	profile := models.Profile{
		ID:       req.ID,
		Email:    req.Email,
		FullName: req.FullName,
		Region:   req.Region,
	}

	if req.Role != nil {
		profile.Role = *req.Role
	} else {
		profile.Role = models.UserRoleViewer
	}

	result := database.DB.Create(&profile)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusCreated, profile)
}

// UpdateProfile updates a profile
func (h *ProfilesHandler) UpdateProfile(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid profile ID")
		return
	}

	var profile models.Profile
	if result := database.DB.First(&profile, "id = ?", id); result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Profile not found")
		return
	}

	var req models.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	updates := make(map[string]interface{})
	if req.FullName != nil {
		updates["full_name"] = *req.FullName
	}
	if req.Role != nil {
		updates["role"] = *req.Role
	}
	if req.Region != nil {
		updates["region"] = *req.Region
	}

	result := database.DB.Model(&profile).Updates(updates)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, profile)
}

// GetAllProfiles retrieves all profiles
func (h *ProfilesHandler) GetAllProfiles(c *gin.Context) {
	var profiles []models.Profile

	query := database.DB.Order("created_at DESC")

	if role := c.Query("role"); role != "" {
		query = query.Where("role = ?", role)
	}

	result := query.Find(&profiles)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, profiles)
}

// IsAdmin checks if a user has admin privileges
func (h *ProfilesHandler) IsAdmin(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var profile models.Profile
	result := database.DB.First(&profile, "id = ?", id)

	if result.Error != nil {
		respondWithData(c, http.StatusOK, gin.H{"is_admin": false})
		return
	}

	respondWithData(c, http.StatusOK, gin.H{"is_admin": profile.IsAdmin()})
}
