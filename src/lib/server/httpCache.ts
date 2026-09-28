import crypto from 'crypto';

// --- Portable (standards-based) cache window ---------------------------------
// Emitted as a plain `Cache-Control` header that every compliant CDN and browser
// understands. This is the fallback that keeps caching working on ANY host
// (Netlify, a VPS, Cloudflare, self-hosted Node, etc.) with no vendor lock-in.
//
// Because non-Vercel shared caches can't be purged on demand, this window is
// intentionally short: an edit self-heals within SHARED_MAX_AGE_SECONDS, and
// stale-while-revalidate means users never block on the origin meanwhile.
const SHARED_MAX_AGE_SECONDS = 60 * 5; // 5 min at any shared cache
const SHARED_STALE_WHILE_REVALIDATE_SECONDS = 60 * 60 * 24; // serve stale up to 1 day while refreshing

// --- Vercel-specific long window ---------------------------------------------
// Vercel reads `Vercel-CDN-Cache-Control` in preference to `Cache-Control`, so
// on Vercel we cache far longer and rely on tag-based purging (purgePaste) to
// bust the entry the instant a paste changes. Other CDNs ignore this header and
// fall back to the portable window above.
const VERCEL_EDGE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
const VERCEL_STALE_WHILE_REVALIDATE_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Browsers always revalidate (via the ETag), so a purge / edit is reflected on
// the next request regardless of the shared-cache window.
export const CACHE_CONTROL_SHARED = `public, max-age=0, s-maxage=${SHARED_MAX_AGE_SECONDS}, stale-while-revalidate=${SHARED_STALE_WHILE_REVALIDATE_SECONDS}`;
export const CACHE_CONTROL_VERCEL_CDN = `public, max-age=${VERCEL_EDGE_MAX_AGE_SECONDS}, stale-while-revalidate=${VERCEL_STALE_WHILE_REVALIDATE_SECONDS}`;

/**
 * Headers that make a response cacheable on a shared CDN in a vendor-neutral
 * way, with Vercel-specific enhancements layered on top when available.
 *
 * - `Cache-Control` (standard): portable moderate window honored everywhere.
 * - `Vercel-CDN-Cache-Control`: Vercel-only long window; ignored by other CDNs.
 * - `Vercel-Cache-Tag`: Vercel-only purge tag; ignored by other CDNs.
 *
 * Moving off Vercel needs no code change — the standard header keeps working and
 * the two `Vercel-*` headers simply become inert.
 *
 * NOTE: the `Vercel-Cache-Tag` header alone is not reliably indexed by the CDN
 * when set through the SvelteKit adapter, so pair this with applyPasteCacheTag()
 * which registers the tag via the official @vercel/functions API at request
 * time. That is what makes invalidateByTag() actually purge the entry.
 */
export function cacheableHeaders(cacheTag: string): Record<string, string> {
	return {
		'Cache-Control': CACHE_CONTROL_SHARED,
		'Vercel-CDN-Cache-Control': CACHE_CONTROL_VERCEL_CDN,
		'Vercel-Cache-Tag': cacheTag
	};
}

/**
 * Register a paste's cache tag on the response the CDN is about to store, using
 * the official Vercel API. This is the reliable counterpart to purgePaste():
 * addCacheTag() here creates the tag->entry association that invalidateByTag()
 * later purges. No-op off Vercel; errors are swallowed so a tagging hiccup never
 * breaks the response.
 */
export async function applyPasteCacheTag(id: string): Promise<void> {
	if (!process.env.VERCEL) return;

	try {
		const { addCacheTag } = await import('@vercel/functions');
		await addCacheTag(pasteCacheTag(id));
	} catch (err) {
		console.error(`Failed to add cache tag for paste ${id}:`, err);
	}
}

/** Header for responses that must never be stored by a shared cache. */
export const CACHE_CONTROL_PRIVATE = 'private, no-cache';

/**
 * Cache tag for a single paste. Every cacheable response for a paste carries
 * this tag (via the Vercel-Cache-Tag header) so purgePaste() can invalidate
 * exactly that paste's page and raw endpoint together.
 */
export function pasteCacheTag(id: string): string {
	return `paste:${id}`;
}

/**
 * Build a strong ETag that fingerprints the current state of a paste. It changes
 * whenever the content changes because it folds in `updated_at` (bumped on every
 * edit). Visibility is included so a public<->private flip also busts the tag.
 *
 * The ETag is the vendor-neutral half of freshness: it works on every host and
 * lets the origin answer unchanged requests with a bodyless 304.
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

/**
 * Invalidate every cached response tagged for this paste (its rendered page and
 * its raw endpoint) on Vercel's CDN. Invalidation marks entries stale and
 * refreshes them in the background, so there's no cache-stampede risk.
 *
 * Vendor-neutral by design: off Vercel there's no purge backend, so this is a
 * no-op and the shorter standard `s-maxage` window handles freshness instead.
 * Failures are swallowed and logged — a purge miss must never break the mutation
 * that triggered it.
 */
export async function purgePaste(id: string): Promise<void> {
	// Only Vercel's runtime provides the purge backend. Skip elsewhere.
	if (!process.env.VERCEL) return;

	try {
		const { invalidateByTag } = await import('@vercel/functions');
		await invalidateByTag(pasteCacheTag(id));
	} catch (err) {
		console.error(`Failed to purge CDN cache for paste ${id}:`, err);
	}
}
