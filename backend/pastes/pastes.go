package pastes

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"pastey/backend/database"
	"pastey/backend/shared"
)

// ── Request / Response Types ──────────────────────────────────────────────────

// CreateRequest is the payload for POST /pastes.
type CreateRequest struct {
	Title      string `json:"title"`
	Content    string `json:"content"`
	Lang       string `json:"lang"`
	Expiry     string `json:"expiry"`
	Visibility string `json:"visibility"`
}

// UpdateRequest is the payload for PUT /pastes/:id.
type UpdateRequest struct {
	Title      string `json:"title"`
	Content    string `json:"content"`
	Lang       string `json:"lang"`
	Expiry     string `json:"expiry"`
	Visibility string `json:"visibility"`
}

// ListResponse wraps a paginated list of pastes.
type ListResponse struct {
	Pastes []Paste `json:"pastes"`
	Total  int64   `json:"total"`
}

// ── Internal Helpers ──────────────────────────────────────────────────────────

// randomID generates a 12-char hex string for use as a paste ID.
func randomID() string {
	b := make([]byte, 6)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

// validVisibility ensures only accepted values pass through.
func validVisibility(v string) string {
	switch v {
	case "public", "unlisted", "private":
		return v
	default:
		return "public"
	}
}

// validLang falls back to plaintext for empty values.
func validLang(l string) string {
	if strings.TrimSpace(l) == "" {
		return "plaintext"
	}
	return l
}

// expiresAt translates a human-readable expiry string to a concrete timestamp.
// Returns nil for "never".
func expiresAt(expiry string) *time.Time {
	var d time.Duration
	switch expiry {
	case "10m":
		d = 10 * time.Minute
	case "1h":
		d = time.Hour
	case "1d":
		d = 24 * time.Hour
	case "1w":
		d = 7 * 24 * time.Hour
	case "1mo":
		d = 30 * 24 * time.Hour
	default:
		return nil // "never" or unknown
	}
	t := time.Now().Add(d)
	return &t
}

// authContext extracts optional auth identity using the request context.
// Works on both public and auth endpoints — returns nil uid for unauthenticated requests.
func authContext(ctx context.Context) (uid *uuid.UUID, username string) {
	userData, ok := shared.UserFromContext(ctx)
	if !ok || userData == nil {
		return nil, "Anonymous"
	}
	parsed, err := uuid.Parse(userData.UserID)
	if err != nil {
		return nil, "Anonymous"
	}
	return &parsed, userData.Username
}

// respondWithError helper writes a JSON error response.
func respondWithError(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}

// respondWithJSON helper writes a JSON success response.
func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(payload)
}

// ── Handlers ──────────────────────────────────────────────────────────────────

// ListPastes returns recent public pastes with pagination support.
func ListPastes(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	limitVal := query.Get("limit")
	offsetVal := query.Get("offset")

	limit, err := strconv.Atoi(limitVal)
	if err != nil || limit <= 0 || limit > 50 {
		limit = 20
	}

	offset, _ := strconv.Atoi(offsetVal)
	if offset < 0 {
		offset = 0
	}

	base := database.DB.Model(&Paste{}).
		Where("visibility = ? AND (expires_at IS NULL OR expires_at > ?)", "public", time.Now())

	var total int64
	if err := base.Count(&total).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to count pastes")
		return
	}

	var pastes []Paste
	if err := base.Order("created_at DESC").Limit(limit).Offset(offset).Find(&pastes).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to fetch pastes")
		return
	}

	respondWithJSON(w, http.StatusOK, &ListResponse{Pastes: pastes, Total: total})
}

// CreatePaste creates a new paste. Works for both anonymous and authenticated users.
// If a valid Bearer token is present, the paste is linked to that user account.
func CreatePaste(w http.ResponseWriter, r *http.Request) {
	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if strings.TrimSpace(req.Content) == "" {
		respondWithError(w, http.StatusBadRequest, "content cannot be empty")
		return
	}

	uid, username := authContext(r.Context())

	paste := &Paste{
		ID:         randomID(),
		Title:      req.Title,
		Content:    req.Content,
		Lang:       validLang(req.Lang),
		Expiry:     req.Expiry,
		Visibility: validVisibility(req.Visibility),
		AuthorID:   uid,
		AuthorName: username,
		ExpiresAt:  expiresAt(req.Expiry),
	}
	if strings.TrimSpace(paste.Title) == "" {
		paste.Title = "Untitled"
	}

	if err := database.DB.Create(paste).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to create paste")
		return
	}

	respondWithJSON(w, http.StatusCreated, paste)
}

// GetPaste retrieves a paste by ID with visibility enforcement:
//   - public / unlisted → visible to everyone
//   - private → visible only to the owner
func GetPaste(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		respondWithError(w, http.StatusBadRequest, "missing paste ID")
		return
	}

	var paste Paste
	if err := database.DB.First(&paste, "id = ?", id).Error; err != nil {
		respondWithError(w, http.StatusNotFound, "paste not found")
		return
	}

	// Check expiry
	if paste.ExpiresAt != nil && paste.ExpiresAt.Before(time.Now()) {
		database.DB.Delete(&paste) // Lazy delete the expired paste
		respondWithError(w, http.StatusNotFound, "paste has expired")
		return
	}

	// Private paste: only the owner may view it
	if paste.Visibility == "private" {
		uid, _ := authContext(r.Context())
		if uid == nil || paste.AuthorID == nil || *uid != *paste.AuthorID {
			userData, ok := shared.UserFromContext(r.Context())
			if !ok || !userData.IsAdmin {
				respondWithError(w, http.StatusNotFound, "paste not found")
				return
			}
		}
	}

	// Increment view counter (fire and forget)
	database.DB.Model(&paste).UpdateColumn("views", paste.Views+1)

	respondWithJSON(w, http.StatusOK, &paste)
}

// UpdatePaste updates a paste. Requires authentication and ownership.
func UpdatePaste(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		respondWithError(w, http.StatusBadRequest, "missing paste ID")
		return
	}

	uid, _ := authContext(r.Context())

	var paste Paste
	if err := database.DB.First(&paste, "id = ?", id).Error; err != nil {
		respondWithError(w, http.StatusNotFound, "paste not found")
		return
	}
	if paste.AuthorID == nil || uid == nil || *paste.AuthorID != *uid {
		userData, ok := shared.UserFromContext(r.Context())
		if !ok || !userData.IsAdmin {
			respondWithError(w, http.StatusForbidden, "forbidden: you do not own this paste")
			return
		}
	}

	var req UpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if strings.TrimSpace(req.Content) == "" {
		respondWithError(w, http.StatusBadRequest, "content cannot be empty")
		return
	}

	updates := map[string]interface{}{
		"title":      req.Title,
		"content":    req.Content,
		"lang":       validLang(req.Lang),
		"expiry":     req.Expiry,
		"visibility": validVisibility(req.Visibility),
		"expires_at": expiresAt(req.Expiry),
		"updated_at": time.Now(),
	}
	if strings.TrimSpace(req.Title) == "" {
		updates["title"] = "Untitled"
	}

	if err := database.DB.Model(&paste).Updates(updates).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to update paste")
		return
	}

	// Refresh the paste struct for the response
	_ = database.DB.First(&paste, "id = ?", id).Error

	respondWithJSON(w, http.StatusOK, &paste)
}

// DeletePaste permanently deletes a paste. Requires authentication and ownership.
func DeletePaste(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		respondWithError(w, http.StatusBadRequest, "missing paste ID")
		return
	}

	uid, _ := authContext(r.Context())

	var paste Paste
	if err := database.DB.First(&paste, "id = ?", id).Error; err != nil {
		respondWithError(w, http.StatusNotFound, "paste not found")
		return
	}
	if paste.AuthorID == nil || uid == nil || *paste.AuthorID != *uid {
		userData, ok := shared.UserFromContext(r.Context())
		if !ok || !userData.IsAdmin {
			respondWithError(w, http.StatusForbidden, "forbidden: you do not own this paste")
			return
		}
	}

	if err := database.DB.Delete(&paste).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to delete paste")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "paste deleted successfully"})
}

// MyPastes returns all pastes (public + private) owned by the authenticated user.
func MyPastes(w http.ResponseWriter, r *http.Request) {
	uid, _ := authContext(r.Context())
	if uid == nil {
		respondWithError(w, http.StatusUnauthorized, "could not resolve user ID")
		return
	}

	var pastes []Paste
	var total int64

	if err := database.DB.Model(&Paste{}).Where("author_id = ?", uid).Count(&total).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to count user pastes")
		return
	}

	if err := database.DB.Where("author_id = ?", uid).Order("created_at DESC").Find(&pastes).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to fetch user pastes")
		return
	}

	respondWithJSON(w, http.StatusOK, &ListResponse{Pastes: pastes, Total: total})
}

// PersonalPastes returns pastes for a specific user:
// - If the request is authenticated as the requested username, it shows all of their pastes (public, unlisted, private).
// - Otherwise, it shows only their public, unexpired pastes.
func PersonalPastes(w http.ResponseWriter, r *http.Request) {
	username := chi.URLParam(r, "username")
	if username == "" {
		respondWithError(w, http.StatusBadRequest, "missing username")
		return
	}

	currentUser, ok := shared.UserFromContext(r.Context())
	showAll := false
	if ok && currentUser != nil && strings.EqualFold(currentUser.Username, username) {
		showAll = true
	}

	tx := database.DB.Model(&Paste{}).Where("author_name = ?", username)

	if !showAll {
		tx = tx.Where("visibility = ? AND (expires_at IS NULL OR expires_at > ?)", "public", time.Now())
	}

	var total int64
	if err := tx.Count(&total).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to count pastes")
		return
	}

	var pastes []Paste
	if err := tx.Order("created_at DESC").Find(&pastes).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to fetch pastes")
		return
	}

	respondWithJSON(w, http.StatusOK, &ListResponse{Pastes: pastes, Total: total})
}



// GetRawPaste retrieves the raw content of a paste by ID.
func GetRawPaste(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		respondWithError(w, http.StatusBadRequest, "missing paste ID")
		return
	}

	var paste Paste
	if err := database.DB.First(&paste, "id = ?", id).Error; err != nil {
		respondWithError(w, http.StatusNotFound, "paste not found")
		return
	}

	// Check expiry
	if paste.ExpiresAt != nil && paste.ExpiresAt.Before(time.Now()) {
		database.DB.Delete(&paste) // Lazy delete the expired paste
		respondWithError(w, http.StatusNotFound, "paste has expired")
		return
	}

	// Private paste: only the owner may view it
	if paste.Visibility == "private" {
		uid, _ := authContext(r.Context())
		if uid == nil || paste.AuthorID == nil || *uid != *paste.AuthorID {
			userData, ok := shared.UserFromContext(r.Context())
			if !ok || !userData.IsAdmin {
				respondWithError(w, http.StatusNotFound, "paste not found")
				return
			}
		}
	}

	// Increment view counter (fire and forget)
	database.DB.Model(&paste).UpdateColumn("views", paste.Views+1)

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(paste.Content))
}


