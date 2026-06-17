# Pastey — Premium & Modern Code Sharing Tool

A premium, modern code sharing and pastebin tool built with Svelte 5 and Tailwind CSS v4. Pastey is designed to be sleek, lightweight, and blazing-fast, allowing users to share code snippets instantly with options for syntax highlighting, expiry, and visibility settings.

---

## 🚀 Key Features

- **Sleek Code Editor (`PasteEditor.svelte`)**:
  - Live syntax-highlighted editor with line numbers and character statistics.
  - Dropdown options for selecting syntax language (JavaScript, Go, Python, Svelte, SQL, etc.).
  - Custom visibility controls (Public, Unlisted, Private).
  - Expiry durations ranging from 10 minutes to never.
- **Code Viewer (`PasteViewer.svelte`)**:
  - Highlights code blocks dynamically based on the chosen language.
  - One-click action to copy the raw paste content or copy the shareable link.
  - Layout showcases views, authors, and creation timestamps.
- **User Authentication & Profiles**:
  - Secure registration and login flows.
  - Transparent HTTP-only cookie session management with automatic access-token refreshes.
  - Personalized profile dashboard (`/u/[username]`) containing user-specific statistics and paste listings.
- **Dual Database Adapters**:
  - Fully decoupled database layer with support for both **SQLite** (via `better-sqlite3`) and **PostgreSQL** (via `pg`).
  - Configured dynamically via environment variables with auto-migration/table generation on startup.
  - Type-safe queries using **Drizzle ORM**.
- **Role-Based Access Control (RBAC) Admin Panel**:
  - Secured dashboard located at `/admin` for site administrators.
  - List and search registered users, manage/toggle admin rights, and delete user accounts.
  - Search, track view counts, and delete pastes system-wide.
- **Dynamic Page Navigation Loading Bar**:
  - Sleek top-loading progress bar (`LoadingBar.svelte`) to indicate route transition state and async data fetching.
- **Case-Sensitive Short IDs**:
  - Generates short, memorable 4-character case-sensitive paste identifiers (e.g. `aB9x`), with automatic collision resolution.
- **Interactive Component Playground (`/ui-kit`)**:
  - Showcase for custom UI tokens, layouts, and reusable glassmorphic components (`Button`, `Badge`, `Card`, `Input`, `TextArea`, `Slider`, `Timeline`).
- **Premium Visual Aesthetics**:
  - Deep dark background theme (`#050505`) with custom neon highlights and elegant glassmorphic layouts.
  - Subtle micro-animations and smooth page transitions using Tailwind transitions and CSS animations.

---

## 🛠️ Technology Stack

- **Framework**: [Svelte 5](https://svelte.dev/) (runes `$state`, `$derived`, `$effect`, and snippets) & [SvelteKit 2](https://kit.svelte.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (using the `@tailwindcss/vite` plugin)
- **Database ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Jose](https://github.com/panva/jose) (JWT signing and verification) & [Bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Syntax Highlighting**: [PrismJS](https://prismjs.com/) for lightweight token parsing
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite 8](https://vite.dev/)
- **Testing**: [Vitest](https://vitest.dev/) for unit tests

---

## 📂 Project Structure

Below is an overview of the key file structure in `src/`:

```
src/
├── app.css              # Global styles & Tailwind v4 theme configs
├── app.d.ts             # TypeScript definitions
├── app.html             # Core HTML template entrypoint
├── hooks.server.ts      # Server-side hooks (middleware for auth/token refreshing)
├── lib/
│   ├── assets/          # Static assets and icons
│   ├── authStore.svelte.ts # Svelte reactive auth state manager
│   ├── index.ts         # Export definitions
│   ├── pasteStore.ts    # Svelte store/helpers for paste management
│   ├── components/      # Core reusable Svelte 5 components
│   │   ├── Badge.svelte
│   │   ├── Button.svelte
│   │   ├── Card.svelte
│   │   ├── Footer.svelte
│   │   ├── Header.svelte
│   │   ├── Input.svelte
│   │   ├── LoadingBar.svelte # Top-loading page transition progress indicator
│   │   ├── Slider.svelte
│   │   ├── TextArea.svelte
│   │   ├── Timeline.svelte
│   │   └── pastey/      # Pastey-specific modules
│   │       ├── CodeEditor.svelte
│   │       ├── CodeViewer.svelte
│   │       ├── Dropdown.svelte
│   │       ├── PasteEditor.svelte
│   │       └── PasteViewer.svelte
│   └── server/          # Server-side business logic and DB interfaces
│       ├── auth.ts      # Password hashing & JWT generation/verification
│       ├── db.ts        # Database adapter interface & loader
│       ├── db.postgres.ts # PostgreSQL adapter implementation (via Drizzle ORM)
│       ├── db.sqlite.ts # SQLite adapter implementation (via Drizzle ORM)
│       ├── schema.postgres.ts # Drizzle PostgreSQL schema definitions
│       ├── schema.sqlite.ts # Drizzle SQLite schema definitions
│       └── handlers/    # Route handlers for SvelteKit endpoints
│           ├── admin.ts
│           ├── auth.ts
│           ├── pastes.ts
│           └── status.ts
└── routes/
    ├── +layout.server.ts # Server loader for auth user state injection
    ├── +layout.svelte   # Root layout config containing Header, Footer, and LoadingBar
    ├── +page.svelte     # Main Pastey root editor page
    ├── [id]/            # Route for viewing individual pastes (by short ID)
    │   ├── +page.server.ts
    │   └── +page.svelte
    ├── admin/           # Admin Dashboard panel
    │   ├── +page.server.ts
    │   └── +page.svelte
    ├── api/             # SvelteKit catch-all API proxy routes
    │   └── [...path]/
    │       └── +server.ts
    ├── login/           # User authentication routes
    │   └── +page.svelte
    ├── raw/             # Route for serving raw text of pastes
    │   └── [id]/
    │       └── +server.ts
    ├── signup/          # User sign up route
    │   └── +page.svelte
    ├── u/               # User-specific routes
    │   └── [username]/
    │       ├── +page.server.ts
    │       └── +page.svelte
    └── ui-kit/          # UI Kit component playground
        └── +page.svelte
```

---

## 💻 Local Development

Ensure you have [Node.js](https://nodejs.org/) installed, then follow the instructions below:

### 1. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Configure the variables in `.env`:
- `DB_TYPE`: Either `sqlite` or `postgres` to select the database adapter.
- `DATABASE_URL`: Path to the SQLite database file (e.g. `pastey.db`) or a PostgreSQL connection string.
- `JWT_SECRET`: A secure random key of at least 32 characters to sign authentication tokens.
- `JWT_ACCESS_EXPIRY_SECONDS` / `JWT_REFRESH_EXPIRY_SECONDS`: Expiry durations for tokens.

### 2. Installation

Install all required package dependencies:

```bash
npm install
```

### 3. Development Server

Start the local development server:

```bash
npm run dev
```

The application will run on `http://localhost:5173`.

### 4. Running Tests

Run unit tests via Vitest:

```bash
npm run test
```

### 5. Diagnostics & Build

To run diagnostics and check TypeScript definitions:

```bash
npm run check
```

To build the optimized production bundle:

```bash
npm run build
```
