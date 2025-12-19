package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pauly7610/studio-pilot-vision/backend/database"
	"github.com/pauly7610/studio-pilot-vision/backend/models"
)

type MetricsHandler struct{}

func NewMetricsHandler() *MetricsHandler {
	return &MetricsHandler{}
}

// GetProductMetrics retrieves all metrics for a specific product
func (h *MetricsHandler) GetProductMetrics(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("productId"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	var metrics []models.ProductMetric
	result := database.DB.
		Where("product_id = ?", productID).
		Order("date ASC").
		Find(&metrics)

	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, metrics)
}

// GetMetric retrieves a single metric by ID
func (h *MetricsHandler) GetMetric(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid metric ID")
		return
	}

	var metric models.ProductMetric
	result := database.DB.First(&metric, "id = ?", id)

	if result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Metric not found")
		return
	}

	respondWithData(c, http.StatusOK, metric)
}

// CreateMetric creates a new metric
func (h *MetricsHandler) CreateMetric(c *gin.Context) {
	var req models.CreateProductMetricRequest
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

	metric := models.ProductMetric{
		ProductID:         req.ProductID,
		Date:              req.Date,
		ActualRevenue:     req.ActualRevenue,
		AdoptionRate:      req.AdoptionRate,
		ActiveUsers:       req.ActiveUsers,
		TransactionVolume: req.TransactionVolume,
		ChurnRate:         req.ChurnRate,
	}

	result := database.DB.Create(&metric)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusCreated, metric)
}

// UpdateMetric updates an existing metric
func (h *MetricsHandler) UpdateMetric(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid metric ID")
		return
	}

	var metric models.ProductMetric
	if result := database.DB.First(&metric, "id = ?", id); result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Metric not found")
		return
	}

	var req models.UpdateProductMetricRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	updates := make(map[string]interface{})
	if req.Date != nil {
		updates["date"] = *req.Date
	}
	if req.ActualRevenue != nil {
		updates["actual_revenue"] = *req.ActualRevenue
	}
	if req.AdoptionRate != nil {
		updates["adoption_rate"] = *req.AdoptionRate
	}
	if req.ActiveUsers != nil {
		updates["active_users"] = *req.ActiveUsers
	}
	if req.TransactionVolume != nil {
		updates["transaction_volume"] = *req.TransactionVolume
	}
	if req.ChurnRate != nil {
		updates["churn_rate"] = *req.ChurnRate
	}

	result := database.DB.Model(&metric).Updates(updates)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, metric)
}

// DeleteMetric deletes a metric
func (h *MetricsHandler) DeleteMetric(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid metric ID")
		return
	}

	result := database.DB.Delete(&models.ProductMetric{}, "id = ?", id)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	if result.RowsAffected == 0 {
		respondWithError(c, http.StatusNotFound, "Metric not found")
		return
	}

	respondWithSuccess(c, http.StatusOK, "Metric deleted successfully", nil)
}

// GetAllMetrics retrieves all metrics with optional filtering
func (h *MetricsHandler) GetAllMetrics(c *gin.Context) {
	var metrics []models.ProductMetric

	query := database.DB.Order("date DESC")

	// Optional date range filtering
	if startDate := c.Query("start_date"); startDate != "" {
		query = query.Where("date >= ?", startDate)
	}
	if endDate := c.Query("end_date"); endDate != "" {
		query = query.Where("date <= ?", endDate)
	}

	result := query.Find(&metrics)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, metrics)
}
