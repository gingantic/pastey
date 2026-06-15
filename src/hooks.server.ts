import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { verifyAccessToken } from '$lib/server/auth';
import * as authHandler from '$lib/server/handlers/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('pastey_token');
	const refreshToken = event.cookies.get('pastey_refresh_token');

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
				event.cookies.set('pastey_token', tokens.access_token, {
					path: '/',
					httpOnly: true,
					secure: !dev,
					sameSite: 'lax',
					maxAge: 15 * 60
				});
				
				// Update refresh token cookie (valid for 30 days)
				event.cookies.set('pastey_refresh_token', tokens.refresh_token, {
					path: '/',
					httpOnly: true,
					secure: !dev,
					sameSite: 'lax',
					maxAge: 30 * 24 * 60 * 60
				});

				user = {
					id: profile.id,
					username: profile.username,
					email: profile.email,
					is_admin: profile.is_admin
				};
			} else {
				// Refresh token invalid/expired, clear cookies
				event.cookies.delete('pastey_token', { path: '/' });
				event.cookies.delete('pastey_refresh_token', { path: '/' });
			}
		} catch (err) {
			console.error('Failed transparent token refresh in hooks:', err);
		}
	}

	event.locals.user = user;

	return resolve(event);
};
