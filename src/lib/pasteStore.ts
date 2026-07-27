import { auth } from './authStore.svelte';

export interface Paste {
	id: string;
	title: string;
	content: string;
	lang: string;
	expiry: string;
	visibility: 'public' | 'unlisted' | 'private';
	author: string;
	date: string;
	views: number;
	expires_at: string | null;
}

function formatPasteDate(dateStr: string): string {
	const d = new Date(dateStr);
	const datePart = d.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
	const timePart = d.toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	});
	return `${datePart} · ${timePart}`;
}

export function mapBackendPaste(p: any): Paste {
	return {
		id: p.id,
		title: p.title || 'Untitled',
		content: p.content,
		lang: p.lang || 'plaintext',
		expiry: p.expiry || 'never',
		visibility: p.visibility || 'public',
		author: p.author_name || 'Anonymous',
		date: formatPasteDate(p.created_at),
		views: p.views || 0,
		expires_at: p.expires_at || null
	};
}

export async function deletePaste(id: string): Promise<void> {
	const res = await auth.fetchWithAuth(`/api/pastes/${id}`, {
		method: 'DELETE'
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.error || `Failed to delete paste: HTTP ${res.status}`);
	}
}
