export interface User {
	username: string;
	email: string;
}

class AuthStore {
	#currentUser = $state<User | null>(null);

	constructor() {
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem('pastey_user');
			if (stored) {
				try {
					this.#currentUser = JSON.parse(stored);
				} catch (e) {
					localStorage.removeItem('pastey_user');
				}
			}
		}
	}

	get currentUser() {
		return this.#currentUser;
	}

	login(emailOrUsername: string, password: string) {
		if (typeof window === 'undefined') return { success: false, message: 'Server-side action not allowed.' };
		
		const usersStr = localStorage.getItem('pastey_users') || '[]';
		let users: any[] = [];
		try {
			users = JSON.parse(usersStr);
		} catch (e) {}

		// Seed a default user for testing if no users exist
		if (users.length === 0) {
			users.push({
				username: 'reihan.dev',
				email: 'reihan@reihan.dev',
				password: 'password123'
			});
			localStorage.setItem('pastey_users', JSON.stringify(users));
		}

		const user = users.find(
			(u) =>
				(u.username.toLowerCase() === emailOrUsername.toLowerCase() ||
					u.email.toLowerCase() === emailOrUsername.toLowerCase()) &&
				u.password === password
		);

		if (user) {
			const loggedInUser: User = { username: user.username, email: user.email };
			this.#currentUser = loggedInUser;
			localStorage.setItem('pastey_user', JSON.stringify(loggedInUser));
			return { success: true, message: 'Success' };
		}

		return { success: false, message: 'Invalid username/email or password.' };
	}

	signup(username: string, email: string, password: string) {
		if (typeof window === 'undefined') return { success: false, message: 'Server-side action not allowed.' };

		const usersStr = localStorage.getItem('pastey_users') || '[]';
		let users: any[] = [];
		try {
			users = JSON.parse(usersStr);
		} catch (e) {}

		if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
			return { success: false, message: 'Username is already taken.' };
		}

		if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
			return { success: false, message: 'Email is already registered.' };
		}

		const newUser = { username, email, password };
		users.push(newUser);
		localStorage.setItem('pastey_users', JSON.stringify(users));

		const loggedInUser: User = { username, email };
		this.#currentUser = loggedInUser;
		localStorage.setItem('pastey_user', JSON.stringify(loggedInUser));

		return { success: true, message: 'Success' };
	}

	logout() {
		if (typeof window === 'undefined') return;
		this.#currentUser = null;
		localStorage.removeItem('pastey_user');
	}
}

export const auth = new AuthStore();
