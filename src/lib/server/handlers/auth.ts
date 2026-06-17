import crypto from 'crypto';
import { getDB } from '../db';
import { 
	hashPassword, 
	comparePassword, 
	generateAccessToken, 
	generateRefreshToken, 
	hashToken 
} from '../auth';

import { JWT_REFRESH_EXPIRY_SECONDS } from '$env/static/private';

const refreshExpiry = JWT_REFRESH_EXPIRY_SECONDS ? parseInt(JWT_REFRESH_EXPIRY_SECONDS, 10) : 30 * 24 * 60 * 60;
const REFRESH_TOKEN_TTL = refreshExpiry * 1000; // in ms

export async function signup(body: any) {
	const { username, email, password } = body || {};

	if (!username || username.trim().length < 3) {
		return { status: 400, error: 'username must be at least 3 characters' };
	}
	if (!email || !email.includes('@')) {
		return { status: 400, error: 'invalid email address' };
	}
	if (!password || password.length < 8) {
		return { status: 400, error: 'password must be at least 8 characters' };
	}

	const db = await getDB();

	// Check if this username/email is already taken
	const existingUser = await db.getUserByUsernameOrEmail(username).catch(() => null);
	const existingEmail = await db.getUserByUsernameOrEmail(email).catch(() => null);
	if (existingUser || existingEmail) {
		return { status: 409, error: 'username or email is already taken' };
	}

	const hash = await hashPassword(password);
	
	// If first user, make them admin
	const count = await db.countUsers().catch(() => 0);
	const isAdmin = count === 0;

	const newUser = {
		id: crypto.randomUUID(),
		username: username.trim(),
		email: email.toLowerCase().trim(),
		password: hash,
		is_admin: isAdmin,
		created_at: new Date(),
		updated_at: new Date()
	};

	await db.createUser(newUser);

	// Issue token pair
	const tokenPair = await issueTokenPair(newUser);
	return { status: 201, data: tokenPair };
}

export async function login(body: any) {
	const { email_or_username, password } = body || {};

	if (!email_or_username || !password) {
		return { status: 400, error: 'invalid credentials' };
	}

	const db = await getDB();
	const user = await db.getUserByUsernameOrEmail(email_or_username);
	if (!user || !user.password) {
		return { status: 401, error: 'invalid credentials' };
	}

	const isMatch = await comparePassword(password, user.password);
	if (!isMatch) {
		return { status: 401, error: 'invalid credentials' };
	}

	const tokenPair = await issueTokenPair(user);
	return { status: 200, data: tokenPair };
}

export async function refresh(body: any) {
	const { refresh_token } = body || {};
	if (!refresh_token || refresh_token.trim() === '') {
		return { status: 400, error: 'refresh token is required' };
	}

	const db = await getDB();
	const hashed = hashToken(refresh_token);

	const rt = await db.getRefreshToken(hashed);
	if (!rt) {
		return { status: 401, error: 'invalid or expired refresh token' };
	}

	if (new Date(rt.expires_at).getTime() < Date.now()) {
		// Cleanup expired token
		await db.deleteRefreshToken(hashed).catch(() => {});
		return { status: 401, error: 'invalid or expired refresh token' };
	}

	// Rotate token: delete old token first
	await db.deleteRefreshToken(hashed);

	const user = await db.getUserById(rt.user_id);
	if (!user) {
		return { status: 404, error: 'user not found' };
	}

	const tokenPair = await issueTokenPair(user);
	return { status: 200, data: tokenPair };
}

export async function logout(body: any) {
	const { refresh_token } = body || {};
	if (!refresh_token || refresh_token.trim() === '') {
		return { status: 400, error: 'refresh token is required' };
	}

	const db = await getDB();
	const hashed = hashToken(refresh_token);
	await db.deleteRefreshToken(hashed);

	return { status: 200, data: { message: 'logged out successfully' } };
}

export async function getMe(userId: string) {
	if (!userId) {
		return { status: 401, error: 'unauthorized' };
	}

	const db = await getDB();
	const user = await db.getUserById(userId);
	if (!user) {
		return { status: 404, error: 'user not found' };
	}

	return {
		status: 200,
		data: {
			id: user.id,
			username: user.username,
			email: user.email,
			is_admin: user.is_admin,
			created_at: user.created_at.toISOString()
		}
	};
}

// ─── Private Token Issuance Helper ───────────────────────────────────────────

async function issueTokenPair(user: any) {
	const db = await getDB();
	const accessToken = await generateAccessToken({
		id: user.id,
		username: user.username,
		email: user.email,
		is_admin: user.is_admin
	});

	const { raw: rawRefresh, hashed: hashedRefresh } = generateRefreshToken();

	const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL);
	await db.createRefreshToken({
		id: crypto.randomUUID(),
		user_id: user.id,
		token: hashedRefresh,
		expires_at: expiresAt,
		created_at: new Date()
	});

	return {
		user: {
			id: user.id,
			username: user.username,
			email: user.email,
			is_admin: user.is_admin,
			created_at: user.created_at.toISOString()
		},
		tokens: {
			access_token: accessToken,
			refresh_token: rawRefresh
		}
	};
}
