package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pauly7610/studio-pilot-vision/backend/database"
	"github.com/pauly7610/studio-pilot-vision/backend/models"
)

type TransitionHandler struct{}

func NewTransitionHandler() *TransitionHandler {
	return &TransitionHandler{}
}

// GetProductTransitionReadiness returns transition readiness for a product
func (h *TransitionHandler) GetProductTransitionReadiness(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("productId"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	var product models.Product
	if result := database.DB.First(&product, "id = ?", productID); result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Product not found")
		return
	}

	var items []models.TransitionItem
	database.DB.Where("product_id = ?", productID).Find(&items)

	// If no items exist, create default ones
	if len(items) == 0 {
		items = createDefaultTransitionItems(productID)
	}

	// Calculate stats
	var salesComplete, salesTotal, techComplete, techTotal, opsComplete, opsTotal int
	var pendingItems []models.TransitionItem

	for _, item := range items {
		switch item.Category {
		case models.TransitionCategorySales:
			salesTotal++
			if item.Complete {
				salesComplete++
			} else {
				pendingItems = append(pendingItems, item)
			}
		case models.TransitionCategoryTech:
			techTotal++
			if item.Complete {
				techComplete++
			} else {
				pendingItems = append(pendingItems, item)
			}
		case models.TransitionCategoryOps:
			opsTotal++
			if item.Complete {
				opsComplete++
			} else {
				pendingItems = append(pendingItems, item)
			}
		}
	}

	totalComplete := salesComplete + techComplete + opsComplete
	totalItems := salesTotal + techTotal + opsTotal
	overallPercent := 0
	if totalItems > 0 {
		overallPercent = (totalComplete * 100) / totalItems
	}

	response := models.TransitionReadinessResponse{
		ProductID:      productID.String(),
		ProductName:    product.Name,
		OverallPercent: overallPercent,
		IsReadyForBAU:  overallPercent >= 80,
		SalesComplete:  salesComplete,
		SalesTotal:     salesTotal,
		TechComplete:   techComplete,
		TechTotal:      techTotal,
		OpsComplete:    opsComplete,
		OpsTotal:       opsTotal,
		PendingItems:   pendingItems,
	}

	respondWithData(c, http.StatusOK, response)
}

// GetTransitionItems returns all transition items for a product
func (h *TransitionHandler) GetTransitionItems(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("productId"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	var items []models.TransitionItem
	result := database.DB.
		Where("product_id = ?", productID).
		Order("category, name").
		Find(&items)

	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, items)
}

// CreateTransitionItem creates a new transition item
func (h *TransitionHandler) CreateTransitionItem(c *gin.Context) {
	var req models.CreateTransitionItemRequest
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

	item := models.TransitionItem{
		ProductID:   req.ProductID,
		Category:    req.Category,
		Name:        req.Name,
		Description: req.Description,
		Owner:       req.Owner,
		DueDate:     req.DueDate,
	}

	result := database.DB.Create(&item)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusCreated, item)
}

// UpdateTransitionItem updates a transition item
func (h *TransitionHandler) UpdateTransitionItem(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid item ID")
		return
	}

	var item models.TransitionItem
	if result := database.DB.First(&item, "id = ?", id); result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Item not found")
		return
	}

	var req models.UpdateTransitionItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Complete != nil {
		updates["complete"] = *req.Complete
		if *req.Complete && item.CompletedAt == nil {
			now := time.Now()
			updates["completed_at"] = now
		}
	}
	if req.CompletedBy != nil {
		updates["completed_by"] = *req.CompletedBy
	}
	if req.Owner != nil {
		updates["owner"] = *req.Owner
	}
	if req.DueDate != nil {
		updates["due_date"] = *req.DueDate
	}

	result := database.DB.Model(&item).Updates(updates)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	database.DB.First(&item, "id = ?", id)
	respondWithData(c, http.StatusOK, item)
}

// DeleteTransitionItem deletes a transition item
func (h *TransitionHandler) DeleteTransitionItem(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid item ID")
		return
	}

	result := database.DB.Delete(&models.TransitionItem{}, "id = ?", id)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	if result.RowsAffected == 0 {
		respondWithError(c, http.StatusNotFound, "Item not found")
		return
	}

	respondWithSuccess(c, http.StatusOK, "Item deleted successfully", nil)
}

// Helper to create default transition items
func createDefaultTransitionItems(productID uuid.UUID) []models.TransitionItem {
	defaults := []struct {
		Category    models.TransitionCategory
		Name        string
		Description string
	}{
		// Sales
		{models.TransitionCategorySales, "Pitch Deck", "Customer-facing presentation"},
		{models.TransitionCategorySales, "FAQs Document", "Common questions and answers"},
		{models.TransitionCategorySales, "Pricing Guide", "Pricing tiers and packages"},
		{models.TransitionCategorySales, "Competitive Analysis", "Market positioning"},
		{models.TransitionCategorySales, "Case Studies", "Success stories from pilot"},
		// Tech
		{models.TransitionCategoryTech, "API Documentation", "Full API reference"},
		{models.TransitionCategoryTech, "Security Certifications", "SOC2, PCI-DSS compliance"},
		{models.TransitionCategoryTech, "Integration Guide", "Step-by-step integration"},
		{models.TransitionCategoryTech, "SDK/Libraries", "Client libraries published"},
		{models.TransitionCategoryTech, "Performance SLAs", "Uptime and latency guarantees"},
		// Ops
		{models.TransitionCategoryOps, "Support SOPs", "Standard operating procedures"},
		{models.TransitionCategoryOps, "Escalation Matrix", "L1/L2/L3 support paths"},
		{models.TransitionCategoryOps, "Runbooks", "Incident response procedures"},
		{models.TransitionCategoryOps, "Monitoring Dashboards", "Operational visibility"},
		{models.TransitionCategoryOps, "Training Materials", "Support team training"},
	}

	var items []models.TransitionItem
	for _, d := range defaults {
		item := models.TransitionItem{
			ProductID:   productID,
			Category:    d.Category,
			Name:        d.Name,
			Description: &d.Description,
			Complete:    false,
		}
		database.DB.Create(&item)
		items = append(items, item)
	}

	return items
}
