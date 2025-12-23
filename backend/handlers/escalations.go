package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pauly7610/studio-pilot-vision/backend/database"
	"github.com/pauly7610/studio-pilot-vision/backend/models"
)

type EscalationsHandler struct{}

func NewEscalationsHandler() *EscalationsHandler {
	return &EscalationsHandler{}
}

// CalculateEscalationLevel determines escalation based on product status
func calculateEscalationLevel(riskBand string, cyclesInStatus int, gatingStatus string) models.EscalationLevel {
	isHighRisk := riskBand == "high"
	isMediumRisk := riskBand == "medium"

	// Critical: High risk for 3+ cycles
	if isHighRisk && cyclesInStatus >= 3 {
		return models.EscalationLevelCritical
	}

	// Exec SteerCo: High risk for 2 cycles
	if isHighRisk && cyclesInStatus >= 2 {
		return models.EscalationLevelExecSteerCo
	}

	// Ambassador Review: Medium risk for 2+ cycles
	if isMediumRisk && cyclesInStatus >= 2 {
		return models.EscalationLevelAmbassadorReview
	}

	// Ambassador Review: Legal/Privacy bottleneck
	if gatingStatus == "Regional Legal" || gatingStatus == "PII/Privacy Review" {
		return models.EscalationLevelAmbassadorReview
	}

	return models.EscalationLevelNone
}

func getEscalationConfig(level models.EscalationLevel) (string, string, string) {
	switch level {
	case models.EscalationLevelAmbassadorReview:
		return "⚠️ Ambassador Deep Dive", "Schedule review with Studio Ambassador", "Studio Ambassador"
	case models.EscalationLevelExecSteerCo:
		return "🚨 Exec SteerCo", "Escalate to Executive Steering Committee", "VP Product"
	case models.EscalationLevelCritical:
		return "🔴 Critical Intervention", "Immediate executive intervention required", "VP Product + Regional VP"
	default:
		return "On Track", "Continue monitoring", "Regional Lead"
	}
}

func getNextMilestone(lifecycleStage string, riskBand string) string {
	if riskBand == "high" {
		return "Risk Mitigation Plan Due"
	}

	switch lifecycleStage {
	case "concept":
		return "Business Case Approval"
	case "early_pilot":
		return "Pilot Launch Gate"
	case "pilot":
		return "Commercial Readiness Review"
	case "commercial":
		return "Scale Decision"
	case "sunset":
		return "Sunset Completion"
	default:
		return "Next Gate Review"
	}
}

// GetProductEscalation calculates and returns escalation status for a product
func (h *EscalationsHandler) GetProductEscalation(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("productId"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	var product models.Product
	result := database.DB.
		Preload("Readiness").
		First(&product, "id = ?", productID)

	if result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Product not found")
		return
	}

	// Calculate cycles in status based on gating_status_since
	cyclesInStatus := 0
	if product.GatingStatusSince != nil {
		weeks := int(time.Since(*product.GatingStatusSince).Hours() / (24 * 7))
		cyclesInStatus = weeks / 2 // 2 weeks per cycle
	}

	riskBand := "medium"
	if product.Readiness != nil {
		riskBand = string(product.Readiness.RiskBand)
	}

	gatingStatus := ""
	if product.GatingStatus != nil {
		gatingStatus = *product.GatingStatus
	}

	level := calculateEscalationLevel(riskBand, cyclesInStatus, gatingStatus)
	label, action, owner := getEscalationConfig(level)
	nextMilestone := getNextMilestone(string(product.LifecycleStage), riskBand)

	response := models.EscalationResponse{
		ProductID:      productID.String(),
		Level:          string(level),
		Label:          label,
		Action:         action,
		Owner:          owner,
		NextMilestone:  nextMilestone,
		CyclesInStatus: cyclesInStatus,
		RequiresAction: level != models.EscalationLevelNone,
	}

	respondWithData(c, http.StatusOK, response)
}

// GetAllEscalations returns all products with active escalations
func (h *EscalationsHandler) GetAllEscalations(c *gin.Context) {
	var products []models.Product
	result := database.DB.
		Preload("Readiness").
		Find(&products)

	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	var escalations []models.EscalationResponse

	for _, product := range products {
		cyclesInStatus := 0
		if product.GatingStatusSince != nil {
			weeks := int(time.Since(*product.GatingStatusSince).Hours() / (24 * 7))
			cyclesInStatus = weeks / 2
		}

		riskBand := "medium"
		if product.Readiness != nil {
			riskBand = string(product.Readiness.RiskBand)
		}

		gatingStatus := ""
		if product.GatingStatus != nil {
			gatingStatus = *product.GatingStatus
		}

		level := calculateEscalationLevel(riskBand, cyclesInStatus, gatingStatus)

		// Only include products with escalations
		if level == models.EscalationLevelNone {
			continue
		}

		label, action, owner := getEscalationConfig(level)
		nextMilestone := getNextMilestone(string(product.LifecycleStage), riskBand)

		escalations = append(escalations, models.EscalationResponse{
			ProductID:      product.ID.String(),
			Level:          string(level),
			Label:          label,
			Action:         action,
			Owner:          owner,
			NextMilestone:  nextMilestone,
			CyclesInStatus: cyclesInStatus,
			RequiresAction: true,
		})
	}

	respondWithData(c, http.StatusOK, escalations)
}

// GetEscalationSummary returns summary stats for escalations
func (h *EscalationsHandler) GetEscalationSummary(c *gin.Context) {
	var products []models.Product
	result := database.DB.
		Preload("Readiness").
		Find(&products)

	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	type Summary struct {
		TotalProducts    int `json:"total_products"`
		OnTrack          int `json:"on_track"`
		AmbassadorReview int `json:"ambassador_review"`
		ExecSteerCo      int `json:"exec_steerco"`
		Critical         int `json:"critical"`
		RequiresAction   int `json:"requires_action"`
	}

	summary := Summary{TotalProducts: len(products)}

	for _, product := range products {
		cyclesInStatus := 0
		if product.GatingStatusSince != nil {
			weeks := int(time.Since(*product.GatingStatusSince).Hours() / (24 * 7))
			cyclesInStatus = weeks / 2
		}

		riskBand := "medium"
		if product.Readiness != nil {
			riskBand = string(product.Readiness.RiskBand)
		}

		gatingStatus := ""
		if product.GatingStatus != nil {
			gatingStatus = *product.GatingStatus
		}

		level := calculateEscalationLevel(riskBand, cyclesInStatus, gatingStatus)

		switch level {
		case models.EscalationLevelNone:
			summary.OnTrack++
		case models.EscalationLevelAmbassadorReview:
			summary.AmbassadorReview++
			summary.RequiresAction++
		case models.EscalationLevelExecSteerCo:
			summary.ExecSteerCo++
			summary.RequiresAction++
		case models.EscalationLevelCritical:
			summary.Critical++
			summary.RequiresAction++
		}
	}

	respondWithData(c, http.StatusOK, summary)
}
