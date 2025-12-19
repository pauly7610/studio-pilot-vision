package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pauly7610/studio-pilot-vision/backend/database"
	"github.com/pauly7610/studio-pilot-vision/backend/models"
)

type ReadinessHandler struct{}

func NewReadinessHandler() *ReadinessHandler {
	return &ReadinessHandler{}
}

// GetProductReadiness retrieves readiness data for a specific product
func (h *ReadinessHandler) GetProductReadiness(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("productId"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	var readiness models.ProductReadiness
	result := database.DB.Where("product_id = ?", productID).First(&readiness)

	if result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Readiness data not found")
		return
	}

	respondWithData(c, http.StatusOK, readiness)
}

// CreateOrUpdateReadiness creates or updates readiness data for a product
func (h *ReadinessHandler) CreateOrUpdateReadiness(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("productId"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	// Verify product exists
	var product models.Product
	if result := database.DB.First(&product, "id = ?", productID); result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Product not found")
		return
	}

	var req models.CreateProductReadinessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	var existingReadiness models.ProductReadiness
	result := database.DB.Where("product_id = ?", productID).First(&existingReadiness)

	if result.Error != nil {
		// Create new readiness
		readiness := models.ProductReadiness{
			ProductID:          productID,
			ComplianceComplete: req.ComplianceComplete,
			SalesTrainingPct:   req.SalesTrainingPct,
			PartnerEnabledPct:  req.PartnerEnabledPct,
			OnboardingComplete: req.OnboardingComplete,
			DocumentationScore: req.DocumentationScore,
			ReadinessScore:     req.ReadinessScore,
			RiskBand:           req.RiskBand,
		}

		if result := database.DB.Create(&readiness); result.Error != nil {
			respondWithError(c, http.StatusInternalServerError, result.Error.Error())
			return
		}

		respondWithData(c, http.StatusCreated, readiness)
		return
	}

	// Update existing readiness
	updates := make(map[string]interface{})
	if req.ComplianceComplete != nil {
		updates["compliance_complete"] = *req.ComplianceComplete
	}
	if req.SalesTrainingPct != nil {
		updates["sales_training_pct"] = *req.SalesTrainingPct
	}
	if req.PartnerEnabledPct != nil {
		updates["partner_enabled_pct"] = *req.PartnerEnabledPct
	}
	if req.OnboardingComplete != nil {
		updates["onboarding_complete"] = *req.OnboardingComplete
	}
	if req.DocumentationScore != nil {
		updates["documentation_score"] = *req.DocumentationScore
	}
	updates["readiness_score"] = req.ReadinessScore
	updates["risk_band"] = req.RiskBand

	if result := database.DB.Model(&existingReadiness).Updates(updates); result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, existingReadiness)
}

// UpdateReadiness updates readiness data
func (h *ReadinessHandler) UpdateReadiness(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid readiness ID")
		return
	}

	var readiness models.ProductReadiness
	if result := database.DB.First(&readiness, "id = ?", id); result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Readiness data not found")
		return
	}

	var req models.UpdateProductReadinessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	updates := make(map[string]interface{})
	if req.ComplianceComplete != nil {
		updates["compliance_complete"] = *req.ComplianceComplete
	}
	if req.SalesTrainingPct != nil {
		updates["sales_training_pct"] = *req.SalesTrainingPct
	}
	if req.PartnerEnabledPct != nil {
		updates["partner_enabled_pct"] = *req.PartnerEnabledPct
	}
	if req.OnboardingComplete != nil {
		updates["onboarding_complete"] = *req.OnboardingComplete
	}
	if req.DocumentationScore != nil {
		updates["documentation_score"] = *req.DocumentationScore
	}
	if req.ReadinessScore != nil {
		updates["readiness_score"] = *req.ReadinessScore
	}
	if req.RiskBand != nil {
		updates["risk_band"] = *req.RiskBand
	}

	result := database.DB.Model(&readiness).Updates(updates)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, readiness)
}

// DeleteReadiness deletes readiness data
func (h *ReadinessHandler) DeleteReadiness(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid readiness ID")
		return
	}

	result := database.DB.Delete(&models.ProductReadiness{}, "id = ?", id)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	if result.RowsAffected == 0 {
		respondWithError(c, http.StatusNotFound, "Readiness data not found")
		return
	}

	respondWithSuccess(c, http.StatusOK, "Readiness data deleted successfully", nil)
}

// GetAllReadiness retrieves all readiness data
func (h *ReadinessHandler) GetAllReadiness(c *gin.Context) {
	var readinessData []models.ProductReadiness

	query := database.DB

	// Optional filtering by risk band
	if riskBand := c.Query("risk_band"); riskBand != "" {
		query = query.Where("risk_band = ?", riskBand)
	}

	result := query.Find(&readinessData)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, readinessData)
}
