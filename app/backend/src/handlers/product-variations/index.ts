/**
 * Product Variations Handler - Amazon-style SKU level variations
 * Her varyasyonun kendi stok, fiyat ve SKU'su var
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-west-1' });
const docClient = DynamoDBDocumentClient.from(dynamodb);

const PRODUCT_VARIATIONS_TABLE = process.env.PRODUCT_VARIATIONS_TABLE || 'AtusHome-ProductVariations';
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || 'AtusHome-Products';

// CORS headers
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
};

function createResponse(statusCode: number, body: any): APIGatewayProxyResult {
  return { statusCode, headers, body: JSON.stringify(body) };
}

// Types
export interface ProductVariation {
  variationId: string;
  productId: string;
  sku: string;
  attributes: Record<string, string>; // { beden: 'M', renk: 'Kırmızı' }
  price: number;
  compareAtPrice?: number;
  stock: number;
  images?: string[];
  barcode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Generate SKU from attributes
function generateSKU(productId: string, attributes: Record<string, string>): string {
  const attrString = Object.entries(attributes)
    .map(([key, value]) => `${key.substring(0, 3).toUpperCase()}-${value.substring(0, 3).toUpperCase()}`)
    .join('-');
  return `${productId.substring(0, 8)}-${attrString}`;
}

// Get all variations for a product
async function getProductVariations(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const productId = event.pathParameters?.productId;

  if (!productId) {
    return createResponse(400, { success: false, message: 'productId is required' });
  }

  try {
    const result = await docClient.send(new QueryCommand({
      TableName: PRODUCT_VARIATIONS_TABLE,
      KeyConditionExpression: 'productId = :productId',
      ExpressionAttributeValues: {
        ':productId': productId,
      },
    }));

    const variations = result.Items || [];

    // Calculate total stock
    const totalStock = variations.reduce((sum, v) => sum + (v.stock || 0), 0);
    const activeVariations = variations.filter(v => v.isActive);

    return createResponse(200, {
      success: true,
      data: {
        productId,
        variations,
        totalStock,
        totalVariations: variations.length,
        activeVariations: activeVariations.length,
      },
    });
  } catch (error) {
    console.error('Get product variations error:', error);
    return createResponse(500, { success: false, message: 'Failed to get product variations' });
  }
}

// Get single variation
async function getVariation(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const productId = event.pathParameters?.productId;
  const variationId = event.pathParameters?.variationId;

  if (!productId || !variationId) {
    return createResponse(400, { success: false, message: 'productId and variationId are required' });
  }

  try {
    const result = await docClient.send(new GetCommand({
      TableName: PRODUCT_VARIATIONS_TABLE,
      Key: { productId, variationId },
    }));

    if (!result.Item) {
      return createResponse(404, { success: false, message: 'Variation not found' });
    }

    return createResponse(200, {
      success: true,
      data: result.Item,
    });
  } catch (error) {
    console.error('Get variation error:', error);
    return createResponse(500, { success: false, message: 'Failed to get variation' });
  }
}

// Create new variation
async function createVariation(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return createResponse(400, { success: false, message: 'Request body is required' });
  }

  const productId = event.pathParameters?.productId;
  if (!productId) {
    return createResponse(400, { success: false, message: 'productId is required' });
  }

  try {
    const body = JSON.parse(event.body);
    const { attributes, price, compareAtPrice, stock = 0, images = [], barcode, isActive = true } = body;

    if (!attributes || !price) {
      return createResponse(400, { success: false, message: 'attributes and price are required' });
    }

    const variationId = `var_${Date.now()}`;
    const sku = body.sku || generateSKU(productId, attributes);

    // Check if SKU already exists
    const existingResult = await docClient.send(new QueryCommand({
      TableName: PRODUCT_VARIATIONS_TABLE,
      IndexName: 'SkuIndex',
      KeyConditionExpression: 'sku = :sku',
      ExpressionAttributeValues: {
        ':sku': sku,
      },
    }));

    if (existingResult.Items && existingResult.Items.length > 0) {
      return createResponse(409, { success: false, message: 'SKU already exists' });
    }

    const variation: ProductVariation = {
      variationId,
      productId,
      sku,
      attributes,
      price,
      compareAtPrice,
      stock,
      images,
      barcode,
      isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await docClient.send(new PutCommand({
      TableName: PRODUCT_VARIATIONS_TABLE,
      Item: variation,
    }));

    return createResponse(201, {
      success: true,
      message: 'Variation created successfully',
      data: variation,
    });
  } catch (error) {
    console.error('Create variation error:', error);
    return createResponse(500, { success: false, message: 'Failed to create variation' });
  }
}

// Update variation
async function updateVariation(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return createResponse(400, { success: false, message: 'Request body is required' });
  }

  const productId = event.pathParameters?.productId;
  const variationId = event.pathParameters?.variationId;

  if (!productId || !variationId) {
    return createResponse(400, { success: false, message: 'productId and variationId are required' });
  }

  try {
    const body = JSON.parse(event.body);
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // Build update expression dynamically
    const allowedFields = ['price', 'compareAtPrice', 'stock', 'images', 'barcode', 'isActive', 'attributes'];
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = body[field];
      }
    }

    if (updateExpressions.length === 0) {
      return createResponse(400, { success: false, message: 'No fields to update' });
    }

    // Always update updatedAt
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    await docClient.send(new UpdateCommand({
      TableName: PRODUCT_VARIATIONS_TABLE,
      Key: { productId, variationId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    }));

    return createResponse(200, {
      success: true,
      message: 'Variation updated successfully',
    });
  } catch (error) {
    console.error('Update variation error:', error);
    return createResponse(500, { success: false, message: 'Failed to update variation' });
  }
}

// Delete variation
async function deleteVariation(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const productId = event.pathParameters?.productId;
  const variationId = event.pathParameters?.variationId;

  if (!productId || !variationId) {
    return createResponse(400, { success: false, message: 'productId and variationId are required' });
  }

  try {
    await docClient.send(new DeleteCommand({
      TableName: PRODUCT_VARIATIONS_TABLE,
      Key: { productId, variationId },
    }));

    return createResponse(200, {
      success: true,
      message: 'Variation deleted successfully',
    });
  } catch (error) {
    console.error('Delete variation error:', error);
    return createResponse(500, { success: false, message: 'Failed to delete variation' });
  }
}

// Bulk create variations (for generating all combinations)
async function bulkCreateVariations(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return createResponse(400, { success: false, message: 'Request body is required' });
  }

  const productId = event.pathParameters?.productId;
  if (!productId) {
    return createResponse(400, { success: false, message: 'productId is required' });
  }

  try {
    const body = JSON.parse(event.body);
    const { attributes, basePrice, stock = 0 } = body;

    if (!attributes || !basePrice) {
      return createResponse(400, { success: false, message: 'attributes and basePrice are required' });
    }

    // Generate all combinations
    const combinations = generateCombinations(attributes);
    const createdVariations = [];
    const errors = [];

    for (const combo of combinations) {
      try {
        const variationId = `var_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const sku = generateSKU(productId, combo);

        const variation: ProductVariation = {
          variationId,
          productId,
          sku,
          attributes: combo,
          price: basePrice,
          stock,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await docClient.send(new PutCommand({
          TableName: PRODUCT_VARIATIONS_TABLE,
          Item: variation,
        }));

        createdVariations.push(variation);
      } catch (err) {
        errors.push({ combo, error: (err as Error).message });
      }
    }

    return createResponse(201, {
      success: true,
      message: `${createdVariations.length} variations created`,
      data: {
        created: createdVariations.length,
        errors: errors.length,
        variations: createdVariations,
        errorDetails: errors,
      },
    });
  } catch (error) {
    console.error('Bulk create variations error:', error);
    return createResponse(500, { success: false, message: 'Failed to create variations' });
  }
}

// Generate all combinations from attributes
function generateCombinations(attributes: Record<string, string[]>): Record<string, string>[] {
  const keys = Object.keys(attributes);
  const values = keys.map(key => attributes[key]);
  
  const combinations: Record<string, string>[] = [];
  
  function recurse(current: Record<string, string>, index: number) {
    if (index === keys.length) {
      combinations.push({ ...current });
      return;
    }
    
    const key = keys[index];
    for (const value of values[index]) {
      current[key] = value;
      recurse(current, index + 1);
    }
  }
  
  recurse({}, 0);
  return combinations;
}

// Get available attribute options for a product (for customer view)
async function getProductAttributeOptions(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const productId = event.pathParameters?.productId;

  if (!productId) {
    return createResponse(400, { success: false, message: 'productId is required' });
  }

  try {
    const result = await docClient.send(new QueryCommand({
      TableName: PRODUCT_VARIATIONS_TABLE,
      KeyConditionExpression: 'productId = :productId',
      FilterExpression: 'isActive = :isActive',
      ExpressionAttributeValues: {
        ':productId': productId,
        ':isActive': true,
      },
    }));

    const variations = result.Items || [];

    // Extract unique attribute options
    const attributeOptions: Record<string, Set<string>> = {};
    
    for (const variation of variations) {
      for (const [key, value] of Object.entries(variation.attributes || {})) {
        if (!attributeOptions[key]) {
          attributeOptions[key] = new Set();
        }
        if (typeof value === 'string') {
          attributeOptions[key].add(value);
        }
      }
    }

    // Convert Sets to Arrays
    const options: Record<string, string[]> = {};
    for (const [key, valueSet] of Object.entries(attributeOptions)) {
      options[key] = Array.from(valueSet);
    }

    return createResponse(200, {
      success: true,
      data: {
        productId,
        attributeOptions: options,
        totalVariations: variations.length,
      },
    });
  } catch (error) {
    console.error('Get product attribute options error:', error);
    return createResponse(500, { success: false, message: 'Failed to get attribute options' });
  }
}

// Find variation by attributes (for customer selection)
async function findVariationByAttributes(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const productId = event.pathParameters?.productId;

  if (!productId) {
    return createResponse(400, { success: false, message: 'productId is required' });
  }

  try {
    // Get attributes from query string
    const selectedAttributes: Record<string, string> = {};
    if (event.queryStringParameters) {
      for (const [key, value] of Object.entries(event.queryStringParameters)) {
        if (key !== 'productId') {
          selectedAttributes[key] = value || '';
        }
      }
    }

    if (Object.keys(selectedAttributes).length === 0) {
      return createResponse(400, { success: false, message: 'No attributes provided' });
    }

    // Get all variations for product
    const result = await docClient.send(new QueryCommand({
      TableName: PRODUCT_VARIATIONS_TABLE,
      KeyConditionExpression: 'productId = :productId',
      ExpressionAttributeValues: {
        ':productId': productId,
      },
    }));

    const variations = result.Items || [];

    // Find matching variation
    const matchingVariation = variations.find(v => {
      if (!v.isActive) return false;
      const attrs = v.attributes || {};
      return Object.entries(selectedAttributes).every(
        ([key, value]) => attrs[key] === value
      );
    });

    if (!matchingVariation) {
      return createResponse(404, {
        success: false,
        message: 'No variation found with selected attributes',
        data: {
          selectedAttributes,
          availableVariations: variations.filter(v => v.isActive).map(v => v.attributes),
        },
      });
    }

    return createResponse(200, {
      success: true,
      data: matchingVariation,
    });
  } catch (error) {
    console.error('Find variation error:', error);
    return createResponse(500, { success: false, message: 'Failed to find variation' });
  }
}

// Main handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event));

  const path = event.path;
  const method = event.httpMethod;

  // CORS preflight
  if (method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Routes
  // GET /products/:productId/variations
  if (path?.match(/\/products\/[^/]+\/variations$/) && method === 'GET') {
    const match = path.match(/\/products\/([^/]+)\/variations$/);
    if (match) {
      event.pathParameters = { ...event.pathParameters, productId: match[1] };
      return getProductVariations(event);
    }
  }

  // POST /products/:productId/variations
  if (path?.match(/\/products\/[^/]+\/variations$/) && method === 'POST') {
    const match = path.match(/\/products\/([^/]+)\/variations$/);
    if (match) {
      event.pathParameters = { ...event.pathParameters, productId: match[1] };
      return createVariation(event);
    }
  }

  // POST /products/:productId/variations/bulk
  if (path?.match(/\/products\/[^/]+\/variations\/bulk$/) && method === 'POST') {
    const match = path.match(/\/products\/([^/]+)\/variations\/bulk$/);
    if (match) {
      event.pathParameters = { ...event.pathParameters, productId: match[1] };
      return bulkCreateVariations(event);
    }
  }

  // GET /products/:productId/variations/options
  if (path?.match(/\/products\/[^/]+\/variations\/options$/) && method === 'GET') {
    const match = path.match(/\/products\/([^/]+)\/variations\/options$/);
    if (match) {
      event.pathParameters = { ...event.pathParameters, productId: match[1] };
      return getProductAttributeOptions(event);
    }
  }

  // GET /products/:productId/variations/find
  if (path?.match(/\/products\/[^/]+\/variations\/find$/) && method === 'GET') {
    const match = path.match(/\/products\/([^/]+)\/variations\/find$/);
    if (match) {
      event.pathParameters = { ...event.pathParameters, productId: match[1] };
      return findVariationByAttributes(event);
    }
  }

  // GET /products/:productId/variations/:variationId
  if (path?.match(/\/products\/[^/]+\/variations\/[^/]+$/) && method === 'GET') {
    const match = path.match(/\/products\/([^/]+)\/variations\/([^/]+)$/);
    if (match) {
      event.pathParameters = { ...event.pathParameters, productId: match[1], variationId: match[2] };
      return getVariation(event);
    }
  }

  // PUT /products/:productId/variations/:variationId
  if (path?.match(/\/products\/[^/]+\/variations\/[^/]+$/) && method === 'PUT') {
    const match = path.match(/\/products\/([^/]+)\/variations\/([^/]+)$/);
    if (match) {
      event.pathParameters = { ...event.pathParameters, productId: match[1], variationId: match[2] };
      return updateVariation(event);
    }
  }

  // DELETE /products/:productId/variations/:variationId
  if (path?.match(/\/products\/[^/]+\/variations\/[^/]+$/) && method === 'DELETE') {
    const match = path.match(/\/products\/([^/]+)\/variations\/([^/]+)$/);
    if (match) {
      event.pathParameters = { ...event.pathParameters, productId: match[1], variationId: match[2] };
      return deleteVariation(event);
    }
  }

  return createResponse(404, { success: false, message: 'Endpoint not found' });
};
