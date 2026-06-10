import type { RequestHandler } from './$types';
import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';

async function handleProxy(event: any) {
	const { params, request, cookies } = event;
	const path = params.path;
	const url = `${BACKEND_URL}/${path}`;

	const method = request.method;

	// Prepare headers
	const headers = new Headers();
	const contentType = request.headers.get('content-type');
	if (contentType) {
		headers.set('content-type', contentType);
	}

	// 1. Handle Logout endpoint specifically
	if (path === 'auth/logout') {
		const refreshToken = cookies.get('pastey_refresh_token');
		
		cookies.delete('pastey_token', { path: '/' });
		cookies.delete('pastey_refresh_token', { path: '/' });

		try {
			const res = await fetch(`${BACKEND_URL}/auth/logout`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ refresh_token: refreshToken || '' })
			});

			const data = await res.json().catch(() => ({}));
			return new Response(JSON.stringify(data), {
				status: res.status,
				headers: { 'Content-Type': 'application/json' }
			});
		} catch (err) {
			return new Response(JSON.stringify({ message: 'Logged out locally' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	// 2. Attach Authorization Bearer token from cookies for all other requests
	const token = cookies.get('pastey_token');
	if (token) {
		headers.set('authorization', `Bearer ${token}`);
	}

	// Get request body
	let body: string | undefined = undefined;
	if (method !== 'GET' && method !== 'HEAD') {
		body = await request.text();
	}

	try {
		const res = await fetch(url, {
			method,
			headers,
			body
		});

		// 3. Handle Login/Signup to extract tokens and set HTTP-only cookies
		if (res.ok && (path === 'auth/login' || path === 'auth/signup')) {
			const data = await res.json();

			cookies.set('pastey_token', data.tokens.access_token, {
				path: '/',
				httpOnly: true,
				secure: !dev,
				sameSite: 'lax',
				maxAge: 15 * 60 // 15 mins
			});

			cookies.set('pastey_refresh_token', data.tokens.refresh_token, {
				path: '/',
				httpOnly: true,
				secure: !dev,
				sameSite: 'lax',
				maxAge: 30 * 24 * 60 * 60 // 30 days
			});

			// Only return user profile to the client, concealing raw tokens
			return new Response(JSON.stringify({ user: data.user }), {
				status: res.status,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Forward backend response
		const responseText = await res.text();
		return new Response(responseText, {
			status: res.status,
			headers: {
				'Content-Type': res.headers.get('content-type') || 'application/json'
			}
		});
	} catch (e: any) {
		console.error(`BFF Proxy error for path ${path}:`, e);
		throw error(500, e.message || 'Internal proxy error');
	}
}

export const GET: RequestHandler = handleProxy;
export const POST: RequestHandler = handleProxy;
export const PUT: RequestHandler = handleProxy;
export const DELETE: RequestHandler = handleProxy;
