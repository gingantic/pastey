import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const username = params.username;
	const token = cookies.get('pastey_token');
	
	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};
	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	try {
		const res = await fetch(`${BACKEND_URL}/users/${username}/pastes`, { headers });
		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			throw error(res.status, body.error || 'Failed to load user pastes');
		}

		const json = await res.json();
		return {
			username,
			pastes: json.pastes ?? [],
			total: json.total ?? 0
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
