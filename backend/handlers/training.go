package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pauly7610/studio-pilot-vision/backend/database"
	"github.com/pauly7610/studio-pilot-vision/backend/models"
)

type TrainingHandler struct{}

func NewTrainingHandler() *TrainingHandler {
	return &TrainingHandler{}
}

// GetProductTraining retrieves training data for a product
func (h *TrainingHandler) GetProductTraining(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("productId"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	var training models.SalesTraining
	result := database.DB.Where("product_id = ?", productID).First(&training)

	if result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Training data not found")
		return
	}

	respondWithData(c, http.StatusOK, training)
}

// CreateOrUpdateTraining creates or updates training data
func (h *TrainingHandler) CreateOrUpdateTraining(c *gin.Context) {
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

	var req models.CreateSalesTrainingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	var existingTraining models.SalesTraining
	result := database.DB.Where("product_id = ?", productID).First(&existingTraining)

	if result.Error != nil {
		// Create new
		training := models.SalesTraining{
			ProductID:        productID,
			TotalReps:        req.TotalReps,
			TrainedReps:      req.TrainedReps,
			LastTrainingDate: req.LastTrainingDate,
		}

		if result := database.DB.Create(&training); result.Error != nil {
			respondWithError(c, http.StatusInternalServerError, result.Error.Error())
			return
		}

		respondWithData(c, http.StatusCreated, training)
		return
	}

	// Update existing
	updates := make(map[string]interface{})
	updates["total_reps"] = req.TotalReps
	updates["trained_reps"] = req.TrainedReps
	if req.LastTrainingDate != nil {
		updates["last_training_date"] = *req.LastTrainingDate
	}

	if result := database.DB.Model(&existingTraining).Updates(updates); result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	// Reload
	database.DB.Where("product_id = ?", productID).First(&existingTraining)
	respondWithData(c, http.StatusOK, existingTraining)
}

// GetAllTraining retrieves all training data
func (h *TrainingHandler) GetAllTraining(c *gin.Context) {
	var training []models.SalesTraining

	result := database.DB.Find(&training)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, training)
}

// DeleteTraining deletes training data
func (h *TrainingHandler) DeleteTraining(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid training ID")
		return
	}

	result := database.DB.Delete(&models.SalesTraining{}, "id = ?", id)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	if result.RowsAffected == 0 {
		respondWithError(c, http.StatusNotFound, "Training data not found")
		return
	}

	respondWithSuccess(c, http.StatusOK, "Training data deleted successfully", nil)
}
