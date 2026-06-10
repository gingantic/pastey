package database

import (
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB is the global GORM database connection pool.
var DB *gorm.DB

// InitDB initializes the database connection pool using environment variables.
func InitDB() error {
	dbType := strings.ToLower(os.Getenv("DB_TYPE"))
	dbURL := os.Getenv("DATABASE_URL")

	if dbType == "" {
		dbType = "sqlite"
	}
	if dbURL == "" {
		dbURL = "pastey.db"
	}

	var dialector gorm.Dialector

	switch dbType {
	case "sqlite":
		dialector = sqlite.Open(dbURL)
	case "postgres":
		dialector = postgres.Open(dbURL)
	default:
		return fmt.Errorf("unsupported DB_TYPE: %s", dbType)
	}

	var err error
	DB, err = gorm.Open(dialector, &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return fmt.Errorf("failed to open database connection: %w", err)
	}

	log.Printf("Successfully connected to database of type: %s", dbType)
	return nil
}
