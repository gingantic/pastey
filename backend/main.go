package main

import (
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"pastey/backend/auth"
	"pastey/backend/database"
	"pastey/backend/pastes"
)

func main() {
	// Load .env file (optional, falls back to environment variables)
	if err := godotenv.Load(); err != nil {
		log.Println("Note: No .env file found, relying on environment variables")
	}

	// Initialize database
	if err := database.InitDB(); err != nil {
		log.Fatalf("Database initialization failed: %v", err)
	}

	// Run migrations
	log.Println("Running database migrations...")
	err := database.DB.AutoMigrate(
		&auth.User{},
		&auth.RefreshToken{},
		&pastes.Paste{},
	)
	if err != nil {
		log.Fatalf("Migration failed: %v", err)
	}
	log.Println("Database migration completed successfully.")

	// If there are users but no admins, promote the oldest user to admin
	var adminCount int64
	if err := database.DB.Model(&auth.User{}).Where("is_admin = ?", true).Count(&adminCount).Error; err == nil && adminCount == 0 {
		var oldestUser auth.User
		if err := database.DB.Order("created_at ASC").First(&oldestUser).Error; err == nil {
			oldestUser.IsAdmin = true
			if err := database.DB.Save(&oldestUser).Error; err == nil {
				log.Printf("[BOOTSTRAP] Promoted first user '%s' (%s) to Admin because no admin existed.", oldestUser.Username, oldestUser.Email)
			} else {
				log.Printf("[BOOTSTRAP] Failed to promote first user: %v", err)
			}
		}
	}

	// Set up router
	r := setupRouter()

	// Server start
	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}

	log.Printf("Pastey Backend starting on port %s...", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
