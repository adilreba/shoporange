/**
 * DynamoDB Rate Limiter
 * ======================
 * Lambda stateless ortamda çalışan, DynamoDB tabanlı rate limiting.
 * In-memory Map yerine persist edilmiş, tüm Lambda instance'ları arasında
 * paylaşılan rate limit kayıtları.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

const RATE_LIMIT_TABLE = process.env.RATE_LIMIT_TABLE || 'RateLimits';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * DynamoDB tabanlı rate limit kontrolü
 * @param identifier IP adresi veya user ID
 * @param maxRequests Pencere içinde izin verilen maksimum istek
 * @param windowMs Pencere süresi (ms)
 */
export async function checkRateLimitDynamoDB(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowKey = Math.floor(now / windowMs);
  const compositeKey = `${identifier}:${windowKey}`;
  const resetTime = (windowKey + 1) * windowMs;

  try {
    // Mevcut kaydı al
    const result = await dynamodb.send(new GetCommand({
      TableName: RATE_LIMIT_TABLE,
      Key: { key: compositeKey },
    }));

    const record = result.Item;

    if (!record) {
      // İlk istek - yeni kayıt oluştur
      await dynamodb.send(new PutCommand({
        TableName: RATE_LIMIT_TABLE,
        Item: {
          key: compositeKey,
          identifier,
          windowKey,
          count: 1,
          resetTime,
          ttl: Math.floor(resetTime / 1000), // DynamoDB TTL (saniye)
        },
      }));

      return { allowed: true, remaining: maxRequests - 1, resetTime };
    }

    const currentCount = record.count || 0;

    if (currentCount >= maxRequests) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime };
    }

    // Sayacı artır
    await dynamodb.send(new UpdateCommand({
      TableName: RATE_LIMIT_TABLE,
      Key: { key: compositeKey },
      UpdateExpression: 'SET #count = #count + :inc',
      ExpressionAttributeNames: { '#count': 'count' },
      ExpressionAttributeValues: { ':inc': 1 },
    }));

    return {
      allowed: true,
      remaining: maxRequests - currentCount - 1,
      resetTime: record.resetTime,
    };
  } catch (error) {
    console.error('Rate limiter DynamoDB error:', error);
    // DynamoDB hatası durumunda isteğe izin ver (fail-open)
    return { allowed: true, remaining: maxRequests, resetTime };
  }
}

/**
 * Auth endpoint'leri için stricter rate limit (brute-force koruması)
 */
export async function checkAuthRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  return checkRateLimitDynamoDB(identifier, 5, 60000); // 1 dakikada 5 deneme
}

export default {
  checkRateLimitDynamoDB,
  checkAuthRateLimit,
};
