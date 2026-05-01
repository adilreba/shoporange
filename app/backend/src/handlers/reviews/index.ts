import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { createSuccessResponse, createErrorResponse } from '../../utils/response';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.REVIEWS_TABLE || 'AtusHome-Reviews';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { httpMethod, path, pathParameters, queryStringParameters, body } = event;

  try {
    // GET /reviews?productId=xxx veya ?userId=xxx
    if (httpMethod === 'GET' && path === '/reviews') {
      const productId = queryStringParameters?.productId;
      const userId = queryStringParameters?.userId;
      if (!productId && !userId) {
        return createErrorResponse(400, 'productId or userId required');
      }
      const index = productId ? 'ProductIdIndex' : 'UserIdIndex';
      const key = productId ? 'productId' : 'userId';
      const value = productId || userId;
      const result = await client.send(new QueryCommand({
        TableName: TABLE,
        IndexName: index,
        KeyConditionExpression: `${key} = :v`,
        ExpressionAttributeValues: { ':v': value },
      }));
      return createSuccessResponse(result.Items || []);
    }

    // POST /reviews
    if (httpMethod === 'POST' && path === '/reviews') {
      const data = JSON.parse(body || '{}');
      if (!data.productId || !data.rating || !data.comment || !data.userName) {
        return createErrorResponse(400, 'Missing required fields');
      }
      const review = {
        id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        productId: data.productId,
        userId: data.userId || 'anonymous',
        userName: data.userName,
        userAvatar: data.userAvatar || '',
        rating: Number(data.rating),
        comment: data.comment,
        createdAt: new Date().toISOString(),
        verified: false,
        helpful: 0,
      };
      await client.send(new PutCommand({ TableName: TABLE, Item: review }));
      return createSuccessResponse(review, 201);
    }

    // POST /reviews/{reviewId}/helpful
    if (httpMethod === 'POST' && path.match(/^\/reviews\/[^/]+\/helpful$/)) {
      const reviewId = pathParameters?.reviewId || path.split('/')[2];
      await client.send(new UpdateCommand({
        TableName: TABLE,
        Key: { id: reviewId },
        UpdateExpression: 'SET helpful = if_not_exists(helpful, :zero) + :inc',
        ExpressionAttributeValues: { ':inc': 1, ':zero': 0 },
      }));
      return createSuccessResponse({ success: true });
    }

    // DELETE /reviews/{reviewId}
    if (httpMethod === 'DELETE' && path.match(/^\/reviews\/[^/]+$/)) {
      const reviewId = pathParameters?.reviewId || path.split('/')[2];
      await client.send(new DeleteCommand({ TableName: TABLE, Key: { id: reviewId } }));
      return createSuccessResponse({ success: true });
    }

    return createErrorResponse(404, 'Not found');
  } catch (err) {
    console.error('Reviews handler error:', err);
    return createErrorResponse(500, 'Internal server error');
  }
};
