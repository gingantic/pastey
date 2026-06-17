import { createClient } from 'redis';

let redisClient: ReturnType<typeof createClient> | null = null;
let isConnecting = false;

export async function getRedisClient(): Promise<ReturnType<typeof createClient> | null> {
	const redisUrl = process.env.REDIS_URL;
	if (!redisUrl) {
		return null;
	}
	if (redisClient) {
		return redisClient;
	}
	if (isConnecting) {
		return null;
	}

	isConnecting = true;
	try {
		const client = createClient({
			url: redisUrl
		});

		client.on('error', (err) => {
			console.error('Redis Client Error:', err);
		});

		await client.connect();
		redisClient = client;
		return redisClient;
	} catch (error) {
		console.error('Failed to connect to Redis:', error);
		return null;
	} finally {
		isConnecting = false;
	}
}
