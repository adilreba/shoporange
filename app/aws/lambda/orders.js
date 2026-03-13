const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const ORDERS_TABLE = process.env.ORDERS_TABLE || 'ShopOrange-Orders';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key'
};

// Create order
exports.createOrder = async (event) => {
  try {
    const orderData = JSON.parse(event.body);
    const timestamp = new Date().toISOString();
    const orderId = `ORD-${Date.now()}`;
    
    const params = {
      TableName: ORDERS_TABLE,
      Item: {
        id: orderId,
        ...orderData,
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: timestamp,
        updatedAt: timestamp
      }
    };
    
    await dynamodb.put(params).promise();
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'Order created successfully',
        order: params.Item
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Get orders
exports.getOrders = async (event) => {
  try {
    const userId = event.queryStringParameters?.userId;
    
    let params = {
      TableName: ORDERS_TABLE
    };
    
    // If userId provided, filter by user
    if (userId) {
      params.IndexName = 'UserIndex';
      params.KeyConditionExpression = 'userId = :userId';
      params.ExpressionAttributeValues = {
        ':userId': userId
      };
      
      const result = await dynamodb.query(params).promise();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.Items)
      };
    }
    
    const result = await dynamodb.scan(params).promise();
    
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

// Get single order
exports.getOrder = async (event) => {
  try {
    const { id } = event.pathParameters;
    
    const params = {
      TableName: ORDERS_TABLE,
      Key: { id }
    };
    
    const result = await dynamodb.get(params).promise();
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Order not found' })
      };
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.Item)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Update order status
exports.updateOrderStatus = async (event) => {
  try {
    const { id } = event.pathParameters;
    const { status } = JSON.parse(event.body);
    
    const params = {
      TableName: ORDERS_TABLE,
      Key: { id },
      UpdateExpression: 'set #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString()
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
