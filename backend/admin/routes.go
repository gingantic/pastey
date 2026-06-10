package admin

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

// RegisterRoutes sets up all routes under the admin scope, enforcing the admin middleware.
func RegisterRoutes(r chi.Router, requireAdmin func(http.Handler) http.Handler) {
	r.Use(requireAdmin)

	r.Get("/users", ListUsers)
	r.Post("/users/{id}/toggle-admin", ToggleAdmin)
	r.Delete("/users/{id}", DeleteUser)
	r.Get("/pastes", ListPastes)
}
