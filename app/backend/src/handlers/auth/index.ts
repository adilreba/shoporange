import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as cognito from '../../services/cognito';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
};

/**
 * POST /auth/register
 * Register a new user
 */
export const register = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { email, password, name, phone } = JSON.parse(event.body);

    if (!email || !password || !name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email, password, and name are required' }),
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid email format' }),
      };
    }

    // Validate password strength
    if (password.length < 8) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Password must be at least 8 characters' }),
      };
    }

    const result = await cognito.signUp({ email, password, name, phone });

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'User registered successfully. Please check your email for verification code.',
        userId: result.userSub,
      }),
    };
  } catch (error: any) {
    console.error('Register error:', error);

    // Handle specific Cognito errors
    if (error.name === 'UsernameExistsException') {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Email already exists' }),
      };
    }

    if (error.name === 'InvalidPasswordException') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: error.message }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Registration failed' }),
    };
  }
};

/**
 * POST /auth/verify
 * Verify email with confirmation code
 */
export const verifyEmail = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { email, code } = JSON.parse(event.body);

    if (!email || !code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email and verification code are required' }),
      };
    }

    await cognito.confirmSignUp(email, code);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Email verified successfully' }),
    };
  } catch (error: any) {
    console.error('Verify email error:', error);

    if (error.name === 'CodeMismatchException') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid verification code' }),
      };
    }

    if (error.name === 'ExpiredCodeException') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Verification code has expired' }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Verification failed' }),
    };
  }
};

/**
 * POST /auth/resend-code
 * Resend verification code
 */
export const resendCode = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { email } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email is required' }),
      };
    }

    await cognito.resendConfirmationCode(email);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Verification code resent' }),
    };
  } catch (error: any) {
    console.error('Resend code error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to resend code' }),
    };
  }
};

/**
 * POST /auth/login
 * Sign in user
 */
export const login = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email and password are required' }),
      };
    }

    const result = await cognito.signIn({ email, password });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user: result.user,
        token: result.tokens.idToken,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: result.tokens.expiresIn,
      }),
    };
  } catch (error: any) {
    console.error('Login error:', error);

    if (error.name === 'NotAuthorizedException') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid email or password' }),
      };
    }

    if (error.name === 'UserNotConfirmedException') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Email not verified. Please check your email.' }),
      };
    }

    if (error.name === 'UserNotFoundException') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid email or password' }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Login failed' }),
    };
  }
};

/**
 * POST /auth/refresh
 * Refresh access token
 */
export const refreshToken = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { refreshToken: token } = JSON.parse(event.body);

    if (!token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Refresh token is required' }),
      };
    }

    const result = await cognito.refreshTokens(token);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        token: result.tokens.idToken,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: result.tokens.expiresIn,
      }),
    };
  } catch (error: any) {
    console.error('Refresh token error:', error);

    if (error.name === 'NotAuthorizedException') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid refresh token' }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Token refresh failed' }),
    };
  }
};

/**
 * POST /auth/logout
 * Sign out user
 */
export const logout = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    const accessToken = authHeader?.replace('Bearer ', '');

    if (accessToken) {
      await cognito.signOut(accessToken);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Logged out successfully' }),
    };
  } catch (error: any) {
    console.error('Logout error:', error);
    // Still return success even if token is invalid
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Logged out successfully' }),
    };
  }
};

/**
 * GET /auth/me
 * Get current user
 */
export const getMe = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization header required' }),
      };
    }

    const user = await cognito.getUser(accessToken);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: user.sub,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user['custom:role'] || 'user',
      }),
    };
  } catch (error: any) {
    console.error('Get user error:', error);

    if (error.name === 'NotAuthorizedException') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid or expired token' }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get user' }),
    };
  }
};

/**
 * POST /auth/forgot-password
 * Send password reset code
 */
export const forgotPassword = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { email } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email is required' }),
      };
    }

    await cognito.forgotPassword(email);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Password reset code sent to your email' }),
    };
  } catch (error: any) {
    console.error('Forgot password error:', error);

    // Don't reveal if user exists
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'If email exists, password reset code sent' }),
    };
  }
};

/**
 * POST /auth/reset-password
 * Reset password with code
 */
export const resetPassword = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { email, code, newPassword } = JSON.parse(event.body);

    if (!email || !code || !newPassword) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email, code, and new password are required' }),
      };
    }

    if (newPassword.length < 8) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Password must be at least 8 characters' }),
      };
    }

    await cognito.confirmForgotPassword(email, code, newPassword);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Password reset successful' }),
    };
  } catch (error: any) {
    console.error('Reset password error:', error);

    if (error.name === 'CodeMismatchException') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid reset code' }),
      };
    }

    if (error.name === 'ExpiredCodeException') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Reset code has expired' }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Password reset failed' }),
    };
  }
};

/**
 * POST /auth/google
 * Google sign in
 */
export const googleLogin = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { token, user: googleUser } = JSON.parse(event.body);

    if (!token || !googleUser?.email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Google token and user info are required' }),
      };
    }

    // TODO: Verify Google token with Google's API
    // For now, we trust the frontend and create/login user
    
    const result = await cognito.handleGoogleSignIn(
      {
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        sub: googleUser.sub || googleUser.id,
      },
      token
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user: result.user,
        token: result.tokens.idToken,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: result.tokens.expiresIn,
      }),
    };
  } catch (error: any) {
    console.error('Google login error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Google login failed' }),
    };
  }
};
