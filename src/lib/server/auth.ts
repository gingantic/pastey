import { dev, building } from '$app/environment';
import * as jose from 'jose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { JWT_SECRET, JWT_ACCESS_EXPIRY_SECONDS } from '$env/static/private';

if (!dev && !building && (!JWT_SECRET || JWT_SECRET === 'pastey-dev-secret-key-minimum-32chars!')) {
	throw new Error('FATAL: JWT_SECRET environment variable is missing or insecure in production.');
}

const secretKey = new TextEncoder().encode(JWT_SECRET || 'pastey-dev-secret-key-minimum-32chars!');

const accessExpiry = JWT_ACCESS_EXPIRY_SECONDS ? parseInt(JWT_ACCESS_EXPIRY_SECONDS, 10) : 15 * 60;

export async function generateAccessToken(user: { id: string; username: string; email: string; is_admin: boolean }): Promise<string> {
	return new jose.SignJWT({
		user_id: user.id,
		username: user.username,
		email: user.email,
		is_admin: user.is_admin
	})
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setIssuer('pastey')
		.setExpirationTime(Math.floor(Date.now() / 1000) + accessExpiry)
		.sign(secretKey);
}

export interface AccessTokenClaims {
	user_id: string;
	username: string;
	email: string;
	is_admin: boolean;
}

export async function verifyAccessToken(token: string): Promise<AccessTokenClaims | null> {
	try {
		const { payload } = await jose.jwtVerify(token, secretKey, {
			issuer: 'pastey'
		});
		return {
			user_id: payload.user_id as string || payload.sub as string,
			username: payload.username as string,
			email: payload.email as string,
			is_admin: !!payload.is_admin
		};
	} catch (e) {
		return null;
	}
}

export function generateRefreshToken() {
	const raw = crypto.randomBytes(64).toString('hex'); // 128 hex chars
	const hashed = hashToken(raw);
	return { raw, hashed };
}

export function generateApiKey() {
	const raw = `pk_${crypto.randomBytes(32).toString('hex')}`; // pk_ + 64 hex chars
	const hashed = hashToken(raw);
	const prefix = raw.slice(0, 10); // e.g. pk_a1b2c3d
	return { raw, hashed, prefix };
}

export function hashToken(raw: string): string {
	return crypto.createHash('sha256').update(raw).digest('hex');
}

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
	return bcrypt.compare(password, hash);
}
