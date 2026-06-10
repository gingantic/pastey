package auth

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
	"pastey/backend/database"
	"pastey/backend/shared"
)

// ── Request / Response types ──────────────────────────────────────────────────

// SignupRequest is the payload for POST /auth/signup.
type SignupRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginRequest is the payload for POST /auth/login.
type LoginRequest struct {
	// EmailOrUsername accepts either the user's email or their username.
	EmailOrUsername string `json:"email_or_username"`
	Password        string `json:"password"`
}

// RefreshRequest is the payload for POST /auth/refresh.
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// LogoutRequest is the payload for POST /auth/logout.
type LogoutRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// TokenPair holds an access + refresh token pair returned on login / signup / refresh.
type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

// AuthResponse is returned on successful signup, login, or token refresh.
type AuthResponse struct {
	User   UserProfile `json:"user"`
	Tokens TokenPair   `json:"tokens"`
}

// UserProfile is the public representation of a user (no password).
type UserProfile struct {
	ID        string    `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	IsAdmin   bool      `json:"is_admin"`
	CreatedAt time.Time `json:"created_at"`
}

// ── Internal helpers ──────────────────────────────────────────────────────────

// issueTokenPair generates a fresh access + refresh token pair for the given user,
// persists the hashed refresh token, and returns the full AuthResponse.
func issueTokenPair(user *User) (*AuthResponse, error) {
	accessToken, err := generateAccessToken(user)
	if err != nil {
		return nil, err
	}

	rawRefresh, hashedRefresh, err := generateRefreshToken(user.ID)
	if err != nil {
		return nil, err
	}

	rt := RefreshToken{
		UserID:    user.ID,
		Token:     hashedRefresh,
		ExpiresAt: time.Now().Add(refreshTokenTTL),
	}
	if err := database.DB.Create(&rt).Error; err != nil {
		return nil, err
	}

	return &AuthResponse{
		User: UserProfile{
			ID:        user.ID.String(),
			Username:  user.Username,
			Email:     user.Email,
			IsAdmin:   user.IsAdmin,
			CreatedAt: user.CreatedAt,
		},
		Tokens: TokenPair{
			AccessToken:  accessToken,
			RefreshToken: rawRefresh,
		},
	}, nil
}

// respondWithError helper writes a JSON error response.
func respondWithError(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

// respondWithJSON helper writes a JSON success response.
func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(payload)
}

// ── API Handlers ──────────────────────────────────────────────────────────────

// Signup registers a new user and returns a token pair.
func Signup(w http.ResponseWriter, r *http.Request) {
	var req SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if len(strings.TrimSpace(req.Username)) < 3 {
		respondWithError(w, http.StatusBadRequest, "username must be at least 3 characters")
		return
	}
	if !strings.Contains(req.Email, "@") {
		respondWithError(w, http.StatusBadRequest, "invalid email address")
		return
	}
	if len(req.Password) < 8 {
		respondWithError(w, http.StatusBadRequest, "password must be at least 8 characters")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to process password")
		return
	}

	// Check if this is the first user in the database to assign admin status
	var count int64
	isAdmin := false
	if err := database.DB.Model(&User{}).Count(&count).Error; err == nil && count == 0 {
		isAdmin = true
	}

	user := &User{
		Username: strings.TrimSpace(req.Username),
		Email:    strings.ToLower(strings.TrimSpace(req.Email)),
		Password: string(hash),
		IsAdmin:  isAdmin,
	}
	if err := database.DB.Create(user).Error; err != nil {
		if strings.Contains(err.Error(), "unique") || strings.Contains(err.Error(), "UNIQUE") {
			respondWithError(w, http.StatusConflict, "username or email is already taken")
			return
		}
		respondWithError(w, http.StatusInternalServerError, "failed to create user")
		return
	}

	res, err := issueTokenPair(user)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to issue session tokens")
		return
	}

	respondWithJSON(w, http.StatusCreated, res)
}

// Login authenticates an existing user by email or username and returns a token pair.
func Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	identifier := strings.ToLower(strings.TrimSpace(req.EmailOrUsername))

	var user User
	if err := database.DB.Where("email = ? OR username = ?", identifier, identifier).First(&user).Error; err != nil {
		respondWithError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		respondWithError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	res, err := issueTokenPair(&user)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to issue session tokens")
		return
	}

	respondWithJSON(w, http.StatusOK, res)
}

// Refresh exchanges a valid refresh token for a new access + refresh token pair.
// The old refresh token is deleted immediately (rotation).
func Refresh(w http.ResponseWriter, r *http.Request) {
	var req RefreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if strings.TrimSpace(req.RefreshToken) == "" {
		respondWithError(w, http.StatusBadRequest, "refresh token is required")
		return
	}

	hashed := hashToken(req.RefreshToken)

	var rt RefreshToken
	if err := database.DB.Where("token = ? AND expires_at > ?", hashed, time.Now()).First(&rt).Error; err != nil {
		respondWithError(w, http.StatusUnauthorized, "invalid or expired refresh token")
		return
	}

	// Rotate: delete old token before issuing new pair
	database.DB.Delete(&rt)

	var user User
	if err := database.DB.First(&user, "id = ?", rt.UserID).Error; err != nil {
		respondWithError(w, http.StatusNotFound, "user not found")
		return
	}

	res, err := issueTokenPair(&user)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to issue session tokens")
		return
	}

	respondWithJSON(w, http.StatusOK, res)
}

// Logout revokes the provided refresh token, effectively ending the session.
func Logout(w http.ResponseWriter, r *http.Request) {
	var req LogoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		// Try to read it or return bad request
		respondWithError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if strings.TrimSpace(req.RefreshToken) == "" {
		respondWithError(w, http.StatusBadRequest, "refresh token is required")
		return
	}
	hashed := hashToken(req.RefreshToken)
	database.DB.Where("token = ?", hashed).Delete(&RefreshToken{})

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "logged out successfully"})
}

// GetMe returns the authenticated user's profile.
func GetMe(w http.ResponseWriter, r *http.Request) {
	userData, ok := shared.UserFromContext(r.Context())
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var user User
	if err := database.DB.First(&user, "id = ?", userData.UserID).Error; err != nil {
		respondWithError(w, http.StatusNotFound, "user not found")
		return
	}

	respondWithJSON(w, http.StatusOK, &UserProfile{
		ID:        user.ID.String(),
		Username:  user.Username,
		Email:     user.Email,
		IsAdmin:   user.IsAdmin,
		CreatedAt: user.CreatedAt,
	})
}
