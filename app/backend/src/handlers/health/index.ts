/**
 * HEALTH CHECK HANDLER
 * Load balancer, monitoring tools, and uptime services için endpoint
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { createErrorResponse, createSuccessResponse } from '../../utils/response';
import { cacheGet } from '../../utils/redis';

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-west-1' });
const docClient = DynamoDBDocumentClient.from(dynamodb);

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    api: { status: 'pass' | 'fail'; responseTime: number };
    dynamodb: { status: 'pass' | 'fail'; responseTime: number };
    redis?: { status: 'pass' | 'fail'; responseTime: number };
  };
}

const startTime = Date.now();

// Basit bağlantı kontrolleri
async function checkDynamoDB(): Promise<{ status: 'pass' | 'fail'; responseTime: number }> {
  const start = Date.now();
  try {
    await docClient.send(new ListTablesCommand({ Limit: 1 }));
    return { status: 'pass', responseTime: Date.now() - start };
  } catch {
    return { status: 'fail', responseTime: Date.now() - start };
  }
}

async function checkRedis(): Promise<{ status: 'pass' | 'fail'; responseTime: number }> {
  const start = Date.now();
  try {
    await cacheGet('health:check');
    return { status: 'pass', responseTime: Date.now() - start };
  } catch {
    return { status: 'fail', responseTime: Date.now() - start };
  }
}

export const getHealth = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const start = Date.now();

  const [dynamoCheck, redisCheck] = await Promise.all([
    checkDynamoDB(),
    checkRedis(),
  ]);

  const allPassed = dynamoCheck.status === 'pass' && redisCheck.status === 'pass';
  const anyFailed = dynamoCheck.status === 'fail' || redisCheck.status === 'fail';

  const status: HealthStatus['status'] = allPassed ? 'healthy' : anyFailed ? 'unhealthy' : 'degraded';

  const health: HealthStatus = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Date.now() - startTime,
    checks: {
      api: { status: 'pass', responseTime: Date.now() - start },
      dynamodb: dynamoCheck,
      redis: redisCheck,
    },
  };

  // Load balancer için: unhealthy ise 503, healthy ise 200
  const statusCode = status === 'unhealthy' ? 503 : 200;

  return createSuccessResponse(health, statusCode);
};

// Lightweight liveness probe (sadece API çalışıyor mu)
export const getLiveness = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return createSuccessResponse({
    status: 'alive',
    timestamp: new Date().toISOString(),
  }, 200);
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') {
    return createSuccessResponse({}, 200);
  }

  const path = event.path;

  if (path === '/health/live' || path.endsWith('/health/live')) {
    return getLiveness(event);
  }

  if (path === '/health' || path.endsWith('/health')) {
    return getHealth(event);
  }

  return createErrorResponse(404, 'Not found');
};
