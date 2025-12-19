package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pauly7610/studio-pilot-vision/backend/database"
	"github.com/pauly7610/studio-pilot-vision/backend/models"
)

type ComplianceHandler struct{}

func NewComplianceHandler() *ComplianceHandler {
	return &ComplianceHandler{}
}

// GetProductCompliance retrieves all compliance records for a product
func (h *ComplianceHandler) GetProductCompliance(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("productId"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	var compliance []models.ProductCompliance
	result := database.DB.
		Where("product_id = ?", productID).
		Order("created_at DESC").
		Find(&compliance)

	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, compliance)
}

// GetCompliance retrieves a single compliance record
func (h *ComplianceHandler) GetCompliance(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid compliance ID")
		return
	}

	var compliance models.ProductCompliance
	result := database.DB.First(&compliance, "id = ?", id)

	if result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Compliance record not found")
		return
	}

	respondWithData(c, http.StatusOK, compliance)
}

// CreateCompliance creates a new compliance record
func (h *ComplianceHandler) CreateCompliance(c *gin.Context) {
	var req models.CreateProductComplianceRequest
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

	compliance := models.ProductCompliance{
		ProductID:         req.ProductID,
		CertificationType: req.CertificationType,
		Status:            req.Status,
		CompletedDate:     req.CompletedDate,
		ExpiryDate:        req.ExpiryDate,
		Notes:             req.Notes,
	}

	result := database.DB.Create(&compliance)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusCreated, compliance)
}

// UpdateCompliance updates a compliance record
func (h *ComplianceHandler) UpdateCompliance(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid compliance ID")
		return
	}

	var compliance models.ProductCompliance
	if result := database.DB.First(&compliance, "id = ?", id); result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Compliance record not found")
		return
	}

	var req models.UpdateProductComplianceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	updates := make(map[string]interface{})
	if req.CertificationType != nil {
		updates["certification_type"] = *req.CertificationType
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.CompletedDate != nil {
		updates["completed_date"] = *req.CompletedDate
	}
	if req.ExpiryDate != nil {
		updates["expiry_date"] = *req.ExpiryDate
	}
	if req.Notes != nil {
		updates["notes"] = *req.Notes
	}

	result := database.DB.Model(&compliance).Updates(updates)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, compliance)
}

// DeleteCompliance deletes a compliance record
func (h *ComplianceHandler) DeleteCompliance(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid compliance ID")
		return
	}

	result := database.DB.Delete(&models.ProductCompliance{}, "id = ?", id)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	if result.RowsAffected == 0 {
		respondWithError(c, http.StatusNotFound, "Compliance record not found")
		return
	}

	respondWithSuccess(c, http.StatusOK, "Compliance record deleted successfully", nil)
}

// GetAllCompliance retrieves all compliance records
func (h *ComplianceHandler) GetAllCompliance(c *gin.Context) {
	var compliance []models.ProductCompliance

	query := database.DB.Order("created_at DESC")

	// Optional filtering by status
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	result := query.Find(&compliance)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, compliance)
}
