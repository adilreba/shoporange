import { createClient, RedisClientType } from 'redis';

const REDIS_URL = process.env.REDIS_URL;

let client: RedisClientType | null = null;
let isConnecting = false;

async function getClient(): Promise<RedisClientType | null> {
  if (!REDIS_URL) {
    return null;
  }

  if (client?.isReady) {
    return client;
  }

  if (isConnecting) {
    // Başka bir bağlantı kuruluyor, bekle
    await new Promise((resolve) => setTimeout(resolve, 100));
    return getClient();
  }

  isConnecting = true;
  try {
    client = createClient({ url: REDIS_URL });
    client.on('error', (err) => {
      console.error('Redis error:', err.message);
    });
    await client.connect();
    return client;
  } catch (error) {
    console.error('Redis connection failed:', error);
    return null;
  } finally {
    isConnecting = false;
  }
}

/**
 * Cache a value with TTL (seconds)
 */
export async function cacheSet(
  key: string,
  value: any,
  ttlSeconds = 300
): Promise<void> {
  const redis = await getClient();
  if (!redis) return;

  try {
    await redis.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    console.error('Redis cacheSet error:', error);
  }
}

/**
 * Get a cached value
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = await getClient();
  if (!redis) return null;

  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data as string) : null;
  } catch (error) {
    console.error('Redis cacheGet error:', error);
    return null;
  }
}

/**
 * Delete a cached value
 */
export async function cacheDel(key: string): Promise<void> {
  const redis = await getClient();
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (error) {
    console.error('Redis cacheDel error:', error);
  }
}

/**
 * Delete cached values by pattern (e.g., "products:*")
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
  const redis = await getClient();
  if (!redis) return;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    console.error('Redis cacheDelPattern error:', error);
  }
}

/**
 * Rate limiter with sliding window (Redis-backed)
 * Returns: { allowed: boolean, remaining: number, resetAt: number }
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const redis = await getClient();
  if (!redis) {
    // Redis yoksa rate limiting devre dışı (tüm isteklere izin ver)
    return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowSeconds * 1000 };
  }

  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  const redisKey = `ratelimit:${key}`;

  try {
    // Eski entries'ları temizle ve yeni entry ekle (atomic pipeline)
    const pipeline = redis.multi();
    pipeline.zRemRangeByScore(redisKey, 0, windowStart);
    pipeline.zAdd(redisKey, { score: now, value: `${now}-${Math.random()}` });
    pipeline.zCard(redisKey);
    pipeline.expire(redisKey, windowSeconds);

    const results = await pipeline.exec();
    const count = (results?.[2] as unknown as number) || 1;

    const allowed = count <= maxRequests;
    const remaining = Math.max(0, maxRequests - count);
    const resetAt = now + windowSeconds * 1000;

    return { allowed, remaining, resetAt };
  } catch (error) {
    console.error('Redis rate limit error:', error);
    return { allowed: true, remaining: maxRequests, resetAt: now + windowSeconds * 1000 };
  }
}

/**
 * Session store: Save session data with TTL
 */
export async function saveSession(
  sessionId: string,
  data: Record<string, any>,
  ttlSeconds = 3600
): Promise<void> {
  const redis = await getClient();
  if (!redis) return;

  try {
    await redis.setEx(`session:${sessionId}`, ttlSeconds, JSON.stringify(data));
  } catch (error) {
    console.error('Redis saveSession error:', error);
  }
}

/**
 * Session store: Get session data
 */
export async function getSession<T = Record<string, any>>(
  sessionId: string
): Promise<T | null> {
  const redis = await getClient();
  if (!redis) return null;

  try {
    const data = await redis.get(`session:${sessionId}`);
    return data ? JSON.parse(data as string) : null;
  } catch (error) {
    console.error('Redis getSession error:', error);
    return null;
  }
}

/**
 * Session store: Delete session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const redis = await getClient();
  if (!redis) return;

  try {
    await redis.del(`session:${sessionId}`);
  } catch (error) {
    console.error('Redis deleteSession error:', error);
  }
}

/**
 * Close Redis connection (for testing / graceful shutdown)
 */
export async function closeRedis(): Promise<void> {
  if (client?.isReady) {
    await client.quit();
    client = null;
  }
}
