import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, or, and, like, sql, count, desc, isNull, gt } from 'drizzle-orm';
import type { DBAdapter, User, RefreshToken, ApiKey, Paste, UserWithPasteCount } from './db';
import * as schema from './schema.sqlite';

export class SqliteAdapter implements DBAdapter {
	private sqliteDb!: any; // better-sqlite3 Database instance
	private db!: BetterSQLite3Database<typeof schema>;
	private dbPath: string;

	constructor(dbPath: string) {
		this.dbPath = dbPath;
	}

	async init(): Promise<void> {
		this.sqliteDb = new Database(this.dbPath);
		
		// Configure WAL mode for performance
		this.sqliteDb.pragma('journal_mode = WAL');

		// Create tables if they do not exist (SQLite migrations)
		this.sqliteDb.exec(`
			CREATE TABLE IF NOT EXISTS users (
				id TEXT PRIMARY KEY,
				username TEXT UNIQUE NOT NULL,
				email TEXT UNIQUE NOT NULL,
				password TEXT NOT NULL,
				is_admin INTEGER NOT NULL DEFAULT 0,
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL
			);

			CREATE TABLE IF NOT EXISTS refresh_tokens (
				id TEXT PRIMARY KEY,
				user_id TEXT NOT NULL,
				token TEXT UNIQUE NOT NULL,
				expires_at TEXT NOT NULL,
				created_at TEXT NOT NULL
			);

			CREATE TABLE IF NOT EXISTS api_keys (
				id TEXT PRIMARY KEY,
				user_id TEXT NOT NULL,
				name TEXT NOT NULL,
				key_hash TEXT UNIQUE NOT NULL,
				prefix TEXT NOT NULL,
				created_at TEXT NOT NULL,
				last_used_at TEXT
			);

			CREATE TABLE IF NOT EXISTS pastes (
				id TEXT PRIMARY KEY,
				title TEXT NOT NULL DEFAULT 'Untitled',
				content TEXT NOT NULL,
				lang TEXT NOT NULL DEFAULT 'plaintext',
				expiry TEXT NOT NULL DEFAULT 'never',
				visibility TEXT NOT NULL DEFAULT 'public',
				author_id TEXT,
				author_name TEXT NOT NULL DEFAULT 'Anonymous',
				views INTEGER NOT NULL DEFAULT 0,
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL,
				expires_at TEXT
			);
		`);

		// Initialize Drizzle ORM
		this.db = drizzle(this.sqliteDb, { schema });
	}

	// Helper to safely format Date values to ISO string for SQLite
	private toSqlDate(d: Date | null | undefined): string | null {
		if (!d) return null;
		return d.toISOString();
	}

	private fromSqlDate(s: string | null | undefined): Date | null {
		if (!s) return null;
		return new Date(s);
	}

	// ─── User Operations ───────────────────────────────────────────────────────

	async createUser(user: User): Promise<void> {
		await this.db.insert(schema.users).values({
			id: user.id,
			username: user.username,
			email: user.email,
			password: user.password!,
			is_admin: user.is_admin,
			created_at: this.toSqlDate(user.created_at)!,
			updated_at: this.toSqlDate(user.updated_at)!
		});
	}

	async getUserById(id: string): Promise<User | null> {
		const rows = await this.db.select().from(schema.users).where(eq(schema.users.id, id));
		if (rows.length === 0) return null;
		const row = rows[0];
		return {
			id: row.id,
			username: row.username,
			email: row.email,
			password: row.password,
			is_admin: row.is_admin,
			created_at: this.fromSqlDate(row.created_at)!,
			updated_at: this.fromSqlDate(row.updated_at)!
		};
	}

	async getUserByUsernameOrEmail(identifier: string): Promise<User | null> {
		const lowered = identifier.toLowerCase().trim();
		const rows = await this.db.select().from(schema.users).where(
			or(
				eq(sql`LOWER(${schema.users.username})`, lowered),
				eq(sql`LOWER(${schema.users.email})`, lowered)
			)
		);
		if (rows.length === 0) return null;
		const row = rows[0];
		return {
			id: row.id,
			username: row.username,
			email: row.email,
			password: row.password,
			is_admin: row.is_admin,
			created_at: this.fromSqlDate(row.created_at)!,
			updated_at: this.fromSqlDate(row.updated_at)!
		};
	}

	async countUsers(search?: string): Promise<number> {
		let condition;
		if (search) {
			const searchTerm = `%${search.toLowerCase().trim()}%`;
			condition = or(
				like(sql`LOWER(${schema.users.username})`, searchTerm),
				like(sql`LOWER(${schema.users.email})`, searchTerm)
			);
		}
		const res = await this.db.select({ count: count() }).from(schema.users).where(condition);
		return res[0].count;
	}

	async listUsers(limit: number, offset: number, search?: string): Promise<UserWithPasteCount[]> {
		let condition;
		if (search) {
			const searchTerm = `%${search.toLowerCase().trim()}%`;
			condition = or(
				like(sql`LOWER(${schema.users.username})`, searchTerm),
				like(sql`LOWER(${schema.users.email})`, searchTerm)
			);
		}

		const res = await this.db
			.select({
				id: schema.users.id,
				username: schema.users.username,
				email: schema.users.email,
				is_admin: schema.users.is_admin,
				created_at: schema.users.created_at,
				paste_count: count(schema.pastes.id)
			})
			.from(schema.users)
			.leftJoin(schema.pastes, eq(schema.pastes.author_id, schema.users.id))
			.where(condition)
			.groupBy(schema.users.id)
			.orderBy(desc(schema.users.created_at))
			.limit(limit)
			.offset(offset);

		return res.map(row => ({
			id: row.id,
			username: row.username,
			email: row.email,
			is_admin: row.is_admin,
			created_at: this.fromSqlDate(row.created_at)!,
			paste_count: row.paste_count
		}));
	}

	async toggleAdmin(id: string, isAdmin: boolean): Promise<void> {
		await this.db
			.update(schema.users)
			.set({ is_admin: isAdmin, updated_at: this.toSqlDate(new Date())! })
			.where(eq(schema.users.id, id));
	}

	async deleteUser(id: string): Promise<void> {
		await this.db.delete(schema.users).where(eq(schema.users.id, id));
	}

	async getOldestUser(): Promise<User | null> {
		const rows = await this.db
			.select()
			.from(schema.users)
			.orderBy(schema.users.created_at)
			.limit(1);
		if (rows.length === 0) return null;
		const row = rows[0];
		return {
			id: row.id,
			username: row.username,
			email: row.email,
			password: row.password,
			is_admin: row.is_admin,
			created_at: this.fromSqlDate(row.created_at)!,
			updated_at: this.fromSqlDate(row.updated_at)!
		};
	}

	// ─── Refresh Token Operations ──────────────────────────────────────────────

	async createRefreshToken(token: RefreshToken): Promise<void> {
		await this.db.insert(schema.refresh_tokens).values({
			id: token.id,
			user_id: token.user_id,
			token: token.token,
			expires_at: this.toSqlDate(token.expires_at)!,
			created_at: this.toSqlDate(token.created_at)!
		});
	}

	async getRefreshToken(hashedToken: string): Promise<RefreshToken | null> {
		const rows = await this.db
			.select()
			.from(schema.refresh_tokens)
			.where(eq(schema.refresh_tokens.token, hashedToken));
		if (rows.length === 0) return null;
		const row = rows[0];
		return {
			id: row.id,
			user_id: row.user_id,
			token: row.token,
			expires_at: this.fromSqlDate(row.expires_at)!,
			created_at: this.fromSqlDate(row.created_at)!
		};
	}

	async deleteRefreshToken(hashedToken: string): Promise<void> {
		await this.db.delete(schema.refresh_tokens).where(eq(schema.refresh_tokens.token, hashedToken));
	}

	async deleteRefreshTokensByUserId(userId: string): Promise<void> {
		await this.db.delete(schema.refresh_tokens).where(eq(schema.refresh_tokens.user_id, userId));
	}

	// ─── API Key Operations ───────────────────────────────────────────────────────

	private mapApiKeyRow(row: schema.SqliteApiKey): ApiKey {
		return {
			id: row.id,
			user_id: row.user_id,
			name: row.name,
			key_hash: row.key_hash,
			prefix: row.prefix,
			created_at: this.fromSqlDate(row.created_at)!,
			last_used_at: this.fromSqlDate(row.last_used_at)
		};
	}

	async createApiKey(key: ApiKey): Promise<void> {
		await this.db.insert(schema.api_keys).values({
			id: key.id,
			user_id: key.user_id,
			name: key.name,
			key_hash: key.key_hash,
			prefix: key.prefix,
			created_at: this.toSqlDate(key.created_at)!,
			last_used_at: this.toSqlDate(key.last_used_at)
		});
	}

	async getApiKeyByHash(keyHash: string): Promise<ApiKey | null> {
		const rows = await this.db
			.select()
			.from(schema.api_keys)
			.where(eq(schema.api_keys.key_hash, keyHash));
		if (rows.length === 0) return null;
		return this.mapApiKeyRow(rows[0]);
	}

	async listApiKeysByUserId(userId: string): Promise<ApiKey[]> {
		const rows = await this.db
			.select()
			.from(schema.api_keys)
			.where(eq(schema.api_keys.user_id, userId))
			.orderBy(desc(schema.api_keys.created_at));
		return rows.map((row) => this.mapApiKeyRow(row));
	}

	async deleteApiKey(id: string, userId: string): Promise<void> {
		await this.db
			.delete(schema.api_keys)
			.where(and(eq(schema.api_keys.id, id), eq(schema.api_keys.user_id, userId)));
	}

	async deleteApiKeysByUserId(userId: string): Promise<void> {
		await this.db.delete(schema.api_keys).where(eq(schema.api_keys.user_id, userId));
	}

	async touchApiKey(id: string, when: Date): Promise<void> {
		await this.db
			.update(schema.api_keys)
			.set({ last_used_at: this.toSqlDate(when) })
			.where(eq(schema.api_keys.id, id));
	}

	// ─── Paste Operations ──────────────────────────────────────────────────────

	async createPaste(paste: Paste): Promise<void> {
		await this.db.insert(schema.pastes).values({
			id: paste.id,
			title: paste.title,
			content: paste.content,
			lang: paste.lang,
			expiry: paste.expiry,
			visibility: paste.visibility,
			author_id: paste.author_id,
			author_name: paste.author_name,
			views: paste.views,
			created_at: this.toSqlDate(paste.created_at)!,
			updated_at: this.toSqlDate(paste.updated_at)!,
			expires_at: this.toSqlDate(paste.expires_at)
		});
	}

	async getPasteById(id: string): Promise<Paste | null> {
		const rows = await this.db.select().from(schema.pastes).where(eq(schema.pastes.id, id));
		if (rows.length === 0) return null;
		const row = rows[0];
		return {
			id: row.id,
			title: row.title,
			content: row.content,
			lang: row.lang,
			expiry: row.expiry,
			visibility: row.visibility,
			author_id: row.author_id,
			author_name: row.author_name,
			views: row.views,
			created_at: this.fromSqlDate(row.created_at)!,
			updated_at: this.fromSqlDate(row.updated_at)!,
			expires_at: this.fromSqlDate(row.expires_at)
		};
	}

	async updatePaste(id: string, updates: Partial<Paste>): Promise<void> {
		const mappedUpdates: any = {};
		for (const [key, value] of Object.entries(updates)) {
			if (value instanceof Date) {
				mappedUpdates[key] = this.toSqlDate(value);
			} else {
				mappedUpdates[key] = value;
			}
		}
		mappedUpdates.updated_at = this.toSqlDate(new Date())!;

		await this.db
			.update(schema.pastes)
			.set(mappedUpdates)
			.where(eq(schema.pastes.id, id));
	}

	async deletePaste(id: string): Promise<void> {
		await this.db.delete(schema.pastes).where(eq(schema.pastes.id, id));
	}

	async deletePastesByAuthorId(authorId: string): Promise<void> {
		await this.db.delete(schema.pastes).where(eq(schema.pastes.author_id, authorId));
	}

	async incrementPasteViews(id: string): Promise<void> {
		await this.db
			.update(schema.pastes)
			.set({ views: sql`${schema.pastes.views} + 1` })
			.where(eq(schema.pastes.id, id));
	}

	async addPasteViews(id: string, delta: number): Promise<void> {
		if (delta <= 0) {
			return;
		}
		await this.db
			.update(schema.pastes)
			.set({ views: sql`${schema.pastes.views} + ${delta}` })
			.where(eq(schema.pastes.id, id));
	}

	async listPublicPastes(limit: number, offset: number): Promise<{ pastes: Paste[]; total: number }> {
		const nowStr = this.toSqlDate(new Date())!;
		const condition = and(
			eq(schema.pastes.visibility, 'public'),
			or(
				isNull(schema.pastes.expires_at),
				gt(schema.pastes.expires_at, nowStr)
			)
		);

		const countRes = await this.db.select({ count: count() }).from(schema.pastes).where(condition);
		const total = countRes[0].count;

		const rows = await this.db
			.select()
			.from(schema.pastes)
			.where(condition)
			.orderBy(desc(schema.pastes.created_at))
			.limit(limit)
			.offset(offset);

		const pastes = rows.map((row: any) => ({
			...row,
			created_at: this.fromSqlDate(row.created_at)!,
			updated_at: this.fromSqlDate(row.updated_at)!,
			expires_at: this.fromSqlDate(row.expires_at)
		}));

		return { pastes, total };
	}

	async listPastesByAuthorId(authorId: string): Promise<{ pastes: Paste[]; total: number }> {
		const condition = eq(schema.pastes.author_id, authorId);
		const countRes = await this.db.select({ count: count() }).from(schema.pastes).where(condition);
		const total = countRes[0].count;

		const rows = await this.db
			.select()
			.from(schema.pastes)
			.where(condition)
			.orderBy(desc(schema.pastes.created_at));

		const pastes = rows.map((row: any) => ({
			...row,
			created_at: this.fromSqlDate(row.created_at)!,
			updated_at: this.fromSqlDate(row.updated_at)!,
			expires_at: this.fromSqlDate(row.expires_at)
		}));

		return { pastes, total };
	}

	async listPastesByAuthorName(authorName: string, showAll: boolean): Promise<{ pastes: Paste[]; total: number }> {
		const nowStr = this.toSqlDate(new Date())!;
		let condition = eq(sql`LOWER(${schema.pastes.author_name})`, authorName.toLowerCase());

		if (!showAll) {
			condition = and(
				condition,
				eq(schema.pastes.visibility, 'public'),
				or(
					isNull(schema.pastes.expires_at),
					gt(schema.pastes.expires_at, nowStr)
				)
			) as any;
		}

		const countRes = await this.db.select({ count: count() }).from(schema.pastes).where(condition);
		const total = countRes[0].count;

		const rows = await this.db
			.select()
			.from(schema.pastes)
			.where(condition)
			.orderBy(desc(schema.pastes.created_at));

		const pastes = rows.map((row: any) => ({
			...row,
			created_at: this.fromSqlDate(row.created_at)!,
			updated_at: this.fromSqlDate(row.updated_at)!,
			expires_at: this.fromSqlDate(row.expires_at)
		}));

		return { pastes, total };
	}

	async listAllPastesAdmin(limit: number, offset: number, search?: string): Promise<{ pastes: Paste[]; total: number }> {
		let condition;
		if (search) {
			const searchTerm = `%${search.toLowerCase().trim()}%`;
			condition = or(
				like(sql`LOWER(${schema.pastes.title})`, searchTerm),
				like(sql`LOWER(${schema.pastes.content})`, searchTerm),
				like(sql`LOWER(${schema.pastes.author_name})`, searchTerm)
			);
		}

		const countRes = await this.db.select({ count: count() }).from(schema.pastes).where(condition);
		const total = countRes[0].count;

		const rows = await this.db
			.select()
			.from(schema.pastes)
			.where(condition)
			.orderBy(desc(schema.pastes.created_at))
			.limit(limit)
			.offset(offset);

		const pastes = rows.map((row: any) => ({
			...row,
			created_at: this.fromSqlDate(row.created_at)!,
			updated_at: this.fromSqlDate(row.updated_at)!,
			expires_at: this.fromSqlDate(row.expires_at)
		}));

		return { pastes, total };
	}
}
