export interface User {
	id: string;
	username: string;
	email: string;
	created_at?: string;
	is_admin?: boolean;
}

class AuthStore {
	#currentUser = $state<User | null>(null);
	#initialized = $state(false);

	get currentUser() {
		return this.#currentUser;
	}

	get initialized() {
		return this.#initialized;
	}

	setUser(user: User | null) {
		this.#currentUser = user;
		this.#initialized = true;
	}

	redirectToLogin() {
		if (typeof window === 'undefined') return;
		const redirect = window.location.pathname + window.location.search;
		const loginUrl = redirect && redirect !== '/login'
			? `/login?redirect=${encodeURIComponent(redirect)}`
			: '/login';
		window.location.href = loginUrl;
	}

	async login(emailOrUsername: string, password: string) {
		try {
			const res = await fetchWithTimeout('/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email_or_username: emailOrUsername, password })
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				return { success: false, message: err.error || 'Invalid credentials' };
			}

			const data = await res.json();
			this.#currentUser = data.user;
			this.#initialized = true;

			return { success: true, message: 'Success' };
		} catch (e: any) {
			return { success: false, message: e.message || 'Connection error' };
		}
	}

	async signup(username: string, email: string, password: string) {
		try {
			const res = await fetchWithTimeout('/api/auth/signup', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ username, email, password })
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				return { success: false, message: err.error || 'Signup failed' };
			}

			const data = await res.json();
			this.#currentUser = data.user;
			this.#initialized = true;

			return { success: true, message: 'Success' };
		} catch (e: any) {
			return { success: false, message: e.message || 'Connection error' };
		}
	}

	async logout() {
		try {
			await fetchWithTimeout('/api/auth/logout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});
		} catch (e) {
			console.error('Logout request failed', e);
		}

		this.#currentUser = null;
		
		// Clear local states and hard reload to clean everything up
		if (typeof window !== 'undefined') {
			window.location.href = '/';
		}
	}

	// fetchWithAuth automatically redirects to /login on 401 (expired/invalid token)
	async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
		const res = await fetchWithTimeout(url, options);

		if (res.status === 401 && typeof window !== 'undefined') {
			// Token is expired or invalid — clear user state and redirect
			this.#currentUser = null;
			this.redirectToLogin();
		}

		return res;
	}
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 60000): Promise<Response> {
	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const response = await fetch(url, {
			...options,
			signal: controller.signal
		});
		clearTimeout(id);
		return response;
	} catch (error: any) {
		clearTimeout(id);
		if (error.name === 'AbortError') {
			throw new Error('Request timed out (60 seconds)');
		}
		throw error;
	}
}

export const auth = new AuthStore();

