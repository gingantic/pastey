import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { mapBackendPaste } from '$lib/pasteStore';
import * as pastesHandler from '$lib/server/handlers/pastes';

export const load: PageServerLoad = async ({ params, locals }) => {
	const username = params.username;
	
	const currentUser = locals.user ? {
		user_id: locals.user.id,
		username: locals.user.username,
		email: locals.user.email,
		is_admin: locals.user.is_admin
	} : null;

	try {
		const res = await pastesHandler.personalPastes(username, currentUser);
		if (res.status !== 200 || !res.data) {
			throw error(res.status, (res && 'error' in res ? res.error : undefined) || 'Failed to load user pastes');
		}

		return {
			username,
			pastes: (res.data.pastes ?? []).map(mapBackendPaste),
			total: res.data.total ?? 0
		};
	} catch (e: any) {
		if (e.status) throw e;
		console.error(`Error loading user ${username} pastes server-side:`, e);
		return {
			username,
			pastes: [],
			total: 0,
			error: e.message || 'Failed to load user profile'
		};
	}
};
