/**
 * SECURE ORDERS HANDLER
 * PII encryption, audit logging, and secure order management
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { encryptObjectFields, decryptObjectFields, maskSensitiveData } from '../../utils/encryption';
import { audit } from '../../utils/auditLogger';
import { getClientIP, securityHeaders } from '../../utils/security';

// DynamoDB client - SDK v3
const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const ORDERS_TABLE = process.env.ORDERS_TABLE || '';
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || '';

// PII fields to encrypt
const ORDER_PII_FIELDS = ['shippingAddress', 'billingAddress', 'phone', 'email', 'fullName'];

const headers = securityHeaders;

// Helper functions
const createErrorResponse = (statusCode: number, message: string, details?: any): APIGatewayProxyResult => ({
  statusCode,
  headers,
  body: JSON.stringify({ 
    error: message, 
    details,
    timestamp: new Date().toISOString() 
  }),
});

const createSuccessResponse = (data: any, statusCode = 200): APIGatewayProxyResult => ({
  statusCode,
  headers,
  body: JSON.stringify(data),
});

// Get user info from token/context
const getUserInfo = (event: APIGatewayProxyEvent): { userId?: string; email?: string } => {
  // Extract from JWT token or context
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  if (authHeader) {
    // In real implementation, decode JWT
    return { userId: 'user_id_from_token', email: 'user@example.com' };
  }
  return {};
};

// Stok kontrolü fonksiyonu
async function checkStockAvailability(
  items: Array<{ productId: string; quantity: number }>
): Promise<{ available: boolean; errors: Array<{ productId: string; name: string; requested: number; available: number }> }> {
  const errors: Array<{ productId: string; name: string; requested: number; available: number }> = [];

  for (const item of items) {
    const result = await dynamodb.send(new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { id: item.productId }
    }));

    const product = result.Item;
    if (!product) {
      errors.push({
        productId: item.productId,
        name: 'Bilinmeyen Ürün',
        requested: item.quantity,
        available: 0
      });
    } else if ((product.stock || 0) < item.quantity) {
      errors.push({
        productId: item.productId,
        name: product.name,
        requested: item.quantity,
        available: product.stock
      });
    }
  }

  return { available: errors.length === 0, errors };
}

// Stok düşürme fonksiyonu
async function deductStock(items: Array<{ productId: string; quantity: number }>): Promise<void> {
  for (const item of items) {
    await dynamodb.send(new UpdateCommand({
      TableName: PRODUCTS_TABLE,
      Key: { id: item.productId },
      UpdateExpression: 'SET stock = stock - :quantity, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':quantity': item.quantity,
        ':updatedAt': new Date().toISOString()
      }
    }));
  }
}

// Stok iade fonksiyonu (sipariş iptalinde)
async function returnStock(items: Array<{ productId: string; quantity: number }>): Promise<void> {
  for (const item of items) {
    await dynamodb.send(new UpdateCommand({
      TableName: PRODUCTS_TABLE,
      Key: { id: item.productId },
      UpdateExpression: 'SET stock = stock + :quantity, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':quantity': item.quantity,
        ':updatedAt': new Date().toISOString()
      }
    }));
  }
}

export const getOrders = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.queryStringParameters?.userId;
    const { email } = getUserInfo(event);

    let result;
    if (userId) {
      // UserId index'i varsa Query kullan
      result = await dynamodb.send(new QueryCommand({
        TableName: ORDERS_TABLE,
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId }
      }));
    } else {
      // Admin yetkisi kontrolü gerekli
      result = await dynamodb.send(new ScanCommand({
        TableName: ORDERS_TABLE
      }));
    }

    // Decrypt PII fields for response
    const decryptedItems = await Promise.all(
      (result.Items || []).map(async (item) => {
        return await decryptObjectFields(item, ORDER_PII_FIELDS);
      })
    );

    // Log admin access
    if (!userId && email) {
      await audit.adminAction({
        adminId: 'admin_id',
        adminEmail: email,
        ipAddress: getClientIP(event),
        action: 'VIEW_ALL_ORDERS',
        resource: 'ORDER',
        details: { count: decryptedItems.length },
      });
    }

    return createSuccessResponse(decryptedItems);
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

export const getOrder = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const orderId = event.pathParameters?.id;
    if (!orderId) {
      return createErrorResponse(400, 'Order ID required');
    }

    const result = await dynamodb.send(new GetCommand({
      TableName: ORDERS_TABLE,
      Key: { id: orderId }
    }));

    if (!result.Item) {
      return createErrorResponse(404, 'Order not found');
    }

    // Decrypt PII fields
    const decryptedOrder = await decryptObjectFields(result.Item, ORDER_PII_FIELDS);

    return createSuccessResponse(decryptedOrder);
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

export const createOrder = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createErrorResponse(400, 'Request body required');
    }

    const orderData = JSON.parse(event.body);
    const { items, userId, email, shippingAddress, billingAddress } = orderData;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return createErrorResponse(400, 'Order items required');
    }

    // Stok kontrolü yap
    const stockCheck = await checkStockAvailability(items);
    if (!stockCheck.available) {
      // Audit log for failed order
      await audit.orderCreate({
        userId: userId || 'unknown',
        email: email || 'unknown',
        ipAddress: getClientIP(event),
        orderId: 'FAILED',
        amount: orderData.totalAmount || 0,
        items: items,
        success: false,
        errorMessage: 'Stock insufficient',
      });

      return createErrorResponse(400, 'Stock insufficient', stockCheck.errors);
    }

    const orderId = `ORD-${Date.now()}`;

    // Prepare order with encrypted PII
    const order = {
      id: orderId,
      ...orderData,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Encrypt PII fields before saving
    const encryptedOrder = await encryptObjectFields(order, ORDER_PII_FIELDS);

    // Siparişi kaydet
    await dynamodb.send(new PutCommand({
      TableName: ORDERS_TABLE,
      Item: encryptedOrder
    }));

    // Stok düşür
    await deductStock(items);

    // Audit log
    await audit.orderCreate({
      userId: userId || 'unknown',
      email: email || 'unknown',
      ipAddress: getClientIP(event),
      orderId: orderId,
      amount: orderData.totalAmount || 0,
      items: items,
      success: true,
    });

    // Return decrypted data to user
    const decryptedOrder = await decryptObjectFields(encryptedOrder, ORDER_PII_FIELDS);
    
    // Mask sensitive data in response
    const maskedOrder = maskSensitiveData(decryptedOrder, ['email', 'phone']);

    return createSuccessResponse(maskedOrder, 201);
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

export const updateOrderStatus = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const orderId = event.pathParameters?.id;
    if (!orderId || !event.body) {
      return createErrorResponse(400, 'Order ID and body required');
    }

    const { status, paymentStatus } = JSON.parse(event.body);
    const { email, userId } = getUserInfo(event);

    // Mevcut siparişi al
    const orderResult = await dynamodb.send(new GetCommand({
      TableName: ORDERS_TABLE,
      Key: { id: orderId }
    }));

    if (!orderResult.Item) {
      return createErrorResponse(404, 'Order not found');
    }

    const order = orderResult.Item;

    // Sipariş iptal, iade veya ödeme başarısız olursa stok iade et
    const shouldReturnStock = (
      (status === 'cancelled' && order.status !== 'cancelled') ||
      (status === 'refunded' && order.status !== 'refunded') ||
      (paymentStatus === 'failed' && order.paymentStatus !== 'failed')
    );
    
    if (shouldReturnStock) {
      await returnStock(order.items);
      
      // Audit log
      await audit.logAuditEvent({
        eventType: 'ORDER_CANCEL',
        severity: 'warning',
        action: 'CANCEL_ORDER',
        resource: 'ORDER',
        resourceId: orderId,
        userId: userId || order.userId,
        userEmail: email || order.email,
        ipAddress: getClientIP(event),
        success: true,
        details: {
          previousStatus: order.status,
          newStatus: status,
          reason: 'Order cancelled or refunded',
        },
      });
    }

    // İptal/iade/ödeme başarısız olan sipariş tekrar aktif olursa stok düşür
    const wasInactive = ['cancelled', 'refunded'].includes(order.status) || order.paymentStatus === 'failed';
    const isNowActive = status && !['cancelled', 'refunded'].includes(status) && paymentStatus !== 'failed';
    
    if (wasInactive && isNowActive) {
      const stockCheck = await checkStockAvailability(order.items);
      if (!stockCheck.available) {
        return createErrorResponse(400, 'Cannot reactivate order - stock insufficient', stockCheck.errors);
      }
      await deductStock(order.items);
    }

    // Siparişi güncelle
    const updateExpressions: string[] = [];
    const expressionValues: Record<string, any> = { ':updatedAt': new Date().toISOString() };
    const expressionNames: Record<string, string> = {};

    if (status) {
      updateExpressions.push('#status = :status');
      expressionValues[':status'] = status;
      expressionNames['#status'] = 'status';
    }
    if (paymentStatus) {
      updateExpressions.push('paymentStatus = :paymentStatus');
      expressionValues[':paymentStatus'] = paymentStatus;
    }
    updateExpressions.push('updatedAt = :updatedAt');

    const result = await dynamodb.send(new UpdateCommand({
      TableName: ORDERS_TABLE,
      Key: { id: orderId },
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

  if (path.includes('/orders/') && path.split('/orders/')[1]) {
    if (method === 'GET') return getOrder(event);
    if (method === 'PUT') return updateOrderStatus(event);
  }

  if (path === '/orders' || path.endsWith('/orders')) {
    if (method === 'GET') return getOrders(event);
    if (method === 'POST') return createOrder(event);
  }

  return createErrorResponse(404, 'Not found');
};
