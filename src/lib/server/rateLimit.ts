import { getRedisClient } from './redis';

// How many paste writes a single IP may perform inside the window.
const MAX_REQUESTS_PER_WINDOW = 10;
// Window length in seconds (1 hour).
const WINDOW_SECONDS = 60 * 60;

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	// Seconds until the window resets.
	retryAfter: number;
}

// In-memory fallback used when Redis is not configured. This is per-instance
// only, so on horizontally scaled hosts Redis should be provided for a shared
// limit.
const memoryStore = new Map<string, { count: number; expiresAt: number }>();

function checkMemory(key: string, limit: number, windowSeconds: number): RateLimitResult {
	const now = Date.now();
	const windowMs = windowSeconds * 1000;
	const entry = memoryStore.get(key);

	if (!entry || entry.expiresAt <= now) {
		memoryStore.set(key, { count: 1, expiresAt: now + windowMs });
		return { allowed: true, remaining: limit - 1, retryAfter: 0 };
	}

	entry.count++;
	const retryAfter = Math.ceil((entry.expiresAt - now) / 1000);

	if (entry.count > limit) {
		return { allowed: false, remaining: 0, retryAfter };
	}

	return { allowed: true, remaining: limit - entry.count, retryAfter };
}

// Occasionally clear expired in-memory entries so the map doesn't grow forever.
function sweepMemory() {
	const now = Date.now();
	for (const [key, entry] of memoryStore) {
		if (entry.expiresAt <= now) {
			memoryStore.delete(key);
		}
	}
}

// Records a request from the given IP and reports whether it is within the
// allowed rate. This is called BEFORE any database work so that abusive IPs
// never reach the database.
export async function checkRateLimit(
	ip: string,
	limit = MAX_REQUESTS_PER_WINDOW,
	windowSeconds = WINDOW_SECONDS
): Promise<RateLimitResult> {
	const key = `ratelimit:paste:${ip}`;

	let redis: Awaited<ReturnType<typeof getRedisClient>> = null;
	try {
		redis = await getRedisClient();
	} catch {
		redis = null;
	}

	if (!redis) {
		if (memoryStore.size > 10_000) {
			sweepMemory();
		}
		return checkMemory(key, limit, windowSeconds);
	}

	try {
		const count = await redis.incr(key);
		// Set the expiry only on the first hit so the window is fixed from the
		// first request rather than sliding on every call.
		if (count === 1) {
			await redis.expire(key, windowSeconds);
		}

		let ttl = await redis.ttl(key);
		// If the key somehow lost its TTL, re-apply the window.
		if (ttl < 0) {
			await redis.expire(key, windowSeconds);
			ttl = windowSeconds;
		}

		if (count > limit) {
			return { allowed: false, remaining: 0, retryAfter: ttl };
		}

		return { allowed: true, remaining: Math.max(0, limit - count), retryAfter: ttl };
	} catch (err) {
		// Never let a rate-limiter failure block legitimate traffic; fall back
		// to the in-memory counter.
		console.error('Redis rate limit failed, falling back to memory:', err);
		return checkMemory(key, limit, windowSeconds);
	}
}
