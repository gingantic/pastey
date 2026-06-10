import type { PageServerLoad } from './$types';
import { mapBackendPaste } from '$lib/pasteStore';
import { error } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const id = params.id;
	const token = cookies.get('pastey_token');
	
	const headers: Record<string, string> = {};
	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	try {
		const res = await fetch(`${BACKEND_URL}/pastes/${id}`, { headers });
		if (!res.ok) {
			if (res.status === 404) {
				return { paste: null, id };
			}
			throw error(res.status, 'Failed to fetch paste');
		}

		const data = await res.json();
		return {
			paste: mapBackendPaste(data),
			id
		};
	} catch (e: any) {
		if (e.status) throw e;
		console.error(`Error loading paste ${id} server-side:`, e);
		return { paste: null, id };
	}
};
