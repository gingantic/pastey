package auth

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

// RegisterRoutes registers the authentication endpoints.
// To avoid circular dependency with the middleware package, we accept the requireAuth middleware as a parameter.
func RegisterRoutes(r chi.Router, requireAuth func(http.Handler) http.Handler) {
	r.Post("/signup", Signup)
	r.Post("/login", Login)
	r.Post("/refresh", Refresh)
	r.Post("/logout", Logout)
	r.With(requireAuth).Get("/me", GetMe)
}
