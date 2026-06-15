import pg from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, or, and, like, sql, count, desc, isNull, gt } from 'drizzle-orm';
import type { DBAdapter, User, RefreshToken, Paste, UserWithPasteCount } from './db';
import * as schema from './schema.postgres';

const { Pool } = pg;

export class PostgresAdapter implements DBAdapter {
	private pool: pg.Pool;
	private db!: NodePgDatabase<typeof schema>;

	constructor(connectionString: string) {
		if (!connectionString) {
			throw new Error('DATABASE_URL is required for PostgreSQL connection.');
		}
		this.pool = new Pool({
			connectionString,
			ssl: connectionString.includes('sslmode=require') || connectionString.includes('neon') ? { rejectUnauthorized: false } : undefined
		});
	}

	async init(): Promise<void> {
		// Initialize Drizzle ORM
		this.db = drizzle(this.pool, { schema });
	}

	// ─── User Operations ───────────────────────────────────────────────────────

	async createUser(user: User): Promise<void> {
		await this.db.insert(schema.users).values({
			id: user.id,
			username: user.username,
			email: user.email,
			password: user.password!,
			is_admin: user.is_admin,
			created_at: user.created_at,
			updated_at: user.updated_at
		});
	}

	async getUserById(id: string): Promise<User | null> {
		const rows = await this.db.select().from(schema.users).where(eq(schema.users.id, id));
		if (rows.length === 0) return null;
		return rows[0];
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
		return rows[0];
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
			created_at: row.created_at,
			paste_count: row.paste_count
		}));
	}

	async toggleAdmin(id: string, isAdmin: boolean): Promise<void> {
		await this.db
			.update(schema.users)
			.set({ is_admin: isAdmin, updated_at: new Date() })
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
		return rows[0];
	}

	// ─── Refresh Token Operations ──────────────────────────────────────────────

	async createRefreshToken(token: RefreshToken): Promise<void> {
		await this.db.insert(schema.refresh_tokens).values({
			id: token.id,
			user_id: token.user_id,
			token: token.token,
			expires_at: token.expires_at,
			created_at: token.created_at
		});
	}

	async getRefreshToken(hashedToken: string): Promise<RefreshToken | null> {
		const rows = await this.db
			.select()
			.from(schema.refresh_tokens)
			.where(eq(schema.refresh_tokens.token, hashedToken));
		if (rows.length === 0) return null;
		return rows[0];
	}

	async deleteRefreshToken(hashedToken: string): Promise<void> {
		await this.db.delete(schema.refresh_tokens).where(eq(schema.refresh_tokens.token, hashedToken));
	}

	async deleteRefreshTokensByUserId(userId: string): Promise<void> {
		await this.db.delete(schema.refresh_tokens).where(eq(schema.refresh_tokens.user_id, userId));
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
			created_at: paste.created_at,
			updated_at: paste.updated_at,
			expires_at: paste.expires_at
		});
	}

	async getPasteById(id: string): Promise<Paste | null> {
		const rows = await this.db.select().from(schema.pastes).where(eq(schema.pastes.id, id));
		if (rows.length === 0) return null;
		return rows[0];
	}

	async updatePaste(id: string, updates: Partial<Paste>): Promise<void> {
		await this.db
			.update(schema.pastes)
			.set({ ...updates, updated_at: new Date() })
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

	async listPublicPastes(limit: number, offset: number): Promise<{ pastes: Paste[]; total: number }> {
		const now = new Date();
		const condition = and(
			eq(schema.pastes.visibility, 'public'),
			or(
				isNull(schema.pastes.expires_at),
				gt(schema.pastes.expires_at, now)
			)
		);

		const countRes = await this.db.select({ count: count() }).from(schema.pastes).where(condition);
		const total = countRes[0].count;

		const pastes = await this.db
			.select()
			.from(schema.pastes)
			.where(condition)
			.orderBy(desc(schema.pastes.created_at))
			.limit(limit)
			.offset(offset);

		return { pastes, total };
	}

	async listPastesByAuthorId(authorId: string): Promise<{ pastes: Paste[]; total: number }> {
		const condition = eq(schema.pastes.author_id, authorId);
		const countRes = await this.db.select({ count: count() }).from(schema.pastes).where(condition);
		const total = countRes[0].count;

		const pastes = await this.db
			.select()
			.from(schema.pastes)
			.where(condition)
			.orderBy(desc(schema.pastes.created_at));

		return { pastes, total };
	}

	async listPastesByAuthorName(authorName: string, showAll: boolean): Promise<{ pastes: Paste[]; total: number }> {
		const now = new Date();
		let condition = eq(sql`LOWER(${schema.pastes.author_name})`, authorName.toLowerCase());

		if (!showAll) {
			condition = and(
				condition,
				eq(schema.pastes.visibility, 'public'),
				or(
					isNull(schema.pastes.expires_at),
					gt(schema.pastes.expires_at, now)
				)
			) as any;
		}

		const countRes = await this.db.select({ count: count() }).from(schema.pastes).where(condition);
		const total = countRes[0].count;

		const pastes = await this.db
			.select()
			.from(schema.pastes)
			.where(condition)
			.orderBy(desc(schema.pastes.created_at));

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

		const pastes = await this.db
			.select()
			.from(schema.pastes)
			.where(condition)
			.orderBy(desc(schema.pastes.created_at))
			.limit(limit)
			.offset(offset);

		return { pastes, total };
	}
}
