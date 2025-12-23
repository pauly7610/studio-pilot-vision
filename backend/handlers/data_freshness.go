package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pauly7610/studio-pilot-vision/backend/database"
	"github.com/pauly7610/studio-pilot-vision/backend/models"
)

type DataFreshnessHandler struct{}

func NewDataFreshnessHandler() *DataFreshnessHandler {
	return &DataFreshnessHandler{}
}

type FreshnessStatus string

const (
	FreshnessStatusSynced   FreshnessStatus = "synced"
	FreshnessStatusFresh    FreshnessStatus = "fresh"
	FreshnessStatusStale    FreshnessStatus = "stale"
	FreshnessStatusOutdated FreshnessStatus = "outdated"
)

type DataFreshnessResponse struct {
	ProductID             string          `json:"product_id"`
	Status                FreshnessStatus `json:"status"`
	StatusLabel           string          `json:"status_label"`
	LastUpdated           string          `json:"last_updated"`
	LastUpdatedAgo        string          `json:"last_updated_ago"`
	DataContractComplete  bool            `json:"data_contract_complete"`
	MandatoryFieldsFilled int             `json:"mandatory_fields_filled"`
	TotalMandatoryFields  int             `json:"total_mandatory_fields"`
	ContractPercent       int             `json:"contract_percent"`
	Message               string          `json:"message"`
}

func getFreshnessStatus(lastUpdated time.Time, contractComplete bool) FreshnessStatus {
	if contractComplete {
		return FreshnessStatusSynced
	}

	hoursSince := time.Since(lastUpdated).Hours()
	if hoursSince < 24 {
		return FreshnessStatusFresh
	}
	if hoursSince < 72 {
		return FreshnessStatusStale
	}
	return FreshnessStatusOutdated
}

func getStatusLabel(status FreshnessStatus) string {
	switch status {
	case FreshnessStatusSynced:
		return "Central Sync Complete"
	case FreshnessStatusFresh:
		return "Data Fresh"
	case FreshnessStatusStale:
		return "Data Stale"
	default:
		return "Update Required"
	}
}

func getStatusMessage(status FreshnessStatus) string {
	switch status {
	case FreshnessStatusSynced:
		return "Data Contract fulfilled — no manual status requests needed"
	case FreshnessStatusFresh:
		return "Recently updated, data is current"
	case FreshnessStatusStale:
		return "Data may be outdated, consider refreshing"
	default:
		return "Data is outdated, update needed"
	}
}

func formatTimeAgo(t time.Time) string {
	d := time.Since(t)
	if d < time.Hour {
		return "just now"
	}
	if d < 24*time.Hour {
		hours := int(d.Hours())
		if hours == 1 {
			return "1 hour ago"
		}
		return string(rune(hours)) + " hours ago"
	}
	days := int(d.Hours() / 24)
	if days == 1 {
		return "1 day ago"
	}
	return string(rune(days)) + " days ago"
}

// GetProductDataFreshness returns data freshness status for a product
func (h *DataFreshnessHandler) GetProductDataFreshness(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("productId"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	var product models.Product
	result := database.DB.First(&product, "id = ?", productID)
	if result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Product not found")
		return
	}

	// Count mandatory fields filled
	mandatoryFields := []bool{
		product.OwnerEmail != "",
		product.Region != "",
		product.BudgetCode != nil && *product.BudgetCode != "",
		product.PIIFlag != nil,
		product.GatingStatus != nil && *product.GatingStatus != "",
		product.SuccessMetric != nil && *product.SuccessMetric != "",
	}

	filled := 0
	for _, f := range mandatoryFields {
		if f {
			filled++
		}
	}

	totalFields := len(mandatoryFields)
	contractComplete := filled == totalFields
	contractPercent := (filled * 100) / totalFields

	status := getFreshnessStatus(product.UpdatedAt, contractComplete)

	response := DataFreshnessResponse{
		ProductID:             productID.String(),
		Status:                status,
		StatusLabel:           getStatusLabel(status),
		LastUpdated:           product.UpdatedAt.Format(time.RFC3339),
		LastUpdatedAgo:        formatTimeAgo(product.UpdatedAt),
		DataContractComplete:  contractComplete,
		MandatoryFieldsFilled: filled,
		TotalMandatoryFields:  totalFields,
		ContractPercent:       contractPercent,
		Message:               getStatusMessage(status),
	}

	respondWithData(c, http.StatusOK, response)
}

// GetAllDataFreshness returns data freshness for all products
func (h *DataFreshnessHandler) GetAllDataFreshness(c *gin.Context) {
	var products []models.Product
	result := database.DB.Find(&products)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	var responses []DataFreshnessResponse

	for _, product := range products {
		mandatoryFields := []bool{
			product.OwnerEmail != "",
			product.Region != "",
			product.BudgetCode != nil && *product.BudgetCode != "",
			product.PIIFlag != nil,
			product.GatingStatus != nil && *product.GatingStatus != "",
			product.SuccessMetric != nil && *product.SuccessMetric != "",
		}

		filled := 0
		for _, f := range mandatoryFields {
			if f {
				filled++
			}
		}

		totalFields := len(mandatoryFields)
		contractComplete := filled == totalFields
		contractPercent := (filled * 100) / totalFields

		status := getFreshnessStatus(product.UpdatedAt, contractComplete)

		responses = append(responses, DataFreshnessResponse{
			ProductID:             product.ID.String(),
			Status:                status,
			StatusLabel:           getStatusLabel(status),
			LastUpdated:           product.UpdatedAt.Format(time.RFC3339),
			LastUpdatedAgo:        formatTimeAgo(product.UpdatedAt),
			DataContractComplete:  contractComplete,
			MandatoryFieldsFilled: filled,
			TotalMandatoryFields:  totalFields,
			ContractPercent:       contractPercent,
			Message:               getStatusMessage(status),
		})
	}

	respondWithData(c, http.StatusOK, responses)
}

// GetDataFreshnessSummary returns summary of data freshness across all products
func (h *DataFreshnessHandler) GetDataFreshnessSummary(c *gin.Context) {
	var products []models.Product
	result := database.DB.Find(&products)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	type Summary struct {
		TotalProducts       int `json:"total_products"`
		SyncedCount         int `json:"synced_count"`
		FreshCount          int `json:"fresh_count"`
		StaleCount          int `json:"stale_count"`
		OutdatedCount       int `json:"outdated_count"`
		AvgContractPercent  int `json:"avg_contract_percent"`
		FullyCompliantCount int `json:"fully_compliant_count"`
	}

	summary := Summary{TotalProducts: len(products)}
	totalPercent := 0

	for _, product := range products {
		mandatoryFields := []bool{
			product.OwnerEmail != "",
			product.Region != "",
			product.BudgetCode != nil && *product.BudgetCode != "",
			product.PIIFlag != nil,
			product.GatingStatus != nil && *product.GatingStatus != "",
			product.SuccessMetric != nil && *product.SuccessMetric != "",
		}

		filled := 0
		for _, f := range mandatoryFields {
			if f {
				filled++
			}
		}

		totalFields := len(mandatoryFields)
		contractComplete := filled == totalFields
		contractPercent := (filled * 100) / totalFields
		totalPercent += contractPercent

		if contractComplete {
			summary.FullyCompliantCount++
		}

		status := getFreshnessStatus(product.UpdatedAt, contractComplete)
		switch status {
		case FreshnessStatusSynced:
			summary.SyncedCount++
		case FreshnessStatusFresh:
			summary.FreshCount++
		case FreshnessStatusStale:
			summary.StaleCount++
		case FreshnessStatusOutdated:
			summary.OutdatedCount++
		}
	}

	if len(products) > 0 {
		summary.AvgContractPercent = totalPercent / len(products)
	}

	respondWithData(c, http.StatusOK, summary)
}
