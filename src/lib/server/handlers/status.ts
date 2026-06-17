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

