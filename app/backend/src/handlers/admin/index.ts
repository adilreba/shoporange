import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

// DynamoDB client - SDK v3
const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || '';
const ORDERS_TABLE = process.env.ORDERS_TABLE || '';
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

// ========== PRODUCT MANAGEMENT ==========

export const getAllProducts = async (): Promise<APIGatewayProxyResult> => {
  try {
    const result = await dynamodb.send(new ScanCommand({
      TableName: PRODUCTS_TABLE
    }));

    return createSuccessResponse(result.Items || []);
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Failed to fetch products');
  }
};

export const updateStock = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const productId = event.pathParameters?.id;
    if (!productId || !event.body) {
      return createErrorResponse(400, 'Product ID and body required');
    }

    const { quantity, operation = 'set', reason } = JSON.parse(event.body);

    if (typeof quantity !== 'number' || quantity < 0) {
      return createErrorResponse(400, 'Valid quantity required');
    }

    // Mevcut ürünü al
    const productResult = await dynamodb.send(new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { id: productId }
    }));

    if (!productResult.Item) {
      return createErrorResponse(404, 'Product not found');
    }

    let updateExpression = '';
    const expressionValues: any = { ':updatedAt': new Date().toISOString() };

    switch (operation) {
      case 'increment':
        updateExpression = 'SET stock = stock + :quantity, updatedAt = :updatedAt';
        expressionValues[':quantity'] = quantity;
        break;
      case 'decrement':
        updateExpression = 'SET stock = stock - :quantity, updatedAt = :updatedAt';
        expressionValues[':quantity'] = quantity;
        break;
      case 'set':
      default:
        updateExpression = 'SET stock = :quantity, updatedAt = :updatedAt';
        expressionValues[':quantity'] = quantity;
    }

    const result = await dynamodb.send(new UpdateCommand({
      TableName: PRODUCTS_TABLE,
      Key: { id: productId },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW'
    }));

    console.log(`Stock updated: ${productId}, Operation: ${operation}, Quantity: ${quantity}, Reason: ${reason || 'N/A'}`);

    return createSuccessResponse({
      message: 'Stock updated successfully',
      product: result.Attributes
    });
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Failed to update stock');
  }
};

export const getLowStockProducts = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const threshold = parseInt(event.queryStringParameters?.threshold || '10');

    const result = await dynamodb.send(new ScanCommand({
      TableName: PRODUCTS_TABLE,
      FilterExpression: 'stock <= :threshold',
      ExpressionAttributeValues: { ':threshold': threshold }
    }));

    return createSuccessResponse(result.Items || []);
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Failed to fetch low stock products');
  }
};

export const createProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createErrorResponse(400, 'Request body required');
    }

    const productData = JSON.parse(event.body);
    const productId = `PROD-${Date.now()}`;

    const product = {
      id: productId,
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dynamodb.send(new PutCommand({
      TableName: PRODUCTS_TABLE,
      Item: product
    }));

    return createSuccessResponse({ message: 'Product created', product }, 201);
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Failed to create product');
  }
};

export const updateProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const productId = event.pathParameters?.id;
    if (!productId || !event.body) {
      return createErrorResponse(400, 'Product ID and body required');
    }

    const updates = JSON.parse(event.body);

    // Dinamik update expression
    const updateExpressions: string[] = [];
    const expressionValues: Record<string, any> = { ':updatedAt': new Date().toISOString() };
    const expressionNames: Record<string, string> = {};

    const fields = ['name', 'description', 'price', 'category', 'stock', 'images', 'brand'];
    fields.forEach(field => {
      if (updates[field] !== undefined) {
        const placeholder = field === 'name' ? '#name' : field;
        updateExpressions.push(`${placeholder} = :${field}`);
        expressionValues[`:${field}`] = updates[field];
        if (field === 'name') expressionNames['#name'] = 'name';
      }
    });
    updateExpressions.push('updatedAt = :updatedAt');

    const result = await dynamodb.send(new UpdateCommand({
      TableName: PRODUCTS_TABLE,
      Key: { id: productId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expressionNames).length > 0 ? expressionNames : undefined,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW'
    }));

    return createSuccessResponse({ message: 'Product updated', product: result.Attributes });
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Failed to update product');
  }
};

export const deleteProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const productId = event.pathParameters?.id;
    if (!productId) {
      return createErrorResponse(400, 'Product ID required');
    }

    await dynamodb.send(new DeleteCommand({
      TableName: PRODUCTS_TABLE,
      Key: { id: productId }
    }));

    return createSuccessResponse({ message: 'Product deleted' });
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Failed to delete product');
  }
};

// ========== ORDER MANAGEMENT ==========

export const getAllOrders = async (): Promise<APIGatewayProxyResult> => {
  try {
    const result = await dynamodb.send(new ScanCommand({
      TableName: ORDERS_TABLE
    }));

    return createSuccessResponse(result.Items || []);
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Failed to fetch orders');
  }
};

export const updateOrderStatus = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const orderId = event.pathParameters?.id;
    if (!orderId || !event.body) {
      return createErrorResponse(400, 'Order ID and body required');
    }

    const { status } = JSON.parse(event.body);

    const result = await dynamodb.send(new UpdateCommand({
      TableName: ORDERS_TABLE,
      Key: { id: orderId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    }));

    return createSuccessResponse({ message: 'Order status updated', order: result.Attributes });
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Failed to update order');
  }
};

// ========== USER MANAGEMENT ==========

export const getAllUsers = async (): Promise<APIGatewayProxyResult> => {
  try {
    const result = await dynamodb.send(new ScanCommand({
      TableName: USERS_TABLE
    }));

    return createSuccessResponse(result.Items || []);
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Failed to fetch users');
  }
};

// ========== SEED DATA ==========

const sampleProducts = [
  {
    id: 'PROD-001',
    name: 'Modern Koltuk Takımı',
    description: 'Lüks ve konforlu modern koltuk takımı',
    price: 15000,
    category: 'ev-yasam',
    subcategory: 'Mobilya',
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'],
    stock: 10,
    rating: 4.5,
    reviewCount: 12
  },
  {
    id: 'PROD-002',
    name: 'Yemek Masası Seti',
    description: '6 kişilik ahşap yemek masası seti',
    price: 8500,
    category: 'ev-yasam',
    subcategory: 'Mobilya',
    images: ['https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800'],
    stock: 5,
    rating: 4.8,
    reviewCount: 8
  }
];

export const seedData = async (): Promise<APIGatewayProxyResult> => {
  try {
    for (const product of sampleProducts) {
      await dynamodb.send(new PutCommand({
        TableName: PRODUCTS_TABLE,
        Item: {
          ...product,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }));
    }

    return createSuccessResponse({ message: 'Sample data seeded', count: sampleProducts.length });
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Failed to seed data');
  }
};

// ========== MAIN HANDLER ==========

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path;
  const method = event.httpMethod;

  // Products
  if (path === '/admin/products' || path.endsWith('/admin/products')) {
    if (method === 'GET') return getAllProducts();
    if (method === 'POST') return createProduct(event);
  }

  if (path.includes('/admin/products/') && path.split('/admin/products/')[1]) {
    if (method === 'PUT') return updateProduct(event);
    if (method === 'DELETE') return deleteProduct(event);
  }

  // Stock Management
  if (path.includes('/admin/products/') && path.includes('/stock')) {
    if (method === 'PUT') return updateStock(event);
  }

  if (path === '/admin/products/low-stock' || path.endsWith('/admin/products/low-stock')) {
    if (method === 'GET') return getLowStockProducts(event);
  }

  // Orders
  if (path === '/admin/orders' || path.endsWith('/admin/orders')) {
    if (method === 'GET') return getAllOrders();
  }

  if (path.includes('/admin/orders/') && path.split('/admin/orders/')[1]) {
    if (method === 'PUT') return updateOrderStatus(event);
  }

  // Users
  if (path === '/admin/users' || path.endsWith('/admin/users')) {
    if (method === 'GET') return getAllUsers();
  }

  // Seed Data
  if (path === '/admin/seed' || path.endsWith('/admin/seed')) {
    if (method === 'POST') return seedData();
  }

  return createErrorResponse(404, 'Not found');
};
