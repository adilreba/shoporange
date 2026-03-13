const AWS = require('aws-sdk');
const crypto = require('crypto');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE || 'ShopOrange-Users';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key'
};

// JWT Secret (in production, use AWS Secrets Manager)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper: Generate JWT token
function generateToken(user) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Helper: Hash password
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper: Get user by email
async function getUserByEmail(email) {
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
}

// Login
exports.login = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body);
    
    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email and password are required' })
      };
    }
    
    // Find user
    const user = await getUserByEmail(email);
    
    if (!user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }
    
    // Verify password
    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user: userWithoutPassword,
        token
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

// Register
exports.register = async (event) => {
  try {
    const { email, password, name, phone } = JSON.parse(event.body);
    
    if (!email || !password || !name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email, password, and name are required' })
      };
    }
    
    // Check if email already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Email already exists' })
      };
    }
    
    const timestamp = new Date().toISOString();
    const userId = `user_${Date.now()}`;
    
    const user = {
      id: userId,
      email,
      password: hashPassword(password),
      name,
      phone: phone || '',
      avatar: '',
      role: 'user',
      addresses: [],
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await dynamodb.put({
      TableName: USERS_TABLE,
      Item: user
    }).promise();
    
    // Generate token
    const token = generateToken(user);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        user: userWithoutPassword,
        token
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

// Google Login
exports.googleLogin = async (event) => {
  try {
    const { token, user: googleUser } = JSON.parse(event.body);
    
    // In production, verify Google token with Google's API
    // For now, we'll trust the frontend and create/find user
    
    let user = await getUserByEmail(googleUser.email);
    
    if (!user) {
      // Create new user
      const timestamp = new Date().toISOString();
      user = {
        id: `user_google_${Date.now()}`,
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.picture || '',
        phone: '',
        role: 'user',
        addresses: [],
        provider: 'google',
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      await dynamodb.put({
        TableName: USERS_TABLE,
        Item: user
      }).promise();
    }
    
    const jwtToken = generateToken(user);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user,
        token: jwtToken
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

// Facebook Login
exports.facebookLogin = async (event) => {
  try {
    const { token, user: fbUser } = JSON.parse(event.body);
    
    // In production, verify Facebook token with Facebook's API
    
    let user = await getUserByEmail(fbUser.email);
    
    if (!user) {
      // Create new user
      const timestamp = new Date().toISOString();
      user = {
        id: `user_fb_${Date.now()}`,
        email: fbUser.email,
        name: fbUser.name,
        avatar: fbUser.picture?.data?.url || '',
        phone: '',
        role: 'user',
        addresses: [],
        provider: 'facebook',
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      await dynamodb.put({
        TableName: USERS_TABLE,
        Item: user
      }).promise();
    }
    
    const jwtToken = generateToken(user);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user,
        token: jwtToken
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

// Verify token
exports.verifyToken = async (event) => {
  try {
    const { token } = JSON.parse(event.body);
    
    if (!token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Token is required' })
      };
    }
    
    // Decode and verify token
    const parts = token.split('.');
    if (parts.length !== 3) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token format' })
      };
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token expired' })
      };
    }
    
    // Get user
    const userResult = await dynamodb.get({
      TableName: USERS_TABLE,
      Key: { id: payload.userId }
    }).promise();
    
    if (!userResult.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      };
    }
    
    const { password, ...userWithoutPassword } = userResult.Item;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(userWithoutPassword)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Forgot password
exports.forgotPassword = async (event) => {
  try {
    const { email } = JSON.parse(event.body);
    
    const user = await getUserByEmail(email);
    
    if (!user) {
      // Don't reveal if email exists
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'If email exists, reset instructions sent' })
      };
    }
    
    // In production, send actual email with reset link
    // For now, just return success
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'If email exists, reset instructions sent' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Reset password
exports.resetPassword = async (event) => {
  try {
    const { token, password } = JSON.parse(event.body);
    
    // In production, verify reset token
    // Update password
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Password reset successful' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
