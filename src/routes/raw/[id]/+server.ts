import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import * as pastesHandler from '$lib/server/handlers/pastes';

export const GET: RequestHandler = async ({ params, locals }) => {
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
		const res = await pastesHandler.getRawPaste(id, currentUser);
		
		if (res.status !== 200) {
			throw error(res.status, res.error || 'Failed to fetch raw paste');
		}

		return new Response(res.rawContent, {
			headers: {
				'Content-Type': 'text/plain; charset=utf-8'
			}
		});
	} catch (e: any) {
		if (e.status) throw e;
		throw error(500, e.message || 'Internal server error');
	}
};
