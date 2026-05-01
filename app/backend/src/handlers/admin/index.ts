import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand, PutSecretValueCommand, CreateSecretCommand } from '@aws-sdk/client-secrets-manager';
import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand, AdminRemoveUserFromGroupCommand, AdminUpdateUserAttributesCommand, AdminListGroupsForUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import * as parasut from '../../services/parasut';
import { checkAdminAccess, isSuperAdmin } from '../../utils/authorization';
import { createErrorResponse, createSuccessResponse } from '../../utils/response';
import { indexProduct, deleteProductIndex, bulkIndexProducts } from '../../utils/search';
import { cacheDelPattern } from '../../utils/redis';

// DynamoDB client - SDK v3
const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const secretsManager = new SecretsManagerClient({});
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || '';
const ORDERS_TABLE = process.env.ORDERS_TABLE || '';
const USERS_TABLE = process.env.USERS_TABLE || '';
const PARASUT_SECRET_NAME = process.env.PARASUT_SECRET_NAME || 'atushome/parasut';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

// Helper functions
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

    // OpenSearch index sync (async, non-blocking)
    indexProduct(product).catch(err => console.error('[Admin] OpenSearch index error:', err));

    // Cache invalidation (async, non-blocking)
    cacheDelPattern('products:*').catch(err => console.error('[Admin] Cache clear error:', err));

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

    // OpenSearch index sync (async, non-blocking)
    if (result.Attributes) {
      indexProduct(result.Attributes).catch(err => console.error('[Admin] OpenSearch index error:', err));
    }

    // Cache invalidation (async, non-blocking)
    cacheDelPattern('products:*').catch(err => console.error('[Admin] Cache clear error:', err));

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

    // OpenSearch index delete (async, non-blocking)
    deleteProductIndex(productId).catch(err => console.error('[Admin] OpenSearch delete error:', err));

    // Cache invalidation (async, non-blocking)
    cacheDelPattern('products:*').catch(err => console.error('[Admin] Cache clear error:', err));

    return createSuccessResponse({ message: 'Product deleted' });
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Failed to delete product');
  }
};

export const reindexProducts = async (): Promise<APIGatewayProxyResult> => {
  try {
    // Tüm ürünleri DynamoDB'den çek
    const result = await dynamodb.send(new ScanCommand({
      TableName: PRODUCTS_TABLE,
    }));

    const products = result.Items || [];
    if (products.length === 0) {
      return createSuccessResponse({ message: 'No products to index', count: 0 });
    }

    // OpenSearch'e bulk indexle
    await bulkIndexProducts(products);

    return createSuccessResponse({
      message: 'Products reindexed successfully',
      count: products.length,
    });
  } catch (error) {
    console.error('Reindex error:', error);
    return createErrorResponse(500, 'Failed to reindex products');
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

export const getDeletedUsers = async (): Promise<APIGatewayProxyResult> => {
  try {
    // Şimdilik pasif kullanıcıları isActive flag'i ile filtreliyoruz
    // Gelecekte ayrı bir tablo veya soft-delete mekanizması eklenebilir
    const result = await dynamodb.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'isActive = :isActive',
      ExpressionAttributeValues: {
        ':isActive': false
      }
    }));

    return createSuccessResponse(result.Items || []);
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Failed to fetch deleted users');
  }
};

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'eu-west-1' });
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';

export const updateUserRole = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.id;
    if (!userId || !event.body) {
      return createErrorResponse(400, 'User ID and body required');
    }

    const { role } = JSON.parse(event.body);
    if (!role) {
      return createErrorResponse(400, 'Role is required');
    }

    // Valid roles
    const validRoles = ['super_admin', 'admin', 'editor', 'support', 'user'];
    if (!validRoles.includes(role)) {
      return createErrorResponse(400, 'Invalid role');
    }

    // Only super_admin can assign super_admin role
    if (role === 'super_admin' && !isSuperAdmin(event)) {
      return createErrorResponse(403, 'Only super_admin can assign super_admin role');
    }

    // Get user from DynamoDB to find email
    const userResult = await dynamodb.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { id: userId }
    }));

    if (!userResult.Item) {
      return createErrorResponse(404, 'User not found');
    }

    const userEmail = userResult.Item.email;
    if (!userEmail) {
      return createErrorResponse(400, 'User email not found');
    }

    // 1. Remove user from all existing Cognito groups
    const groupsResponse = await cognitoClient.send(new AdminListGroupsForUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: userEmail,
    }));

    for (const group of groupsResponse.Groups || []) {
      if (group.GroupName) {
        await cognitoClient.send(new AdminRemoveUserFromGroupCommand({
          UserPoolId: USER_POOL_ID,
          Username: userEmail,
          GroupName: group.GroupName,
        }));
      }
    }

    // 2. Add user to new Cognito group
    await cognitoClient.send(new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: userEmail,
      GroupName: role,
    }));

    // 3. Update custom:role attribute for backward compatibility
    await cognitoClient.send(new AdminUpdateUserAttributesCommand({
      UserPoolId: USER_POOL_ID,
      Username: userEmail,
      UserAttributes: [
        { Name: 'custom:role', Value: role },
      ],
    }));

    // 4. Update role in DynamoDB
    await dynamodb.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { id: userId },
      UpdateExpression: 'SET #role = :role, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#role': 'role' },
      ExpressionAttributeValues: {
        ':role': role,
        ':updatedAt': new Date().toISOString()
      }
    }));

    // Log the action
    console.log(`User role updated: ${userId} (${userEmail}) -> ${role}`);

    return createSuccessResponse({ 
      message: 'User role updated successfully',
      userId,
      role 
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return createErrorResponse(500, 'Failed to update user role');
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

// ========== DASHBOARD STATS ==========

export const getDashboardStats = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const days = parseInt(event.queryStringParameters?.days || '30');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffISO = cutoffDate.toISOString();

    // Siparişleri çek
    const ordersResult = await dynamodb.send(new ScanCommand({
      TableName: ORDERS_TABLE,
    }));
    const orders = ordersResult.Items || [];
    const recentOrders = orders.filter((o: any) => o.createdAt >= cutoffISO);

    const totalOrders = recentOrders.length;
    const totalRevenue = recentOrders
      .filter((o: any) => o.status === 'completed')
      .reduce((sum: number, o: any) => sum + (o.total || 0), 0);

    const statusCounts: Record<string, number> = {};
    recentOrders.forEach((o: any) => {
      const status = o.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Kullanıcıları çek
    const usersResult = await dynamodb.send(new ScanCommand({
      TableName: USERS_TABLE,
    }));
    const users = usersResult.Items || [];
    const totalUsers = users.length;
    const newUsers = users.filter((u: any) => u.createdAt >= cutoffISO).length;

    // Ürünleri çek
    const productsResult = await dynamodb.send(new ScanCommand({
      TableName: PRODUCTS_TABLE,
    }));
    const products = productsResult.Items || [];
    const totalProducts = products.length;
    const lowStockProducts = products
      .filter((p: any) => (p.stock || 0) < 10)
      .map((p: any) => ({ id: p.id, name: p.name, stock: p.stock }));

    // Son 7 gün günlük satış (grafik için)
    const dailySales: Record<string, { revenue: number; orders: number }> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailySales[key] = { revenue: 0, orders: 0 };
    }

    recentOrders.forEach((o: any) => {
      const dateKey = (o.createdAt || '').split('T')[0];
      if (dailySales[dateKey]) {
        dailySales[dateKey].orders += 1;
        if (o.status === 'completed') {
          dailySales[dateKey].revenue += o.total || 0;
        }
      }
    });

    return createSuccessResponse({
      period: { days, from: cutoffISO },
      orders: {
        total: totalOrders,
        revenue: totalRevenue,
        byStatus: statusCounts,
      },
      users: {
        total: totalUsers,
        new: newUsers,
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts,
        lowStockCount: lowStockProducts.length,
      },
      dailySales: Object.entries(dailySales)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({ date, ...data })),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return createErrorResponse(500, 'Failed to get dashboard stats');
  }
};

// ========== MAIN HANDLER ==========

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Authorization check for all admin routes
  const authCheck = checkAdminAccess(event);
  if (!authCheck.allowed) {
    return createErrorResponse(403, authCheck.reason || 'Forbidden');
  }

  const path = event.path;
  const method = event.httpMethod;

  // Dashboard
  if (path === '/admin/dashboard/stats' || path.endsWith('/admin/dashboard/stats')) {
    if (method === 'GET') return getDashboardStats(event);
  }

  // Products
  if (path === '/admin/products' || path.endsWith('/admin/products')) {
    if (method === 'GET') return getAllProducts();
    if (method === 'POST') return createProduct(event);
  }

  if (path === '/admin/products/reindex' || path.endsWith('/admin/products/reindex')) {
    if (method === 'POST') return reindexProducts();
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

  if (path === '/admin/users/deleted' || path.endsWith('/admin/users/deleted')) {
    if (method === 'GET') return getDeletedUsers();
  }

  // Update User Role
  if (path.includes('/admin/users/') && path.includes('/role')) {
    if (method === 'PUT') return updateUserRole(event);
  }

  // Seed Data
  if (path === '/admin/seed' || path.endsWith('/admin/seed')) {
    if (method === 'POST') return seedData();
  }

  // Paraşüt Routes
  if (path === '/admin/parasut/config' || path.endsWith('/admin/parasut/config')) {
    if (method === 'GET') return parasutConfigGet();
    if (method === 'PUT') return parasutConfigUpdate(event);
  }

  if (path === '/admin/parasut/test' || path.endsWith('/admin/parasut/test')) {
    if (method === 'POST') return parasutTest();
  }

  if (path === '/admin/parasut/status' || path.endsWith('/admin/parasut/status')) {
    if (method === 'GET') return parasutStatus();
  }

  if (path.includes('/admin/parasut/invoices/') && path.includes('/sync')) {
    if (method === 'POST') return parasutInvoiceSync(event);
  }

  return createErrorResponse(404, 'Not found');
};

// ========== PARASUT INTEGRATION ==========

async function getParasutSecret(): Promise<any> {
  try {
    const secret = await secretsManager.send(new GetSecretValueCommand({
      SecretId: PARASUT_SECRET_NAME,
    }));
    return secret.SecretString ? JSON.parse(secret.SecretString) : null;
  } catch (error) {
    console.log('Paraşüt secret bulunamadı, mock mode kullanılacak');
    return {
      clientId: 'mock',
      clientSecret: 'mock',
      username: 'mock',
      password: 'mock',
      companyId: 'mock',
      isTestMode: true,
    };
  }
}

// Paraşüt yapılandırmasını getir
export const parasutConfigGet = async (): Promise<APIGatewayProxyResult> => {
  try {
    const config = await getParasutSecret();
    
    // Hassas bilgileri maskele
    return createSuccessResponse({
      clientId: config.clientId,
      clientSecret: config.clientSecret === 'mock' ? '' : '********',
      username: config.username,
      password: config.password === 'mock' ? '' : '********',
      companyId: config.companyId,
      isTestMode: config.isTestMode ?? true,
    });
  } catch (error) {
    console.error('Paraşüt config hatası:', error);
    return createErrorResponse(500, 'Yapılandırma alınamadı');
  }
};

// Paraşüt yapılandırmasını güncelle
export const parasutConfigUpdate = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createErrorResponse(400, 'Request body required');
    }

    const config = JSON.parse(event.body);
    
    // Mevcut config'i al (maskeleme kontrolü için)
    const currentConfig = await getParasutSecret();
    
    // Yeni config oluştur
    const newConfig = {
      clientId: config.clientId || currentConfig.clientId,
      clientSecret: config.clientSecret === '********' ? currentConfig.clientSecret : config.clientSecret,
      username: config.username || currentConfig.username,
      password: config.password === '********' ? currentConfig.password : config.password,
      companyId: config.companyId || currentConfig.companyId,
      isTestMode: config.isTestMode ?? currentConfig.isTestMode ?? true,
    };

    // Secrets Manager'da güncelle veya oluştur
    try {
      await secretsManager.send(new PutSecretValueCommand({
        SecretId: PARASUT_SECRET_NAME,
        SecretString: JSON.stringify(newConfig),
      }));
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        // Secret yoksa oluştur
        await secretsManager.send(new CreateSecretCommand({
          Name: PARASUT_SECRET_NAME,
          SecretString: JSON.stringify(newConfig),
        }));
      } else {
        throw error;
      }
    }

    return createSuccessResponse({
      success: true,
      message: 'Yapılandırma kaydedildi',
    });
  } catch (error) {
    console.error('Paraşüt config update hatası:', error);
    return createErrorResponse(500, 'Yapılandırma kaydedilemedi');
  }
};

// Paraşüt bağlantı testi
export const parasutTest = async (): Promise<APIGatewayProxyResult> => {
  try {
    const result = await parasut.testConnection();
    return createSuccessResponse(result);
  } catch (error: any) {
    console.error('Paraşüt test hatası:', error);
    return createErrorResponse(500, error.message || 'Bağlantı testi başarısız');
  }
};

// Paraşüt durum bilgisi
export const parasutStatus = async (): Promise<APIGatewayProxyResult> => {
  try {
    const config = await getParasutSecret();
    
    if (config.clientId === 'mock') {
      return createSuccessResponse({
        connected: true,
        companyName: 'Mock Mode',
        lastSync: new Date().toISOString(),
      });
    }

    // Gerçek bağlantı testi
    const testResult = await parasut.testConnection();
    
    return createSuccessResponse({
      connected: testResult.success,
      companyName: testResult.companyName,
      lastSync: new Date().toISOString(),
      error: testResult.success ? undefined : testResult.message,
    });
  } catch (error: any) {
    return createSuccessResponse({
      connected: false,
      error: error.message,
    });
  }
};

// Paraşüt fatura senkronizasyonu
export const parasutInvoiceSync = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const invoiceId = event.pathParameters?.id;
    if (!invoiceId) {
      return createErrorResponse(400, 'Invoice ID required');
    }

    // Faturayı getir
    const invoiceResult = await dynamodb.send(new GetCommand({
      TableName: process.env.INVOICES_TABLE || '',
      Key: { invoiceId },
    }));

    if (!invoiceResult.Item) {
      return createErrorResponse(404, 'Invoice not found');
    }

    const invoice = invoiceResult.Item;
    
    if (!invoice.parasutInvoiceId) {
      return createErrorResponse(400, 'Fatura henüz Paraşüt\'e gönderilmemiş');
    }

    // Paraşüt'ten durum al
    const status = await parasut.getInvoiceStatus(invoice.parasutInvoiceId);

    // Durumu güncelle
    await dynamodb.send(new UpdateCommand({
      TableName: process.env.INVOICES_TABLE || '',
      Key: { invoiceId },
      UpdateExpression: 'set gibStatus = :gibStatus, status = :status, pdfUrl = :pdfUrl, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':gibStatus': status.gibStatus,
        ':status': status.status,
        ':pdfUrl': status.pdfUrl,
        ':updatedAt': new Date().toISOString(),
      },
    }));

    return createSuccessResponse({
      success: true,
      status: status.status,
      gibStatus: status.gibStatus,
      pdfUrl: status.pdfUrl,
    });
  } catch (error: any) {
    console.error('Paraşüt sync hatası:', error);
    return createErrorResponse(500, error.message || 'Senkronizasyon başarısız');
  }
};
