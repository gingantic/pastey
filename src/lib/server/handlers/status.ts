import { getDB } from '../db';

export interface SystemStatus {
	timestamp: string;
	database: { status: 'connected' | 'error'; type: string; latency_ms: number | null };
	redis: { status: 'connected' | 'disabled' | 'error'; latency_ms: number | null };
}

// Called directly from server-side code (admin page load), not exposed via API
export async function getSystemStatus(): Promise<SystemStatus> {
	// ── Database health ───────────────────────────────────────────────────────
	let dbStatus: 'connected' | 'error' = 'error';
	let dbLatencyMs: number | null = null;
	let dbType = 'unknown';

	try {
		const { DB_TYPE } = await import('$env/static/private');
		dbType = DB_TYPE?.toLowerCase().includes('postgres') ? 'postgres' : 'sqlite';
	} catch {
		// env not available
	}

	try {
		const db = await getDB();
		const t0 = performance.now();
		await db.countUsers();
		dbLatencyMs = Math.round(performance.now() - t0);
		dbStatus = 'connected';
	} catch {
		dbStatus = 'error';
	}

	// ── Redis health ──────────────────────────────────────────────────────────
	let redisStatus: 'connected' | 'disabled' | 'error' = 'disabled';
	let redisLatencyMs: number | null = null;

	try {
		const { getRedisClient } = await import('../redis');
		const redis = await getRedisClient();
		if (redis) {
			const t0 = performance.now();
			await redis.ping();
			redisLatencyMs = Math.round(performance.now() - t0);
			redisStatus = 'connected';
		}
	} catch {
		redisStatus = 'error';
	}

	return {
		timestamp: new Date().toISOString(),
		database: {
			status: dbStatus,
			type: dbType,
			latency_ms: dbLatencyMs
		},
		redis: {
			status: redisStatus,
			latency_ms: redisLatencyMs
		}
	};
}
