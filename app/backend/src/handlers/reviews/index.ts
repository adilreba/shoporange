/**
 * REVIEWS HANDLER
 * Ürün yorumları: CRUD + helpful marking
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { securityHeaders } from '../../utils/security';
import { requireAuth } from '../../utils/authorization';
import { audit } from '../../utils/auditLogger';
import { getClientIP } from '../../utils/security';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const REVIEWS_TABLE = process.env.REVIEWS_TABLE || '';
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || '';

const headers = securityHeaders;

const createErrorResponse = (statusCode: number, message: string): APIGatewayProxyResult => ({
  statusCode,
  headers,
  body: JSON.stringify({ error: message, timestamp: new Date().toISOString() }),
});

const createSuccessResponse = (data: any, statusCode = 200): APIGatewayProxyResult => ({
  statusCode,
  headers,
  body: JSON.stringify(data),
});

// ===== GET REVIEWS BY PRODUCT =====
export const getReviewsByProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const productId = event.queryStringParameters?.productId;
    if (!productId) {
      return createErrorResponse(400, 'productId query parameter is required');
    }

    const result = await dynamodb.send(new QueryCommand({
      TableName: REVIEWS_TABLE,
      IndexName: 'ProductIndex',
      KeyConditionExpression: 'productId = :productId',
      ExpressionAttributeValues: { ':productId': productId },
      ScanIndexForward: false,
    }));

    return createSuccessResponse({ reviews: result.Items || [] });
  } catch (error) {
    console.error('Error fetching reviews by product:', error);
    return createErrorResponse(500, 'Failed to fetch reviews');
  }
};

// ===== GET REVIEWS BY USER =====
export const getReviewsByUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.queryStringParameters?.userId;
    if (!userId) {
      return createErrorResponse(400, 'userId query parameter is required');
    }

    const result = await dynamodb.send(new QueryCommand({
      TableName: REVIEWS_TABLE,
      IndexName: 'UserIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
      ScanIndexForward: false,
    }));

    return createSuccessResponse({ reviews: result.Items || [] });
  } catch (error) {
    console.error('Error fetching reviews by user:', error);
    return createErrorResponse(500, 'Failed to fetch reviews');
  }
};

// ===== CREATE REVIEW =====
export const createReview = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = requireAuth(event);
    const body = JSON.parse(event.body || '{}');
    const { productId, rating, comment, userName } = body;

    if (!productId || !rating || !comment) {
      return createErrorResponse(400, 'productId, rating, and comment are required');
    }
    if (rating < 1 || rating > 5) {
      return createErrorResponse(400, 'Rating must be between 1 and 5');
    }
    if (comment.length < 5 || comment.length > 2000) {
      return createErrorResponse(400, 'Comment must be between 5 and 2000 characters');
    }

    const productResult = await dynamodb.send(new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { id: productId },
    }));
    if (!productResult.Item) {
      return createErrorResponse(404, 'Product not found');
    }

    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const review = {
      id: reviewId,
      productId,
      userId: user.userId,
      userName: userName || user.name || user.email,
      rating,
      comment: comment.trim(),
      helpfulCount: 0,
      verified: false,
      createdAt: now,
      updatedAt: now,
    };

    await dynamodb.send(new PutCommand({
      TableName: REVIEWS_TABLE,
      Item: review,
    }));

    await audit.userAction({
      userId: user.userId,
      userEmail: user.email,
      ipAddress: getClientIP(event),
      action: 'CREATE_REVIEW',
      resource: 'REVIEW',
      resourceId: reviewId,
      details: { productId, rating },
    });

    return createSuccessResponse({ review, message: 'Review created successfully' }, 201);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return createErrorResponse(401, 'Authentication required');
    }
    console.error('Error creating review:', error);
    return createErrorResponse(500, 'Failed to create review');
  }
};

// ===== MARK REVIEW HELPFUL =====
export const markHelpful = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const reviewId = event.pathParameters?.id;
    if (!reviewId) {
      return createErrorResponse(400, 'Review ID is required');
    }

    await dynamodb.send(new UpdateCommand({
      TableName: REVIEWS_TABLE,
      Key: { id: reviewId },
      UpdateExpression: 'SET helpfulCount = if_not_exists(helpfulCount, :zero) + :inc, updatedAt = :now',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':zero': 0,
        ':now': new Date().toISOString(),
      },
    }));

    return createSuccessResponse({ message: 'Review marked as helpful' });
  } catch (error) {
    console.error('Error marking review helpful:', error);
    return createErrorResponse(500, 'Failed to mark review as helpful');
  }
};

// ===== DELETE REVIEW =====
export const deleteReview = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = requireAuth(event);
    const reviewId = event.pathParameters?.id;
    if (!reviewId) {
      return createErrorResponse(400, 'Review ID is required');
    }

    const reviewResult = await dynamodb.send(new GetCommand({
      TableName: REVIEWS_TABLE,
      Key: { id: reviewId },
    }));

    const review = reviewResult.Item;
    if (!review) {
      return createErrorResponse(404, 'Review not found');
    }

    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    if (review.userId !== user.userId && !isAdmin) {
      return createErrorResponse(403, 'You can only delete your own reviews');
    }

    await dynamodb.send(new DeleteCommand({
      TableName: REVIEWS_TABLE,
      Key: { id: reviewId },
    }));

    await audit.adminAction({
      adminId: user.userId,
      adminEmail: user.email,
      ipAddress: getClientIP(event),
      action: 'DELETE_REVIEW',
      resource: 'REVIEW',
      resourceId: reviewId,
    });

    return createSuccessResponse({ message: 'Review deleted successfully' });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return createErrorResponse(401, 'Authentication required');
    }
    console.error('Error deleting review:', error);
    return createErrorResponse(500, 'Failed to delete review');
  }
};

// ===== MAIN HANDLER =====
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const path = event.path;
  const method = event.httpMethod;

  if (path === '/reviews' || path.endsWith('/reviews')) {
    if (method === 'GET') {
      if (event.queryStringParameters?.productId) {
        return getReviewsByProduct(event);
      }
      if (event.queryStringParameters?.userId) {
        return getReviewsByUser(event);
      }
      return createErrorResponse(400, 'productId or userId query parameter is required');
    }
    if (method === 'POST') return createReview(event);
  }

  if (path.match(/\/reviews\/[^/]+\/helpful$/) || path.endsWith('/helpful')) {
    if (method === 'POST') return markHelpful(event);
  }

  if (path.match(/\/reviews\/[^/]+$/) || path.match(/\/reviews\/[^/]+\/?$/)) {
    if (method === 'DELETE') return deleteReview(event);
  }

  return createErrorResponse(404, 'Not found');
};
