package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pauly7610/studio-pilot-vision/backend/database"
	"github.com/pauly7610/studio-pilot-vision/backend/models"
)

type ProductHandler struct{}

func NewProductHandler() *ProductHandler {
	return &ProductHandler{}
}

// GetProducts retrieves all products with related data
func (h *ProductHandler) GetProducts(c *gin.Context) {
	var products []models.Product

	result := database.DB.
		Preload("Readiness").
		Preload("Prediction").
		Preload("Compliance").
		Preload("MarketEvidence").
		Preload("Partners").
		Preload("Feedback").
		Preload("Dependencies").
		Order("created_at DESC").
		Find(&products)

	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, products)
}

// GetProduct retrieves a single product by ID with all related data
func (h *ProductHandler) GetProduct(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	var product models.Product
	result := database.DB.
		Preload("Readiness").
		Preload("Prediction").
		Preload("Compliance").
		Preload("MarketEvidence").
		Preload("Partners").
		Preload("Training").
		Preload("Feedback").
		Preload("Actions").
		Preload("Metrics").
		Preload("Dependencies").
		Preload("ReadinessHistory").
		First(&product, "id = ?", id)

	if result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Product not found")
		return
	}

	respondWithData(c, http.StatusOK, product)
}

// CreateProduct creates a new product
func (h *ProductHandler) CreateProduct(c *gin.Context) {
	var req models.CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	product := models.Product{
		Name:           req.Name,
		ProductType:    req.ProductType,
		Region:         req.Region,
		LifecycleStage: req.LifecycleStage,
		LaunchDate:     req.LaunchDate,
		RevenueTarget:  req.RevenueTarget,
		OwnerEmail:     req.OwnerEmail,
		SuccessMetric:  req.SuccessMetric,
		GovernanceTier: req.GovernanceTier,
		BudgetCode:     req.BudgetCode,
		PIIFlag:        req.PIIFlag,
	}

	if product.Region == "" {
		product.Region = "North America"
	}

	result := database.DB.Create(&product)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusCreated, product)
}

// UpdateProduct updates an existing product
func (h *ProductHandler) UpdateProduct(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	var product models.Product
	if result := database.DB.First(&product, "id = ?", id); result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Product not found")
		return
	}

	var req models.UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.ProductType != nil {
		updates["product_type"] = *req.ProductType
	}
	if req.Region != nil {
		updates["region"] = *req.Region
	}
	if req.LifecycleStage != nil {
		updates["lifecycle_stage"] = *req.LifecycleStage
	}
	if req.LaunchDate != nil {
		updates["launch_date"] = *req.LaunchDate
	}
	if req.RevenueTarget != nil {
		updates["revenue_target"] = *req.RevenueTarget
	}
	if req.OwnerEmail != nil {
		updates["owner_email"] = *req.OwnerEmail
	}
	if req.SuccessMetric != nil {
		updates["success_metric"] = *req.SuccessMetric
	}
	if req.GatingStatus != nil {
		updates["gating_status"] = *req.GatingStatus
	}
	if req.GovernanceTier != nil {
		updates["governance_tier"] = *req.GovernanceTier
	}
	if req.BudgetCode != nil {
		updates["budget_code"] = *req.BudgetCode
	}
	if req.PIIFlag != nil {
		updates["pii_flag"] = *req.PIIFlag
	}
	if req.BusinessSponsor != nil {
		updates["business_sponsor"] = *req.BusinessSponsor
	}
	if req.EngineeringLead != nil {
		updates["engineering_lead"] = *req.EngineeringLead
	}

	result := database.DB.Model(&product).Updates(updates)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	// Reload with associations
	database.DB.
		Preload("Readiness").
		Preload("Prediction").
		Preload("Compliance").
		Preload("Partners").
		First(&product, "id = ?", id)

	respondWithData(c, http.StatusOK, product)
}

// DeleteProduct deletes a product
func (h *ProductHandler) DeleteProduct(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	result := database.DB.Delete(&models.Product{}, "id = ?", id)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	if result.RowsAffected == 0 {
		respondWithError(c, http.StatusNotFound, "Product not found")
		return
	}

	respondWithSuccess(c, http.StatusOK, "Product deleted successfully", nil)
}

// GetProductsByRegion retrieves products filtered by region
func (h *ProductHandler) GetProductsByRegion(c *gin.Context) {
	region := c.Param("region")

	var products []models.Product
	result := database.DB.
		Preload("Readiness").
		Preload("Prediction").
		Where("region = ?", region).
		Order("created_at DESC").
		Find(&products)

	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, products)
}

// GetProductsByLifecycle retrieves products filtered by lifecycle stage
func (h *ProductHandler) GetProductsByLifecycle(c *gin.Context) {
	stage := c.Param("stage")

	var products []models.Product
	result := database.DB.
		Preload("Readiness").
		Preload("Prediction").
		Where("lifecycle_stage = ?", stage).
		Order("created_at DESC").
		Find(&products)

	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, products)
}

// GetProductsByRiskBand retrieves products filtered by risk band
func (h *ProductHandler) GetProductsByRiskBand(c *gin.Context) {
	riskBand := c.Param("riskBand")

	var products []models.Product
	result := database.DB.
		Joins("JOIN product_readiness ON product_readiness.product_id = products.id").
		Where("product_readiness.risk_band = ?", riskBand).
		Preload("Readiness").
		Preload("Prediction").
		Order("products.created_at DESC").
		Find(&products)

	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, products)
}
