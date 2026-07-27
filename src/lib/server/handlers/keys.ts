import crypto from 'crypto';
import { getDB } from '../db';
import { generateApiKey } from '../auth';
import type { ApiKey } from '../db';

const MAX_KEYS_PER_USER = 10;

// Map an ApiKey to its public JSON shape (never expose the hash)
function toResponse(key: ApiKey) {
	return {
		id: key.id,
		name: key.name,
		prefix: key.prefix,
		created_at: key.created_at.toISOString(),
		last_used_at: key.last_used_at ? key.last_used_at.toISOString() : null
	};
}

export async function listKeys(currentUser: any) {
	if (!currentUser) {
		return { status: 401, error: 'authentication required' };
	}

	const db = await getDB();
	const keys = await db.listApiKeysByUserId(currentUser.user_id);
	return { status: 200, data: { keys: keys.map(toResponse) } };
}

export async function createKey(body: any, currentUser: any) {
	if (!currentUser) {
		return { status: 401, error: 'authentication required' };
	}

	const name = (body?.name || '').trim();
	if (!name) {
		return { status: 400, error: 'key name is required' };
	}
	if (name.length > 50) {
		return { status: 400, error: 'key name must be 50 characters or fewer' };
	}

	const db = await getDB();
	const existing = await db.listApiKeysByUserId(currentUser.user_id);
	if (existing.length >= MAX_KEYS_PER_USER) {
		return { status: 400, error: `maximum of ${MAX_KEYS_PER_USER} API keys allowed` };
	}

	const { raw, hashed, prefix } = generateApiKey();
	const key: ApiKey = {
		id: crypto.randomUUID(),
		user_id: currentUser.user_id,
		name,
		key_hash: hashed,
		prefix,
		created_at: new Date(),
		last_used_at: null
	};
	await db.createApiKey(key);

	// The raw key is returned exactly once; only its hash is stored
	return { status: 201, data: { ...toResponse(key), key: raw } };
}

export async function deleteKey(id: string, currentUser: any) {
	if (!currentUser) {
		return { status: 401, error: 'authentication required' };
	}

	const db = await getDB();
	const keys = await db.listApiKeysByUserId(currentUser.user_id);
	if (!keys.some((k) => k.id === id)) {
		return { status: 404, error: 'API key not found' };
	}

	await db.deleteApiKey(id, currentUser.user_id);
	return { status: 200, data: { message: 'API key revoked' } };
}
