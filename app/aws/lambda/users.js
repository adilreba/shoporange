const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE || 'AtusHome-Users';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key'
};

// Get user by ID
exports.getUser = async (event) => {
  try {
    const { id } = event.pathParameters;
    
    const params = {
      TableName: USERS_TABLE,
      Key: { id }
    };
    
    const result = await dynamodb.get(params).promise();
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      };
    }
    
    // Remove sensitive data
    const user = { ...result.Item };
    delete user.password;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(user)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Get user by email
exports.getUserByEmail = async (email) => {
  const params = {
    TableName: USERS_TABLE,
    IndexName: 'EmailIndex',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': email
    }
  };
  
  const result = await dynamodb.query(params).promise();
  return result.Items?.[0];
};

// Create user
exports.createUser = async (event) => {
  try {
    const userData = JSON.parse(event.body);
    const timestamp = new Date().toISOString();
    
    // Check if email already exists
    const existingUser = await exports.getUserByEmail(userData.email);
    if (existingUser) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Email already exists' })
      };
    }
    
    const params = {
      TableName: USERS_TABLE,
      Item: {
        id: `user_${Date.now()}`,
        ...userData,
        role: 'user',
        createdAt: timestamp,
        updatedAt: timestamp
      }
    };
    
    await dynamodb.put(params).promise();
    
    // Remove password from response
    const response = { ...params.Item };
    delete response.password;
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Update user
exports.updateUser = async (event) => {
  try {
    const { id } = event.pathParameters;
    const updates = JSON.parse(event.body);
    
    const params = {
      TableName: USERS_TABLE,
      Key: { id },
      UpdateExpression: 'set #name = :name, phone = :phone, address = :address, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':name': updates.name,
        ':phone': updates.phone,
        ':address': updates.address,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };
    
    const result = await dynamodb.update(params).promise();
    
    // Remove password from response
    const response = { ...result.Attributes };
    delete response.password;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Get all users (admin only)
exports.getUsers = async (event) => {
  try {
    const params = {
      TableName: USERS_TABLE
    };
    
    const result = await dynamodb.scan(params).promise();
    
    // Remove passwords from response
    const users = result.Items.map(user => {
      const u = { ...user };
      delete u.password;
      return u;
    });
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(users)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
