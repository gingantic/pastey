import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ params, fetch, cookies }) => {
	const id = params.id;
	if (!id) {
		throw error(400, 'Missing paste ID');
	}

	const token = cookies.get('pastey_token');
	const headers: Record<string, string> = {};
	if (token) {
		headers['authorization'] = `Bearer ${token}`;
	}

	try {
		const response = await fetch(`${BACKEND_URL}/pastes/${id}/raw`, { headers });
		if (!response.ok) {
			if (response.status === 404) {
				throw error(404, 'Paste not found or has expired');
			}
			throw error(response.status, 'Failed to fetch raw paste');
		}

		const content = await response.text();
		return new Response(content, {
			headers: {
				'Content-Type': 'text/plain; charset=utf-8'
			}
		});
	} catch (e: any) {
		if (e.status) {
			throw e;
		}
		throw error(500, e.message || 'Internal server error');
	}
};
