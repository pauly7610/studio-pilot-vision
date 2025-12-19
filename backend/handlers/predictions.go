package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pauly7610/studio-pilot-vision/backend/database"
	"github.com/pauly7610/studio-pilot-vision/backend/models"
)

type PredictionsHandler struct{}

func NewPredictionsHandler() *PredictionsHandler {
	return &PredictionsHandler{}
}

// GetProductPrediction retrieves the latest prediction for a product
func (h *PredictionsHandler) GetProductPrediction(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("productId"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	var prediction models.ProductPrediction
	result := database.DB.
		Where("product_id = ?", productID).
		Order("scored_at DESC").
		First(&prediction)

	if result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Prediction not found")
		return
	}

	respondWithData(c, http.StatusOK, prediction)
}

// GetProductPredictionHistory retrieves all predictions for a product
func (h *PredictionsHandler) GetProductPredictionHistory(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("productId"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	var predictions []models.ProductPrediction
	result := database.DB.
		Where("product_id = ?", productID).
		Order("scored_at DESC").
		Find(&predictions)

	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, predictions)
}

// CreatePrediction creates a new prediction
func (h *PredictionsHandler) CreatePrediction(c *gin.Context) {
	var req models.CreateProductPredictionRequest
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

	prediction := models.ProductPrediction{
		ProductID:          req.ProductID,
		SuccessProbability: req.SuccessProbability,
		RevenueProbability: req.RevenueProbability,
		FailureRisk:        req.FailureRisk,
		ModelVersion:       req.ModelVersion,
		Features:           req.Features,
	}

	result := database.DB.Create(&prediction)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusCreated, prediction)
}

// UpdatePrediction updates a prediction
func (h *PredictionsHandler) UpdatePrediction(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid prediction ID")
		return
	}

	var prediction models.ProductPrediction
	if result := database.DB.First(&prediction, "id = ?", id); result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Prediction not found")
		return
	}

	var req models.UpdateProductPredictionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	updates := make(map[string]interface{})
	if req.SuccessProbability != nil {
		updates["success_probability"] = *req.SuccessProbability
	}
	if req.RevenueProbability != nil {
		updates["revenue_probability"] = *req.RevenueProbability
	}
	if req.FailureRisk != nil {
		updates["failure_risk"] = *req.FailureRisk
	}
	if req.ModelVersion != nil {
		updates["model_version"] = *req.ModelVersion
	}
	if req.Features != nil {
		updates["features"] = req.Features
	}

	result := database.DB.Model(&prediction).Updates(updates)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, prediction)
}

// DeletePrediction deletes a prediction
func (h *PredictionsHandler) DeletePrediction(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid prediction ID")
		return
	}

	result := database.DB.Delete(&models.ProductPrediction{}, "id = ?", id)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	if result.RowsAffected == 0 {
		respondWithError(c, http.StatusNotFound, "Prediction not found")
		return
	}

	respondWithSuccess(c, http.StatusOK, "Prediction deleted successfully", nil)
}

// GetAllPredictions retrieves all predictions
func (h *PredictionsHandler) GetAllPredictions(c *gin.Context) {
	var predictions []models.ProductPrediction

	result := database.DB.
		Order("scored_at DESC").
		Find(&predictions)

	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, predictions)
}
