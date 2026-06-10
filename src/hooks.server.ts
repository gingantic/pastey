import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { BACKEND_URL } from '$env/static/private';

function decodeJwt(token: string) {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;
		const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
		return JSON.parse(payload);
	} catch (e) {
		return null;
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('pastey_token');
	const refreshToken = event.cookies.get('pastey_refresh_token');

	let user = null;

	if (token) {
		const claims = decodeJwt(token);
		if (claims) {
			const isExpired = claims.exp ? claims.exp * 1000 < Date.now() : true;
			if (!isExpired) {
				user = {
					id: claims.user_id || claims.sub,
					username: claims.username,
					email: claims.email,
					is_admin: !!claims.is_admin
				};
			}
		}
	}

	// If token was missing/expired but refresh token is present, try server-side refresh
	if (!user && refreshToken) {
		try {
			const response = await fetch(`${BACKEND_URL}/auth/refresh`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ refresh_token: refreshToken })
			});

			if (response.ok) {
				const data = await response.json();
				// Update access token cookie (valid for 15 mins)
				event.cookies.set('pastey_token', data.tokens.access_token, {
					path: '/',
					httpOnly: true,
					secure: !dev,
					sameSite: 'lax',
					maxAge: 15 * 60
				});
				// Update refresh token cookie (valid for 30 days)
				event.cookies.set('pastey_refresh_token', data.tokens.refresh_token, {
					path: '/',
					httpOnly: true,
					secure: !dev,
					sameSite: 'lax',
					maxAge: 30 * 24 * 60 * 60
				});

				user = {
					id: data.user.id,
					username: data.user.username,
					email: data.user.email,
					is_admin: !!data.user.is_admin
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
