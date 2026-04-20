import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { securityHeaders } from '../../utils/security';

// DynamoDB client - SDK v3 (daha hızlı, daha küçük)
const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || '';

// CORS headers - merkezi security.ts'den
const headers = securityHeaders;

// Hata yanıtı helper'ı
const createErrorResponse = (statusCode: number, message: string): APIGatewayProxyResult => ({
  statusCode,
  headers,
  body: JSON.stringify({ 
    error: message,
    timestamp: new Date().toISOString(),
  }),
});

// Başarı yanıtı helper'ı
const createSuccessResponse = (data: any, statusCode = 200): APIGatewayProxyResult => ({
  statusCode,
  headers,
  body: JSON.stringify(data),
});

// Ürünleri listele
export const getProducts = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const category = event.queryStringParameters?.category;
    const search = event.queryStringParameters?.search?.toLowerCase();
    const limit = parseInt(event.queryStringParameters?.limit || '20');
    const lastKey = event.queryStringParameters?.lastKey;

    // Pagination icin ExclusiveStartKey
    const exclusiveStartKey = lastKey ? { id: lastKey } : undefined;

    // Kategori ile query kullan (daha verimli)
    let products: any[] = [];
    let lastEvaluatedKey: any = null;
    
    if (category) {
      const result = await dynamodb.send(new QueryCommand({
        TableName: PRODUCTS_TABLE,
        IndexName: 'CategoryIndex',
        KeyConditionExpression: 'category = :category',
        ExpressionAttributeValues: {
          ':category': category,
        },
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKey,
      }));
      products = result.Items || [];
      lastEvaluatedKey = result.LastEvaluatedKey;
    } else {
      const result = await dynamodb.send(new ScanCommand({
        TableName: PRODUCTS_TABLE,
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKey,
      }));
      products = result.Items || [];
      lastEvaluatedKey = result.LastEvaluatedKey;
    }

    // Arama filtresi (memory'de filtrele)
    // NOT: Production'da Elasticsearch/OpenSearch kullanilmali
    if (search) {
      products = products.filter((p: any) =>
        p.name?.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search) ||
        p.brand?.toLowerCase().includes(search)
      );
    }

    return createSuccessResponse({
      products,
      total: products.length,
      hasMore: !!lastEvaluatedKey,
      nextKey: lastEvaluatedKey ? lastEvaluatedKey.id : null,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return createErrorResponse(500, 'Failed to fetch products');
  }
};

// Tek ürün getir
export const getProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id;

    if (!id) {
      return createErrorResponse(400, 'Product ID is required');
    }

    const result = await dynamodb.send(new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { id },
    }));

    if (!result.Item) {
      return createErrorResponse(404, 'Product not found');
    }

    return createSuccessResponse(result.Item);
  } catch (error) {
    console.error('Error fetching product:', error);
    return createErrorResponse(500, 'Failed to fetch product');
  }
};

// Ürün ara
export const searchProducts = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const query = event.queryStringParameters?.q;

    if (!query) {
      return createErrorResponse(400, 'Search query is required');
    }

    const searchLower = query.toLowerCase();
    
    // Not: Production'da Elasticsearch/OpenSearch kullanılmalı
    const result = await dynamodb.send(new ScanCommand({
      TableName: PRODUCTS_TABLE,
    }));

    const products = (result.Items || []).filter((p: any) =>
      p.name?.toLowerCase().includes(searchLower) ||
      p.description?.toLowerCase().includes(searchLower) ||
      p.brand?.toLowerCase().includes(searchLower)
    );

    return createSuccessResponse({
      products,
      total: products.length,
      query,
    });
  } catch (error) {
    console.error('Error searching products:', error);
    return createErrorResponse(500, 'Failed to search products');
  }
};

// Main handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path;
  const method = event.httpMethod;

  // Route handling
  if (path.includes('/products/') && path.split('/products/')[1]) {
    if (method === 'GET') return getProduct(event);
  }

  if (path === '/products' || path.endsWith('/products')) {
    if (method === 'GET') return getProducts(event);
  }

  return createErrorResponse(404, 'Not found');
};
