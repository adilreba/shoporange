import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || '';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

// Örnek ürün verileri
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
  },
  {
    id: 'PROD-003',
    name: 'Çift Kişilik Yatak',
    description: 'Ortopedik çift kişilik yatak',
    price: 12000,
    category: 'bedroom',
    images: ['https://example.com/bed1.jpg'],
    stock: 15,
    rating: 4.3,
    reviews: 20
  }
];

export const seedData = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Her ürünü DynamoDB'ye ekle
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
      body: JSON.stringify({ 
        message: 'Sample data seeded successfully',
        count: sampleProducts.length
      }) 
    };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
