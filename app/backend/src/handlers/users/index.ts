import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE || '';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

export const getUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.id;
    if (!userId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'User ID required' }) };
    }

    const result = await dynamodb.get({
      TableName: USERS_TABLE,
      Key: { id: userId }
    }).promise();

    if (!result.Item) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'User not found' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify(result.Item) };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

export const updateUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.id;
    if (!userId || !event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'User ID and body required' }) };
    }

    const updates = JSON.parse(event.body);
    
    const result = await dynamodb.update({
      TableName: USERS_TABLE,
      Key: { id: userId },
      UpdateExpression: 'set #name = :name, email = :email, phone = :phone, address = :address, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#name': 'name' },
      ExpressionAttributeValues: {
        ':name': updates.name,
        ':email': updates.email,
        ':phone': updates.phone,
        ':address': updates.address,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    }).promise();

    return { statusCode: 200, headers, body: JSON.stringify(result.Attributes) };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
