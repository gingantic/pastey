import type { DBAdapter, User, RefreshToken, Paste, UserWithPasteCount } from './db';

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
				await this.redis.set(`user:${id}`, JSON.stringify(user), { EX: 3600 });
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

	// ─── Paste Operations ──────────────────────────────────────────────────────

	async createPaste(paste: Paste): Promise<void> {
		await this.underlying.createPaste(paste);
		if (paste.author_id) {
			try {
				const userPastesKey = `user_pastes:${paste.author_id}`;
				const ttl = paste.expires_at
					? Math.max(1, Math.ceil((paste.expires_at.getTime() - Date.now()) / 1000))
					: 3600;
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
				const defaultTTL = 3600;
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
				const keys = pasteIds.flatMap((id: string) => [`paste:${id}`, `paste_views:${id}`]);
				await this.redis.del(keys);
			}
			await this.redis.del(userPastesKey);
		} catch (err) {
			console.error('Redis deletePastesByAuthorId cache invalidate failed:', err);
		}

		await this.underlying.deletePastesByAuthorId(authorId);
	}

	async incrementPasteViews(id: string): Promise<void> {
		await this.underlying.incrementPasteViews(id);
		try {
			// Increment counter if it exists in Redis, otherwise ignore (it will load on next getPasteById)
			const exists = await this.redis.exists(`paste_views:${id}`);
			if (exists) {
				await this.redis.incr(`paste_views:${id}`);
			}
		} catch (err) {
			console.error('Redis incrementPasteViews failed:', err);
		}
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
