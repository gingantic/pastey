package auth

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	qt "github.com/frankban/quicktest"
	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"pastey/backend/database"
)

func TestMain(m *testing.M) {
	// Initialize in-memory SQLite DB for testing
	gormDB, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		panic("failed to connect to in-memory database: " + err.Error())
	}
	database.DB = gormDB

	// Run migrations
	_ = database.DB.AutoMigrate(&User{}, &RefreshToken{})

	// Set test environment variable
	os.Setenv("JWT_SECRET", "test-secret-key-32-bytes-long!!!")

	os.Exit(m.Run())
}

// ── Token helpers tests (no DB needed) ────────────────────────────────────────

func TestGenerateAndParseAccessToken(t *testing.T) {
	c := qt.New(t)

	user := &User{
		Username: "testuser",
		Email:    "test@example.com",
	}
	user.ID = uuid.New()

	token, err := generateAccessToken(user)
	c.Assert(err, qt.IsNil)
	c.Assert(token, qt.Not(qt.Equals), "")

	claims, err := parseAccessToken(token)
	c.Assert(err, qt.IsNil)
	c.Assert(claims.Username, qt.Equals, "testuser")
	c.Assert(claims.Email, qt.Equals, "test@example.com")
}

func TestAccessTokenExpiry(t *testing.T) {
	c := qt.New(t)

	user := &User{Username: "expiry-test", Email: "e@e.com"}
	user.ID = uuid.New()

	token, _ := generateAccessToken(user)
	claims, err := parseAccessToken(token)
	c.Assert(err, qt.IsNil)

	// Should expire ~15 minutes from now
	c.Assert(claims.ExpiresAt.Time.After(time.Now()), qt.IsTrue)
	c.Assert(claims.ExpiresAt.Time.Before(time.Now().Add(16*time.Minute)), qt.IsTrue)
}

func TestParseAccessToken_InvalidSignature(t *testing.T) {
	c := qt.New(t)

	_, err := parseAccessToken("this.is.notavalidtoken")
	c.Assert(err, qt.Not(qt.IsNil))
}

func TestHashToken_Deterministic(t *testing.T) {
	c := qt.New(t)

	raw := "my-super-raw-token"
	h1 := hashToken(raw)
	h2 := hashToken(raw)
	c.Assert(h1, qt.Equals, h2)
	c.Assert(h1, qt.Not(qt.Equals), raw)
}

func TestHashToken_DifferentInputs(t *testing.T) {
	c := qt.New(t)
	c.Assert(hashToken("tokenA"), qt.Not(qt.Equals), hashToken("tokenB"))
}

func TestGenerateRefreshToken(t *testing.T) {
	c := qt.New(t)

	raw, hashed, err := generateRefreshToken(uuid.New())
	c.Assert(err, qt.IsNil)
	c.Assert(len(raw), qt.Equals, 128) // 64 bytes hex-encoded = 128 chars
	c.Assert(hashed, qt.Equals, hashToken(raw))
}

// ── HTTP Endpoint tests with In-Memory DB ─────────────────────────────────────

func TestSignupValidation(t *testing.T) {
	tests := []struct {
		name    string
		req     SignupRequest
		code    int
		wantErr string
	}{
		{
			name:    "username too short",
			req:     SignupRequest{Username: "ab", Email: "a@b.com", Password: "password123"},
			code:    http.StatusBadRequest,
			wantErr: "username must be at least 3 characters",
		},
		{
			name:    "invalid email",
			req:     SignupRequest{Username: "valid", Email: "notanemail", Password: "password123"},
			code:    http.StatusBadRequest,
			wantErr: "invalid email address",
		},
		{
			name:    "password too short",
			req:     SignupRequest{Username: "valid", Email: "a@b.com", Password: "short"},
			code:    http.StatusBadRequest,
			wantErr: "password must be at least 8 characters",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := qt.New(t)

			body, _ := json.Marshal(tt.req)
			req := httptest.NewRequest("POST", "/auth/signup", bytes.NewReader(body))
			rec := httptest.NewRecorder()

			Signup(rec, req)

			c.Assert(rec.Code, qt.Equals, tt.code)
			var resp map[string]string
			_ = json.Unmarshal(rec.Body.Bytes(), &resp)
			c.Assert(strings.Contains(resp["error"], tt.wantErr), qt.IsTrue, qt.Commentf("got: %v", resp["error"]))
		})
	}
}

func TestSignupAndLoginSuccess(t *testing.T) {
	c := qt.New(t)

	// Clean users table before test
	database.DB.Exec("DELETE FROM users")
	database.DB.Exec("DELETE FROM refresh_tokens")

	// 1. Signup
	signupReq := SignupRequest{
		Username: "reihan",
		Email:    "reihan@example.com",
		Password: "supersecretpassword123",
	}
	body, _ := json.Marshal(signupReq)
	req := httptest.NewRequest("POST", "/auth/signup", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	Signup(rec, req)

	c.Assert(rec.Code, qt.Equals, http.StatusCreated)

	var signupRes AuthResponse
	err := json.Unmarshal(rec.Body.Bytes(), &signupRes)
	c.Assert(err, qt.IsNil)
	c.Assert(signupRes.User.Username, qt.Equals, "reihan")
	c.Assert(signupRes.User.Email, qt.Equals, "reihan@example.com")
	c.Assert(signupRes.Tokens.AccessToken, qt.Not(qt.Equals), "")
	c.Assert(signupRes.Tokens.RefreshToken, qt.Not(qt.Equals), "")

	// 2. Login
	loginReq := LoginRequest{
		EmailOrUsername: "reihan@example.com",
		Password:        "supersecretpassword123",
	}
	body, _ = json.Marshal(loginReq)
	req = httptest.NewRequest("POST", "/auth/login", bytes.NewReader(body))
	rec = httptest.NewRecorder()

	Login(rec, req)

	c.Assert(rec.Code, qt.Equals, http.StatusOK)

	var loginRes AuthResponse
	err = json.Unmarshal(rec.Body.Bytes(), &loginRes)
	c.Assert(err, qt.IsNil)
	c.Assert(loginRes.User.Username, qt.Equals, "reihan")
	c.Assert(loginRes.Tokens.AccessToken, qt.Not(qt.Equals), "")
}

func TestRefreshAndLogout(t *testing.T) {
	c := qt.New(t)

	database.DB.Exec("DELETE FROM users")
	database.DB.Exec("DELETE FROM refresh_tokens")

	// Create user
	signupReq := SignupRequest{
		Username: "john",
		Email:    "john@example.com",
		Password: "password12345",
	}
	body, _ := json.Marshal(signupReq)
	req := httptest.NewRequest("POST", "/auth/signup", bytes.NewReader(body))
	rec := httptest.NewRecorder()
	Signup(rec, req)

	var signupRes AuthResponse
	_ = json.Unmarshal(rec.Body.Bytes(), &signupRes)

	// 1. Refresh token
	refreshReq := RefreshRequest{
		RefreshToken: signupRes.Tokens.RefreshToken,
	}
	body, _ = json.Marshal(refreshReq)
	req = httptest.NewRequest("POST", "/auth/refresh", bytes.NewReader(body))
	rec = httptest.NewRecorder()

	Refresh(rec, req)

	c.Assert(rec.Code, qt.Equals, http.StatusOK)

	var refreshRes AuthResponse
	err := json.Unmarshal(rec.Body.Bytes(), &refreshRes)
	c.Assert(err, qt.IsNil)
	c.Assert(refreshRes.Tokens.AccessToken, qt.Not(qt.Equals), "")
	c.Assert(refreshRes.Tokens.RefreshToken, qt.Not(qt.Equals), "")

	// 2. Logout using the NEW refresh token
	logoutReq := LogoutRequest{
		RefreshToken: refreshRes.Tokens.RefreshToken,
	}
	body, _ = json.Marshal(logoutReq)
	req = httptest.NewRequest("POST", "/auth/logout", bytes.NewReader(body))
	rec = httptest.NewRecorder()

	Logout(rec, req)

	c.Assert(rec.Code, qt.Equals, http.StatusOK)

	// 3. Trying to refresh again with the logged out token should fail
	body, _ = json.Marshal(RefreshRequest{RefreshToken: refreshRes.Tokens.RefreshToken})
	req = httptest.NewRequest("POST", "/auth/refresh", bytes.NewReader(body))
	rec = httptest.NewRecorder()
	Refresh(rec, req)

	c.Assert(rec.Code, qt.Equals, http.StatusUnauthorized)
}
