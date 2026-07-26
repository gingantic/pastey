import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSystemStatus } from '$lib/server/handlers/status';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}
	if (!locals.user.is_admin) {
		throw error(403, 'Forbidden: Admin access required');
	}

	// System status is computed directly on the server instead of via an API endpoint
	return {
		status: await getSystemStatus()
	};
};
