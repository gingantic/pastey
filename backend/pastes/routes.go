package pastes

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

// RegisterRoutes registers all the paste endpoints.
// To avoid circular dependency with the middleware package, we accept the requireAuth middleware as a parameter.
func RegisterRoutes(r chi.Router, requireAuth func(http.Handler) http.Handler) {
	r.Get("/", ListPastes)
	r.Post("/", CreatePaste)

	r.Get("/{id}", GetPaste)
	r.Get("/{id}/raw", GetRawPaste)

	// Owner/auth endpoints
	r.Group(func(r chi.Router) {
		r.Use(requireAuth)
		r.Put("/{id}", UpdatePaste)
		r.Delete("/{id}", DeletePaste)
	})
}
