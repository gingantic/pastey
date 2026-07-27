import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { mapBackendPaste } from '$lib/pasteStore';
import * as pastesHandler from '$lib/server/handlers/pastes';

// Build handler claims from the session — pages talk to the codebase logic
// directly so the REST API can stay fully auth-gated.
function toClaims(locals: App.Locals) {
	return locals.user
		? {
				user_id: locals.user.id,
				username: locals.user.username,
				email: locals.user.email,
				is_admin: locals.user.is_admin
			}
		: null;
}

function pasteDataFromForm(form: FormData) {
	return {
		title: (form.get('title') as string) || '',
		content: (form.get('content') as string) || '',
		lang: (form.get('lang') as string) || '',
		expiry: (form.get('expiry') as string) || 'never',
		visibility: ((form.get('visibility') as string) || 'public') as
			| 'public'
			| 'unlisted'
			| 'private',
		custom_slug: (form.get('custom_slug') as string) || undefined
	};
}

export const load: PageServerLoad = async ({ url, locals }) => {
	const editId = url.searchParams.get('edit');
	if (!editId || !locals.user) {
		return { editPaste: null };
	}

	const res = await pastesHandler.getPaste(editId, toClaims(locals));
	if (res.status !== 200 || !res.data) {
		return { editPaste: null };
	}

	// Only the author may edit their paste
	if ((res.data.author_name || '').toLowerCase() !== locals.user.username.toLowerCase()) {
		return { editPaste: null };
	}

	return { editPaste: mapBackendPaste(res.data) };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const form = await request.formData();
		const res = await pastesHandler.createPaste(pasteDataFromForm(form), toClaims(locals));

		if (res.status >= 400 || !res.data) {
			return fail(res.status, { error: res.error || 'Failed to save paste' });
		}
		return { paste: { id: res.data.id } };
	},

	update: async ({ request, locals }) => {
		const form = await request.formData();
		const id = (form.get('id') as string) || '';
		const res = await pastesHandler.updatePaste(id, pasteDataFromForm(form), toClaims(locals));

		if (res.status >= 400) {
			return fail(res.status, { error: res.error || 'Failed to update paste' });
		}
		return { paste: { id } };
	}
};
