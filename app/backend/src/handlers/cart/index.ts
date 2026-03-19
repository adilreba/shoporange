import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const CART_TABLE = process.env.CART_TABLE || '';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

// Kullanıcı ID'sini token'dan al
const getUserId = (event: APIGatewayProxyEvent): string => {
  // Cognito authorizer'dan kullanıcı bilgisi
  return event.requestContext.authorizer?.claims?.sub || 'guest';
};

// Sepeti getir
export const getCart = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserId(event);

    const result = await dynamodb
      .query({
        TableName: CART_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      })
      .promise();

    const items = result.Items || [];
    const total = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        items,
        total,
        count: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
      }),
    };
  } catch (error) {
    console.error('Error fetching cart:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch cart' }),
    };
  }
};

// Sepete ekle
export const addToCart = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserId(event);

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { productId, name, price, image, quantity = 1 } = JSON.parse(event.body);

    if (!productId || !name || !price) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Mevcut ürünü kontrol et
    const existing = await dynamodb
      .get({
        TableName: CART_TABLE,
        Key: { userId, productId },
      })
      .promise();

    if (existing.Item) {
      // Mevcut ürünü güncelle
      await dynamodb
        .update({
          TableName: CART_TABLE,
          Key: { userId, productId },
          UpdateExpression: 'SET quantity = quantity + :quantity, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':quantity': quantity,
            ':updatedAt': new Date().toISOString(),
          },
        })
        .promise();
    } else {
      // Yeni ürün ekle
      await dynamodb
        .put({
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
        })
        .promise();
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Added to cart' }),
    };
  } catch (error) {
    console.error('Error adding to cart:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to add to cart' }),
    };
  }
};

// Sepet ürününü güncelle
export const updateCartItem = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserId(event);
    const productId = event.pathParameters?.productId;

    if (!productId || !event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    const { quantity } = JSON.parse(event.body);

    if (quantity <= 0) {
      // Miktar 0 veya negatifse ürünü sil
      await dynamodb
        .delete({
          TableName: CART_TABLE,
          Key: { userId, productId },
        })
        .promise();
    } else {
      await dynamodb
        .update({
          TableName: CART_TABLE,
          Key: { userId, productId },
          UpdateExpression: 'SET quantity = :quantity, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':quantity': quantity,
            ':updatedAt': new Date().toISOString(),
          },
        })
        .promise();
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Cart updated' }),
    };
  } catch (error) {
    console.error('Error updating cart:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to update cart' }),
    };
  }
};

// Sepetten ürün sil
export const removeFromCart = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserId(event);
    const productId = event.pathParameters?.productId;

    if (!productId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Product ID is required' }),
      };
    }

    await dynamodb
      .delete({
        TableName: CART_TABLE,
        Key: { userId, productId },
      })
      .promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Removed from cart' }),
    };
  } catch (error) {
    console.error('Error removing from cart:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to remove from cart' }),
    };
  }
};

// Sepeti temizle
export const clearCart = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserId(event);

    // Kullanıcının tüm sepet öğelerini bul
    const result = await dynamodb
      .query({
        TableName: CART_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      })
      .promise();

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

      await dynamodb
        .batchWrite({
          RequestItems: {
            [CART_TABLE]: deleteRequests,
          },
        })
        .promise();
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Cart cleared' }),
    };
  } catch (error) {
    console.error('Error clearing cart:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to clear cart' }),
    };
  }
};

// Main handler - routes to specific functions and handles OPTIONS
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Handle OPTIONS (preflight) requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  const path = event.path;
  const method = event.httpMethod;

  // Route to appropriate function
  if (path === '/cart' || path.endsWith('/cart')) {
    if (method === 'GET') return getCart(event);
    if (method === 'POST') return addToCart(event);
    if (method === 'DELETE') return clearCart(event);
  }
  
  if (path.includes('/cart/') && path.split('/cart/')[1]) {
    if (method === 'PUT') return updateCartItem(event);
    if (method === 'DELETE') return removeFromCart(event);
  }

  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error: 'Not found' }),
  };
};
