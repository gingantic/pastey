# Pastey — Minimal Code Sharing Tool

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
- **Interactive Component Playground (`/ui-kit`)**:
  - Showcase for custom UI tokens, layouts, and reusable components (`Button`, `Badge`, `Card`, `Input`, `TextArea`).
- **Premium Visual Aesthetics**:
  - Deep dark background theme (`#050505`) with custom neon highlights and elegant glassmorphic components.
  - Micro-animations and smooth page transitions using Tailwind transitions and CSS animations.

---

## 🛠️ Technology Stack

- **Framework**: [Svelte 5](https://svelte.dev/) (using runes like `$state`, `$derived`, `$effect`, and Svelte snippets) & [SvelteKit 2](https://kit.svelte.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (utilizing the `@tailwindcss/vite` plugin)
- **Syntax Highlighting**: [PrismJS](https://prismjs.com/) for lightweight token parsing
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite 8](https://vite.dev/)

---

## 📂 Project Structure

Below is an overview of the key file structure in `src/`:

```
src/
├── lib/
│   ├── assets/          # Static assets and icons
│   ├── components/      # Core reusable Svelte 5 components
│   │   ├── Badge.svelte
│   │   ├── Button.svelte
│   │   ├── Card.svelte
│   │   ├── Input.svelte
│   │   ├── TextArea.svelte
│   │   └── pastey/      # Pastey-specific modules
│   │       ├── CodeEditor.svelte
│   │       ├── CodeViewer.svelte
│   │       ├── Dropdown.svelte
│   │       ├── PasteEditor.svelte
│   │       └── PasteViewer.svelte
│   └── index.ts
├── routes/
│   ├── ui-kit/
│   │   └── +page.svelte # UI Kit component playground
│   ├── +layout.svelte   # Root layout config
│   └── +page.svelte     # Main Pastey root editor/viewer page
├── app.css              # Global styles & Tailwind v4 theme configs
├── app.d.ts             # TypeScript definitions
└── app.html             # Core HTML template entrypoint
```

---

## 💻 Local Development

Ensure you have [Node.js](https://nodejs.org/) installed, then follow the instructions below:

### 1. Installation

Install all required package dependencies:

```bash
npm install
```

### 2. Development Server

Start the local development server:

```bash
npm run dev
```

The application will run on `http://localhost:5173`.

### 3. Build & Type Checking

To run diagnostics and check types:

```bash
npm run check
```

To build the optimized production bundle:

```bash
npm run build
```
