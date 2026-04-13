import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { encryptField, decryptField, maskSensitiveData, maskEmail, maskPhone } from '../../utils/encryption';
import { audit } from '../../utils/auditLogger';
import { getClientIP } from '../../utils/security';

// DynamoDB client - SDK v3
const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const USERS_TABLE = process.env.USERS_TABLE || '';

// PII fields that need encryption
const USER_PII_FIELDS = ['email', 'phone', 'address'] as const;

// Kullanıcı ID'sini token'dan al
const getUserId = (event: APIGatewayProxyEvent): string => {
  return event.requestContext.authorizer?.claims?.sub || 'guest';
};

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

    // Decrypt PII fields
    const decryptedUser = { ...result.Item };
    const encryptionContext = { userId, service: 'users', purpose: 'pii-retrieval' };
    
    for (const field of USER_PII_FIELDS) {
      if (result.Item[field] && typeof result.Item[field] === 'string') {
        try {
          decryptedUser[field] = await decryptField(result.Item[field], encryptionContext);
        } catch (decryptError) {
          console.error(`Failed to decrypt ${field}:`, decryptError);
          // If decryption fails, keep the original value (might be unencrypted legacy data)
          decryptedUser[field] = result.Item[field];
        }
      }
    }

    // Log admin access with masked data
    const maskedForLog = maskSensitiveData(decryptedUser, ['email', 'phone']);
    console.log('Admin user access:', { userId: maskedForLog.id, email: maskedForLog.email });

    // Audit log for admin access
    await audit.adminAction({
      adminId: event.requestContext.authorizer?.claims?.sub || 'unknown',
      adminEmail: event.requestContext.authorizer?.claims?.email || 'unknown',
      ipAddress: getClientIP(event),
      action: 'VIEW_USER',
      resource: 'USER',
      resourceId: userId,
      details: { accessedFields: Object.keys(decryptedUser) },
    });

    return createSuccessResponse(decryptedUser);
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
    const encryptionContext = { userId, service: 'users', purpose: 'pii-storage' };

    // Dinamik update expression oluştur
    const updateExpressions: string[] = [];
    const expressionValues: Record<string, any> = { ':updatedAt': new Date().toISOString() };
    const expressionNames: Record<string, string> = {};

    if (updates.name) {
      updateExpressions.push('#name = :name');
      expressionValues[':name'] = updates.name;
      expressionNames['#name'] = 'name';
    }
    // Encrypt PII fields before storing
    if (updates.email) {
      updateExpressions.push('email = :email');
      expressionValues[':email'] = await encryptField(updates.email, encryptionContext);
    }
    if (updates.phone) {
      updateExpressions.push('phone = :phone');
      expressionValues[':phone'] = await encryptField(updates.phone, encryptionContext);
    }
    if (updates.address) {
      updateExpressions.push('address = :address');
      const addressData = typeof updates.address === 'string' 
        ? updates.address 
        : JSON.stringify(updates.address);
      expressionValues[':address'] = await encryptField(addressData, encryptionContext);
    }
    // Rol güncelleme desteği
    if (updates.role) {
      updateExpressions.push('#role = :role');
      expressionValues[':role'] = updates.role;
      expressionNames['#role'] = 'role';
    }
    // Bildirim tercihi güncelleme desteği
    if (updates.notificationPreference) {
      updateExpressions.push('notificationPreference = :notificationPreference');
      expressionValues[':notificationPreference'] = updates.notificationPreference;
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

    // Audit log for admin update
    await audit.adminAction({
      adminId: event.requestContext.authorizer?.claims?.sub || 'unknown',
      adminEmail: event.requestContext.authorizer?.claims?.email || 'unknown',
      ipAddress: getClientIP(event),
      action: 'UPDATE_USER',
      resource: 'USER',
      resourceId: userId,
      details: { 
        updatedFields: Object.keys(updates).filter(k => !['password'].includes(k)),
        hasEmailUpdate: !!updates.email,
        hasPhoneUpdate: !!updates.phone,
      },
    });

    // Decrypt PII fields for response
    const decryptedResult = result.Attributes ? { ...result.Attributes } : null;
    if (decryptedResult) {
      for (const field of USER_PII_FIELDS) {
        if (decryptedResult[field] && typeof decryptedResult[field] === 'string') {
          try {
            decryptedResult[field] = await decryptField(decryptedResult[field], encryptionContext);
          } catch (e) {
            // Keep as-is if decryption fails
          }
        }
      }
    }

    return createSuccessResponse(decryptedResult);
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

export const getMe = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserId(event);

    const result = await dynamodb.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { id: userId }
    }));

    if (!result.Item) {
      return createErrorResponse(404, 'User not found');
    }

    // Decrypt PII fields for the user
    const decryptedUser = { ...result.Item };
    const encryptionContext = { userId, service: 'users', purpose: 'pii-retrieval' };
    
    for (const field of USER_PII_FIELDS) {
      if (result.Item[field] && typeof result.Item[field] === 'string') {
        try {
          decryptedUser[field] = await decryptField(result.Item[field], encryptionContext);
        } catch (decryptError) {
          console.error(`Failed to decrypt ${field}:`, decryptError);
          // If decryption fails, might be legacy unencrypted data
          decryptedUser[field] = result.Item[field];
        }
      }
    }

    return createSuccessResponse(decryptedUser);
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

export const updateMe = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserId(event);
    if (!event.body) {
      return createErrorResponse(400, 'Request body required');
    }

    const updates = JSON.parse(event.body);
    const encryptionContext = { userId, service: 'users', purpose: 'pii-storage' };

    const updateExpressions: string[] = [];
    const expressionValues: Record<string, any> = { ':updatedAt': new Date().toISOString() };
    const expressionNames: Record<string, string> = {};

    if (updates.name) {
      updateExpressions.push('#name = :name');
      expressionValues[':name'] = updates.name;
      expressionNames['#name'] = 'name';
    }
    // Encrypt PII fields before storing
    if (updates.email) {
      updateExpressions.push('email = :email');
      expressionValues[':email'] = await encryptField(updates.email, encryptionContext);
    }
    if (updates.phone !== undefined) {
      updateExpressions.push('phone = :phone');
      expressionValues[':phone'] = updates.phone 
        ? await encryptField(updates.phone, encryptionContext)
        : null;
    }
    if (updates.address) {
      updateExpressions.push('address = :address');
      const addressData = typeof updates.address === 'string' 
        ? updates.address 
        : JSON.stringify(updates.address);
      expressionValues[':address'] = await encryptField(addressData, encryptionContext);
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

    // Audit log for user self-update
    await audit.userAction({
      userId,
      userEmail: updates.email ? maskEmail(updates.email) : 'unchanged',
      ipAddress: getClientIP(event),
      action: 'UPDATE_PROFILE',
      resource: 'USER',
      resourceId: userId,
      details: { 
        updatedFields: Object.keys(updates).filter(k => !['password'].includes(k)),
      },
    });

    // Decrypt PII fields for response
    const decryptedResult = result.Attributes ? { ...result.Attributes } : null;
    if (decryptedResult) {
      for (const field of USER_PII_FIELDS) {
        if (decryptedResult[field] && typeof decryptedResult[field] === 'string') {
          try {
            decryptedResult[field] = await decryptField(decryptedResult[field], encryptionContext);
          } catch (e) {
            // Keep as-is if decryption fails
          }
        }
      }
    }

    return createSuccessResponse(decryptedResult);
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

  if (path === '/users/me' || path.endsWith('/users/me')) {
    if (method === 'GET') return getMe(event);
    if (method === 'PUT') return updateMe(event);
  }

  if (path.includes('/users/') && path.split('/users/')[1]) {
    if (method === 'GET') return getUser(event);
    if (method === 'PUT') return updateUser(event);
  }

  return createErrorResponse(404, 'Not found');
};
