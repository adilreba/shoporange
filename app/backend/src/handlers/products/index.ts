import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || '';

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

// Ürünleri listele
export const getProducts = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const category = event.queryStringParameters?.category;
    const search = event.queryStringParameters?.search;
    const limit = parseInt(event.queryStringParameters?.limit || '20');

    let params: AWS.DynamoDB.DocumentClient.ScanInput = {
      TableName: PRODUCTS_TABLE,
      Limit: limit,
    };

    const result = await dynamodb.scan(params).promise();
    let products = result.Items || [];

    // Kategori filtresi
    if (category) {
      products = products.filter((p: any) => p.category === category);
    }

    // Arama filtresi
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter((p: any) =>
        p.name?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        p.brand?.toLowerCase().includes(searchLower)
      );
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        products,
        total: products.length,
      }),
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch products' }),
    };
  }
};

// Tek ürün getir
export const getProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id;

    if (!id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Product ID is required' }),
      };
    }

    const result = await dynamodb
      .get({
        TableName: PRODUCTS_TABLE,
        Key: { id },
      })
      .promise();

    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Product not found' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch product' }),
    };
  }
};

// Ürün ara
export const searchProducts = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const query = event.queryStringParameters?.q;

    if (!query) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Search query is required' }),
      };
    }

    const result = await dynamodb
      .scan({
        TableName: PRODUCTS_TABLE,
      })
      .promise();

    const products = (result.Items || []).filter((p: any) =>
      p.name?.toLowerCase().includes(query.toLowerCase()) ||
      p.description?.toLowerCase().includes(query.toLowerCase()) ||
      p.brand?.toLowerCase().includes(query.toLowerCase())
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        products,
        total: products.length,
        query,
      }),
    };
  } catch (error) {
    console.error('Error searching products:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to search products' }),
    };
  }
};
