import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

// DynamoDB client - SDK v3
const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const ORDERS_TABLE = process.env.ORDERS_TABLE || '';
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || '';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

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
      result = await dynamodb.send(new ScanCommand({
        TableName: ORDERS_TABLE
      }));
    }

    return createSuccessResponse(result.Items || []);
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

    return createSuccessResponse(result.Item);
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
    const { items, userId } = orderData;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return createErrorResponse(400, 'Order items required');
    }

    // Stok kontrolü yap
    const stockCheck = await checkStockAvailability(items);
    if (!stockCheck.available) {
      return createErrorResponse(400, 'Stock insufficient', stockCheck.errors);
    }

    const orderId = `ORD-${Date.now()}`;

    const order = {
      id: orderId,
      ...orderData,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Siparişi kaydet
    await dynamodb.send(new PutCommand({
      TableName: ORDERS_TABLE,
      Item: order
    }));

    // Stok düşür
    await deductStock(items);

    return createSuccessResponse(order, 201);
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

    // Mevcut siparişi al
    const orderResult = await dynamodb.send(new GetCommand({
      TableName: ORDERS_TABLE,
      Key: { id: orderId }
    }));

    if (!orderResult.Item) {
      return createErrorResponse(404, 'Order not found');
    }

    const order = orderResult.Item;

    // Sipariş iptal edilirse stok iade et
    if (status === 'cancelled' && order.status !== 'cancelled') {
      await returnStock(order.items);
    }

    // İptal edilen sipariş tekrar aktif olursa stok düşür
    if (order.status === 'cancelled' && status !== 'cancelled') {
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
