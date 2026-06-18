import { getDB } from '../db';

export async function getStatus() {
	const db = await getDB();
	const userCount = await db.countUsers().catch(() => 0);
	
	// We call listAllPastesAdmin with limit=1 to get the total pastes count efficiently
	const pasteCount = await db.listAllPastesAdmin(1, 0).then(res => res.total).catch(() => 0);

	let redisStatus = 'disabled';
	try {
		const { getRedisClient } = await import('../redis');
		const redis = await getRedisClient();
		if (redis) {
			redisStatus = 'connected';
		}
	} catch (err) {
		redisStatus = 'error';
	}

	return {
		status: 'healthy',
		message: 'Welcome to Pastey.',
		timestamp: new Date().toISOString(),
		redis: redisStatus,
		stats: {
			total_users: userCount,
			total_pastes: pasteCount
		}
	};
}

export async function getDetailedStatus(currentUser: any) {
	if (!currentUser || !currentUser.is_admin) {
		return { status: 403, error: 'forbidden: admin access required' };
	}

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
		status: 200,
		data: {
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
		}
	};
}

