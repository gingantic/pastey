package pastes

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	qt "github.com/frankban/quicktest"
	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"pastey/backend/database"
	"pastey/backend/shared"
)

func TestMain(m *testing.M) {
	// Initialize in-memory SQLite DB for testing
	gormDB, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		panic("failed to connect to in-memory database: " + err.Error())
	}
	database.DB = gormDB

	// Run migrations
	_ = database.DB.AutoMigrate(&Paste{})

	os.Exit(m.Run())
}

// ── Helper / utility function tests (no DB required) ──────────────────────────

func TestRandomID(t *testing.T) {
	c := qt.New(t)

	id1 := randomID()
	id2 := randomID()

	c.Assert(len(id1), qt.Equals, 12, qt.Commentf("expected 12-char hex ID"))
	c.Assert(id1, qt.Not(qt.Equals), id2, qt.Commentf("IDs must be unique"))
}

func TestValidVisibility(t *testing.T) {
	c := qt.New(t)

	c.Assert(validVisibility("public"), qt.Equals, "public")
	c.Assert(validVisibility("unlisted"), qt.Equals, "unlisted")
	c.Assert(validVisibility("private"), qt.Equals, "private")
	c.Assert(validVisibility(""), qt.Equals, "public")
	c.Assert(validVisibility("unknown"), qt.Equals, "public")
	c.Assert(validVisibility("SECRET"), qt.Equals, "public")
}

func TestValidLang(t *testing.T) {
	c := qt.New(t)

	c.Assert(validLang("go"), qt.Equals, "go")
	c.Assert(validLang(""), qt.Equals, "plaintext")
	c.Assert(validLang("   "), qt.Equals, "plaintext")
	c.Assert(validLang("javascript"), qt.Equals, "javascript")
}

func TestExpiresAt(t *testing.T) {
	now := time.Now()

	cases := []struct {
		expiry string
		minTTL time.Duration
		maxTTL time.Duration
		isNil  bool
	}{
		{"never", 0, 0, true},
		{"", 0, 0, true},
		{"10m", 9 * time.Minute, 11 * time.Minute, false},
		{"1h", 59 * time.Minute, 61 * time.Minute, false},
		{"1d", 23 * time.Hour, 25 * time.Hour, false},
		{"1w", 6*24*time.Hour + 23*time.Hour, 7*24*time.Hour + time.Hour, false},
		{"1mo", 29 * 24 * time.Hour, 31 * 24 * time.Hour, false},
	}

	for _, tc := range cases {
		t.Run(tc.expiry, func(t *testing.T) {
			c := qt.New(t)
			result := expiresAt(tc.expiry)
			if tc.isNil {
				c.Assert(result, qt.IsNil)
				return
			}
			c.Assert(result, qt.Not(qt.IsNil))
			c.Assert(result.After(now.Add(tc.minTTL)), qt.IsTrue)
			c.Assert(result.Before(now.Add(tc.maxTTL)), qt.IsTrue)
		})
	}
}

// ── Handler input validation tests ────────────────────────────────────────────

func TestCreatePaste_EmptyContent(t *testing.T) {
	c := qt.New(t)

	body, _ := json.Marshal(CreateRequest{Content: ""})
	req := httptest.NewRequest("POST", "/pastes", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	CreatePaste(rec, req)

	c.Assert(rec.Code, qt.Equals, http.StatusBadRequest)
	var resp map[string]string
	_ = json.Unmarshal(rec.Body.Bytes(), &resp)
	c.Assert(strings.Contains(resp["error"], "content cannot be empty"), qt.IsTrue)
}

func TestCreatePaste_WhitespaceContent(t *testing.T) {
	c := qt.New(t)

	body, _ := json.Marshal(CreateRequest{Content: "   "})
	req := httptest.NewRequest("POST", "/pastes", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	CreatePaste(rec, req)

	c.Assert(rec.Code, qt.Equals, http.StatusBadRequest)
}

// ── Integration Endpoints tests ───────────────────────────────────────────────

func TestCreateAndGetPaste(t *testing.T) {
	c := qt.New(t)

	// Clean table
	database.DB.Exec("DELETE FROM pastes")

	// 1. Create Paste
	createReq := CreateRequest{
		Title:      "Test paste",
		Content:    "Hello, SQLite!",
		Lang:       "plaintext",
		Visibility: "public",
		Expiry:     "never",
	}
	body, _ := json.Marshal(createReq)
	req := httptest.NewRequest("POST", "/pastes", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	CreatePaste(rec, req)

	c.Assert(rec.Code, qt.Equals, http.StatusCreated)

	var paste Paste
	err := json.Unmarshal(rec.Body.Bytes(), &paste)
	c.Assert(err, qt.IsNil)
	c.Assert(paste.Title, qt.Equals, "Test paste")
	c.Assert(paste.Content, qt.Equals, "Hello, SQLite!")
	c.Assert(paste.ID, qt.Not(qt.Equals), "")

	// 2. Get Paste
	req = httptest.NewRequest("GET", "/pastes/"+paste.ID, nil)

	// Mock Chi URL Param for GET /pastes/{id}
	chiCtx := chi.NewRouteContext()
	chiCtx.URLParams.Add("id", paste.ID)
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, chiCtx))

	rec = httptest.NewRecorder()
	GetPaste(rec, req)

	c.Assert(rec.Code, qt.Equals, http.StatusOK)

	var getRes Paste
	err = json.Unmarshal(rec.Body.Bytes(), &getRes)
	c.Assert(err, qt.IsNil)
	c.Assert(getRes.ID, qt.Equals, paste.ID)
	c.Assert(getRes.Views, qt.Equals, int64(1))
}

// ── Ownership logic tests ─────────────────────────────────────────────────────

func TestOwnership_SameUser(t *testing.T) {
	c := qt.New(t)

	ownerID := uuid.New()
	paste := &Paste{AuthorID: &ownerID}

	c.Assert(*paste.AuthorID == ownerID, qt.IsTrue)
}

func TestOwnership_DifferentUser(t *testing.T) {
	c := qt.New(t)

	ownerID := uuid.New()
	attackerID := uuid.New()
	paste := &Paste{AuthorID: &ownerID}

	c.Assert(*paste.AuthorID == attackerID, qt.IsFalse)
}

func TestOwnership_AnonymousPaste(t *testing.T) {
	c := qt.New(t)

	paste := &Paste{AuthorID: nil}
	uid := uuid.New()

	c.Assert(paste.AuthorID == nil, qt.IsTrue)
	c.Assert(&uid != paste.AuthorID, qt.IsTrue)
}

func TestMyPastes(t *testing.T) {
	c := qt.New(t)

	// Clean table
	database.DB.Exec("DELETE FROM pastes")

	uid := uuid.New()
	
	// Create a paste owned by uid
	p1 := &Paste{
		ID:         "userpaste111",
		Title:      "User Paste 1",
		Content:    "Secret stuff",
		Visibility: "private",
		AuthorID:   &uid,
		AuthorName: "testuser",
	}
	c.Assert(database.DB.Create(p1).Error, qt.IsNil)

	// Create a paste not owned by uid
	otherUid := uuid.New()
	p2 := &Paste{
		ID:         "otherpaste22",
		Title:      "Other Paste",
		Content:    "Other content",
		Visibility: "public",
		AuthorID:   &otherUid,
		AuthorName: "otheruser",
	}
	c.Assert(database.DB.Create(p2).Error, qt.IsNil)

	req := httptest.NewRequest("GET", "/users/me/pastes", nil)
	// Inject user identity into context
	identity := &shared.UserData{
		UserID:   uid.String(),
		Username: "testuser",
		Email:    "test@user.com",
	}
	ctx := shared.ContextWithUser(req.Context(), identity)
	req = req.WithContext(ctx)

	rec := httptest.NewRecorder()
	MyPastes(rec, req)

	c.Assert(rec.Code, qt.Equals, http.StatusOK)

	var resp ListResponse
	err := json.Unmarshal(rec.Body.Bytes(), &resp)
	c.Assert(err, qt.IsNil)
	c.Assert(resp.Total, qt.Equals, int64(1))
	c.Assert(len(resp.Pastes), qt.Equals, 1)
	c.Assert(resp.Pastes[0].ID, qt.Equals, "userpaste111")
}

func TestGetRawPaste(t *testing.T) {
	c := qt.New(t)

	// Clean table
	database.DB.Exec("DELETE FROM pastes")

	// Create a public paste
	p1 := &Paste{
		ID:         "rawpaste1111",
		Title:      "Public Paste",
		Content:    "Hello Raw Public!",
		Visibility: "public",
	}
	c.Assert(database.DB.Create(p1).Error, qt.IsNil)

	// Create an unlisted paste
	p2 := &Paste{
		ID:         "rawpaste2222",
		Title:      "Unlisted Paste",
		Content:    "Hello Raw Unlisted!",
		Visibility: "unlisted",
	}
	c.Assert(database.DB.Create(p2).Error, qt.IsNil)

	// Create a private paste
	ownerID := uuid.New()
	p3 := &Paste{
		ID:         "rawpaste3333",
		Title:      "Private Paste",
		Content:    "Hello Raw Private!",
		Visibility: "private",
		AuthorID:   &ownerID,
	}
	c.Assert(database.DB.Create(p3).Error, qt.IsNil)

	// Test 1: Fetch raw public paste (unauthenticated)
	req := httptest.NewRequest("GET", "/pastes/rawpaste1111/raw", nil)
	chiCtx := chi.NewRouteContext()
	chiCtx.URLParams.Add("id", "rawpaste1111")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, chiCtx))
	rec := httptest.NewRecorder()
	GetRawPaste(rec, req)
	c.Assert(rec.Code, qt.Equals, http.StatusOK)
	c.Assert(rec.Body.String(), qt.Equals, "Hello Raw Public!")
	c.Assert(rec.Header().Get("Content-Type"), qt.Equals, "text/plain; charset=utf-8")

	// Test 2: Fetch raw unlisted paste (unauthenticated)
	req = httptest.NewRequest("GET", "/pastes/rawpaste2222/raw", nil)
	chiCtx = chi.NewRouteContext()
	chiCtx.URLParams.Add("id", "rawpaste2222")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, chiCtx))
	rec = httptest.NewRecorder()
	GetRawPaste(rec, req)
	c.Assert(rec.Code, qt.Equals, http.StatusOK)
	c.Assert(rec.Body.String(), qt.Equals, "Hello Raw Unlisted!")

	// Test 3: Fetch raw private paste (unauthenticated -> should fail/404)
	req = httptest.NewRequest("GET", "/pastes/rawpaste3333/raw", nil)
	chiCtx = chi.NewRouteContext()
	chiCtx.URLParams.Add("id", "rawpaste3333")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, chiCtx))
	rec = httptest.NewRecorder()
	GetRawPaste(rec, req)
	c.Assert(rec.Code, qt.Equals, http.StatusNotFound)

	// Test 4: Fetch raw private paste (authenticated owner -> should succeed)
	req = httptest.NewRequest("GET", "/pastes/rawpaste3333/raw", nil)
	chiCtx = chi.NewRouteContext()
	chiCtx.URLParams.Add("id", "rawpaste3333")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, chiCtx))
	// Inject user identity
	identity := &shared.UserData{
		UserID:   ownerID.String(),
		Username: "owner",
		Email:    "owner@test.com",
	}
	req = req.WithContext(shared.ContextWithUser(req.Context(), identity))
	rec = httptest.NewRecorder()
	GetRawPaste(rec, req)
	c.Assert(rec.Code, qt.Equals, http.StatusOK)
	c.Assert(rec.Body.String(), qt.Equals, "Hello Raw Private!")
}

func TestLazyDeleteExpiredPaste(t *testing.T) {
	c := qt.New(t)

	// Clean table
	database.DB.Exec("DELETE FROM pastes")

	// 1. Create an expired paste
	expiredTime := time.Now().Add(-10 * time.Minute)
	p := &Paste{
		ID:         "expiredpaste",
		Title:      "Expired Paste",
		Content:    "Should be deleted",
		Visibility: "public",
		ExpiresAt:  &expiredTime,
	}
	c.Assert(database.DB.Create(p).Error, qt.IsNil)

	// 2. Fetch normally -> should return 404 and delete it from DB
	req := httptest.NewRequest("GET", "/pastes/expiredpaste", nil)
	chiCtx := chi.NewRouteContext()
	chiCtx.URLParams.Add("id", "expiredpaste")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, chiCtx))
	rec := httptest.NewRecorder()
	GetPaste(rec, req)

	c.Assert(rec.Code, qt.Equals, http.StatusNotFound)

	// Verify it is gone from the database
	var count int64
	c.Assert(database.DB.Model(&Paste{}).Where("id = ?", "expiredpaste").Count(&count).Error, qt.IsNil)
	c.Assert(count, qt.Equals, int64(0))

	// 3. Create another expired paste for raw test
	c.Assert(database.DB.Create(p).Error, qt.IsNil)

	// 4. Fetch raw -> should return 404 and delete it from DB
	req = httptest.NewRequest("GET", "/pastes/expiredpaste/raw", nil)
	chiCtx = chi.NewRouteContext()
	chiCtx.URLParams.Add("id", "expiredpaste")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, chiCtx))
	rec = httptest.NewRecorder()
	GetRawPaste(rec, req)

	c.Assert(rec.Code, qt.Equals, http.StatusNotFound)

	// Verify it is gone from the database
	c.Assert(database.DB.Model(&Paste{}).Where("id = ?", "expiredpaste").Count(&count).Error, qt.IsNil)
	c.Assert(count, qt.Equals, int64(0))
}



