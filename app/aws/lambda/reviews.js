const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const REVIEWS_TABLE = process.env.REVIEWS_TABLE || 'AtusHome-Reviews';
const PRODUCTS_TABLE = process.env.TABLE_NAME || 'AtusHome-Products';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key'
};

// Get reviews by product
exports.getReviewsByProduct = async (event) => {
  try {
    const { productId } = event.queryStringParameters || {};
    
    if (!productId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Product ID is required' })
      };
    }
    
    const params = {
      TableName: REVIEWS_TABLE,
      IndexName: 'ProductIndex',
      KeyConditionExpression: 'productId = :productId',
      ExpressionAttributeValues: {
        ':productId': productId
      },
      ScanIndexForward: false // Sort by newest first
    };
    
    const result = await dynamodb.query(params).promise();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.Items)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Get reviews by user
exports.getReviewsByUser = async (event) => {
  try {
    const { userId } = event.queryStringParameters || {};
    
    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User ID is required' })
      };
    }
    
    const params = {
      TableName: REVIEWS_TABLE,
      IndexName: 'UserIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false
    };
    
    const result = await dynamodb.query(params).promise();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.Items)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Create review
exports.createReview = async (event) => {
  try {
    const reviewData = JSON.parse(event.body);
    const timestamp = new Date().toISOString();
    const reviewId = `rev_${Date.now()}`;
    
    const review = {
      id: reviewId,
      ...reviewData,
      helpful: 0,
      verified: false,
      createdAt: timestamp
    };
    
    // Save review
    await dynamodb.put({
      TableName: REVIEWS_TABLE,
      Item: review
    }).promise();
    
    // Update product rating
    await updateProductRating(reviewData.productId);
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(review)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Mark review as helpful
exports.markHelpful = async (event) => {
  try {
    const { id } = event.pathParameters;
    
    const params = {
      TableName: REVIEWS_TABLE,
      Key: { id },
      UpdateExpression: 'set helpful = helpful + :inc',
      ExpressionAttributeValues: {
        ':inc': 1
      },
      ReturnValues: 'ALL_NEW'
    };
    
    const result = await dynamodb.update(params).promise();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.Attributes)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Delete review
exports.deleteReview = async (event) => {
  try {
    const { id } = event.pathParameters;
    
    // Get review first to find productId
    const reviewResult = await dynamodb.get({
      TableName: REVIEWS_TABLE,
      Key: { id }
    }).promise();
    
    if (!reviewResult.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Review not found' })
      };
    }
    
    const productId = reviewResult.Item.productId;
    
    // Delete review
    await dynamodb.delete({
      TableName: REVIEWS_TABLE,
      Key: { id }
    }).promise();
    
    // Update product rating
    await updateProductRating(productId);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Review deleted successfully' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Helper function to update product rating
async function updateProductRating(productId) {
  try {
    // Get all reviews for product
    const reviewsResult = await dynamodb.query({
      TableName: REVIEWS_TABLE,
      IndexName: 'ProductIndex',
      KeyConditionExpression: 'productId = :productId',
      ExpressionAttributeValues: {
        ':productId': productId
      }
    }).promise();
    
    const reviews = reviewsResult.Items || [];
    const reviewCount = reviews.length;
    const averageRating = reviewCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;
    
    // Update product
    await dynamodb.update({
      TableName: PRODUCTS_TABLE,
      Key: { id: productId },
      UpdateExpression: 'set rating = :rating, reviewCount = :reviewCount, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':rating': Math.round(averageRating * 10) / 10,
        ':reviewCount': reviewCount,
        ':updatedAt': new Date().toISOString()
      }
    }).promise();
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
}
