import type { PageServerLoad } from './$types';
import { mapBackendPaste } from '$lib/pasteStore';
import { error } from '@sveltejs/kit';
import * as pastesHandler from '$lib/server/handlers/pastes';

export const load: PageServerLoad = async ({ params, locals }) => {
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
