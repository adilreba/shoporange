import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

// DynamoDB client - SDK v3
const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const USERS_TABLE = process.env.USERS_TABLE || '';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

// Helper functions
const createErrorResponse = (statusCode: number, message: string): APIGatewayProxyResult => ({
  statusCode,
  headers,
  body: JSON.stringify({ error: message, timestamp: new Date().toISOString() }),
});

const createSuccessResponse = (data: any, statusCode = 200): APIGatewayProxyResult => ({
  statusCode,
  headers,
  body: JSON.stringify(data),
});

export const getUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.id;
    if (!userId) {
      return createErrorResponse(400, 'User ID required');
    }

    const result = await dynamodb.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { id: userId }
    }));

    if (!result.Item) {
      return createErrorResponse(404, 'User not found');
    }

    return createSuccessResponse(result.Item);
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

export const updateUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.id;
    if (!userId || !event.body) {
      return createErrorResponse(400, 'User ID and body required');
    }

    const updates = JSON.parse(event.body);

    // Dinamik update expression oluştur
    const updateExpressions: string[] = [];
    const expressionValues: Record<string, any> = { ':updatedAt': new Date().toISOString() };
    const expressionNames: Record<string, string> = {};

    if (updates.name) {
      updateExpressions.push('#name = :name');
      expressionValues[':name'] = updates.name;
      expressionNames['#name'] = 'name';
    }
    if (updates.email) {
      updateExpressions.push('email = :email');
      expressionValues[':email'] = updates.email;
    }
    if (updates.phone) {
      updateExpressions.push('phone = :phone');
      expressionValues[':phone'] = updates.phone;
    }
    if (updates.address) {
      updateExpressions.push('address = :address');
      expressionValues[':address'] = updates.address;
    }
    updateExpressions.push('updatedAt = :updatedAt');

    const result = await dynamodb.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { id: userId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expressionNames).length > 0 ? expressionNames : undefined,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW'
    }));

    return createSuccessResponse(result.Attributes);
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

// Main handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path;
  const method = event.httpMethod;

  if (path.includes('/users/') && path.split('/users/')[1]) {
    if (method === 'GET') return getUser(event);
    if (method === 'PUT') return updateUser(event);
  }

  return createErrorResponse(404, 'Not found');
};
