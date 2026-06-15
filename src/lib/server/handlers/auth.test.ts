import { describe, it, expect, beforeEach } from 'vitest';
import { getDB } from '../db';
import { signup, login, refresh, logout, getMe } from './auth';

async function cleanDB() {
	const db = await getDB();
	if ('sqliteDb' in db && (db as any).sqliteDb) {
		(db as any).sqliteDb.exec('DELETE FROM users; DELETE FROM refresh_tokens; DELETE FROM pastes;');
	} else if ('pool' in db && (db as any).pool) {
		await (db as any).pool.query('DELETE FROM refresh_tokens; DELETE FROM pastes; DELETE FROM users;');
	}
}

describe('Auth Handlers', () => {
	beforeEach(async () => {
		await cleanDB();
	});

	describe('Signup Validation', () => {
		it('should reject usernames shorter than 3 characters', async () => {
			const res = await signup({ username: 'ab', email: 'a@b.com', password: 'password123' });
			expect(res.status).toBe(400);
			expect(res.error).toContain('username must be at least 3 characters');
		});

		it('should reject invalid email addresses', async () => {
			const res = await signup({ username: 'valid', email: 'notanemail', password: 'password123' });
			expect(res.status).toBe(400);
			expect(res.error).toContain('invalid email address');
		});

		it('should reject passwords shorter than 8 characters', async () => {
			const res = await signup({ username: 'valid', email: 'a@b.com', password: 'short' });
			expect(res.status).toBe(400);
			expect(res.error).toContain('password must be at least 8 characters');
		});
	});

	describe('Signup & Login Success Flows', () => {
		it('should sign up, promote the first user to admin, and log in successfully', async () => {
			// 1. Signup
			const signupRes = await signup({
				username: 'reihan',
				email: 'reihan@example.com',
				password: 'supersecretpassword123'
			});

			expect(signupRes.status).toBe(201);
			expect(signupRes.data).toBeDefined();
			expect(signupRes.data!.user.username).toBe('reihan');
			expect(signupRes.data!.user.email).toBe('reihan@example.com');
			expect(signupRes.data!.user.is_admin).toBe(true); // First user is Admin
			expect(signupRes.data!.tokens.access_token).toBeDefined();
			expect(signupRes.data!.tokens.refresh_token).toBeDefined();

			// 2. Login
			const loginRes = await login({
				email_or_username: 'reihan@example.com',
				password: 'supersecretpassword123'
			});

			expect(loginRes.status).toBe(200);
			expect(loginRes.data!.user.username).toBe('reihan');
			expect(loginRes.data!.tokens.access_token).toBeDefined();
			expect(loginRes.data!.tokens.refresh_token).toBeDefined();
		});

		it('should not promote secondary signups to admin status', async () => {
			// Admin signup
			await signup({ username: 'admin', email: 'admin@example.com', password: 'password123' });
			
			// Regular user signup
			const userRes = await signup({ username: 'user', email: 'user@example.com', password: 'password123' });
			expect(userRes.status).toBe(201);
			expect(userRes.data!.user.is_admin).toBe(false); // Second user is NOT Admin
		});
	});

	describe('Token Refresh & Logout Rotation', () => {
		it('should rotate refresh tokens and revoke session upon logout', async () => {
			const signupRes = await signup({
				username: 'john',
				email: 'john@example.com',
				password: 'password12345'
			});

			const originalRefreshToken = signupRes.data!.tokens.refresh_token;

			// 1. Refresh token
			const refreshRes = await refresh({ refresh_token: originalRefreshToken });
			expect(refreshRes.status).toBe(200);
			expect(refreshRes.data!.tokens.access_token).toBeDefined();
			expect(refreshRes.data!.tokens.refresh_token).toBeDefined();
			expect(refreshRes.data!.tokens.refresh_token).not.toEqual(originalRefreshToken);

			// 2. Logout using the rotated refresh token
			const logoutRes = await logout({ refresh_token: refreshRes.data!.tokens.refresh_token });
			expect(logoutRes.status).toBe(200);
			expect(logoutRes.data!.message).toBe('logged out successfully');

			// 3. Trying to refresh again with the logged out token should fail
			const failRefresh = await refresh({ refresh_token: refreshRes.data!.tokens.refresh_token });
			expect(failRefresh.status).toBe(401);
		});
	});
});
