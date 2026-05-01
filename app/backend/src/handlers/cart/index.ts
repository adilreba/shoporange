import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { getUserId } from '../../utils/authorization';
import { createErrorResponse, createSuccessResponse } from '../../utils/response';

// DynamoDB client - SDK v3
const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const CART_TABLE = process.env.CART_TABLE || '';

const headers = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

// Helper functions
// getUserId is now imported from '../../utils/authorization'

// Sepeti getir
export const getCart = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserId(event);

    const result = await dynamodb.send(new QueryCommand({
      TableName: CART_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    }));

    const items = result.Items || [];
    const total = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    return createSuccessResponse({
      items,
      total,
      count: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return createErrorResponse(500, 'Failed to fetch cart');
  }
};

// Sepete ekle
export const addToCart = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserId(event);

    if (!event.body) {
      return createErrorResponse(400, 'Request body is required');
    }

    const { productId, name, price, image, quantity = 1 } = JSON.parse(event.body);

    if (!productId || !name || !price) {
      return createErrorResponse(400, 'Missing required fields');
    }

    // Mevcut ürünü kontrol et
    const existing = await dynamodb.send(new GetCommand({
      TableName: CART_TABLE,
      Key: { userId, productId },
    }));

    if (existing.Item) {
      // Mevcut ürünü güncelle
      await dynamodb.send(new UpdateCommand({
        TableName: CART_TABLE,
        Key: { userId, productId },
        UpdateExpression: 'SET quantity = quantity + :quantity, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':quantity': quantity,
          ':updatedAt': new Date().toISOString(),
        },
      }));
    } else {
      // Yeni ürün ekle
      await dynamodb.send(new PutCommand({
        TableName: CART_TABLE,
        Item: {
          userId,
          productId,
          name,
          price,
          image,
          quantity,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }));
    }

    return createSuccessResponse({ message: 'Added to cart' });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return createErrorResponse(500, 'Failed to add to cart');
  }
};

// Sepet ürününü güncelle
export const updateCartItem = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserId(event);
    const productId = event.pathParameters?.productId;

    if (!productId || !event.body) {
      return createErrorResponse(400, 'Missing required fields');
    }

    const { quantity } = JSON.parse(event.body);

    if (quantity <= 0) {
      // Miktar 0 veya negatifse ürünü sil
      await dynamodb.send(new DeleteCommand({
        TableName: CART_TABLE,
        Key: { userId, productId },
      }));
    } else {
      await dynamodb.send(new UpdateCommand({
        TableName: CART_TABLE,
        Key: { userId, productId },
        UpdateExpression: 'SET quantity = :quantity, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':quantity': quantity,
          ':updatedAt': new Date().toISOString(),
        },
      }));
    }

    return createSuccessResponse({ message: 'Cart updated' });
  } catch (error) {
    console.error('Error updating cart:', error);
    return createErrorResponse(500, 'Failed to update cart');
  }
};

// Sepetten ürün sil
export const removeFromCart = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserId(event);
    const productId = event.pathParameters?.productId;

    if (!productId) {
      return createErrorResponse(400, 'Product ID is required');
    }

    await dynamodb.send(new DeleteCommand({
      TableName: CART_TABLE,
      Key: { userId, productId },
    }));

    return createSuccessResponse({ message: 'Removed from cart' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    return createErrorResponse(500, 'Failed to remove from cart');
  }
};

// Sepeti temizle
export const clearCart = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserId(event);

    // Kullanıcının tüm sepet öğelerini bul
    const result = await dynamodb.send(new QueryCommand({
      TableName: CART_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    }));

    // Batch delete
    const items = result.Items || [];
    if (items.length > 0) {
      const deleteRequests = items.map((item: any) => ({
        DeleteRequest: {
          Key: {
            userId: item.userId,
            productId: item.productId,
          },
        },
      }));

      await dynamodb.send(new BatchWriteCommand({
        RequestItems: {
          [CART_TABLE]: deleteRequests,
        },
      }));
    }

    return createSuccessResponse({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return createErrorResponse(500, 'Failed to clear cart');
  }
};

// Main handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path;
  const method = event.httpMethod;

  if (path === '/cart' || path.endsWith('/cart')) {
    if (method === 'GET') return getCart(event);
    if (method === 'POST') return addToCart(event);
    if (method === 'DELETE') return clearCart(event);
  }

  if (path.includes('/cart/') && path.split('/cart/')[1]) {
    if (method === 'PUT') return updateCartItem(event);
    if (method === 'DELETE') return removeFromCart(event);
  }

  return createErrorResponse(404, 'Not found');
};
