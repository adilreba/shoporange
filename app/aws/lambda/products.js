const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || 'ShopOrange-Products';

// CORS headers
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key'
};

// Get all products
exports.getProducts = async (event) => {
  try {
    const params = {
      TableName: TABLE_NAME
    };
    
    // Add category filter if provided
    if (event.queryStringParameters?.category) {
      params.IndexName = 'CategoryIndex';
      params.KeyConditionExpression = 'category = :category';
      params.ExpressionAttributeValues = {
        ':category': event.queryStringParameters.category
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

// Get single product
exports.getProduct = async (event) => {
  try {
    const { id } = event.pathParameters;
    
    const params = {
      TableName: TABLE_NAME,
      Key: { id }
    };
    
    const result = await dynamodb.get(params).promise();
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Product not found' })
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

// Create product
exports.createProduct = async (event) => {
  try {
    const product = JSON.parse(event.body);
    const timestamp = new Date().toISOString();
    
    const params = {
      TableName: TABLE_NAME,
      Item: {
        id: `prod_${Date.now()}`,
        ...product,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    };
    
    await dynamodb.put(params).promise();
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(params.Item)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Update product
exports.updateProduct = async (event) => {
  try {
    const { id } = event.pathParameters;
    const updates = JSON.parse(event.body);
    
    const params = {
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: 'set #name = :name, price = :price, stock = :stock, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':name': updates.name,
        ':price': updates.price,
        ':stock': updates.stock,
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

// Delete product
exports.deleteProduct = async (event) => {
  try {
    const { id } = event.pathParameters;
    
    const params = {
      TableName: TABLE_NAME,
      Key: { id }
    };
    
    await dynamodb.delete(params).promise();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Product deleted successfully' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
