// Package shared contains types shared across Go packages.
package shared

import "context"

// UserData is attached to every authenticated request context by the auth handler.
type UserData struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	IsAdmin  bool   `json:"is_admin"`
}

type contextKey string

const UserContextKey contextKey = "user"

// UserFromContext retrieves the UserData from the context if it exists.
func UserFromContext(ctx context.Context) (*UserData, bool) {
	userData, ok := ctx.Value(UserContextKey).(*UserData)
	return userData, ok
}

// ContextWithUser injects UserData into the context.
func ContextWithUser(ctx context.Context, userData *UserData) context.Context {
	return context.WithValue(ctx, UserContextKey, userData)
}
