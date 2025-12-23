package database

import (
	"log"

	"github.com/pauly7610/studio-pilot-vision/backend/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect(databaseURL string) error {
	var err error
	DB, err = gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return err
	}

	log.Println("Database connection established")
	return nil
}

func Migrate() error {
	log.Println("Running database migrations...")

	err := DB.AutoMigrate(
		&models.Product{},
		&models.ProductReadiness{},
		&models.ProductMetric{},
		&models.ProductCompliance{},
		&models.ProductPartner{},
		&models.ProductFeedback{},
		&models.ProductPrediction{},
		&models.ProductMarketEvidence{},
		&models.SalesTraining{},
		&models.ProductAction{},
		&models.Profile{},
		&models.ProductDependency{},
		&models.ProductReadinessHistory{},
	)

	if err != nil {
		return err
	}

	log.Println("Database migrations completed")
	return nil
}

func Close() error {
	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}
