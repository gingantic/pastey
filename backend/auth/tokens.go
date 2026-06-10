package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"pastey/backend/shared"
)

// ── Constants ─────────────────────────────────────────────────────────────────

const (
	accessTokenTTL  = 15 * time.Minute
	refreshTokenTTL = 30 * 24 * time.Hour // 30 days
)

// ── JWT Claims ────────────────────────────────────────────────────────────────

// Claims are the custom payload embedded in every access token.
type Claims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	IsAdmin  bool   `json:"is_admin"`
	jwt.RegisteredClaims
}

// getJWTSecret returns the secret key from environment variables.
func getJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "pastey-dev-secret-key-minimum-32chars!"
	}
	return []byte(secret)
}

// ── Access Token ──────────────────────────────────────────────────────────────

// generateAccessToken mints a signed JWT for the given user.
func generateAccessToken(user *User) (string, error) {
	claims := Claims{
		UserID:   user.ID.String(),
		Username: user.Username,
		Email:    user.Email,
		IsAdmin:  user.IsAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   user.ID.String(),
			Issuer:    "pastey",
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(accessTokenTTL)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(getJWTSecret())
}

// parseAccessToken validates a JWT string and returns its claims.
func parseAccessToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return getJWTSecret(), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}
	return claims, nil
}

// ValidateToken parses, validates and returns UserData for the given token string.
func ValidateToken(tokenString string) (*shared.UserData, error) {
	claims, err := parseAccessToken(tokenString)
	if err != nil {
		return nil, err
	}

	return &shared.UserData{
		UserID:   claims.UserID,
		Username: claims.Username,
		Email:    claims.Email,
		IsAdmin:  claims.IsAdmin,
	}, nil
}

// ── Refresh Token ─────────────────────────────────────────────────────────────

// generateRefreshToken creates a cryptographically random 64-byte opaque token.
// Returns the raw token (sent to client) and its SHA-256 hash (stored in DB).
func generateRefreshToken(_ uuid.UUID) (raw, hashed string, err error) {
	b := make([]byte, 64)
	if _, err = rand.Read(b); err != nil {
		return
	}
	raw = hex.EncodeToString(b)
	hashed = hashToken(raw)
	return
}

// hashToken returns the hex-encoded SHA-256 hash of a raw refresh token.
// Only the hash is stored in the DB — a breach cannot expose live tokens.
func hashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}
