import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import * as pastesHandler from '$lib/server/handlers/pastes';
import {
	CACHE_CONTROL_PRIVATE,
	applyPasteCacheTag,
	cacheableHeaders,
	etagMatches,
	pasteCacheTag,
	pasteETag
} from '$lib/server/httpCache';

export const GET: RequestHandler = async ({ params, locals, request }) => {
	const id = params.id;
	if (!id) {
		throw error(400, 'Missing paste ID');
	}

	const currentUser = locals.user ? {
		user_id: locals.user.id,
		username: locals.user.username,
		email: locals.user.email,
		is_admin: locals.user.is_admin
	} : null;

	try {
		const res = await pastesHandler.getPaste(id, currentUser);

		if (res.status !== 200 || !res.data) {
			throw error(res.status, res.error || 'Failed to fetch raw paste');
		}

		const paste = res.data;

		// Only let the shared CDN cache anonymous, non-private responses. Private
		// pastes and logged-in requests must never be stored on a shared cache.
		const cacheable = !currentUser && paste.visibility !== 'private';

		const etag = pasteETag(paste);
		const headers: Record<string, string> = {
			'Content-Type': 'text/plain; charset=utf-8',
			ETag: etag
		};

		if (cacheable) {
			// Standards-based caching for any host, plus Vercel long-cache + purge
			// tag layered on top. Off Vercel the Vercel-* headers are inert and the
			// portable s-maxage keeps working.
			Object.assign(headers, cacheableHeaders(pasteCacheTag(id)));
			// Reliably register the purge tag via the official Vercel API so
			// invalidateByTag() can actually evict this entry on edit/delete.
			await applyPasteCacheTag(id);
		} else {
			headers['Cache-Control'] = CACHE_CONTROL_PRIVATE;
		}

		// Conditional request: if the client's cached copy still matches, skip
		// sending the body entirely.
		if (etagMatches(request.headers.get('if-none-match'), etag)) {
			return new Response(null, { status: 304, headers });
		}

		return new Response(paste.content, { headers });
	} catch (e: any) {
		if (e.status) throw e;
		throw error(500, e.message || 'Internal server error');
	}
};
