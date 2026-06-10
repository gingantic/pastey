package pastes

import (
	"time"

	"github.com/google/uuid"
)

// Paste is the GORM model for a code snippet stored in the pastes database.
type Paste struct {
	ID         string     `gorm:"primaryKey;size:12"                          json:"id"`
	Title      string     `gorm:"size:255;not null;default:'Untitled'"         json:"title"`
	Content    string     `gorm:"type:text;not null"                           json:"content"`
	Lang       string     `gorm:"size:50;not null;default:'plaintext'"         json:"lang"`
	Expiry     string     `gorm:"size:20;not null;default:'never'"             json:"expiry"`
	Visibility string     `gorm:"size:10;not null;default:'public'"            json:"visibility"`
	AuthorID   *uuid.UUID `gorm:"type:uuid"                                    json:"author_id,omitempty"`
	AuthorName string     `gorm:"size:50;not null;default:'Anonymous'"         json:"author_name"`
	Views      int64      `gorm:"not null;default:0"                           json:"views"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
	ExpiresAt  *time.Time `json:"expires_at,omitempty"`
}
