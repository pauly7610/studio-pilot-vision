package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/pauly7610/studio-pilot-vision/backend/config"
	"github.com/pauly7610/studio-pilot-vision/backend/handlers"
	"github.com/pauly7610/studio-pilot-vision/backend/middleware"
)

func SetupRouter(cfg *config.Config) *gin.Engine {
	router := gin.Default()

	// Middleware
	router.Use(middleware.CORS(cfg.CORSOrigins))

	// Initialize handlers
	productHandler := handlers.NewProductHandler()
	metricsHandler := handlers.NewMetricsHandler()
	readinessHandler := handlers.NewReadinessHandler()
	complianceHandler := handlers.NewComplianceHandler()
	partnersHandler := handlers.NewPartnersHandler()
	feedbackHandler := handlers.NewFeedbackHandler()
	predictionsHandler := handlers.NewPredictionsHandler()
	actionsHandler := handlers.NewActionsHandler()
	trainingHandler := handlers.NewTrainingHandler()
	marketEvidenceHandler := handlers.NewMarketEvidenceHandler()
	profilesHandler := handlers.NewProfilesHandler()
	dependenciesHandler := handlers.NewDependenciesHandler()

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "studio-pilot-vision-api"})
	})

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Public routes (with optional auth)
		public := v1.Group("")
		public.Use(middleware.OptionalAuth(cfg.JWTSecret))
		{
			// Products
			public.GET("/products", productHandler.GetProducts)
			public.GET("/products/:id", productHandler.GetProduct)
			public.GET("/products/region/:region", productHandler.GetProductsByRegion)
			public.GET("/products/lifecycle/:stage", productHandler.GetProductsByLifecycle)
			public.GET("/products/risk/:riskBand", productHandler.GetProductsByRiskBand)

			// Metrics
			public.GET("/metrics", metricsHandler.GetAllMetrics)
			public.GET("/metrics/:id", metricsHandler.GetMetric)
			public.GET("/products/:productId/metrics", metricsHandler.GetProductMetrics)

			// Readiness
			public.GET("/readiness", readinessHandler.GetAllReadiness)
			public.GET("/products/:productId/readiness", readinessHandler.GetProductReadiness)

			// Compliance
			public.GET("/compliance", complianceHandler.GetAllCompliance)
			public.GET("/compliance/:id", complianceHandler.GetCompliance)
			public.GET("/products/:productId/compliance", complianceHandler.GetProductCompliance)

			// Partners
			public.GET("/partners", partnersHandler.GetAllPartners)
			public.GET("/partners/:id", partnersHandler.GetPartner)
			public.GET("/products/:productId/partners", partnersHandler.GetProductPartners)

			// Feedback
			public.GET("/feedback", feedbackHandler.GetAllFeedback)
			public.GET("/feedback/:id", feedbackHandler.GetFeedback)
			public.GET("/feedback/summary", feedbackHandler.GetFeedbackSummary)
			public.GET("/products/:productId/feedback", feedbackHandler.GetProductFeedback)

			// Predictions
			public.GET("/predictions", predictionsHandler.GetAllPredictions)
			public.GET("/products/:productId/predictions", predictionsHandler.GetProductPrediction)
			public.GET("/products/:productId/predictions/history", predictionsHandler.GetProductPredictionHistory)

			// Actions
			public.GET("/actions", actionsHandler.GetAllActions)
			public.GET("/actions/:id", actionsHandler.GetAction)
			public.GET("/products/:productId/actions", actionsHandler.GetProductActions)

			// Training
			public.GET("/training", trainingHandler.GetAllTraining)
			public.GET("/products/:productId/training", trainingHandler.GetProductTraining)

			// Market Evidence
			public.GET("/market-evidence", marketEvidenceHandler.GetAllMarketEvidence)
			public.GET("/products/:productId/market-evidence", marketEvidenceHandler.GetProductMarketEvidence)

			// Dependencies
			public.GET("/dependencies", dependenciesHandler.GetAllDependencies)
			public.GET("/dependencies/blocked", dependenciesHandler.GetBlockedDependencies)
			public.GET("/dependencies/summary", dependenciesHandler.GetDependencySummary)
			public.GET("/products/:productId/dependencies", dependenciesHandler.GetProductDependencies)

			// Profiles
			public.GET("/profiles", profilesHandler.GetAllProfiles)
			public.GET("/profiles/:id", profilesHandler.GetProfile)
			public.GET("/profiles/:id/is-admin", profilesHandler.IsAdmin)
		}

		// Protected routes (require auth)
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
		{
			// Current user profile
			protected.GET("/me", profilesHandler.GetCurrentProfile)

			// Feedback (users can create)
			protected.POST("/feedback", feedbackHandler.CreateFeedback)

			// Actions (users can create and update their own)
			protected.POST("/actions", actionsHandler.CreateAction)
			protected.PUT("/actions/:id", actionsHandler.UpdateAction)
			protected.PATCH("/actions/:id", actionsHandler.UpdateAction)
		}

		// Admin routes (require admin role)
		admin := v1.Group("")
		admin.Use(middleware.AuthMiddleware(cfg.JWTSecret))
		admin.Use(middleware.AdminOnly())
		{
			// Products management
			admin.POST("/products", productHandler.CreateProduct)
			admin.PUT("/products/:id", productHandler.UpdateProduct)
			admin.PATCH("/products/:id", productHandler.UpdateProduct)
			admin.DELETE("/products/:id", productHandler.DeleteProduct)

			// Metrics management
			admin.POST("/metrics", metricsHandler.CreateMetric)
			admin.PUT("/metrics/:id", metricsHandler.UpdateMetric)
			admin.PATCH("/metrics/:id", metricsHandler.UpdateMetric)
			admin.DELETE("/metrics/:id", metricsHandler.DeleteMetric)

			// Readiness management
			admin.POST("/products/:productId/readiness", readinessHandler.CreateOrUpdateReadiness)
			admin.PUT("/readiness/:id", readinessHandler.UpdateReadiness)
			admin.PATCH("/readiness/:id", readinessHandler.UpdateReadiness)
			admin.DELETE("/readiness/:id", readinessHandler.DeleteReadiness)

			// Compliance management
			admin.POST("/compliance", complianceHandler.CreateCompliance)
			admin.PUT("/compliance/:id", complianceHandler.UpdateCompliance)
			admin.PATCH("/compliance/:id", complianceHandler.UpdateCompliance)
			admin.DELETE("/compliance/:id", complianceHandler.DeleteCompliance)

			// Partners management
			admin.POST("/partners", partnersHandler.CreatePartner)
			admin.PUT("/partners/:id", partnersHandler.UpdatePartner)
			admin.PATCH("/partners/:id", partnersHandler.UpdatePartner)
			admin.DELETE("/partners/:id", partnersHandler.DeletePartner)

			// Feedback management
			admin.PUT("/feedback/:id", feedbackHandler.UpdateFeedback)
			admin.PATCH("/feedback/:id", feedbackHandler.UpdateFeedback)
			admin.DELETE("/feedback/:id", feedbackHandler.DeleteFeedback)

			// Predictions management
			admin.POST("/predictions", predictionsHandler.CreatePrediction)
			admin.PUT("/predictions/:id", predictionsHandler.UpdatePrediction)
			admin.PATCH("/predictions/:id", predictionsHandler.UpdatePrediction)
			admin.DELETE("/predictions/:id", predictionsHandler.DeletePrediction)

			// Actions management
			admin.DELETE("/actions/:id", actionsHandler.DeleteAction)

			// Training management
			admin.POST("/products/:productId/training", trainingHandler.CreateOrUpdateTraining)
			admin.DELETE("/training/:id", trainingHandler.DeleteTraining)

			// Market Evidence management
			admin.POST("/market-evidence", marketEvidenceHandler.CreateMarketEvidence)
			admin.PUT("/market-evidence/:id", marketEvidenceHandler.UpdateMarketEvidence)
			admin.PATCH("/market-evidence/:id", marketEvidenceHandler.UpdateMarketEvidence)
			admin.DELETE("/market-evidence/:id", marketEvidenceHandler.DeleteMarketEvidence)

			// Dependencies management
			admin.POST("/dependencies", dependenciesHandler.CreateDependency)
			admin.PUT("/dependencies/:id", dependenciesHandler.UpdateDependency)
			admin.PATCH("/dependencies/:id", dependenciesHandler.UpdateDependency)
			admin.DELETE("/dependencies/:id", dependenciesHandler.DeleteDependency)

			// Profiles management
			admin.POST("/profiles", profilesHandler.CreateProfile)
			admin.PUT("/profiles/:id", profilesHandler.UpdateProfile)
			admin.PATCH("/profiles/:id", profilesHandler.UpdateProfile)
		}
	}

	return router
}
