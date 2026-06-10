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

	async login(emailOrUsername: string, password: string) {
		try {
			const res = await fetch('/api/auth/login', {
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
			const res = await fetch('/api/auth/signup', {
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
			await fetch('/api/auth/logout', {
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

	// fetchWithAuth acts as a standard fetch since the browser handles auth cookies automatically.
	// We keep this method for compatibility.
	async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
		return fetch(url, options);
	}
}

export const auth = new AuthStore();
