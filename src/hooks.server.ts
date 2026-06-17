import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { verifyAccessToken } from '$lib/server/auth';
import * as authHandler from '$lib/server/handlers/auth';
import { JWT_ACCESS_EXPIRY_SECONDS, JWT_REFRESH_EXPIRY_SECONDS } from '$env/static/private';

const accessExpiry = JWT_ACCESS_EXPIRY_SECONDS ? parseInt(JWT_ACCESS_EXPIRY_SECONDS, 10) : 15 * 60;
const refreshExpiry = JWT_REFRESH_EXPIRY_SECONDS ? parseInt(JWT_REFRESH_EXPIRY_SECONDS, 10) : 30 * 24 * 60 * 60;

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('_sess');
	const refreshToken = event.cookies.get('_auth');

	let user = null;

	if (token) {
		const claims = await verifyAccessToken(token);
		if (claims) {
			user = {
				id: claims.user_id,
				username: claims.username,
				email: claims.email,
				is_admin: claims.is_admin
			};
		}
	}

	// If token was missing/expired but refresh token is present, try server-side refresh
	if (!user && refreshToken) {
		try {
			const res = await authHandler.refresh({ refresh_token: refreshToken });

			if (res.status === 200 && res.data) {
				const { tokens, user: profile } = res.data;
				
				// Update access token cookie (valid for 15 mins)
				event.cookies.set('_sess', tokens.access_token, {
					path: '/',
					httpOnly: true,
					secure: event.url.protocol === 'https:',
					sameSite: 'lax',
					maxAge: accessExpiry
				});
				
				// Update refresh token cookie (valid for 30 days)
				event.cookies.set('_auth', tokens.refresh_token, {
					path: '/',
					httpOnly: true,
					secure: event.url.protocol === 'https:',
					sameSite: 'lax',
					maxAge: refreshExpiry
				});

				user = {
					id: profile.id,
					username: profile.username,
					email: profile.email,
					is_admin: profile.is_admin
				};
			} else {
				// Refresh token invalid/expired, clear cookies
				event.cookies.delete('_sess', { path: '/' });
				event.cookies.delete('_auth', { path: '/' });
			}
		} catch (err) {
			console.error('Failed transparent token refresh in hooks:', err);
		}
	}

	event.locals.user = user;

	return resolve(event);
};
