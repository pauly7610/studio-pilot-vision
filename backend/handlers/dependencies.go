package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pauly7610/studio-pilot-vision/backend/database"
	"github.com/pauly7610/studio-pilot-vision/backend/models"
)

type DependenciesHandler struct{}

func NewDependenciesHandler() *DependenciesHandler {
	return &DependenciesHandler{}
}

// GetProductDependencies retrieves all dependencies for a product
func (h *DependenciesHandler) GetProductDependencies(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("productId"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	var dependencies []models.ProductDependency
	result := database.DB.
		Where("product_id = ?", productID).
		Order("created_at DESC").
		Find(&dependencies)

	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, dependencies)
}

// GetAllDependencies retrieves all dependencies with optional filtering
func (h *DependenciesHandler) GetAllDependencies(c *gin.Context) {
	var dependencies []models.ProductDependency

	query := database.DB.Order("created_at DESC")

	// Filter by status (blocked, pending, resolved)
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	// Filter by type (internal, external)
	if depType := c.Query("type"); depType != "" {
		query = query.Where("type = ?", depType)
	}

	// Filter by category
	if category := c.Query("category"); category != "" {
		query = query.Where("category = ?", category)
	}

	result := query.Find(&dependencies)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, dependencies)
}

// GetBlockedDependencies retrieves only blocked dependencies
func (h *DependenciesHandler) GetBlockedDependencies(c *gin.Context) {
	var dependencies []models.ProductDependency

	result := database.DB.
		Where("status = ?", models.DependencyStatusBlocked).
		Order("blocked_since ASC").
		Find(&dependencies)

	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, dependencies)
}

// CreateDependency creates a new dependency
func (h *DependenciesHandler) CreateDependency(c *gin.Context) {
	var req models.CreateProductDependencyRequest
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

	dependency := models.ProductDependency{
		ProductID: req.ProductID,
		Name:      req.Name,
		Type:      req.Type,
		Category:  req.Category,
		Notes:     req.Notes,
	}

	if req.Status != nil {
		dependency.Status = *req.Status
		if *req.Status == models.DependencyStatusBlocked {
			now := time.Now()
			dependency.BlockedSince = &now
		}
	} else {
		dependency.Status = models.DependencyStatusPending
	}

	result := database.DB.Create(&dependency)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusCreated, dependency)
}

// UpdateDependency updates a dependency
func (h *DependenciesHandler) UpdateDependency(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid dependency ID")
		return
	}

	var dependency models.ProductDependency
	if result := database.DB.First(&dependency, "id = ?", id); result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Dependency not found")
		return
	}

	var req models.UpdateProductDependencyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Type != nil {
		updates["type"] = *req.Type
	}
	if req.Category != nil {
		updates["category"] = *req.Category
	}
	if req.Status != nil {
		updates["status"] = *req.Status
		// Handle status transitions
		if *req.Status == models.DependencyStatusBlocked && dependency.Status != models.DependencyStatusBlocked {
			now := time.Now()
			updates["blocked_since"] = now
		} else if *req.Status == models.DependencyStatusResolved && dependency.Status == models.DependencyStatusBlocked {
			now := time.Now()
			updates["resolved_at"] = now
			updates["blocked_since"] = nil
		}
	}
	if req.Notes != nil {
		updates["notes"] = *req.Notes
	}

	result := database.DB.Model(&dependency).Updates(updates)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	// Reload dependency
	database.DB.First(&dependency, "id = ?", id)
	respondWithData(c, http.StatusOK, dependency)
}

// DeleteDependency deletes a dependency
func (h *DependenciesHandler) DeleteDependency(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid dependency ID")
		return
	}

	result := database.DB.Delete(&models.ProductDependency{}, "id = ?", id)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	if result.RowsAffected == 0 {
		respondWithError(c, http.StatusNotFound, "Dependency not found")
		return
	}

	respondWithSuccess(c, http.StatusOK, "Dependency deleted successfully", nil)
}

// GetDependencySummary returns summary stats for dependencies
func (h *DependenciesHandler) GetDependencySummary(c *gin.Context) {
	type Summary struct {
		TotalCount     int64   `json:"total_count"`
		BlockedCount   int64   `json:"blocked_count"`
		PendingCount   int64   `json:"pending_count"`
		ResolvedCount  int64   `json:"resolved_count"`
		InternalCount  int64   `json:"internal_count"`
		ExternalCount  int64   `json:"external_count"`
		AvgBlockedDays float64 `json:"avg_blocked_days"`
	}

	var summary Summary

	database.DB.Model(&models.ProductDependency{}).Count(&summary.TotalCount)
	database.DB.Model(&models.ProductDependency{}).Where("status = ?", "blocked").Count(&summary.BlockedCount)
	database.DB.Model(&models.ProductDependency{}).Where("status = ?", "pending").Count(&summary.PendingCount)
	database.DB.Model(&models.ProductDependency{}).Where("status = ?", "resolved").Count(&summary.ResolvedCount)
	database.DB.Model(&models.ProductDependency{}).Where("type = ?", "internal").Count(&summary.InternalCount)
	database.DB.Model(&models.ProductDependency{}).Where("type = ?", "external").Count(&summary.ExternalCount)

	// Calculate average blocked days
	var blockedDeps []models.ProductDependency
	database.DB.Where("status = ? AND blocked_since IS NOT NULL", "blocked").Find(&blockedDeps)

	if len(blockedDeps) > 0 {
		var totalDays float64
		now := time.Now()
		for _, dep := range blockedDeps {
			if dep.BlockedSince != nil {
				days := now.Sub(*dep.BlockedSince).Hours() / 24
				totalDays += days
			}
		}
		summary.AvgBlockedDays = totalDays / float64(len(blockedDeps))
	}

	respondWithData(c, http.StatusOK, summary)
}
