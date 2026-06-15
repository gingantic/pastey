import { describe, it, expect } from 'vitest';
import { 
	hashPassword, 
	comparePassword, 
	generateAccessToken, 
	verifyAccessToken, 
	generateRefreshToken, 
	hashToken 
} from './auth';

describe('Auth Helpers', () => {
	describe('Password Hashing', () => {
		it('should hash and compare passwords correctly', async () => {
			const pw = 'super-secret-password-123';
			const hash = await hashPassword(pw);
			
			expect(hash).toBeDefined();
			expect(hash).not.toEqual(pw);
			
			const isMatch = await comparePassword(pw, hash);
			expect(isMatch).toBe(true);
			
			const isMatchWrong = await comparePassword('wrong-password', hash);
			expect(isMatchWrong).toBe(false);
		});
	});

	describe('Access Tokens (JWT)', () => {
		it('should generate and verify access tokens correctly', async () => {
			const user = {
				id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
				username: 'testuser',
				email: 'test@example.com',
				is_admin: true
			};

			const token = await generateAccessToken(user);
			expect(token).toBeDefined();
			expect(typeof token).toBe('string');

			const claims = await verifyAccessToken(token);
			expect(claims).not.toBeNull();
			expect(claims?.user_id).toBe(user.id);
			expect(claims?.username).toBe(user.username);
			expect(claims?.email).toBe(user.email);
			expect(claims?.is_admin).toBe(user.is_admin);
		});

		it('should fail verification for invalid signatures', async () => {
			const claims = await verifyAccessToken('invalid.token.string');
			expect(claims).toBeNull();
		});
	});

	describe('Refresh Tokens', () => {
		it('should generate a 128-char hex refresh token and its hash', () => {
			const { raw, hashed } = generateRefreshToken();
			
			expect(raw).toHaveLength(128);
			expect(hashed).toBeDefined();
			expect(hashed).toEqual(hashToken(raw));
		});

		it('should hash tokens deterministically', () => {
			const raw = 'my-custom-token';
			const h1 = hashToken(raw);
			const h2 = hashToken(raw);
			
			expect(h1).toEqual(h2);
			expect(h1).not.toEqual(raw);
		});
	});
});
