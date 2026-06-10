package middleware

import (
	"net/http"
	"strings"

	"pastey/backend/auth"
	"pastey/backend/database"
	"pastey/backend/shared"
)

// AuthMiddleware extracts the JWT token from the Authorization header and validates it.
// If valid, the user's data is injected into the context.
// If invalid, a 401 is returned.
// If missing, the request passes through unauthenticated.
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			next.ServeHTTP(w, r)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error": "invalid authorization header format"}`))
			return
		}

		tokenString := parts[1]
		userData, err := auth.ValidateToken(tokenString)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error": "invalid or expired token"}`))
			return
		}

		// Inject user data into context
		ctx := shared.ContextWithUser(r.Context(), userData)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireAuth is a middleware that enforces that the user must be authenticated.
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, ok := shared.UserFromContext(r.Context())
		if !ok {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error": "authentication required"}`))
			return
		}
		next.ServeHTTP(w, r)
	})
}

// RequireAdmin enforces that the user is authenticated and has administrator privileges.
func RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userData, ok := shared.UserFromContext(r.Context())
		if !ok || userData == nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error": "authentication required"}`))
			return
		}

		// Verify admin status directly in database to avoid token spoofing/stale claims
		var user auth.User
		if err := database.DB.Select("is_admin").First(&user, "id = ?", userData.UserID).Error; err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error": "user not found"}`))
			return
		}

		if !user.IsAdmin {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			w.Write([]byte(`{"error": "forbidden: admin access required"}`))
			return
		}

		next.ServeHTTP(w, r)
	})
}
