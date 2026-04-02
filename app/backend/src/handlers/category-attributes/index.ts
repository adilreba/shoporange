/**
 * Category Attributes Handler - Amazon-style dynamic product attributes
 * Kategoriye özel özellik şeması yönetimi
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-west-1' });
const docClient = DynamoDBDocumentClient.from(dynamodb);

const CATEGORY_ATTRIBUTES_TABLE = process.env.CATEGORY_ATTRIBUTES_TABLE || 'AtusHome-CategoryAttributes';

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

// Önceden tanımlanmış kategori özellik şemaları
export const DEFAULT_CATEGORY_SCHEMAS: Record<string, CategoryAttribute[]> = {
  'giyim': [
    { attributeId: 'beden', name: 'Beden', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'], required: true, order: 1 },
    { attributeId: 'renk', name: 'Renk', type: 'color', options: ['Siyah', 'Beyaz', 'Kırmızı', 'Mavi', 'Yeşil', 'Sarı', 'Pembe', 'Mor', 'Gri', 'Kahverengi'], required: true, order: 2 },
    { attributeId: 'materyal', name: 'Materyal', type: 'select', options: ['Pamuk', 'Polyester', 'Keten', 'Yün', 'İpek', 'Deri', 'Kadife', 'Denim'], required: false, order: 3 },
    { attributeId: 'desen', name: 'Desen', type: 'select', options: ['Düz', 'Çizgili', 'Kareli', 'Çiçekli', 'Geometrik', 'Hayvan Deseni'], required: false, order: 4 },
  ],
  'ayakkabi': [
    { attributeId: 'numara', name: 'Numara', type: 'select', options: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'], required: true, order: 1 },
    { attributeId: 'renk', name: 'Renk', type: 'color', options: ['Siyah', 'Beyaz', 'Kahverengi', 'Bej', 'Kırmızı', 'Mavi', 'Gri'], required: true, order: 2 },
    { attributeId: 'materyal', name: 'Materyal', type: 'select', options: ['Deri', 'Suni Deri', 'Kumaş', 'Nubuk', 'Süet', 'Kauçuk'], required: false, order: 3 },
  ],
  'mutfak': [
    { attributeId: 'malzeme', name: 'Malzeme', type: 'select', options: ['Plastik', 'Paslanmaz Çelik', 'Cam', 'Seramik', 'Ahşap', 'Silikon', 'Döküm Demir'], required: true, order: 1 },
    { attributeId: 'hacim', name: 'Hacim/Kapasite', type: 'select', options: ['250ml', '500ml', '1L', '1.5L', '2L', '3L', '5L', '10L'], required: false, order: 2 },
    { attributeId: 'renk', name: 'Renk', type: 'color', options: ['Siyah', 'Beyaz', 'Kırmızı', 'Mavi', 'Yeşil', 'Pembe', 'Gri', 'Şeffaf'], required: false, order: 3 },
  ],
  'elektronik': [
    { attributeId: 'renk', name: 'Renk', type: 'color', options: ['Siyah', 'Beyaz', 'Gümüş', 'Altın', 'Uzay Grisi', 'Mavi', 'Kırmızı'], required: false, order: 1 },
    { attributeId: 'depolama', name: 'Depolama', type: 'select', options: ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'], required: false, order: 2 },
    { attributeId: 'ram', name: 'RAM', type: 'select', options: ['2GB', '4GB', '8GB', '16GB', '32GB', '64GB'], required: false, order: 3 },
  ],
  'mobilya': [
    { attributeId: 'renk', name: 'Renk', type: 'color', options: ['Beyaz', 'Siyah', 'Kahverengi', 'Meşe', 'Ceviz', 'Gri', 'Bej', 'Krem'], required: true, order: 1 },
    { attributeId: 'malzeme', name: 'Malzeme', type: 'select', options: ['Ahşap', 'Metal', 'Cam', 'Plastik', 'Deri', 'Kumaş', 'Mermer'], required: true, order: 2 },
    { attributeId: 'boyut', name: 'Boyut', type: 'select', options: ['Tek Kişilik', 'Çift Kişilik', 'Queen', 'King'], required: false, order: 3 },
  ],
  'oyuncak': [
    { attributeId: 'yas-grubu', name: 'Yaş Grubu', type: 'select', options: ['0-12 ay', '1-3 yaş', '3-6 yaş', '6-9 yaş', '9-12 yaş', '12+ yaş'], required: true, order: 1 },
    { attributeId: 'malzeme', name: 'Malzeme', type: 'select', options: ['Plastik', 'Ahşap', 'Kumaş', 'Silikon', 'Kauçuk', 'Metal'], required: false, order: 2 },
    { attributeId: 'cinsiyet', name: 'Cinsiyet', type: 'select', options: ['Kız', 'Erkek', 'Unisex'], required: false, order: 3 },
  ],
  'kozmetik': [
    { attributeId: 'cilt-tipi', name: 'Cilt Tipi', type: 'select', options: ['Kuru', 'Yağlı', 'Karma', 'Normal', 'Hassas', 'Tüm Cilt Tipleri'], required: true, order: 1 },
    { attributeId: 'hacim', name: 'Hacim', type: 'select', options: ['30ml', '50ml', '100ml', '150ml', '200ml', '250ml', '500ml'], required: false, order: 2 },
    { attributeId: 'renk-tonu', name: 'Renk Tonu', type: 'select', options: ['Açık', 'Orta', 'Koyu', 'Sıcak', 'Soğuk', 'Nötr'], required: false, order: 3 },
  ],
  'spor': [
    { attributeId: 'beden', name: 'Beden', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], required: true, order: 1 },
    { attributeId: 'renk', name: 'Renk', type: 'color', options: ['Siyah', 'Beyaz', 'Gri', 'Mavi', 'Kırmızı', 'Yeşil', 'Turuncu', 'Mor'], required: true, order: 2 },
    { attributeId: 'malzeme', name: 'Malzeme', type: 'select', options: ['Polyester', 'Naylon', 'Elastan', 'Pamuk', 'Kuru Fit'], required: false, order: 3 },
  ],
  'ev-tekstili': [
    { attributeId: 'renk', name: 'Renk', type: 'color', options: ['Beyaz', 'Krem', 'Bej', 'Gri', 'Mavi', 'Yeşil', 'Pembe', 'Sarı', 'Turuncu'], required: true, order: 1 },
    { attributeId: 'boyut', name: 'Boyut', type: 'select', options: ['Tek Kişilik', 'Çift Kişilik', 'King Size', 'Bebek'], required: true, order: 2 },
    { attributeId: 'materyal', name: 'Materyal', type: 'select', options: ['Pamuk', 'Saten', 'Flanel', 'Kadife', 'Bambu', 'Mikrofiber'], required: true, order: 3 },
    { attributeId: 'desen', name: 'Desen', type: 'select', options: ['Düz', 'Çizgili', 'Çiçekli', 'Geometrik', 'Etnik'], required: false, order: 4 },
  ],
};

// Attribute types
export interface CategoryAttribute {
  attributeId: string;
  name: string;
  type: 'select' | 'color' | 'text' | 'number';
  options: string[];
  required: boolean;
  order: number;
}

// Get all predefined category schemas
async function getCategorySchemas(): Promise<APIGatewayProxyResult> {
  try {
    return createResponse(200, {
      success: true,
      data: DEFAULT_CATEGORY_SCHEMAS,
    });
  } catch (error) {
    console.error('Get category schemas error:', error);
    return createResponse(500, { success: false, message: 'Failed to get category schemas' });
  }
}

// Get attributes for a specific category
async function getCategoryAttributes(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const categoryId = event.pathParameters?.categoryId;

  if (!categoryId) {
    return createResponse(400, { success: false, message: 'categoryId is required' });
  }

  try {
    // First check predefined schemas
    const predefined = DEFAULT_CATEGORY_SCHEMAS[categoryId];
    
    // Get custom attributes from DynamoDB
    const result = await docClient.send(new QueryCommand({
      TableName: CATEGORY_ATTRIBUTES_TABLE,
      KeyConditionExpression: 'categoryId = :categoryId',
      ExpressionAttributeValues: {
        ':categoryId': categoryId,
      },
    }));

    const customAttributes = result.Items || [];

    // Merge predefined and custom attributes
    const allAttributes = predefined ? [...predefined, ...customAttributes] : customAttributes;

    // Sort by order
    allAttributes.sort((a, b) => a.order - b.order);

    return createResponse(200, {
      success: true,
      data: {
        categoryId,
        attributes: allAttributes,
        hasPredefined: !!predefined,
        customCount: customAttributes.length,
      },
    });
  } catch (error) {
    console.error('Get category attributes error:', error);
    return createResponse(500, { success: false, message: 'Failed to get category attributes' });
  }
}

// Add custom attribute to category
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
    const { name, type = 'select', options = [], required = false } = body;

    if (!name) {
      return createResponse(400, { success: false, message: 'name is required' });
    }

    const attributeId = `attr_${Date.now()}`;
    const order = body.order || 100;

    const attribute: CategoryAttribute = {
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
    return createResponse(500, { success: false, message: 'Failed to add category attribute' });
  }
}

// Delete custom attribute
async function deleteCategoryAttribute(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const categoryId = event.pathParameters?.categoryId;
  const attributeId = event.pathParameters?.attributeId;

  if (!categoryId || !attributeId) {
    return createResponse(400, { success: false, message: 'categoryId and attributeId are required' });
  }

  try {
    await docClient.send(new DeleteCommand({
      TableName: CATEGORY_ATTRIBUTES_TABLE,
      Key: {
        categoryId,
        attributeId,
      },
    }));

    return createResponse(200, {
      success: true,
      message: 'Attribute deleted successfully',
    });
  } catch (error) {
    console.error('Delete category attribute error:', error);
    return createResponse(500, { success: false, message: 'Failed to delete category attribute' });
  }
}

// Seed default category schemas (admin only)
async function seedCategorySchemas(): Promise<APIGatewayProxyResult> {
  try {
    const results = [];

    for (const [categoryId, attributes] of Object.entries(DEFAULT_CATEGORY_SCHEMAS)) {
      for (const attr of attributes) {
        try {
          await docClient.send(new PutCommand({
            TableName: CATEGORY_ATTRIBUTES_TABLE,
            Item: {
              categoryId,
              attributeId: attr.attributeId,
              ...attr,
              isDefault: true,
              createdAt: new Date().toISOString(),
            },
          }));
          results.push({ categoryId, attributeId: attr.attributeId, status: 'created' });
        } catch (err) {
          results.push({ categoryId, attributeId: attr.attributeId, status: 'error', error: (err as Error).message });
        }
      }
    }

    return createResponse(200, {
      success: true,
      message: 'Category schemas seeded successfully',
      data: results,
    });
  } catch (error) {
    console.error('Seed category schemas error:', error);
    return createResponse(500, { success: false, message: 'Failed to seed category schemas' });
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
  if (path === '/category-schemas' && method === 'GET') {
    return getCategorySchemas();
  }

  if (path === '/category-attributes/seed' && method === 'POST') {
    return seedCategorySchemas();
  }

  if (path?.startsWith('/category-attributes/') && path.includes('/attributes')) {
    const match = path.match(/\/category-attributes\/([^/]+)\/attributes/);
    if (match) {
      event.pathParameters = { ...event.pathParameters, categoryId: match[1] };
      
      if (method === 'GET') {
        return getCategoryAttributes(event);
      }
      if (method === 'POST') {
        return addCategoryAttribute(event);
      }
    }
  }

  if (path?.startsWith('/category-attributes/') && path.includes('/attributes/')) {
    const match = path.match(/\/category-attributes\/([^/]+)\/attributes\/([^/]+)/);
    if (match) {
      event.pathParameters = { 
        ...event.pathParameters, 
        categoryId: match[1],
        attributeId: match[2],
      };
      
      if (method === 'DELETE') {
        return deleteCategoryAttribute(event);
      }
    }
  }

  // Simple path patterns as fallback
  if (path?.startsWith('/category-attributes/')) {
    const parts = path.split('/');
    if (parts.length >= 3) {
      const categoryId = parts[2];
      event.pathParameters = { ...event.pathParameters, categoryId };

      if (method === 'GET') {
        return getCategoryAttributes(event);
      }
    }
  }

  return createResponse(404, { success: false, message: 'Endpoint not found' });
};
