import { APIGatewayProxyResult } from 'aws-lambda';
import { securityHeaders } from './security';

export { securityHeaders };

export function createErrorResponse(
  statusCode: number,
  message: string,
  details?: any
): APIGatewayProxyResult {
  const body: Record<string, any> = { error: message };
  if (details !== undefined) body.details = details;
  return {
    statusCode,
    headers: securityHeaders,
    body: JSON.stringify(body),
  };
}

export function createSuccessResponse(
  data: any,
  statusCode = 200
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: securityHeaders,
    body: JSON.stringify(data),
  };
}
