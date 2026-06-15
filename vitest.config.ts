import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

// Override environment variables for in-memory SQLite test suite
process.env.DB_TYPE = 'sqlite';
process.env.DATABASE_URL = ':memory:';
process.env.JWT_SECRET = 'test-secret-key-minimum-32-chars-long-!!!';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'node'
	}
});
