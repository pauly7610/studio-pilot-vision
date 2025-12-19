package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pauly7610/studio-pilot-vision/backend/database"
	"github.com/pauly7610/studio-pilot-vision/backend/models"
)

type MarketEvidenceHandler struct{}

func NewMarketEvidenceHandler() *MarketEvidenceHandler {
	return &MarketEvidenceHandler{}
}

// GetProductMarketEvidence retrieves all market evidence for a product
func (h *MarketEvidenceHandler) GetProductMarketEvidence(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("productId"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	var evidence []models.ProductMarketEvidence
	result := database.DB.
		Where("product_id = ?", productID).
		Order("measurement_date DESC").
		Find(&evidence)

	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, evidence)
}

// CreateMarketEvidence creates new market evidence
func (h *MarketEvidenceHandler) CreateMarketEvidence(c *gin.Context) {
	var req models.CreateProductMarketEvidenceRequest
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

	evidence := models.ProductMarketEvidence{
		ProductID:            req.ProductID,
		MerchantAdoptionRate: req.MerchantAdoptionRate,
		SentimentScore:       req.SentimentScore,
		SampleSize:           req.SampleSize,
		Notes:                req.Notes,
	}

	if req.MeasurementDate != nil {
		evidence.MeasurementDate = *req.MeasurementDate
	}

	result := database.DB.Create(&evidence)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusCreated, evidence)
}

// UpdateMarketEvidence updates market evidence
func (h *MarketEvidenceHandler) UpdateMarketEvidence(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid evidence ID")
		return
	}

	var evidence models.ProductMarketEvidence
	if result := database.DB.First(&evidence, "id = ?", id); result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Market evidence not found")
		return
	}

	var req models.UpdateProductMarketEvidenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	updates := make(map[string]interface{})
	if req.MeasurementDate != nil {
		updates["measurement_date"] = *req.MeasurementDate
	}
	if req.MerchantAdoptionRate != nil {
		updates["merchant_adoption_rate"] = *req.MerchantAdoptionRate
	}
	if req.SentimentScore != nil {
		updates["sentiment_score"] = *req.SentimentScore
	}
	if req.SampleSize != nil {
		updates["sample_size"] = *req.SampleSize
	}
	if req.Notes != nil {
		updates["notes"] = *req.Notes
	}

	result := database.DB.Model(&evidence).Updates(updates)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, evidence)
}

// DeleteMarketEvidence deletes market evidence
func (h *MarketEvidenceHandler) DeleteMarketEvidence(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid evidence ID")
		return
	}

	result := database.DB.Delete(&models.ProductMarketEvidence{}, "id = ?", id)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	if result.RowsAffected == 0 {
		respondWithError(c, http.StatusNotFound, "Market evidence not found")
		return
	}

	respondWithSuccess(c, http.StatusOK, "Market evidence deleted successfully", nil)
}

// GetAllMarketEvidence retrieves all market evidence
func (h *MarketEvidenceHandler) GetAllMarketEvidence(c *gin.Context) {
	var evidence []models.ProductMarketEvidence

	result := database.DB.Order("measurement_date DESC").Find(&evidence)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, evidence)
}
