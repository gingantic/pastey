import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedisAdapterWrapper } from './db.redis';
import type { DBAdapter, User, RefreshToken, Paste } from './db';

// Mock Redis implementation
class MockRedis {
	store: Map<string, string> = new Map();
	sets: Map<string, Set<string>> = new Map();
	expirations: Map<string, number> = new Map();

	async get(key: string) {
		return this.store.get(key) || null;
	}

	async set(key: string, val: string, options?: { EX?: number }) {
		this.store.set(key, val);
		if (options?.EX) {
			this.expirations.set(key, options.EX);
		}
	}

	async del(keys: string | string[]) {
		const keyList = Array.isArray(keys) ? keys : [keys];
		for (const k of keyList) {
			this.store.delete(k);
			this.sets.delete(k);
			this.expirations.delete(k);
		}
	}

	async sAdd(key: string, val: string) {
		if (!this.sets.has(key)) {
			this.sets.set(key, new Set());
		}
		this.sets.get(key)!.add(val);
	}

	async sRem(key: string, val: string) {
		if (this.sets.has(key)) {
			this.sets.get(key)!.delete(val);
		}
	}

	async sMembers(key: string) {
		if (this.sets.has(key)) {
			return Array.from(this.sets.get(key)!);
		}
		return [];
	}

	async expire(key: string, ttl: number) {
		this.expirations.set(key, ttl);
	}

	async exists(key: string) {
		return this.store.has(key) ? 1 : 0;
	}

	async incr(key: string) {
		const val = this.store.get(key);
		const num = val ? parseInt(val, 10) : 0;
		const newVal = num + 1;
		this.store.set(key, newVal.toString());
		return newVal;
	}
}

describe('RedisAdapterWrapper', () => {
	let mockDB: DBAdapter;
	let mockRedis: MockRedis;
	let wrapper: RedisAdapterWrapper;

	beforeEach(() => {
		mockRedis = new MockRedis();
		mockDB = {
			init: vi.fn(),
			createUser: vi.fn(),
			getUserById: vi.fn(),
			getUserByUsernameOrEmail: vi.fn(),
			countUsers: vi.fn(),
			listUsers: vi.fn(),
			toggleAdmin: vi.fn(),
			deleteUser: vi.fn(),
			getOldestUser: vi.fn(),
			createRefreshToken: vi.fn(),
			getRefreshToken: vi.fn(),
			deleteRefreshToken: vi.fn(),
			deleteRefreshTokensByUserId: vi.fn(),
			createPaste: vi.fn(),
			getPasteById: vi.fn(),
			updatePaste: vi.fn(),
			deletePaste: vi.fn(),
			deletePastesByAuthorId: vi.fn(),
			incrementPasteViews: vi.fn(),
			listPublicPastes: vi.fn(),
			listPastesByAuthorId: vi.fn(),
			listPastesByAuthorName: vi.fn(),
			listAllPastesAdmin: vi.fn(),
			createApiKey: vi.fn(),
			getApiKeyByHash: vi.fn(),
			listApiKeysByUserId: vi.fn().mockResolvedValue([]),
			deleteApiKey: vi.fn(),
			deleteApiKeysByUserId: vi.fn(),
			touchApiKey: vi.fn(),
		};
		wrapper = new RedisAdapterWrapper(mockDB, mockRedis);
	});

	describe('User Operations Caching', () => {
		const testUser: User = {
			id: 'user-123',
			username: 'testuser',
			email: 'test@example.com',
			password: 'hashedpassword',
			is_admin: false,
			created_at: new Date('2026-06-01T00:00:00Z'),
			updated_at: new Date('2026-06-01T00:00:00Z')
		};

		it('should query the database on cache miss and store in cache', async () => {
			vi.mocked(mockDB.getUserById).mockResolvedValue(testUser);

			const user = await wrapper.getUserById('user-123');
			expect(user).toEqual(testUser);
			expect(mockDB.getUserById).toHaveBeenCalledTimes(1);

			// Check that it's cached in Redis
			const cached = await mockRedis.get('user:user-123');
			expect(cached).not.toBeNull();
			const parsed = JSON.parse(cached!);
			expect(parsed.id).toBe('user-123');
		});

		it('should return from cache on cache hit without calling DB', async () => {
			await mockRedis.set('user:user-123', JSON.stringify(testUser));

			const user = await wrapper.getUserById('user-123');
			expect(user).toEqual(testUser);
			expect(mockDB.getUserById).not.toHaveBeenCalled();
		});

		it('should invalidate cache on toggleAdmin and deleteUser', async () => {
			await mockRedis.set('user:user-123', JSON.stringify(testUser));

			await wrapper.toggleAdmin('user-123', true);
			expect(mockDB.toggleAdmin).toHaveBeenCalledWith('user-123', true);
			expect(await mockRedis.get('user:user-123')).toBeNull();

			await mockRedis.set('user:user-123', JSON.stringify(testUser));
			await wrapper.deleteUser('user-123');
			expect(mockDB.deleteUser).toHaveBeenCalledWith('user-123');
			expect(await mockRedis.get('user:user-123')).toBeNull();
		});
	});

	describe('Refresh Token Operations', () => {
		const testToken: RefreshToken = {
			id: 'token-uuid',
			user_id: 'user-123',
			token: 'hashedtoken123',
			expires_at: new Date(Date.now() + 3600 * 1000),
			created_at: new Date()
		};

		it('should save refresh token to Redis and NOT call DB when Redis is active', async () => {
			await wrapper.createRefreshToken(testToken);

			expect(mockDB.createRefreshToken).not.toHaveBeenCalled();

			const cached = await mockRedis.get('rt:hashedtoken123');
			expect(cached).not.toBeNull();
			const parsed = JSON.parse(cached!);
			expect(parsed.token).toBe('hashedtoken123');

			const members = await mockRedis.sMembers('user_rt:user-123');
			expect(members).toContain('hashedtoken123');
		});

		it('should get refresh token from Redis and fall back to DB on miss', async () => {
			vi.mocked(mockDB.getRefreshToken).mockResolvedValue(testToken);

			// Cache miss -> fetches from DB
			let token = await wrapper.getRefreshToken('hashedtoken123');
			expect(token).toEqual(testToken);
			expect(mockDB.getRefreshToken).toHaveBeenCalledTimes(1);

			// Cache hit
			await mockRedis.set('rt:hashedtoken123', JSON.stringify(testToken));
			vi.mocked(mockDB.getRefreshToken).mockClear();

			token = await wrapper.getRefreshToken('hashedtoken123');
			expect(token).toEqual(testToken);
			expect(mockDB.getRefreshToken).not.toHaveBeenCalled();
		});

		it('should delete token from Redis and also delete from DB', async () => {
			await mockRedis.set('rt:hashedtoken123', JSON.stringify(testToken));
			await mockRedis.sAdd('user_rt:user-123', 'hashedtoken123');

			await wrapper.deleteRefreshToken('hashedtoken123');

			expect(await mockRedis.get('rt:hashedtoken123')).toBeNull();
			const members = await mockRedis.sMembers('user_rt:user-123');
			expect(members).not.toContain('hashedtoken123');
			expect(mockDB.deleteRefreshToken).toHaveBeenCalledWith('hashedtoken123');
		});

		it('should delete all refresh tokens by user ID', async () => {
			await mockRedis.set('rt:token1', JSON.stringify({ ...testToken, token: 'token1' }));
			await mockRedis.set('rt:token2', JSON.stringify({ ...testToken, token: 'token2' }));
			await mockRedis.sAdd('user_rt:user-123', 'token1');
			await mockRedis.sAdd('user_rt:user-123', 'token2');

			await wrapper.deleteRefreshTokensByUserId('user-123');

			expect(await mockRedis.get('rt:token1')).toBeNull();
			expect(await mockRedis.get('rt:token2')).toBeNull();
			expect(await mockRedis.sMembers('user_rt:user-123')).toEqual([]);
			expect(mockDB.deleteRefreshTokensByUserId).toHaveBeenCalledWith('user-123');
		});
	});

	describe('Paste Operations Caching', () => {
		const testPaste: Paste = {
			id: 'p123',
			title: 'My Paste',
			content: 'echo hello',
			lang: 'bash',
			expiry: 'never',
			visibility: 'public',
			author_id: 'user-123',
			author_name: 'testuser',
			views: 42,
			created_at: new Date('2026-06-01T00:00:00Z'),
			updated_at: new Date('2026-06-01T00:00:00Z'),
			expires_at: null
		};

		it('should query DB on paste cache miss, cache it, and return', async () => {
			vi.mocked(mockDB.getPasteById).mockResolvedValue(testPaste);

			const paste = await wrapper.getPasteById('p123');
			expect(paste).toEqual(testPaste);
			expect(mockDB.getPasteById).toHaveBeenCalledTimes(1);

			const cached = await mockRedis.get('paste:p123');
			expect(cached).not.toBeNull();
			const parsed = JSON.parse(cached!);
			expect(parsed.id).toBe('p123');

			const cachedViews = await mockRedis.get('paste_views:p123');
			expect(cachedViews).toBe('42');

			const userPastes = await mockRedis.sMembers('user_pastes:user-123');
			expect(userPastes).toContain('p123');
		});

		it('should return paste from cache and merge current views from Redis', async () => {
			await mockRedis.set('paste:p123', JSON.stringify(testPaste));
			await mockRedis.set('paste_views:p123', '100');

			const paste = await wrapper.getPasteById('p123');
			expect(paste!.views).toBe(100);
			expect(mockDB.getPasteById).not.toHaveBeenCalled();
		});

		it('should increment view count in DB and in Redis cache if active', async () => {
			await mockRedis.set('paste_views:p123', '10');

			await wrapper.incrementPasteViews('p123');

			expect(mockDB.incrementPasteViews).toHaveBeenCalledWith('p123');
			expect(await mockRedis.get('paste_views:p123')).toBe('11');
		});

		it('should invalidate paste cache on update and delete', async () => {
			await mockRedis.set('paste:p123', JSON.stringify(testPaste));
			await mockRedis.set('paste_views:p123', '10');

			await wrapper.updatePaste('p123', { title: 'Updated' });
			expect(mockDB.updatePaste).toHaveBeenCalled();
			expect(await mockRedis.get('paste:p123')).toBeNull();
			expect(await mockRedis.get('paste_views:p123')).toBeNull();

			await mockRedis.set('paste:p123', JSON.stringify(testPaste));
			await mockRedis.set('paste_views:p123', '10');
			await mockRedis.sAdd('user_pastes:user-123', 'p123');

			await wrapper.deletePaste('p123');
			expect(mockDB.deletePaste).toHaveBeenCalled();
			expect(await mockRedis.get('paste:p123')).toBeNull();
			expect(await mockRedis.get('paste_views:p123')).toBeNull();
			expect(await mockRedis.sMembers('user_pastes:user-123')).not.toContain('p123');
		});

		it('should bulk invalidate author pastes', async () => {
			await mockRedis.set('paste:p1', JSON.stringify({ ...testPaste, id: 'p1' }));
			await mockRedis.set('paste:p2', JSON.stringify({ ...testPaste, id: 'p2' }));
			await mockRedis.sAdd('user_pastes:user-123', 'p1');
			await mockRedis.sAdd('user_pastes:user-123', 'p2');

			await wrapper.deletePastesByAuthorId('user-123');

			expect(await mockRedis.get('paste:p1')).toBeNull();
			expect(await mockRedis.get('paste:p2')).toBeNull();
			expect(await mockRedis.sMembers('user_pastes:user-123')).toEqual([]);
			expect(mockDB.deletePastesByAuthorId).toHaveBeenCalledWith('user-123');
		});
	});
});
