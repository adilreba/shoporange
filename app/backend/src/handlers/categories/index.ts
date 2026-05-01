/**
 * Categories Handler - Dinamik Kategori Yönetimi
 * Admin panelinden kategori oluşturma ve özellik ekleme
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-west-1' });
const docClient = DynamoDBDocumentClient.from(dynamodb);

const CATEGORIES_TABLE = process.env.CATEGORIES_TABLE || 'AtusHome-Categories';
const CATEGORY_ATTRIBUTES_TABLE = process.env.CATEGORY_ATTRIBUTES_TABLE || 'AtusHome-CategoryAttributes';

// CORS headers
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
};

function createResponse(statusCode: number, body: any): APIGatewayProxyResult {
  return { statusCode, headers, body: JSON.stringify(body) };
}

// Types
export interface Category {
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryAttributeDef {
  attributeId: string;
  name: string;
  type: 'select' | 'color' | 'text' | 'number';
  options: string[];
  required: boolean;
  order: number;
}

// Get all categories
async function getCategories(): Promise<APIGatewayProxyResult> {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: CATEGORIES_TABLE,
    }));

    const categories = (result.Items || []).sort((a, b) => a.order - b.order);

    return createResponse(200, {
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return createResponse(500, { success: false, message: 'Failed to get categories' });
  }
}

// Get single category with attributes
async function getCategory(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const categoryId = event.pathParameters?.categoryId;

  if (!categoryId) {
    return createResponse(400, { success: false, message: 'categoryId is required' });
  }

  try {
    // Get category
    const categoryResult = await docClient.send(new GetCommand({
      TableName: CATEGORIES_TABLE,
      Key: { categoryId },
    }));

    if (!categoryResult.Item) {
      return createResponse(404, { success: false, message: 'Category not found' });
    }

    // Get attributes
    const attributesResult = await docClient.send(new QueryCommand({
      TableName: CATEGORY_ATTRIBUTES_TABLE,
      KeyConditionExpression: 'categoryId = :categoryId',
      ExpressionAttributeValues: {
        ':categoryId': categoryId,
      },
    }));

    const attributes = (attributesResult.Items || []).sort((a, b) => a.order - b.order);

    return createResponse(200, {
      success: true,
      data: {
        ...categoryResult.Item,
        attributes,
      },
    });
  } catch (error) {
    console.error('Get category error:', error);
    return createResponse(500, { success: false, message: 'Failed to get category' });
  }
}

// Create new category
async function createCategory(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return createResponse(400, { success: false, message: 'Request body is required' });
  }

  try {
    const body = JSON.parse(event.body);
    const { name, description, icon, parentId, order = 0 } = body;

    if (!name) {
      return createResponse(400, { success: false, message: 'name is required' });
    }

    const categoryId = `cat_${Date.now()}`;
    const slug = name.toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const category: Category = {
      categoryId,
      name,
      slug,
      description,
      icon,
      parentId,
      order,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await docClient.send(new PutCommand({
      TableName: CATEGORIES_TABLE,
      Item: category,
    }));

    return createResponse(201, {
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    console.error('Create category error:', error);
    return createResponse(500, { success: false, message: 'Failed to create category' });
  }
}

// Update category
async function updateCategory(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return createResponse(400, { success: false, message: 'Request body is required' });
  }

  const categoryId = event.pathParameters?.categoryId;
  if (!categoryId) {
    return createResponse(400, { success: false, message: 'categoryId is required' });
  }

  try {
    const body = JSON.parse(event.body);
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    const allowedFields = ['name', 'description', 'icon', 'parentId', 'order', 'isActive'];
    
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

    // Update slug if name changed
    if (body.name) {
      const slug = body.name.toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      updateExpressions.push('#slug = :slug');
      expressionAttributeNames['#slug'] = 'slug';
      expressionAttributeValues[':slug'] = slug;
    }

    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    await docClient.send(new UpdateCommand({
      TableName: CATEGORIES_TABLE,
      Key: { categoryId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    }));

    return createResponse(200, {
      success: true,
      message: 'Category updated successfully',
    });
  } catch (error) {
    console.error('Update category error:', error);
    return createResponse(500, { success: false, message: 'Failed to update category' });
  }
}

// Delete category
async function deleteCategory(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const categoryId = event.pathParameters?.categoryId;

  if (!categoryId) {
    return createResponse(400, { success: false, message: 'categoryId is required' });
  }

  try {
    // First delete all attributes
    const attributesResult = await docClient.send(new QueryCommand({
      TableName: CATEGORY_ATTRIBUTES_TABLE,
      KeyConditionExpression: 'categoryId = :categoryId',
      ExpressionAttributeValues: {
        ':categoryId': categoryId,
      },
    }));

    for (const attr of attributesResult.Items || []) {
      await docClient.send(new DeleteCommand({
        TableName: CATEGORY_ATTRIBUTES_TABLE,
        Key: {
          categoryId,
          attributeId: attr.attributeId,
        },
      }));
    }

    // Then delete category
    await docClient.send(new DeleteCommand({
      TableName: CATEGORIES_TABLE,
      Key: { categoryId },
    }));

    return createResponse(200, {
      success: true,
      message: 'Category and its attributes deleted successfully',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    return createResponse(500, { success: false, message: 'Failed to delete category' });
  }
}

// Add attribute to category
async function addCategoryAttribute(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return createResponse(400, { success: false, message: 'Request body is required' });
  }

  const categoryId = event.pathParameters?.categoryId;
  if (!categoryId) {
    return createResponse(400, { success: false, message: 'categoryId is required' });
  }

  try {
    const body = JSON.parse(event.body);
    const { name, type = 'select', options = [], required = false, order = 0 } = body;

    if (!name) {
      return createResponse(400, { success: false, message: 'name is required' });
    }

    const attributeId = `attr_${Date.now()}`;

    const attribute: CategoryAttributeDef = {
      attributeId,
      name,
      type,
      options,
      required,
      order,
    };

    await docClient.send(new PutCommand({
      TableName: CATEGORY_ATTRIBUTES_TABLE,
      Item: {
        categoryId,
        attributeId,
        ...attribute,
        createdAt: new Date().toISOString(),
      },
    }));

    return createResponse(201, {
      success: true,
      message: 'Attribute added successfully',
      data: attribute,
    });
  } catch (error) {
    console.error('Add category attribute error:', error);
    return createResponse(500, { success: false, message: 'Failed to add attribute' });
  }
}

// Update attribute
async function updateCategoryAttribute(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return createResponse(400, { success: false, message: 'Request body is required' });
  }

  const categoryId = event.pathParameters?.categoryId;
  const attributeId = event.pathParameters?.attributeId;

  if (!categoryId || !attributeId) {
    return createResponse(400, { success: false, message: 'categoryId and attributeId are required' });
  }

  try {
    const body = JSON.parse(event.body);
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    const allowedFields = ['name', 'type', 'options', 'required', 'order'];
    
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

    await docClient.send(new UpdateCommand({
      TableName: CATEGORY_ATTRIBUTES_TABLE,
      Key: { categoryId, attributeId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    }));

    return createResponse(200, {
      success: true,
      message: 'Attribute updated successfully',
    });
  } catch (error) {
    console.error('Update category attribute error:', error);
    return createResponse(500, { success: false, message: 'Failed to update attribute' });
  }
}

// Delete attribute
async function deleteCategoryAttribute(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const categoryId = event.pathParameters?.categoryId;
  const attributeId = event.pathParameters?.attributeId;

  if (!categoryId || !attributeId) {
    return createResponse(400, { success: false, message: 'categoryId and attributeId are required' });
  }

  try {
    await docClient.send(new DeleteCommand({
      TableName: CATEGORY_ATTRIBUTES_TABLE,
      Key: { categoryId, attributeId },
    }));

    return createResponse(200, {
      success: true,
      message: 'Attribute deleted successfully',
    });
  } catch (error) {
    console.error('Delete category attribute error:', error);
    return createResponse(500, { success: false, message: 'Failed to delete attribute' });
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
  // GET /categories
  if (path === '/categories' && method === 'GET') {
    return getCategories();
  }

  // POST /categories
  if (path === '/categories' && method === 'POST') {
    return createCategory(event);
  }

  // GET /categories/:categoryId
  if (path?.match(/\/categories\/[^/]+$/) && method === 'GET') {
    const match = path.match(/\/categories\/([^/]+)$/);
    if (match) {
      event.pathParameters = { ...event.pathParameters, categoryId: match[1] };
      return getCategory(event);
    }
  }

  // PUT /categories/:categoryId
  if (path?.match(/\/categories\/[^/]+$/) && method === 'PUT') {
    const match = path.match(/\/categories\/([^/]+)$/);
    if (match) {
      event.pathParameters = { ...event.pathParameters, categoryId: match[1] };
      return updateCategory(event);
    }
  }

  // DELETE /categories/:categoryId
  if (path?.match(/\/categories\/[^/]+$/) && method === 'DELETE') {
    const match = path.match(/\/categories\/([^/]+)$/);
    if (match) {
      event.pathParameters = { ...event.pathParameters, categoryId: match[1] };
      return deleteCategory(event);
    }
  }

  // POST /categories/:categoryId/attributes
  if (path?.match(/\/categories\/[^/]+\/attributes$/) && method === 'POST') {
    const match = path.match(/\/categories\/([^/]+)\/attributes$/);
    if (match) {
      event.pathParameters = { ...event.pathParameters, categoryId: match[1] };
      return addCategoryAttribute(event);
    }
  }

  // PUT /categories/:categoryId/attributes/:attributeId
  if (path?.match(/\/categories\/[^/]+\/attributes\/[^/]+$/) && method === 'PUT') {
    const match = path.match(/\/categories\/([^/]+)\/attributes\/([^/]+)$/);
    if (match) {
      event.pathParameters = { 
        ...event.pathParameters, 
        categoryId: match[1],
        attributeId: match[2],
      };
      return updateCategoryAttribute(event);
    }
  }

  // DELETE /categories/:categoryId/attributes/:attributeId
  if (path?.match(/\/categories\/[^/]+\/attributes\/[^/]+$/) && method === 'DELETE') {
    const match = path.match(/\/categories\/([^/]+)\/attributes\/([^/]+)$/);
    if (match) {
      event.pathParameters = { 
        ...event.pathParameters, 
        categoryId: match[1],
        attributeId: match[2],
      };
      return deleteCategoryAttribute(event);
    }
  }

  return createResponse(404, { success: false, message: 'Endpoint not found' });
};
