import { DB_TYPE, DATABASE_URL } from '$env/static/private';

export interface User {
	id: string;
	username: string;
	email: string;
	password?: string;
	is_admin: boolean;
	created_at: Date;
	updated_at: Date;
}

export interface RefreshToken {
	id: string;
	user_id: string;
	token: string; // SHA-256 hash
	expires_at: Date;
	created_at: Date;
}

export interface Paste {
	id: string;
	title: string;
	content: string;
	lang: string;
	expiry: string;
	visibility: string;
	author_id: string | null;
	author_name: string;
	views: number;
	created_at: Date;
	updated_at: Date;
	expires_at: Date | null;
}

export interface UserWithPasteCount {
	id: string;
	username: string;
	email: string;
	is_admin: boolean;
	created_at: Date;
	paste_count: number;
}

export interface DBAdapter {
	init(): Promise<void>;
	
	// User operations
	createUser(user: User): Promise<void>;
	getUserById(id: string): Promise<User | null>;
	getUserByUsernameOrEmail(identifier: string): Promise<User | null>;
	countUsers(search?: string): Promise<number>;
	listUsers(limit: number, offset: number, search?: string): Promise<UserWithPasteCount[]>;
	toggleAdmin(id: string, isAdmin: boolean): Promise<void>;
	deleteUser(id: string): Promise<void>;
	getOldestUser(): Promise<User | null>;
	
	// Refresh Token operations
	createRefreshToken(token: RefreshToken): Promise<void>;
	getRefreshToken(hashedToken: string): Promise<RefreshToken | null>;
	deleteRefreshToken(hashedToken: string): Promise<void>;
	deleteRefreshTokensByUserId(userId: string): Promise<void>;
	
	// Paste operations
	createPaste(paste: Paste): Promise<void>;
	getPasteById(id: string): Promise<Paste | null>;
	updatePaste(id: string, updates: Partial<Paste>): Promise<void>;
	deletePaste(id: string): Promise<void>;
	deletePastesByAuthorId(authorId: string): Promise<void>;
	incrementPasteViews(id: string): Promise<void>;
	listPublicPastes(limit: number, offset: number): Promise<{ pastes: Paste[]; total: number }>;
	listPastesByAuthorId(authorId: string): Promise<{ pastes: Paste[]; total: number }>;
	listPastesByAuthorName(authorName: string, showAll: boolean): Promise<{ pastes: Paste[]; total: number }>;
	listAllPastesAdmin(limit: number, offset: number, search?: string): Promise<{ pastes: Paste[]; total: number }>;
}

let dbInstance: DBAdapter | null = null;

export async function getDB(): Promise<DBAdapter> {
	if (dbInstance) {
		return dbInstance;
	}

	const isPostgres = DB_TYPE?.toLowerCase() === 'postgres' || DB_TYPE?.toLowerCase() === 'postgresql';
	
	let baseDb: DBAdapter;
	if (isPostgres) {
		const { PostgresAdapter } = await import('./db.postgres');
		baseDb = new PostgresAdapter(DATABASE_URL);
	} else {
		const { SqliteAdapter } = await import('./db.sqlite');
		baseDb = new SqliteAdapter(DATABASE_URL || 'pastey.db');
	}

	await baseDb.init();

	try {
		const { getRedisClient } = await import('./redis');
		const redis = await getRedisClient();
		if (redis) {
			const { RedisAdapterWrapper } = await import('./db.redis');
			dbInstance = new RedisAdapterWrapper(baseDb, redis);
		} else {
			dbInstance = baseDb;
		}
	} catch (err) {
		console.error('Failed to initialize Redis wrapper, using base DB:', err);
		dbInstance = baseDb;
	}

	return dbInstance;
}

