import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}
	if (!locals.user.is_admin) {
		throw error(403, 'Forbidden: Admin access required');
	}
};
