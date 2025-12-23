package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pauly7610/studio-pilot-vision/backend/database"
	"github.com/pauly7610/studio-pilot-vision/backend/models"
)

type FeedbackHandler struct{}

func NewFeedbackHandler() *FeedbackHandler {
	return &FeedbackHandler{}
}

// GetProductFeedback retrieves all feedback for a product
func (h *FeedbackHandler) GetProductFeedback(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("productId"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	var feedback []models.ProductFeedback
	result := database.DB.
		Where("product_id = ?", productID).
		Order("created_at DESC").
		Find(&feedback)

	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, feedback)
}

// GetFeedback retrieves a single feedback entry
func (h *FeedbackHandler) GetFeedback(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid feedback ID")
		return
	}

	var feedback models.ProductFeedback
	result := database.DB.First(&feedback, "id = ?", id)

	if result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Feedback not found")
		return
	}

	respondWithData(c, http.StatusOK, feedback)
}

// CreateFeedback creates new feedback
func (h *FeedbackHandler) CreateFeedback(c *gin.Context) {
	var req models.CreateProductFeedbackRequest
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

	feedback := models.ProductFeedback{
		ProductID:      req.ProductID,
		Source:         req.Source,
		RawText:        req.RawText,
		Theme:          req.Theme,
		SentimentScore: req.SentimentScore,
		ImpactLevel:    req.ImpactLevel,
		Volume:         req.Volume,
	}

	result := database.DB.Create(&feedback)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusCreated, feedback)
}

// UpdateFeedback updates feedback
func (h *FeedbackHandler) UpdateFeedback(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid feedback ID")
		return
	}

	var feedback models.ProductFeedback
	if result := database.DB.First(&feedback, "id = ?", id); result.Error != nil {
		respondWithError(c, http.StatusNotFound, "Feedback not found")
		return
	}

	var req models.UpdateProductFeedbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	updates := make(map[string]interface{})
	if req.Source != nil {
		updates["source"] = *req.Source
	}
	if req.RawText != nil {
		updates["raw_text"] = *req.RawText
	}
	if req.Theme != nil {
		updates["theme"] = *req.Theme
	}
	if req.SentimentScore != nil {
		updates["sentiment_score"] = *req.SentimentScore
	}
	if req.ImpactLevel != nil {
		updates["impact_level"] = *req.ImpactLevel
	}
	if req.Volume != nil {
		updates["volume"] = *req.Volume
	}

	result := database.DB.Model(&feedback).Updates(updates)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, feedback)
}

// DeleteFeedback deletes feedback
func (h *FeedbackHandler) DeleteFeedback(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid feedback ID")
		return
	}

	result := database.DB.Delete(&models.ProductFeedback{}, "id = ?", id)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	if result.RowsAffected == 0 {
		respondWithError(c, http.StatusNotFound, "Feedback not found")
		return
	}

	respondWithSuccess(c, http.StatusOK, "Feedback deleted successfully", nil)
}

// GetAllFeedback retrieves all feedback with optional filtering
func (h *FeedbackHandler) GetAllFeedback(c *gin.Context) {
	var feedback []models.ProductFeedback

	query := database.DB.Order("created_at DESC")

	// Optional filtering
	if source := c.Query("source"); source != "" {
		query = query.Where("source = ?", source)
	}
	if theme := c.Query("theme"); theme != "" {
		query = query.Where("theme = ?", theme)
	}
	if impactLevel := c.Query("impact_level"); impactLevel != "" {
		query = query.Where("impact_level = ?", impactLevel)
	}

	result := query.Find(&feedback)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, feedback)
}

// GetFeedbackSummary returns aggregated feedback statistics
func (h *FeedbackHandler) GetFeedbackSummary(c *gin.Context) {
	type ThemeSummary struct {
		Theme        string  `json:"theme"`
		Count        int     `json:"count"`
		AvgSentiment float64 `json:"avg_sentiment"`
		TotalVolume  int     `json:"total_volume"`
	}

	var summaries []ThemeSummary
	result := database.DB.Model(&models.ProductFeedback{}).
		Select("theme, COUNT(*) as count, AVG(sentiment_score) as avg_sentiment, SUM(COALESCE(volume, 1)) as total_volume").
		Group("theme").
		Find(&summaries)

	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	respondWithData(c, http.StatusOK, summaries)
}

// GetMerchantSignal returns aggregated sentiment metrics for a product (Merchant Signal)
func (h *FeedbackHandler) GetMerchantSignal(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("productId"))
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid product ID")
		return
	}

	type MerchantSignalResponse struct {
		ProductID        string   `json:"product_id"`
		Status           string   `json:"status"` // positive, negative, neutral, no_data
		AverageSentiment float64  `json:"average_sentiment"`
		TotalFeedback    int64    `json:"total_feedback"`
		PositiveCount    int64    `json:"positive_count"`
		NegativeCount    int64    `json:"negative_count"`
		NeutralCount     int64    `json:"neutral_count"`
		HighImpactCount  int64    `json:"high_impact_count"`
		TopThemes        []string `json:"top_themes"`
		RecentTrend      string   `json:"recent_trend"` // improving, declining, stable
	}

	var feedback []models.ProductFeedback
	result := database.DB.
		Where("product_id = ?", productID).
		Order("created_at DESC").
		Find(&feedback)

	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, result.Error.Error())
		return
	}

	response := MerchantSignalResponse{
		ProductID: productID.String(),
		TopThemes: []string{},
	}

	if len(feedback) == 0 {
		response.Status = "no_data"
		response.RecentTrend = "stable"
		respondWithData(c, http.StatusOK, response)
		return
	}

	// Calculate metrics
	var totalSentiment float64
	themeCounts := make(map[string]int)

	for _, f := range feedback {
		score := 0.0
		if f.SentimentScore != nil {
			score = *f.SentimentScore
		}
		totalSentiment += score

		if score > 0.3 {
			response.PositiveCount++
		} else if score < -0.3 {
			response.NegativeCount++
		} else {
			response.NeutralCount++
		}

		if f.ImpactLevel != nil && *f.ImpactLevel == "HIGH" {
			response.HighImpactCount++
		}

		if f.Theme != nil && *f.Theme != "" {
			volume := 1
			if f.Volume != nil {
				volume = *f.Volume
			}
			themeCounts[*f.Theme] += volume
		}
	}

	response.TotalFeedback = int64(len(feedback))
	response.AverageSentiment = totalSentiment / float64(len(feedback))

	// Determine status
	if response.AverageSentiment > 0.2 {
		response.Status = "positive"
	} else if response.AverageSentiment < -0.2 {
		response.Status = "negative"
	} else {
		response.Status = "neutral"
	}

	// Calculate trend (compare recent half vs older half)
	midpoint := len(feedback) / 2
	if midpoint > 0 {
		var recentSum, olderSum float64
		for i, f := range feedback {
			score := 0.0
			if f.SentimentScore != nil {
				score = *f.SentimentScore
			}
			if i < midpoint {
				recentSum += score
			} else {
				olderSum += score
			}
		}
		recentAvg := recentSum / float64(midpoint)
		olderAvg := olderSum / float64(len(feedback)-midpoint)

		if recentAvg-olderAvg > 0.1 {
			response.RecentTrend = "improving"
		} else if recentAvg-olderAvg < -0.1 {
			response.RecentTrend = "declining"
		} else {
			response.RecentTrend = "stable"
		}
	} else {
		response.RecentTrend = "stable"
	}

	// Get top 3 themes
	type themeCount struct {
		theme string
		count int
	}
	var themes []themeCount
	for t, c := range themeCounts {
		themes = append(themes, themeCount{t, c})
	}
	// Sort by count descending
	for i := 0; i < len(themes); i++ {
		for j := i + 1; j < len(themes); j++ {
			if themes[j].count > themes[i].count {
				themes[i], themes[j] = themes[j], themes[i]
			}
		}
	}
	for i := 0; i < len(themes) && i < 3; i++ {
		response.TopThemes = append(response.TopThemes, themes[i].theme)
	}

	respondWithData(c, http.StatusOK, response)
}
