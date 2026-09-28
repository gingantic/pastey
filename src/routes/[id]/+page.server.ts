import type { PageServerLoad } from './$types';
import { mapBackendPaste } from '$lib/pasteStore';
import { error } from '@sveltejs/kit';
import * as pastesHandler from '$lib/server/handlers/pastes';
import { cacheableHeaders } from '$lib/server/httpCache';

export const load: PageServerLoad = async ({ params, locals, setHeaders }) => {
	const id = params.id;
	
	const currentUser = locals.user ? {
		user_id: locals.user.id,
		username: locals.user.username,
		email: locals.user.email,
		is_admin: locals.user.is_admin
	} : null;

	try {
		const res = await pastesHandler.getPaste(id, currentUser);
		
		if (res.status !== 200) {
			if (res.status === 404) {
				return { paste: null, id };
			}
			throw error(res.status, res.error || 'Failed to fetch paste');
		}

		// Allow a shared CDN to cache the rendered page so repeat views are
		// served from the edge instead of re-rendering on the origin (cuts
		// Fast Origin Transfer). Only cache when it's safe:
		//   - anonymous request (no logged-in user => no personalized layout)
		//   - paste is public or unlisted (never private)
		// Authenticated/private requests fall through and stay uncached.
		// Portable short-window caching (standard Cache-Control) works on any
		// host; an edit shows up within the s-maxage window. No vendor lock-in.
		if (!currentUser && res.data && res.data.visibility !== 'private') {
			setHeaders(cacheableHeaders());
		}

		return {
			paste: mapBackendPaste(res.data),
			id
		};
	} catch (e: any) {
		if (e.status) throw e;
		console.error(`Error loading paste ${id} server-side:`, e);
		return { paste: null, id };
	}
};
