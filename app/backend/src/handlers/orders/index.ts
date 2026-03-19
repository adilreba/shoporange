import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const ORDERS_TABLE = process.env.ORDERS_TABLE || '';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

export const getOrders = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.queryStringParameters?.userId;
    
    let params: AWS.DynamoDB.DocumentClient.ScanInput = { TableName: ORDERS_TABLE };
    
    if (userId) {
      params = {
        TableName: ORDERS_TABLE,
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId }
      };
    }

    const result = await dynamodb.scan(params).promise();
    return { statusCode: 200, headers, body: JSON.stringify(result.Items || []) };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

export const getOrder = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const orderId = event.pathParameters?.id;
    if (!orderId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Order ID required' }) };
    }

    const result = await dynamodb.get({
      TableName: ORDERS_TABLE,
      Key: { id: orderId }
    }).promise();

    if (!result.Item) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Order not found' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify(result.Item) };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

export const createOrder = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Request body required' }) };
    }

    const orderData = JSON.parse(event.body);
    const orderId = `ORD-${Date.now()}`;
    
    const order = {
      id: orderId,
      ...orderData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dynamodb.put({
      TableName: ORDERS_TABLE,
      Item: order
    }).promise();

    return { statusCode: 201, headers, body: JSON.stringify(order) };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
