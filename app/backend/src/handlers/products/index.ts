import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { createErrorResponse, createSuccessResponse } from '../../utils/response';
import { searchProducts as searchOpenSearch } from '../../utils/search';
import { cacheGet, cacheSet, cacheDelPattern } from '../../utils/redis';

// DynamoDB client - SDK v3 (daha hızlı, daha küçük)
const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || '';



// Ürünleri listele
export const getProducts = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const category = event.queryStringParameters?.category;
    const search = event.queryStringParameters?.search?.toLowerCase();
    const limit = parseInt(event.queryStringParameters?.limit || '20');
    const lastKey = event.queryStringParameters?.lastKey;
    const cacheKey = `products:list:${category || 'all'}:${search || 'none'}:${limit}:${lastKey || 'first'}`;

    // Cache'den dene
    const cached = await cacheGet<APIGatewayProxyResult>(cacheKey);
    if (cached) {
      return cached;
    }

    // Arama varsa OpenSearch kullan (daha performansli)
    if (search) {
      const from = lastKey ? parseInt(lastKey) : 0;
      const osResult = await searchOpenSearch({
        query: search,
        category,
        size: limit,
        from,
      });

      // OpenSearch sonuc varsa veya calisiyorsa kullan
      if (osResult.products.length > 0 || osResult.took > 0) {
        const response = createSuccessResponse({
          products: osResult.products,
          total: osResult.total,
          hasMore: osResult.total > from + limit,
          nextKey: osResult.total > from + limit ? String(from + limit) : null,
          source: 'opensearch',
        });
        await cacheSet(cacheKey, response, 120); // Arama cache'i 2 dakika
        return response;
      }

      // OpenSearch fallback: DynamoDB + memory filtreleme
      console.log('[Products] OpenSearch fallback to DynamoDB for search:', search);
    }

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
      const result = await dynamodb.send(new QueryCommand({
        TableName: PRODUCTS_TABLE,
        IndexName: 'StatusIndex',
        KeyConditionExpression: 'status = :status',
        ExpressionAttributeValues: {
          ':status': 'active',
        },
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKey,
      }));
      products = result.Items || [];
      lastEvaluatedKey = result.LastEvaluatedKey;
    }

    // Arama filtresi (memory'de filtrele) — OpenSearch fallback
    if (search) {
      products = products.filter((p: any) =>
        p.name?.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search) ||
        p.brand?.toLowerCase().includes(search)
      );
    }

    const response = createSuccessResponse({
      products,
      total: products.length,
      hasMore: !!lastEvaluatedKey,
      nextKey: lastEvaluatedKey ? lastEvaluatedKey.id : null,
      source: search ? 'dynamodb-fallback' : 'dynamodb',
    });
    await cacheSet(cacheKey, response, search ? 120 : 300); // Arama 2dk, listeleme 5dk
    return response;
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

    const cacheKey = `products:detail:${id}`;
    const cached = await cacheGet<APIGatewayProxyResult>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await dynamodb.send(new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { id },
    }));

    if (!result.Item) {
      return createErrorResponse(404, 'Product not found');
    }

    const response = createSuccessResponse(result.Item);
    await cacheSet(cacheKey, response, 600); // Detay cache'i 10 dakika
    return response;
  } catch (error) {
    console.error('Error fetching product:', error);
    return createErrorResponse(500, 'Failed to fetch product');
  }
};

// Ürün ara
export const searchProducts = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const query = event.queryStringParameters?.q;
    const category = event.queryStringParameters?.category;
    const limit = parseInt(event.queryStringParameters?.limit || '20');
    const from = parseInt(event.queryStringParameters?.from || '0');

    if (!query) {
      return createErrorResponse(400, 'Search query is required');
    }

    const cacheKey = `products:search:${query.toLowerCase()}:${category || 'all'}:${limit}:${from}`;
    const cached = await cacheGet<APIGatewayProxyResult>(cacheKey);
    if (cached) {
      return cached;
    }

    // 1. OpenSearch dene
    const osResult = await searchOpenSearch({
      query,
      category,
      size: limit,
      from,
    });

    if (osResult.products.length > 0 || osResult.took > 0) {
      const response = createSuccessResponse({
        products: osResult.products,
        total: osResult.total,
        query,
        source: 'opensearch',
      });
      await cacheSet(cacheKey, response, 120); // Arama cache'i 2 dakika
      return response;
    }

    // 2. Fallback: DynamoDB + memory filtreleme
    console.log('[Products] OpenSearch unavailable, using DynamoDB fallback for search:', query);
    const searchLower = query.toLowerCase();
    
    const result = await dynamodb.send(new QueryCommand({
      TableName: PRODUCTS_TABLE,
      IndexName: 'StatusIndex',
      KeyConditionExpression: 'status = :status',
      ExpressionAttributeValues: {
        ':status': 'active',
      },
    }));

    const products = (result.Items || []).filter((p: any) =>
      p.name?.toLowerCase().includes(searchLower) ||
      p.description?.toLowerCase().includes(searchLower) ||
      p.brand?.toLowerCase().includes(searchLower)
    );

    const response = createSuccessResponse({
      products: products.slice(from, from + limit),
      total: products.length,
      query,
      source: 'dynamodb-fallback',
    });
    await cacheSet(cacheKey, response, 120); // Arama cache'i 2 dakika
    return response;
  } catch (error) {
    console.error('Error searching products:', error);
    return createErrorResponse(500, 'Failed to search products');
  }
};

// Main handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return createSuccessResponse({}, 200);
  }

  const path = event.path;
  const method = event.httpMethod;

  // Route handling
  if (path.includes('/products/') && path.split('/products/')[1]) {
    if (method === 'GET') return getProduct(event);
  }

  if (path === '/products/search' || path.endsWith('/products/search')) {
    if (method === 'GET') return searchProducts(event);
  }

  if (path === '/products' || path.endsWith('/products')) {
    if (method === 'GET') return getProducts(event);
  }

  return createErrorResponse(404, 'Not found');
};
