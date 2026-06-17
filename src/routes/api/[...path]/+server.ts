import { dev } from '$app/environment';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyAccessToken } from '$lib/server/auth';
import * as statusHandler from '$lib/server/handlers/status';
import * as authHandler from '$lib/server/handlers/auth';
import * as pastesHandler from '$lib/server/handlers/pastes';
import * as adminHandler from '$lib/server/handlers/admin';

async function getCurrentUser(event: any) {
	if (event.locals.user) {
		return {
			user_id: event.locals.user.id,
			username: event.locals.user.username,
			email: event.locals.user.email,
			is_admin: event.locals.user.is_admin
		};
	}
	
	const authHeader = event.request.headers.get('authorization');
	if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
		const token = authHeader.substring(7);
		const claims = await verifyAccessToken(token);
		if (claims) {
			return claims;
		}
	}
	
	return null;
}

async function handleRouter(event: any) {
	const { params, request, cookies, url } = event;
	const path = params.path;
	const method = request.method;
	
	const parts = path.split('/');
	const user = await getCurrentUser(event);

	let body: any = null;
	if (method !== 'GET' && method !== 'HEAD') {
		body = await request.json().catch(() => ({}));
	}

	let res: { status: number; data?: any; error?: string; rawContent?: string } = {
		status: 404,
		error: 'Not found'
	};

	try {
		// 1. Status Route
		if (path === 'status') {
			res = { status: 200, data: await statusHandler.getStatus() };
		}
		
		// 2. Auth Routes
		else if (parts[0] === 'auth') {
			if (parts[1] === 'signup' && method === 'POST') {
				res = await authHandler.signup(body);
			} else if (parts[1] === 'login' && method === 'POST') {
				res = await authHandler.login(body);
			} else if (parts[1] === 'refresh' && method === 'POST') {
				// Fallback: read refresh token from body or cookies
				const token = body?.refresh_token || cookies.get('pastey_refresh_token');
				res = await authHandler.refresh({ refresh_token: token });
			} else if (parts[1] === 'logout' && method === 'POST') {
				const token = body?.refresh_token || cookies.get('pastey_refresh_token');
				res = await authHandler.logout({ refresh_token: token });
			} else if (parts[1] === 'me' && method === 'GET') {
				res = await authHandler.getMe(user?.user_id);
			}
		}
		
		// 3. User Routes
		else if (parts[0] === 'users') {
			if (parts[1] === 'me' && parts[2] === 'pastes' && method === 'GET') {
				res = await pastesHandler.myPastes(user);
			} else if (parts[2] === 'pastes' && method === 'GET') {
				res = await pastesHandler.personalPastes(parts[1], user);
			}
		}
		
		// 4. Pastes Routes
		else if (parts[0] === 'pastes') {
			if (parts.length === 1) {
				if (method === 'GET') {
					res = await pastesHandler.listPastes(url);
				} else if (method === 'POST') {
					res = await pastesHandler.createPaste(body, user);
				}
			} else if (parts.length === 2) {
				const id = parts[1];
				if (method === 'GET') {
					res = await pastesHandler.getPaste(id, user);
				} else if (method === 'PUT') {
					res = await pastesHandler.updatePaste(id, body, user);
				} else if (method === 'DELETE') {
					res = await pastesHandler.deletePaste(id, user);
				}
			} else if (parts.length === 3 && parts[2] === 'raw' && method === 'GET') {
				res = await pastesHandler.getRawPaste(parts[1], user);
			}
		}
		
		// 5. Admin Routes
		else if (parts[0] === 'admin') {
			if (parts[1] === 'users') {
				if (parts.length === 2 && method === 'GET') {
					res = await adminHandler.listUsers(url, user);
				} else if (parts.length === 3 && method === 'DELETE') {
					res = await adminHandler.deleteUser(parts[2], user);
				} else if (parts.length === 4 && parts[3] === 'toggle-admin' && method === 'POST') {
					res = await adminHandler.toggleAdmin(parts[2], user);
				}
			} else if (parts[1] === 'pastes' && method === 'GET') {
				res = await adminHandler.listPastes(url, user);
			}
		}
		
		// Handle Success Response & Cookie management
		if (res.status >= 200 && res.status < 300) {
			// Manage cookies for Authentication
			if (path === 'auth/login' || path === 'auth/signup' || path === 'auth/refresh') {
				const data = res.data;
				cookies.set('pastey_token', data.tokens.access_token, {
					path: '/',
					httpOnly: true,
					secure: url.protocol === 'https:',
					sameSite: 'lax',
					maxAge: 15 * 60 // 15 mins
				});

				cookies.set('pastey_refresh_token', data.tokens.refresh_token, {
					path: '/',
					httpOnly: true,
					secure: url.protocol === 'https:',
					sameSite: 'lax',
					maxAge: 30 * 24 * 60 * 60 // 30 days
				});

				// Return user profile and conceal raw tokens
				return json({ user: data.user }, { status: res.status });
			}
			
			if (path === 'auth/logout') {
				cookies.delete('pastey_token', { path: '/' });
				cookies.delete('pastey_refresh_token', { path: '/' });
				return json(res.data, { status: res.status });
			}

			// Raw paste retrieval response (plain text)
			if (res.rawContent !== undefined) {
				return new Response(res.rawContent, {
					status: res.status,
					headers: { 'Content-Type': 'text/plain; charset=utf-8' }
				});
			}

			return json(res.data, { status: res.status });
		}

		// Handle error response
		return json({ error: res.error || 'Request failed' }, { status: res.status });

	} catch (e: any) {
		console.error(`Router error for path ${path}:`, e);
		return json({ error: e.message || 'Internal server error' }, { status: 500 });
	}
}

export const GET: RequestHandler = handleRouter;
export const POST: RequestHandler = handleRouter;
export const PUT: RequestHandler = handleRouter;
export const DELETE: RequestHandler = handleRouter;
