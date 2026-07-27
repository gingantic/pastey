import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: text('id').primaryKey().notNull(),
	username: text('username').unique().notNull(),
	email: text('email').unique().notNull(),
	password: text('password').notNull(),
	is_admin: integer('is_admin', { mode: 'boolean' }).default(false).notNull(),
	created_at: text('created_at').notNull(),
	updated_at: text('updated_at').notNull()
});

export const refresh_tokens = sqliteTable('refresh_tokens', {
	id: text('id').primaryKey().notNull(),
	user_id: text('user_id').notNull(),
	token: text('token').unique().notNull(),
	expires_at: text('expires_at').notNull(),
	created_at: text('created_at').notNull()
});

export const api_keys = sqliteTable('api_keys', {
	id: text('id').primaryKey().notNull(),
	user_id: text('user_id').notNull(),
	name: text('name').notNull(),
	key_hash: text('key_hash').unique().notNull(),
	prefix: text('prefix').notNull(),
	created_at: text('created_at').notNull(),
	last_used_at: text('last_used_at')
});

export const pastes = sqliteTable('pastes', {
	id: text('id').primaryKey().notNull(),
	title: text('title').default('Untitled').notNull(),
	content: text('content').notNull(),
	lang: text('lang').default('plaintext').notNull(),
	expiry: text('expiry').default('never').notNull(),
	visibility: text('visibility').default('public').notNull(),
	author_id: text('author_id'),
	author_name: text('author_name').default('Anonymous').notNull(),
	views: integer('views').default(0).notNull(),
	created_at: text('created_at').notNull(),
	updated_at: text('updated_at').notNull(),
	expires_at: text('expires_at')
});

export type SqliteUser = typeof users.$inferSelect;
export type SqliteRefreshToken = typeof refresh_tokens.$inferSelect;
export type SqliteApiKey = typeof api_keys.$inferSelect;
export type SqlitePaste = typeof pastes.$inferSelect;
