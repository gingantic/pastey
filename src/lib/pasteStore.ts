export interface Paste {
	id: string;
	title: string;
	content: string;
	lang: string;
	expiry: string;
	visibility: 'public' | 'unlisted' | 'private';
	author: string;
	date: string;
	views: number;
}

const defaultPastes: Paste[] = [
	{
		id: 'a1b2c3',
		title: 'golang middleware snippet',
		lang: 'go',
		author: 'reihan.dev',
		date: 'Jun 5, 2026 · 08:30',
		views: 147,
		visibility: 'public',
		expiry: 'never',
		content: `package middleware

import (
	"context"
	"net/http"
	"time"

	"github.com/rs/zerolog/log"
)

// LoggingMiddleware logs each request with method, path, status and latency.
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rw := &responseWriter{ResponseWriter: w, status: http.StatusOK}

		next.ServeHTTP(rw, r)

		log.Info().
			Str("method", r.Method).
			Str("path", r.URL.Path).
			Int("status", rw.status).
			Dur("latency", time.Since(start)).
			Msg("request")
	})
}

type responseWriter struct {
	http.ResponseWriter
	status int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}`
	},
	{
		id: 'd4e5f6',
		title: 'svelte 5 runes example',
		lang: 'svelte',
		author: 'reihan.dev',
		date: '1 hr ago',
		views: 42,
		visibility: 'private',
		expiry: 'never',
		content: `<script lang="ts">
	let count = $state(0);
	let doubled = $derived(count * 2);

	function increment() {
		count += 1;
	}
</script>

<button onclick={increment}>
	Count: {count} (Doubled: {doubled})
</button>`
	},
	{
		id: 'g7h8i9',
		title: 'docker-compose config',
		lang: 'yaml',
		author: 'reihan.dev',
		date: '3 hr ago',
		views: 98,
		visibility: 'public',
		expiry: 'never',
		content: `version: '3.8'

services:
  web:
    build: .
    ports:
      - "5173:5173"
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules`
	},
	{
		id: 'j1k2l3',
		title: 'postgres schema init',
		lang: 'sql',
		author: 'reihan.dev',
		date: 'yesterday',
		views: 204,
		visibility: 'public',
		expiry: 'never',
		content: `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`
	},
	{
		id: 'm4n5o6',
		title: 'nginx reverse proxy',
		lang: 'nginx',
		author: 'reihan.dev',
		date: '2 days ago',
		views: 11,
		visibility: 'private',
		expiry: 'never',
		content: `server {
    listen 80;
    server_name reihan.dev;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`
	}
];

export function getPastes(): Paste[] {
	if (typeof window === 'undefined') return defaultPastes;
	const stored = localStorage.getItem('pastey_pastes');
	if (!stored) {
		localStorage.setItem('pastey_pastes', JSON.stringify(defaultPastes));
		return defaultPastes;
	}
	try {
		return JSON.parse(stored);
	} catch (e) {
		return defaultPastes;
	}
}

export function savePaste(paste: Paste) {
	if (typeof window === 'undefined') return;
	const pastes = getPastes();
	pastes.unshift(paste);
	localStorage.setItem('pastey_pastes', JSON.stringify(pastes));
}

export function getPasteById(id: string): Paste | undefined {
	const pastes = getPastes();
	return pastes.find((p) => p.id === id);
}
