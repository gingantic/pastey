import type { PageServerLoad } from './$types';
import { BACKEND_URL } from '$env/static/private';

export const load: PageServerLoad = async () => {
	try {
		const res = await fetch(`${BACKEND_URL}/status`);
		if (!res.ok) {
			return {
				status: 'error',
				error: `Backend returned status ${res.status}`
			};
		}
		const data = await res.json();
		return {
			status: 'success',
			data
		};
	} catch (e: any) {
		console.error('Failed to load status from backend:', e);
		return {
			status: 'error',
			error: e.message || 'Could not connect to the backend server'
		};
	}
};
