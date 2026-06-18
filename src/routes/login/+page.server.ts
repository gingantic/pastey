import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		// If already logged in, respect the redirect param or go home
		const redirectTo = url.searchParams.get('redirect') || '/';
		throw redirect(302, redirectTo);
	}
	return {
		redirectTo: url.searchParams.get('redirect') || '/'
	};
};

