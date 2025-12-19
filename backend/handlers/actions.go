package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pauly7610/studio-pilot-vision/backend/database"
	"github.com/pauly7610/studio-pilot-vision/backend/models"
)

type ActionsHandler struct{}

func NewActionsHandler() *ActionsHandler {
	return &ActionsHandler{}
}

// GetProductActions retrieves all actions for a product
func (h *ActionsHandler) GetProductActions(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("productId"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	var actions []models.ProductAction
	result := database.DB.
		Where("product_id = ?", productID).
		Order("created_at DESC").
		Find(&actions)

	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, actions)
}

// GetAllActions retrieves all actions
func (h *ActionsHandler) GetAllActions(c *gin.Context) {
	var actions []models.ProductAction

	query := database.DB.Order("created_at DESC")

	// Optional filtering
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if priority := c.Query("priority"); priority != "" {
		query = query.Where("priority = ?", priority)
	}
	if actionType := c.Query("action_type"); actionType != "" {
		query = query.Where("action_type = ?", actionType)
	}

	result := query.Find(&actions)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, actions)
}

// GetAction retrieves a single action
func (h *ActionsHandler) GetAction(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid action ID")
		return
	}

	var action models.ProductAction
	result := database.DB.First(&action, "id = ?", id)

	if result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Action not found")
		return
	}

	respondWithData(c, http.StatusOK, action)
}

// CreateAction creates a new action
func (h *ActionsHandler) CreateAction(c *gin.Context) {
	var req models.CreateProductActionRequest
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

	action := models.ProductAction{
		ProductID:   req.ProductID,
		ActionType:  req.ActionType,
		Title:       req.Title,
		Description: req.Description,
		AssignedTo:  req.AssignedTo,
		DueDate:     req.DueDate,
	}

	if req.Status != nil {
		action.Status = *req.Status
	} else {
		action.Status = models.ActionStatusPending
	}

	if req.Priority != nil {
		action.Priority = *req.Priority
	} else {
		action.Priority = models.ActionPriorityMedium
	}

	// Get user from context if available
	if userID, exists := c.Get("userID"); exists {
		userIDStr := userID.(string)
		action.CreatedBy = &userIDStr
	}

	result := database.DB.Create(&action)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusCreated, action)
}

// UpdateAction updates an action
func (h *ActionsHandler) UpdateAction(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid action ID")
		return
	}

	var action models.ProductAction
	if result := database.DB.First(&action, "id = ?", id); result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Action not found")
		return
	}

	var req models.UpdateProductActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	updates := make(map[string]interface{})
	if req.ActionType != nil {
		updates["action_type"] = *req.ActionType
	}
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.AssignedTo != nil {
		updates["assigned_to"] = *req.AssignedTo
	}
	if req.Status != nil {
		updates["status"] = *req.Status
		// Auto-set completed_at when status changes to completed
		if *req.Status == models.ActionStatusCompleted && action.CompletedAt == nil {
			now := time.Now()
			updates["completed_at"] = now
		}
	}
	if req.Priority != nil {
		updates["priority"] = *req.Priority
	}
	if req.DueDate != nil {
		updates["due_date"] = *req.DueDate
	}
	if req.CompletedAt != nil {
		updates["completed_at"] = *req.CompletedAt
	}

	result := database.DB.Model(&action).Updates(updates)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	// Reload action
	database.DB.First(&action, "id = ?", id)
	respondWithData(c, http.StatusOK, action)
}

// DeleteAction deletes an action
func (h *ActionsHandler) DeleteAction(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid action ID")
		return
	}

	result := database.DB.Delete(&models.ProductAction{}, "id = ?", id)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	if result.RowsAffected == 0 {
		respondWithError(c, http.StatusNotFound, "Action not found")
		return
	}

	respondWithSuccess(c, http.StatusOK, "Action deleted successfully", nil)
}
