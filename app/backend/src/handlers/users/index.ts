import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { encryptField, decryptField, maskSensitiveData, maskEmail, maskPhone } from '../../utils/encryption';
import { audit } from '../../utils/auditLogger';
import { getClientIP } from '../../utils/security';
import { getUserId, getUserFromToken, requireAuth, requireAdmin } from '../../utils/authorization';
import { createErrorResponse, createSuccessResponse } from '../../utils/response';

// DynamoDB client - SDK v3
const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const USERS_TABLE = process.env.USERS_TABLE || '';

// PII fields that need encryption
const USER_PII_FIELDS = ['email', 'phone', 'address'] as const;

// getUserId is now imported from '../../utils/authorization'

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

// Helper functions
export const getUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const targetUserId = event.pathParameters?.id;
    if (!targetUserId) {
      return createErrorResponse(400, 'User ID required');
    }

    // Authorization: users can only view their own profile, admins can view any
    const authUser = getUserFromToken(event);
    if (authUser && authUser.userId !== targetUserId) {
      try {
        requireAdmin(event);
      } catch {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'You do not have permission to view this user' }),
        };
      }
    }

    const result = await dynamodb.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { id: targetUserId }
    }));

    if (!result.Item) {
      return createErrorResponse(404, 'User not found');
    }

    // Decrypt PII fields
    const decryptedUser = { ...result.Item };
    const encryptionContext = { userId: targetUserId, service: 'users', purpose: 'pii-retrieval' };
    
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
      adminId: authUser?.userId || 'unknown',
      adminEmail: authUser?.email || 'unknown',
      ipAddress: getClientIP(event),
      action: 'VIEW_USER',
      resource: 'USER',
      resourceId: targetUserId,
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
    const targetUserId = event.pathParameters?.id;
    if (!targetUserId || !event.body) {
      return createErrorResponse(400, 'User ID and body required');
    }

    // Authorization: users can update their own profile, admins can update any
    const authUser = getUserFromToken(event);
    if (authUser && authUser.userId !== targetUserId) {
      try {
        requireAdmin(event);
      } catch {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'You do not have permission to update this user' }),
        };
      }
    }

    const updates = JSON.parse(event.body);
    const encryptionContext = { userId: targetUserId, service: 'users', purpose: 'pii-storage' };

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
      Key: { id: targetUserId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expressionNames).length > 0 ? expressionNames : undefined,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW'
    }));

    // Audit log for admin update
    await audit.adminAction({
      adminId: authUser?.userId || 'unknown',
      adminEmail: authUser?.email || 'unknown',
      ipAddress: getClientIP(event),
      action: 'UPDATE_USER',
      resource: 'USER',
      resourceId: targetUserId,
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

// ===== SOFT DELETE USER =====
export const softDeleteUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const adminUser = requireAdmin(event);
    const userId = event.pathParameters?.id;
    if (!userId) {
      return createErrorResponse(400, 'User ID required');
    }

    const body = JSON.parse(event.body || '{}');
    const adminId = body.adminId || adminUser.userId;

    const result = await dynamodb.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { id: userId },
      UpdateExpression: 'SET isActive = :false, deletedAt = :now, deletedBy = :adminId, updatedAt = :now',
      ExpressionAttributeValues: {
        ':false': false,
        ':now': new Date().toISOString(),
        ':adminId': adminId,
      },
      ReturnValues: 'ALL_NEW',
    }));

    await audit.adminAction({
      adminId: adminUser.userId,
      adminEmail: adminUser.email,
      ipAddress: getClientIP(event),
      action: 'SOFT_DELETE_USER',
      resource: 'USER',
      resourceId: userId,
    });

    return createSuccessResponse({ 
      success: true, 
      message: 'Kullanıcı başarıyla pasif yapıldı',
      user: result.Attributes,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return createErrorResponse(403, 'Admin access required');
    }
    console.error('Error soft deleting user:', error);
    return createErrorResponse(500, 'Failed to soft delete user');
  }
};

// ===== RESTORE USER =====
export const restoreUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const adminUser = requireAdmin(event);
    const userId = event.pathParameters?.id;
    if (!userId) {
      return createErrorResponse(400, 'User ID required');
    }

    const result = await dynamodb.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { id: userId },
      UpdateExpression: 'SET isActive = :true, deletedAt = :null, deletedBy = :null, updatedAt = :now',
      ExpressionAttributeValues: {
        ':true': true,
        ':null': null,
        ':now': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    }));

    await audit.adminAction({
      adminId: adminUser.userId,
      adminEmail: adminUser.email,
      ipAddress: getClientIP(event),
      action: 'RESTORE_USER',
      resource: 'USER',
      resourceId: userId,
    });

    return createSuccessResponse({ 
      success: true, 
      message: 'Kullanıcı başarıyla geri yüklendi',
      user: result.Attributes,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return createErrorResponse(403, 'Admin access required');
    }
    console.error('Error restoring user:', error);
    return createErrorResponse(500, 'Failed to restore user');
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

  if (path.match(/\/users\/[^/]+\/soft-delete$/) || path.endsWith('/soft-delete')) {
    if (method === 'PUT') return softDeleteUser(event);
  }

  if (path.match(/\/users\/[^/]+\/restore$/) || path.endsWith('/restore')) {
    if (method === 'PUT') return restoreUser(event);
  }

  if (path.includes('/users/') && path.split('/users/')[1] && !path.includes('/soft-delete') && !path.includes('/restore')) {
    if (method === 'GET') return getUser(event);
    if (method === 'PUT') return updateUser(event);
  }

  return createErrorResponse(404, 'Not found');
};
