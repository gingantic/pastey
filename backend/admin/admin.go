package admin

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"pastey/backend/auth"
	"pastey/backend/database"
	"pastey/backend/pastes"
	"pastey/backend/shared"
)

type AdminUserResponse struct {
	ID         string    `json:"id"`
	Username   string    `json:"username"`
	Email      string    `json:"email"`
	IsAdmin    bool      `json:"is_admin"`
	CreatedAt  time.Time `json:"created_at"`
	PasteCount int64     `json:"paste_count"`
}

type UserListResponse struct {
	Users []AdminUserResponse `json:"users"`
	Total int64               `json:"total"`
}

func respondWithError(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}

func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(payload)
}

// ListUsers returns all users in the system, paginated and searchable.
func ListUsers(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	limit, _ := strconv.Atoi(query.Get("limit"))
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	offset, _ := strconv.Atoi(query.Get("offset"))
	if offset < 0 {
		offset = 0
	}
	search := query.Get("search")

	var users []auth.User
	var total int64

	db := database.DB.Model(&auth.User{})
	if search != "" {
		searchTerm := "%" + strings.ToLower(search) + "%"
		db = db.Where("LOWER(username) LIKE ? OR LOWER(email) LIKE ?", searchTerm, searchTerm)
	}

	if err := db.Count(&total).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to count users")
		return
	}

	if err := db.Order("created_at DESC").Limit(limit).Offset(offset).Find(&users).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to fetch users")
		return
	}

	var responseUsers []AdminUserResponse
	for _, u := range users {
		var pasteCount int64
		database.DB.Model(&pastes.Paste{}).Where("author_id = ?", u.ID).Count(&pasteCount)

		responseUsers = append(responseUsers, AdminUserResponse{
			ID:         u.ID.String(),
			Username:   u.Username,
			Email:      u.Email,
			IsAdmin:    u.IsAdmin,
			CreatedAt:  u.CreatedAt,
			PasteCount: pasteCount,
		})
	}

	respondWithJSON(w, http.StatusOK, &UserListResponse{Users: responseUsers, Total: total})
}

// ToggleAdmin changes the admin status of a user.
func ToggleAdmin(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		respondWithError(w, http.StatusBadRequest, "missing user ID")
		return
	}

	// Prevent self-lockout
	currentUser, ok := shared.UserFromContext(r.Context())
	if ok && currentUser != nil && currentUser.UserID == id {
		respondWithError(w, http.StatusBadRequest, "cannot toggle your own admin status")
		return
	}

	var user auth.User
	if err := database.DB.First(&user, "id = ?", id).Error; err != nil {
		respondWithError(w, http.StatusNotFound, "user not found")
		return
	}

	user.IsAdmin = !user.IsAdmin
	if err := database.DB.Save(&user).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to update user admin status")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message":  "user admin status updated",
		"is_admin": user.IsAdmin,
	})
}

// DeleteUser removes a user, their refresh tokens, and their pastes.
func DeleteUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		respondWithError(w, http.StatusBadRequest, "missing user ID")
		return
	}

	// Prevent self-deletion
	currentUser, ok := shared.UserFromContext(r.Context())
	if ok && currentUser != nil && currentUser.UserID == id {
		respondWithError(w, http.StatusBadRequest, "cannot delete your own account from the admin panel")
		return
	}

	var user auth.User
	if err := database.DB.First(&user, "id = ?", id).Error; err != nil {
		respondWithError(w, http.StatusNotFound, "user not found")
		return
	}

	// Delete user's pastes
	if err := database.DB.Where("author_id = ?", user.ID).Delete(&pastes.Paste{}).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to delete user's pastes")
		return
	}

	// Delete user's refresh tokens
	database.DB.Where("user_id = ?", user.ID).Delete(&auth.RefreshToken{})

	// Delete the user
	if err := database.DB.Delete(&user).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to delete user")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "user and their pastes deleted successfully"})
}

type AdminPasteListResponse struct {
	Pastes []pastes.Paste `json:"pastes"`
	Total  int64          `json:"total"`
}

// ListPastes returns all pastes (public, unlisted, private) in the system, paginated and searchable.
func ListPastes(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	limit, _ := strconv.Atoi(query.Get("limit"))
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	offset, _ := strconv.Atoi(query.Get("offset"))
	if offset < 0 {
		offset = 0
	}
	search := query.Get("search")

	var userPastes []pastes.Paste
	var total int64

	db := database.DB.Model(&pastes.Paste{})
	if search != "" {
		searchTerm := "%" + strings.ToLower(search) + "%"
		db = db.Where("LOWER(title) LIKE ? OR LOWER(content) LIKE ? OR LOWER(author_name) LIKE ?", searchTerm, searchTerm, searchTerm)
	}

	if err := db.Count(&total).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to count pastes")
		return
	}

	if err := db.Order("created_at DESC").Limit(limit).Offset(offset).Find(&userPastes).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to fetch pastes")
		return
	}

	respondWithJSON(w, http.StatusOK, &AdminPasteListResponse{Pastes: userPastes, Total: total})
}
