import { env } from '$env/dynamic/private';
import type { DBAdapter, User, RefreshToken, ApiKey, Paste, UserWithPasteCount } from './db';

// Default Redis cache TTL in seconds, overridable via REDIS_CACHE_TTL_SECONDS.
const CACHE_TTL_SECONDS = (() => {
	const parsed = parseInt(env.REDIS_CACHE_TTL_SECONDS ?? '', 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 3600;
})();

// How many buffered views accumulate in Redis before they are flushed to the
// database in a single write. Higher values mean fewer DB writes under heavy
// read traffic. Overridable via REDIS_VIEW_FLUSH_THRESHOLD.
const VIEW_FLUSH_THRESHOLD = (() => {
	const parsed = parseInt(env.REDIS_VIEW_FLUSH_THRESHOLD ?? '', 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
})();

export class RedisAdapterWrapper implements DBAdapter {
	constructor(
		private underlying: DBAdapter,
		private redis: any
	) {}

	async init(): Promise<void> {
		await this.underlying.init();
	}

	// ─── User Operations ───────────────────────────────────────────────────────

	async createUser(user: User): Promise<void> {
		await this.underlying.createUser(user);
	}

	async getUserById(id: string): Promise<User | null> {
		try {
			const cached = await this.redis.get(`user:${id}`);
			if (cached) {
				const user = JSON.parse(cached);
				user.created_at = new Date(user.created_at);
				user.updated_at = new Date(user.updated_at);
				return user;
			}
		} catch (err) {
			console.error('Redis getUserById failed:', err);
		}

		const user = await this.underlying.getUserById(id);
		if (user) {
			try {
				await this.redis.set(`user:${id}`, JSON.stringify(user), { EX: CACHE_TTL_SECONDS });
			} catch (err) {
				console.error('Redis cache user failed:', err);
			}
		}
		return user;
	}

	async getUserByUsernameOrEmail(identifier: string): Promise<User | null> {
		// getUserByUsernameOrEmail is only used during registration/login (low frequency),
		// so we query the database directly to ensure absolute accuracy of unique username/emails.
		return this.underlying.getUserByUsernameOrEmail(identifier);
	}

	async countUsers(search?: string): Promise<number> {
		return this.underlying.countUsers(search);
	}

	async listUsers(limit: number, offset: number, search?: string): Promise<UserWithPasteCount[]> {
		return this.underlying.listUsers(limit, offset, search);
	}

	async toggleAdmin(id: string, isAdmin: boolean): Promise<void> {
		await this.underlying.toggleAdmin(id, isAdmin);
		try {
			await this.redis.del(`user:${id}`);
		} catch (err) {
			console.error('Redis toggleAdmin invalidate failed:', err);
		}
	}

	async deleteUser(id: string): Promise<void> {
		await this.underlying.deleteUser(id);
		try {
			await this.redis.del(`user:${id}`);
			await this.deleteRefreshTokensByUserId(id);
			await this.deleteApiKeysByUserId(id);
		} catch (err) {
			console.error('Redis deleteUser invalidate failed:', err);
		}
	}

	async getOldestUser(): Promise<User | null> {
		return this.underlying.getOldestUser();
	}

	// ─── Refresh Token Operations ──────────────────────────────────────────────

	async createRefreshToken(token: RefreshToken): Promise<void> {
		let storedInRedis = false;
		try {
			const key = `rt:${token.token}`;
			const userKey = `user_rt:${token.user_id}`;
			const ttl = Math.max(1, Math.ceil((token.expires_at.getTime() - Date.now()) / 1000));
			await this.redis.set(key, JSON.stringify(token), { EX: ttl });
			await this.redis.sAdd(userKey, token.token);
			await this.redis.expire(userKey, ttl);
			storedInRedis = true;
		} catch (err) {
			console.error('Redis createRefreshToken failed, falling back to database:', err);
		}

		if (!storedInRedis) {
			await this.underlying.createRefreshToken(token);
		}
	}

	async getRefreshToken(hashedToken: string): Promise<RefreshToken | null> {
		try {
			const val = await this.redis.get(`rt:${hashedToken}`);
			if (val) {
				const rt = JSON.parse(val);
				rt.expires_at = new Date(rt.expires_at);
				rt.created_at = new Date(rt.created_at);
				return rt;
			}
		} catch (err) {
			console.error('Redis getRefreshToken failed, checking database:', err);
		}

		return this.underlying.getRefreshToken(hashedToken);
	}

	async deleteRefreshToken(hashedToken: string): Promise<void> {
		try {
			const val = await this.redis.get(`rt:${hashedToken}`);
			if (val) {
				const rt = JSON.parse(val);
				await this.redis.del(`rt:${hashedToken}`);
				await this.redis.sRem(`user_rt:${rt.user_id}`, hashedToken);
			}
		} catch (err) {
			console.error('Redis deleteRefreshToken failed:', err);
		}

		// Also delete from underlying DB to ensure cleanup
		await this.underlying.deleteRefreshToken(hashedToken);
	}

	async deleteRefreshTokensByUserId(userId: string): Promise<void> {
		try {
			const userKey = `user_rt:${userId}`;
			const tokens = await this.redis.sMembers(userKey);
			if (tokens.length > 0) {
				const keys = tokens.map((t: string) => `rt:${t}`);
				await this.redis.del(keys);
			}
			await this.redis.del(userKey);
		} catch (err) {
			console.error('Redis deleteRefreshTokensByUserId failed:', err);
		}

		await this.underlying.deleteRefreshTokensByUserId(userId);
	}

	// ─── API Key Operations ───────────────────────────────────────────────────────

	async createApiKey(key: ApiKey): Promise<void> {
		await this.underlying.createApiKey(key);
	}

	async getApiKeyByHash(keyHash: string): Promise<ApiKey | null> {
		try {
			const cached = await this.redis.get(`ak:${keyHash}`);
			if (cached) {
				const key = JSON.parse(cached);
				key.created_at = new Date(key.created_at);
				key.last_used_at = key.last_used_at ? new Date(key.last_used_at) : null;
				return key;
			}
		} catch (err) {
			console.error('Redis getApiKeyByHash failed:', err);
		}

		const key = await this.underlying.getApiKeyByHash(keyHash);
		if (key) {
			try {
				await this.redis.set(`ak:${keyHash}`, JSON.stringify(key), { EX: 300 });
			} catch (err) {
				console.error('Redis cache api key failed:', err);
			}
		}
		return key;
	}

	async listApiKeysByUserId(userId: string): Promise<ApiKey[]> {
		return this.underlying.listApiKeysByUserId(userId);
	}

	async deleteApiKey(id: string, userId: string): Promise<void> {
		// Invalidate the hash-lookup cache before removal
		try {
			const keys = await this.underlying.listApiKeysByUserId(userId);
			const target = keys.find((k) => k.id === id);
			if (target) {
				await this.redis.del(`ak:${target.key_hash}`);
			}
		} catch (err) {
			console.error('Redis deleteApiKey cache invalidate failed:', err);
		}

		await this.underlying.deleteApiKey(id, userId);
	}

	async deleteApiKeysByUserId(userId: string): Promise<void> {
		try {
			const keys = await this.underlying.listApiKeysByUserId(userId);
			if (keys.length > 0) {
				await this.redis.del(keys.map((k) => `ak:${k.key_hash}`));
			}
		} catch (err) {
			console.error('Redis deleteApiKeysByUserId cache invalidate failed:', err);
		}

		await this.underlying.deleteApiKeysByUserId(userId);
	}

	async touchApiKey(id: string, when: Date): Promise<void> {
		await this.underlying.touchApiKey(id, when);
	}

	// ─── Paste Operations ──────────────────────────────────────────────────────

	async createPaste(paste: Paste): Promise<void> {
		await this.underlying.createPaste(paste);
		if (paste.author_id) {
			try {
				const userPastesKey = `user_pastes:${paste.author_id}`;
				const ttl = paste.expires_at
					? Math.max(1, Math.ceil((paste.expires_at.getTime() - Date.now()) / 1000))
					: CACHE_TTL_SECONDS;
				await this.redis.sAdd(userPastesKey, paste.id);
				await this.redis.expire(userPastesKey, ttl);
			} catch (err) {
				console.error('Redis createPaste caching failed:', err);
			}
		}
	}

	async getPasteById(id: string): Promise<Paste | null> {
		try {
			const cached = await this.redis.get(`paste:${id}`);
			if (cached) {
				const paste = JSON.parse(cached);
				paste.created_at = new Date(paste.created_at);
				paste.updated_at = new Date(paste.updated_at);
				if (paste.expires_at) {
					paste.expires_at = new Date(paste.expires_at);
				}

				// Check expiration
				if (paste.expires_at && paste.expires_at.getTime() < Date.now()) {
					// Expired: delete from cache and let core DB adapter lazy delete
					await this.redis.del(`paste:${id}`);
					await this.redis.del(`paste_views:${id}`);
					if (paste.author_id) {
						await this.redis.sRem(`user_pastes:${paste.author_id}`, id);
					}
					return null;
				}

				const views = await this.redis.get(`paste_views:${id}`);
				if (views !== null) {
					paste.views = parseInt(views, 10);
				}
				return paste;
			}
		} catch (err) {
			console.error('Redis getPasteById cache lookup failed:', err);
		}

		const paste = await this.underlying.getPasteById(id);
		if (paste) {
			try {
				const defaultTTL = CACHE_TTL_SECONDS;
				let ttl = defaultTTL;
				if (paste.expires_at) {
					const remaining = Math.floor((paste.expires_at.getTime() - Date.now()) / 1000);
					if (remaining > 0) {
						ttl = Math.min(ttl, remaining);
					} else {
						return paste; // Expired, don't cache
					}
				}
				await this.redis.set(`paste:${id}`, JSON.stringify(paste), { EX: ttl });
				await this.redis.set(`paste_views:${id}`, paste.views.toString(), { EX: ttl });
				if (paste.author_id) {
					const userPastesKey = `user_pastes:${paste.author_id}`;
					await this.redis.sAdd(userPastesKey, id);
					await this.redis.expire(userPastesKey, ttl);
				}
			} catch (err) {
				console.error('Redis cache paste failed:', err);
			}
		}
		return paste;
	}

	async updatePaste(id: string, updates: Partial<Paste>): Promise<void> {
		await this.underlying.updatePaste(id, updates);
		try {
			await this.redis.del(`paste:${id}`);
			await this.redis.del(`paste_views:${id}`);
		} catch (err) {
			console.error('Redis updatePaste cache invalidate failed:', err);
		}
	}

	async deletePaste(id: string): Promise<void> {
		const paste = await this.getPasteById(id).catch(() => null);
		await this.underlying.deletePaste(id);
		try {
			await this.redis.del(`paste:${id}`);
			await this.redis.del(`paste_views:${id}`);
			await this.redis.del(`paste_views_pending:${id}`);
			if (paste && paste.author_id) {
				await this.redis.sRem(`user_pastes:${paste.author_id}`, id);
			}
		} catch (err) {
			console.error('Redis deletePaste cache invalidate failed:', err);
		}
	}

	async deletePastesByAuthorId(authorId: string): Promise<void> {
		try {
			const userPastesKey = `user_pastes:${authorId}`;
			const pasteIds = await this.redis.sMembers(userPastesKey);
			if (pasteIds.length > 0) {
				const keys = pasteIds.flatMap((id: string) => [
					`paste:${id}`,
					`paste_views:${id}`,
					`paste_views_pending:${id}`
				]);
				await this.redis.del(keys);
			}
			await this.redis.del(userPastesKey);
		} catch (err) {
			console.error('Redis deletePastesByAuthorId cache invalidate failed:', err);
		}

		await this.underlying.deletePastesByAuthorId(authorId);
	}

	async incrementPasteViews(id: string): Promise<void> {
		// Write-behind: buffer views in Redis and flush to the DB in batches so a
		// popular paste doesn't generate one DB write per view. Only when Redis is
		// unavailable do we fall back to writing every view straight to the DB.
		try {
			// Keep the live display counter in sync if it's currently cached, so
			// reads reflect views immediately without a DB round-trip.
			const exists = await this.redis.exists(`paste_views:${id}`);
			if (exists) {
				await this.redis.incr(`paste_views:${id}`);
			}

			// Track how many views still need to be persisted to the DB.
			const pendingKey = `paste_views_pending:${id}`;
			const pending = await this.redis.incr(pendingKey);
			// Guard against the pending counter lingering forever if a paste stops
			// being viewed before it reaches the flush threshold.
			await this.redis.expire(pendingKey, CACHE_TTL_SECONDS);

			if (pending >= VIEW_FLUSH_THRESHOLD) {
				// Atomically claim the buffered count and reset it, then flush.
				const claimed = await this.redis.getDel(pendingKey);
				const delta = parseInt(claimed ?? '0', 10);
				if (delta > 0) {
					try {
						await this.underlying.addPasteViews(id, delta);
					} catch (err) {
						console.error('Redis view flush to DB failed, re-buffering:', err);
						// Don't lose the views: add them back to the pending counter.
						await this.redis.incrBy(pendingKey, delta).catch(() => {});
						await this.redis.expire(pendingKey, CACHE_TTL_SECONDS).catch(() => {});
					}
				}
			}
		} catch (err) {
			console.error('Redis incrementPasteViews failed, writing directly to DB:', err);
			await this.underlying.incrementPasteViews(id).catch((e) => {
				console.error('Direct incrementPasteViews fallback failed:', e);
			});
		}
	}

	async addPasteViews(id: string, delta: number): Promise<void> {
		await this.underlying.addPasteViews(id, delta);
	}

	async listPublicPastes(limit: number, offset: number): Promise<{ pastes: Paste[]; total: number }> {
		return this.underlying.listPublicPastes(limit, offset);
	}

	async listPastesByAuthorId(authorId: string): Promise<{ pastes: Paste[]; total: number }> {
		return this.underlying.listPastesByAuthorId(authorId);
	}

	async listPastesByAuthorName(authorName: string, showAll: boolean): Promise<{ pastes: Paste[]; total: number }> {
		return this.underlying.listPastesByAuthorName(authorName, showAll);
	}

	async listAllPastesAdmin(limit: number, offset: number, search?: string): Promise<{ pastes: Paste[]; total: number }> {
		return this.underlying.listAllPastesAdmin(limit, offset, search);
	}
}
