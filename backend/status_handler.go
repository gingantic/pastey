package main

import (
	"encoding/json"
	"net/http"
	"time"

	"pastey/backend/auth"
	"pastey/backend/database"
	"pastey/backend/pastes"
)

// StatusResponse defines the JSON response structure for the status endpoint.
type StatusResponse struct {
	Status    string           `json:"status"`
	Message   string           `json:"message"`
	Timestamp time.Time        `json:"timestamp"`
	Stats     map[string]int64 `json:"stats"`
}

// GetStatus returns system metrics and database statistics.
func GetStatus(w http.ResponseWriter, r *http.Request) {
	var userCount int64
	var pasteCount int64

	// Retrieve counts from database if connected
	if database.DB != nil {
		database.DB.Model(&auth.User{}).Count(&userCount)
		database.DB.Model(&pastes.Paste{}).Count(&pasteCount)
	}

	response := StatusResponse{
		Status:    "healthy",
		Message:   "Welcome to Pastey.",
		Timestamp: time.Now(),
		Stats: map[string]int64{
			"total_users":  userCount,
			"total_pastes": pasteCount,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(response)
}
