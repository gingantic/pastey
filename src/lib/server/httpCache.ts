import crypto from 'crypto';

// Short shared-cache window. A compliant CDN (Vercel, Cloudflare, Netlify, etc.)
// serves repeat requests from the edge for this many seconds, then revalidates
// against the origin. The window is deliberately small so edits appear quickly
// without needing any vendor-specific purge. Revalidation is cheap because the
// ETag lets the origin answer unchanged requests with a bodyless 304, so origin
// transfer stays low even after the window elapses.
const SHARED_MAX_AGE_SECONDS = 180; // fresh at the edge for 1 minute

// While revalidating, keep serving the last good copy briefly so users never
// block on the origin. Kept short so stale content can't linger long.
const STALE_WHILE_REVALIDATE_SECONDS = 300; // up to 5 min stale while refreshing

// Browsers always revalidate (via the ETag), so an edit is reflected on the
// next request regardless of the shared-cache window.
export const CACHE_CONTROL_SHARED = `public, max-age=0, s-maxage=${SHARED_MAX_AGE_SECONDS}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`;

/** Header for responses that must never be stored by a shared cache. */
export const CACHE_CONTROL_PRIVATE = 'private, no-cache';

/**
 * Headers that make a response cacheable on a shared CDN in a vendor-neutral
 * way. A single standard `Cache-Control` is understood by every CDN and browser,
 * so this behaves identically on Vercel or anywhere else — no lock-in, no
 * purge backend required.
 */
export function cacheableHeaders(): Record<string, string> {
	return {
		'Cache-Control': CACHE_CONTROL_SHARED
	};
}

/**
 * Build a strong ETag that fingerprints the current state of a paste. It changes
 * whenever the content changes because it folds in `updated_at` (bumped on every
 * edit). Visibility is included so a public<->private flip also busts the tag.
 *
 * The ETag lets a revalidation return a bodyless 304 when nothing changed, which
 * is what keeps origin transfer low despite the short cache window.
 */
export function pasteETag(paste: { id: string; updated_at: unknown; visibility: string }): string {
	const basis = `${paste.id}:${String(paste.updated_at)}:${paste.visibility}`;
	const hash = crypto.createHash('sha1').update(basis).digest('base64url');
	return `"${hash}"`;
}

/**
 * Compare the client's If-None-Match against the current ETag. Handles the
 * comma-separated list form and the `W/` weak prefix per RFC 9110.
 */
export function etagMatches(ifNoneMatch: string | null, etag: string): boolean {
	if (!ifNoneMatch) return false;
	if (ifNoneMatch.trim() === '*') return true;
	const normalize = (t: string) => t.trim().replace(/^W\//, '');
	const target = normalize(etag);
	return ifNoneMatch.split(',').some((candidate) => normalize(candidate) === target);
}
