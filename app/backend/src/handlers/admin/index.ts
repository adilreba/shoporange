import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || '';
const ORDERS_TABLE = process.env.ORDERS_TABLE || '';
const USERS_TABLE = process.env.USERS_TABLE || '';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

// ========== PRODUCT MANAGEMENT ==========

// Tüm ürünleri listele
export const getAllProducts = async (): Promise<APIGatewayProxyResult> => {
  try {
    const result = await dynamodb.scan({
      TableName: PRODUCTS_TABLE
    }).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.Items || [])
    };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch products' }) };
  }
};

// Ürün ekle
export const createProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Request body required' }) };
    }

    const productData = JSON.parse(event.body);
    const productId = `PROD-${Date.now()}`;

    const product = {
      id: productId,
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dynamodb.put({
      TableName: PRODUCTS_TABLE,
      Item: product
    }).promise();

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ message: 'Product created', product })
    };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to create product' }) };
  }
};

// Ürün güncelle
export const updateProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const productId = event.pathParameters?.id;
    if (!productId || !event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Product ID and body required' }) };
    }

    const updates = JSON.parse(event.body);

    const result = await dynamodb.update({
      TableName: PRODUCTS_TABLE,
      Key: { id: productId },
      UpdateExpression: 'set #name = :name, description = :description, price = :price, category = :category, stock = :stock, images = :images, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#name': 'name' },
      ExpressionAttributeValues: {
        ':name': updates.name,
        ':description': updates.description,
        ':price': updates.price,
        ':category': updates.category,
        ':stock': updates.stock,
        ':images': updates.images,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    }).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Product updated', product: result.Attributes })
    };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to update product' }) };
  }
};

// Ürün sil
export const deleteProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const productId = event.pathParameters?.id;
    if (!productId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Product ID required' }) };
    }

    await dynamodb.delete({
      TableName: PRODUCTS_TABLE,
      Key: { id: productId }
    }).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Product deleted' })
    };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to delete product' }) };
  }
};

// ========== ORDER MANAGEMENT ==========

// Tüm siparişleri listele
export const getAllOrders = async (): Promise<APIGatewayProxyResult> => {
  try {
    const result = await dynamodb.scan({
      TableName: ORDERS_TABLE
    }).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.Items || [])
    };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch orders' }) };
  }
};

// Sipariş durumu güncelle
export const updateOrderStatus = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const orderId = event.pathParameters?.id;
    if (!orderId || !event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Order ID and body required' }) };
    }

    const { status } = JSON.parse(event.body);

    const result = await dynamodb.update({
      TableName: ORDERS_TABLE,
      Key: { id: orderId },
      UpdateExpression: 'set #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    }).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Order status updated', order: result.Attributes })
    };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to update order' }) };
  }
};

// ========== USER MANAGEMENT ==========

// Tüm kullanıcıları listele
export const getAllUsers = async (): Promise<APIGatewayProxyResult> => {
  try {
    const result = await dynamodb.scan({
      TableName: USERS_TABLE
    }).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.Items || [])
    };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch users' }) };
  }
};

// ========== SEED DATA ==========

const sampleProducts = [
  {
    id: 'PROD-001',
    name: 'Modern Koltuk Takımı',
    description: 'Lüks ve konforlu modern koltuk takımı',
    price: 15000,
    category: 'living-room',
    images: ['https://example.com/sofa1.jpg'],
    stock: 10,
    rating: 4.5,
    reviews: 12
  },
  {
    id: 'PROD-002',
    name: 'Yemek Masası Seti',
    description: '6 kişilik ahşap yemek masası seti',
    price: 8500,
    category: 'dining-room',
    images: ['https://example.com/table1.jpg'],
    stock: 5,
    rating: 4.8,
    reviews: 8
  }
];

export const seedData = async (): Promise<APIGatewayProxyResult> => {
  try {
    for (const product of sampleProducts) {
      await dynamodb.put({
        TableName: PRODUCTS_TABLE,
        Item: {
          ...product,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }).promise();
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Sample data seeded', count: sampleProducts.length })
    };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to seed data' }) };
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

  return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
};
