import { pgTable, uuid, varchar, text, boolean, timestamp, bigint } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: uuid('id').primaryKey().notNull(),
	username: varchar('username', { length: 50 }).unique().notNull(),
	email: varchar('email', { length: 255 }).unique().notNull(),
	password: text('password').notNull(),
	is_admin: boolean('is_admin').default(false).notNull(),
	created_at: timestamp('created_at', { withTimezone: true }).notNull(),
	updated_at: timestamp('updated_at', { withTimezone: true }).notNull()
});

export const refresh_tokens = pgTable('refresh_tokens', {
	id: uuid('id').primaryKey().notNull(),
	user_id: uuid('user_id').notNull(),
	token: varchar('token', { length: 255 }).unique().notNull(),
	expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
	created_at: timestamp('created_at', { withTimezone: true }).notNull()
});

export const pastes = pgTable('pastes', {
	id: varchar('id', { length: 12 }).primaryKey().notNull(),
	title: varchar('title', { length: 255 }).default('Untitled').notNull(),
	content: text('content').notNull(),
	lang: varchar('lang', { length: 50 }).default('plaintext').notNull(),
	expiry: varchar('expiry', { length: 20 }).default('never').notNull(),
	visibility: varchar('visibility', { length: 10 }).default('public').notNull(),
	author_id: uuid('author_id'),
	author_name: varchar('author_name', { length: 50 }).default('Anonymous').notNull(),
	views: bigint('views', { mode: 'number' }).default(0).notNull(),
	created_at: timestamp('created_at', { withTimezone: true }).notNull(),
	updated_at: timestamp('updated_at', { withTimezone: true }).notNull(),
	expires_at: timestamp('expires_at', { withTimezone: true })
});
export type PostgresUser = typeof users.$inferSelect;
export type PostgresRefreshToken = typeof refresh_tokens.$inferSelect;
export type PostgresPaste = typeof pastes.$inferSelect;
