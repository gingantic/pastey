# Pastey Backend

Go backend for [Pastey](https://github.com/reihan/pastey) — built with **Chi**, **GORM**, and **SQLite / PostgreSQL**.

This backend runs entirely natively on Go, requiring **zero Docker dependencies** and **no database installation** by default.

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | [Go Chi Router](https://github.com/go-chi/chi) |
| ORM | [GORM](https://gorm.io) |
| Database | SQLite (file-based, default) / PostgreSQL (switchable) |
| Auth | JWT (HS256, 15 min) + Refresh Token (30 days) |
| Passwords | bcrypt cost 12 |

---

## Prerequisites

You only need **Go** installed on your system:

| Tool | Link | Notes |
|------|------|-------|
| **Go** 1.22+ | [go.dev/dl](https://go.dev/dl/) | Run `go version` to check |

No Docker, Docker Desktop, or database server installation is required to start developing!

---

## Setup & Running

### 1. Install dependencies
From the `backend` directory, run:
```powershell
go mod tidy
```

### 2. Configure environment (`.env`)
A default `.env` file is already created:
```env
PORT=4000
DB_TYPE=sqlite
DATABASE_URL=pastey.db
JWT_SECRET=pastey-dev-secret-key-minimum-32chars!
```
* **SQLite (Default):** Runs out of a local `pastey.db` file created in this directory.
* **PostgreSQL (Optional):** Change `DB_TYPE=postgres` and `DATABASE_URL=postgresql://user:pass@host:port/dbname` to use a real PostgreSQL database (local or cloud-hosted).

### 3. Start the server
```powershell
go run .
```
The server will:
* Automatically create the local `pastey.db` SQLite database file (if using SQLite).
* Run GORM `AutoMigrate` to configure all tables.
* Start the API at **http://localhost:4000**.

---

## Running Tests

Run all unit and integration tests using standard Go commands:
```powershell
go test -v ./...
```
Tests automatically spin up an isolated, temporary **in-memory SQLite database**, ensuring they run instantly and leave no stale data.

---

## Project Structure

```
backend/
├── main.go               # Server entry point, Chi router config, GORM AutoMigrate
├── .env                  # Environment configuration variables
├── README.md             # This instructions file
├── database/
│   └── database.go       # Shared GORM DB connection initialization
├── middleware/
│   └── auth.go           # Chi JWT extraction and validation middleware
├── shared/
│   └── types.go          # Shared context keys and user identity structs
├── auth/                 # Auth module
│   ├── auth.go           # Signup, login, refresh, logout HTTP handlers
│   ├── models.go         # User & RefreshToken schema definitions
│   ├── tokens.go         # Access token (JWT) & refresh token helpers
│   └── auth_test.go      # HTTP and token unit tests (SQLite in-memory)
└── pastes/               # Pastes module
    ├── pastes.go         # List, get, create, update, delete pastes HTTP handlers
    ├── models.go         # Paste schema definitions
    └── pastes_test.go    # HTTP pastes unit/integration tests (SQLite in-memory)
```

---

## API Endpoints

Base URL: `http://localhost:4000`

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/signup` | — | Register. Returns `access_token` + `refresh_token` |
| `POST` | `/auth/login` | — | Login. Returns `access_token` + `refresh_token` |
| `POST` | `/auth/refresh` | — | Exchange refresh token → new token pair (rotation) |
| `POST` | `/auth/logout` | — | Revoke refresh token |
| `GET` | `/auth/me` | 🔒 JWT | Get current user profile |

### Pastes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/pastes` | — | List recent public pastes (`?limit=20&offset=0`) |
| `POST` | `/pastes` | optional 🔒 | Create paste (anonymous or linked to account) |
| `GET` | `/pastes/:id` | optional 🔒 | Get paste (visibility enforced) |
| `PUT` | `/pastes/:id` | 🔒 JWT | Update paste (owner only) |
| `DELETE` | `/pastes/:id` | 🔒 JWT | Delete paste (owner only) |
| `GET` | `/pastes/:id/raw` | optional 🔒 | Get raw content of a paste |

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/users/me/pastes` | 🔒 JWT | Get all pastes by current authenticated user |
| `GET` | `/users/:username/pastes` | — | Get all public pastes of a specific user |

### Authentication Header
```
Authorization: Bearer <access_token>
```
