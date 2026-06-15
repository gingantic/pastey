import type { PageServerLoad } from './$types';
import * as statusHandler from '$lib/server/handlers/status';

export const load: PageServerLoad = async () => {
	try {
		const data = await statusHandler.getStatus();
		return {
			status: 'success',
			data
		};
	} catch (e: any) {
		console.error('Failed to load status directly:', e);
		return {
			status: 'error',
			error: e.message || 'Could not fetch status metrics'
		};
	}
};
