package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pauly7610/studio-pilot-vision/backend/database"
	"github.com/pauly7610/studio-pilot-vision/backend/models"
)

type PartnersHandler struct{}

func NewPartnersHandler() *PartnersHandler {
	return &PartnersHandler{}
}

// GetProductPartners retrieves all partners for a product
func (h *PartnersHandler) GetProductPartners(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("productId"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	var partners []models.ProductPartner
	result := database.DB.
		Where("product_id = ?", productID).
		Order("created_at DESC").
		Find(&partners)

	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, partners)
}

// GetPartner retrieves a single partner
func (h *PartnersHandler) GetPartner(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid partner ID")
		return
	}

	var partner models.ProductPartner
	result := database.DB.First(&partner, "id = ?", id)

	if result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Partner not found")
		return
	}

	respondWithData(c, http.StatusOK, partner)
}

// CreatePartner creates a new partner
func (h *PartnersHandler) CreatePartner(c *gin.Context) {
	var req models.CreateProductPartnerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Verify product exists
	var product models.Product
	if result := database.DB.First(&product, "id = ?", req.ProductID); result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Product not found")
		return
	}

	partner := models.ProductPartner{
		ProductID:         req.ProductID,
		PartnerName:       req.PartnerName,
		Enabled:           req.Enabled,
		OnboardedDate:     req.OnboardedDate,
		IntegrationStatus: req.IntegrationStatus,
		RailType:          req.RailType,
	}

	result := database.DB.Create(&partner)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusCreated, partner)
}

// UpdatePartner updates a partner
func (h *PartnersHandler) UpdatePartner(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid partner ID")
		return
	}

	var partner models.ProductPartner
	if result := database.DB.First(&partner, "id = ?", id); result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Partner not found")
		return
	}

	var req models.UpdateProductPartnerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	updates := make(map[string]interface{})
	if req.PartnerName != nil {
		updates["partner_name"] = *req.PartnerName
	}
	if req.Enabled != nil {
		updates["enabled"] = *req.Enabled
	}
	if req.OnboardedDate != nil {
		updates["onboarded_date"] = *req.OnboardedDate
	}
	if req.IntegrationStatus != nil {
		updates["integration_status"] = *req.IntegrationStatus
	}
	if req.RailType != nil {
		updates["rail_type"] = *req.RailType
	}

	result := database.DB.Model(&partner).Updates(updates)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, partner)
}

// DeletePartner deletes a partner
func (h *PartnersHandler) DeletePartner(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid partner ID")
		return
	}

	result := database.DB.Delete(&models.ProductPartner{}, "id = ?", id)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	if result.RowsAffected == 0 {
		respondWithError(c, http.StatusNotFound, "Partner not found")
		return
	}

	respondWithSuccess(c, http.StatusOK, "Partner deleted successfully", nil)
}

// GetAllPartners retrieves all partners
func (h *PartnersHandler) GetAllPartners(c *gin.Context) {
	var partners []models.ProductPartner

	query := database.DB.Order("created_at DESC")

	// Optional filtering by enabled status
	if enabled := c.Query("enabled"); enabled != "" {
		query = query.Where("enabled = ?", enabled == "true")
	}

	result := query.Find(&partners)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, partners)
}
