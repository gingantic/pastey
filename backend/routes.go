package main

import (
	"pastey/backend/admin"
	"pastey/backend/auth"
	customMiddleware "pastey/backend/middleware"
	"pastey/backend/pastes"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func setupRouter() *chi.Mux {
	r := chi.NewRouter()

	// Standard middleware
	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.Recoverer)

	// Configure CORS
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://127.0.0.1:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Apply auth parser middleware to all routes globally (adds user to context if present)
	r.Use(customMiddleware.AuthMiddleware)

	// Status and stats endpoint
	r.Get("/status", GetStatus)

	// Auth routes
	r.Route("/auth", func(r chi.Router) {
		auth.RegisterRoutes(r, customMiddleware.RequireAuth)
	})

	// Users routes
	r.Route("/users", func(r chi.Router) {
		r.With(customMiddleware.RequireAuth).Get("/me/pastes", pastes.MyPastes)
		r.Get("/{username}/pastes", pastes.PersonalPastes)
	})

	// Pastes routes
	r.Route("/pastes", func(r chi.Router) {
		pastes.RegisterRoutes(r, customMiddleware.RequireAuth)
	})

	// Admin routes
	r.Route("/admin", func(r chi.Router) {
		admin.RegisterRoutes(r, customMiddleware.RequireAdmin)
	})

	return r
}
