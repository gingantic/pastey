import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import { getDB } from '../db';
import { createPaste, getPaste, deletePaste, updatePaste } from './pastes';

async function cleanDB() {
	const db = await getDB();
	if ('sqliteDb' in db && (db as any).sqliteDb) {
		(db as any).sqliteDb.exec('DELETE FROM users; DELETE FROM refresh_tokens; DELETE FROM pastes;');
	} else if ('pool' in db && (db as any).pool) {
		await (db as any).pool.query('DELETE FROM refresh_tokens; DELETE FROM pastes; DELETE FROM users;');
	}
}

describe('Pastes Handlers', () => {
	beforeEach(async () => {
		await cleanDB();
	});

	describe('Paste Creation Validation', () => {
		it('should reject paste creation with empty content', async () => {
			const res = await createPaste({ title: 'Test', content: '' }, null);
			expect(res.status).toBe(400);
			expect(res.error).toBe('content cannot be empty');
		});
	});

	describe('Paste Retrieval & Visibility', () => {
		it('should create and retrieve a public paste and increment its view count', async () => {
			const createRes = await createPaste({
				title: 'My Paste',
				content: 'console.log("hello");',
				lang: 'javascript',
				expiry: 'never',
				visibility: 'public'
			}, null);

			expect(createRes.status).toBe(201);
			expect(createRes.data!.id).toHaveLength(4);
			expect(createRes.data!.author_name).toBe('Anonymous');

			const pasteId = createRes.data!.id;

			// Get paste
			const getRes = await getPaste(pasteId, null);
			expect(getRes.status).toBe(200);
			expect(getRes.data!.title).toBe('My Paste');
			expect(getRes.data!.views).toBe(1);

			// View counts should increment
			const getResAgain = await getPaste(pasteId, null);
			expect(getResAgain.data!.views).toBe(2);
		});

		it('should restrict private pastes to the owner or admins only', async () => {
			const owner = { user_id: 'owner-uuid-1111', username: 'owneruser', email: 'owner@e.com', is_admin: false };
			const stranger = { user_id: 'stranger-uuid-2222', username: 'strangeruser', email: 'stranger@e.com', is_admin: false };
			const admin = { user_id: 'admin-uuid-3333', username: 'adminuser', email: 'admin@e.com', is_admin: true };

			const createRes = await createPaste({
				title: 'Secret Code',
				content: 'private-credentials',
				visibility: 'private'
			}, owner);

			const pasteId = createRes.data!.id;

			// Stranger should get 404
			const strangerRes = await getPaste(pasteId, stranger);
			expect(strangerRes.status).toBe(404);

			// Unauthenticated user should get 404
			const anonRes = await getPaste(pasteId, null);
			expect(anonRes.status).toBe(404);

			// Owner should be allowed to view
			const ownerRes = await getPaste(pasteId, owner);
			expect(ownerRes.status).toBe(200);
			expect(ownerRes.data!.content).toBe('private-credentials');

			// Admin should be allowed to view
			const adminRes = await getPaste(pasteId, admin);
			expect(adminRes.status).toBe(200);
		});
	});

	describe('Paste Expiration & Lazy Deletion', () => {
		it('should lazy delete expired pastes upon retrieval', async () => {
			const db = await getDB();
			const expiredPaste = {
				id: 'expired12345',
				title: 'Expired Paste',
				content: 'this is old',
				lang: 'plaintext',
				expiry: '10m',
				visibility: 'public',
				author_id: null,
				author_name: 'Anonymous',
				views: 0,
				created_at: new Date(Date.now() - 15 * 60 * 1000), // Created 15 mins ago
				updated_at: new Date(Date.now() - 15 * 60 * 1000),
				expires_at: new Date(Date.now() - 5 * 60 * 1000) // Expired 5 mins ago
			};

			await db.createPaste(expiredPaste);

			// Retrieve expired paste -> should return 404
			const getRes = await getPaste(expiredPaste.id, null);
			expect(getRes.status).toBe(404);
			expect(getRes.error).toBe('paste has expired');

			// Paste should be lazy deleted from the database
			const dbPaste = await db.getPasteById(expiredPaste.id);
			expect(dbPaste).toBeNull();
		});
	});

	describe('ID Collision Handling', () => {
		it('should append a character when ID collision occurs', async () => {
			const db = await getDB();
			const mockRandomInt = vi.spyOn(crypto, 'randomInt');
			
			// Mock randomInt to return 0 ('A') for the first 4 calls,
			// then 1 ('B') for subsequent calls.
			let callCount = 0;
			mockRandomInt.mockImplementation(() => {
				callCount++;
				if (callCount <= 4) {
					return 0; // index 0 is 'A'
				} else {
					return 1; // index 1 is 'B'
				}
			});

			// Create a paste that has ID 'AAAA'
			await db.createPaste({
				id: 'AAAA',
				title: 'Existing Paste',
				content: 'already here',
				lang: 'plaintext',
				expiry: 'never',
				visibility: 'public',
				author_id: null,
				author_name: 'Anonymous',
				views: 0,
				created_at: new Date(),
				updated_at: new Date(),
				expires_at: null
			});

			// Create a new paste. The first attempt will try 'AAAA' and collide.
			// The second attempt will generate a 5-char ID 'BBBBB', which will succeed.
			const res = await createPaste({
				title: 'New Paste',
				content: 'hello',
			}, null);

			expect(res.status).toBe(201);
			expect(res.data!.id).toBe('BBBBB');
			expect(res.data!.id).toHaveLength(5);

			mockRandomInt.mockRestore();
		});
	});
});
