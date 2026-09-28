import crypto from 'crypto';
import { getDB } from '../db';
import { checkRateLimit } from '../rateLimit';

// Generates a case-sensitive random alphanumeric string of the specified length for use as a paste ID.
function generatePasteId(length = 4): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let id = '';
	for (let i = 0; i < length; i++) {
		id += chars[crypto.randomInt(0, chars.length)];
	}
	return id;
}

// Route segments that must never be used as paste slugs.
const RESERVED_SLUGS = new Set([
	'api', 'login', 'signup', 'logout', 'admin', 'raw', 'u',
	'status', 'auth', 'users', 'pastes', 'ui-kit'
]);

// Validate a user-supplied custom slug.
function validateCustomSlug(slug: string): string | null {
	if (!/^[a-zA-Z0-9_-]{3,50}$/.test(slug)) {
		return 'Custom URL must be 3–50 characters and contain only letters, numbers, hyphens, or underscores.';
	}
	if (RESERVED_SLUGS.has(slug.toLowerCase())) {
		return `"${slug}" is a reserved name and cannot be used as a custom URL.`;
	}
	return null;
}

function validVisibility(v: string): string {
	switch (v) {
		case 'public':
		case 'unlisted':
		case 'private':
			return v;
		default:
			return 'public';
	}
}

function validLang(l: string): string {
	if (!l || l.trim() === '') {
		return 'plaintext';
	}
	return l;
}

function getExpiresAt(expiry: string): Date | null {
	let ms = 0;
	switch (expiry) {
		case '10m':
			ms = 10 * 60 * 1000;
			break;
		case '1h':
			ms = 60 * 60 * 1000;
			break;
		case '1d':
			ms = 24 * 60 * 60 * 1000;
			break;
		case '1w':
			ms = 7 * 24 * 60 * 60 * 1000;
			break;
		case '1mo':
			ms = 30 * 24 * 60 * 60 * 1000;
			break;
		default:
			return null; // never or unknown
	}
	return new Date(Date.now() + ms);
}

export async function createPaste(body: any, currentUser: any, ip?: string) {
	const { title, content, lang, expiry, visibility, custom_slug } = body || {};

	if (!content || content.trim() === '') {
		return { status: 400, error: 'content cannot be empty' };
	}

	// Gate before touching the database: limit paste creation per IP within an
	// hour so a single client can't hammer the DB. Runs before getDB()/queries.
	if (ip) {
		const rate = await checkRateLimit(ip);
		if (!rate.allowed) {
			return {
				status: 429,
				error: `too many pastes from your IP, please try again in ${rate.retryAfter} seconds`,
				retryAfter: rate.retryAfter
			};
		}
	}

	const db = await getDB();

	let uniqueId = '';

	// Custom slug path — only available to authenticated users
	if (custom_slug && custom_slug.trim() !== '') {
		if (!currentUser) {
			return { status: 403, error: 'you must be logged in to use a custom URL' };
		}
		const slugError = validateCustomSlug(custom_slug.trim());
		if (slugError) {
			return { status: 400, error: slugError };
		}
		const existing = await db.getPasteById(custom_slug.trim());
		if (existing) {
			return { status: 409, error: 'that custom URL is already taken, please choose another' };
		}
		uniqueId = custom_slug.trim();
	} else {
		// Auto-generate a random short ID
		let idLength = 4;
		while (true) {
			uniqueId = generatePasteId(idLength);
			const existing = await db.getPasteById(uniqueId);
			if (!existing) {
				break;
			}
			idLength++;
		}
	}

	const paste = {
		id: uniqueId,
		title: !title || title.trim() === '' ? 'Untitled' : title.trim(),
		content: content,
		lang: validLang(lang),
		expiry: expiry || 'never',
		visibility: validVisibility(visibility),
		author_id: currentUser ? currentUser.user_id : null,
		author_name: currentUser ? currentUser.username : 'Anonymous',
		views: 0,
		created_at: new Date(),
		updated_at: new Date(),
		expires_at: getExpiresAt(expiry)
	};

	await db.createPaste(paste);
	return { status: 201, data: paste };
}

export async function getPaste(id: string, currentUser: any): Promise<{ status: number; data?: any; error?: string }> {
	if (!id) {
		return { status: 400, error: 'missing paste ID' };
	}

	const db = await getDB();
	const paste = await db.getPasteById(id);
	if (!paste) {
		return { status: 404, error: 'paste not found' };
	}

	// Check expiry
	if (paste.expires_at && new Date(paste.expires_at).getTime() < Date.now()) {
		await db.deletePaste(id).catch(() => {});
		return { status: 404, error: 'paste has expired' };
	}

	// Private visibility check
	if (paste.visibility === 'private') {
		const isOwner = currentUser && paste.author_id && currentUser.user_id === paste.author_id;
		const isAdmin = currentUser && currentUser.is_admin;
		if (!isOwner && !isAdmin) {
			return { status: 404, error: 'paste not found' };
		}
	}

	// Increment view count asynchronously (fire and forget / backgrounded)
	db.incrementPasteViews(id).catch(err => console.error('Failed to increment views:', err));
	paste.views++; // Increment locally for the response

	return { status: 200, data: paste };
}

export async function updatePaste(id: string, body: any, currentUser: any): Promise<{ status: number; data?: any; error?: string }> {
	if (!id) {
		return { status: 400, error: 'missing paste ID' };
	}

	const db = await getDB();
	const paste = await db.getPasteById(id);
	if (!paste) {
		return { status: 404, error: 'paste not found' };
	}

	// Check ownership/admin privileges
	const isOwner = currentUser && paste.author_id && currentUser.user_id === paste.author_id;
	const isAdmin = currentUser && currentUser.is_admin;
	if (!isOwner && !isAdmin) {
		return { status: 403, error: 'forbidden: you do not own this paste' };
	}

	const { title, content, lang, expiry, visibility } = body || {};
	if (!content || content.trim() === '') {
		return { status: 400, error: 'content cannot be empty' };
	}

	const updates = {
		title: !title || title.trim() === '' ? 'Untitled' : title.trim(),
		content,
		lang: validLang(lang),
		expiry: expiry || 'never',
		visibility: validVisibility(visibility),
		expires_at: getExpiresAt(expiry)
	};

	await db.updatePaste(id, updates);

	const updated = await db.getPasteById(id);
	return { status: 200, data: updated };
}

export async function deletePaste(id: string, currentUser: any): Promise<{ status: number; data?: any; error?: string }> {
	if (!id) {
		return { status: 400, error: 'missing paste ID' };
	}

	const db = await getDB();
	const paste = await db.getPasteById(id);
	if (!paste) {
		return { status: 404, error: 'paste not found' };
	}

	// Check ownership/admin privileges
	const isOwner = currentUser && paste.author_id && currentUser.user_id === paste.author_id;
	const isAdmin = currentUser && currentUser.is_admin;
	if (!isOwner && !isAdmin) {
		return { status: 403, error: 'forbidden: you do not own this paste' };
	}

	await db.deletePaste(id);
	return { status: 200, data: { message: 'paste deleted successfully' } };
}

export async function myPastes(currentUser: any): Promise<{ status: number; data?: any; error?: string }> {
	if (!currentUser) {
		return { status: 401, error: 'could not resolve user ID' };
	}

	const db = await getDB();
	const result = await db.listPastesByAuthorId(currentUser.user_id);
	return { status: 200, data: result };
}

export async function personalPastes(username: string, currentUser: any): Promise<{ status: number; data?: any; error?: string }> {
	if (!username) {
		return { status: 400, error: 'missing username' };
	}

	const showAll = currentUser && currentUser.username.toLowerCase() === username.toLowerCase();
	
	const db = await getDB();
	const result = await db.listPastesByAuthorName(username, showAll);
	return { status: 200, data: result };
}

export async function getRawPaste(id: string, currentUser: any): Promise<{ status: number; rawContent?: string; error?: string }> {
	const res = await getPaste(id, currentUser);
	if (res.status !== 200 || !res.data) {
		return { status: res.status, error: res.error || 'Failed to fetch raw paste' };
	}
	return { status: 200, rawContent: res.data.content };
}
