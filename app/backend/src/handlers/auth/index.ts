import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as cognito from '../../services/cognito';
import {
  securityHeaders,
  sanitizeInput,
  checkRateLimit,
  getClientIP,
  detectSQLInjection,
  validatePasswordStrength,
  logSecurityEvent,
} from '../../utils/security';

// Rate limit configs
const RATE_LIMITS = {
  login: { max: 5, window: 300000 }, // 5 deneme, 5 dakika
  register: { max: 3, window: 3600000 }, // 3 deneme, 1 saat
  default: { max: 100, window: 60000 }, // 100 istek, 1 dakika
};

// Helper: Rate limit check with specific limits
const checkAuthRateLimit = (
  event: APIGatewayProxyEvent,
  type: keyof typeof RATE_LIMITS
) => {
  const clientIP = getClientIP(event);
  const limit = RATE_LIMITS[type] || RATE_LIMITS.default;
  return checkRateLimit(`${clientIP}:${type}`, limit.max, limit.window);
};

/**
 * POST /auth/register
 * Register a new user with security checks
 */
export const register = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Rate limiting
    const rateCheck = checkAuthRateLimit(event, 'register');
    if (!rateCheck.allowed) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { endpoint: 'register', ip: getClientIP(event) }, 'medium');
      return {
        statusCode: 429,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Too many registration attempts. Please try again later.' }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { email, password, name, phone } = JSON.parse(event.body);

    // Input validation
    if (!email || !password || !name) {
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Email, password, and name are required' }),
      };
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    const sanitizedName = sanitizeInput(name);
    const sanitizedPhone = phone ? sanitizeInput(phone) : undefined;

    // Validate email format (strict)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Invalid email format' }),
      };
    }

    // SQL injection check
    if (detectSQLInjection(sanitizedEmail) || detectSQLInjection(sanitizedName)) {
      logSecurityEvent('SQL_INJECTION_ATTEMPT', { endpoint: 'register', email: sanitizedEmail }, 'high');
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Invalid input detected' }),
      };
    }

    // Validate password strength
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ 
          error: 'Password does not meet security requirements',
          details: passwordCheck.errors,
        }),
      };
    }

    const result = await cognito.signUp({
      email: sanitizedEmail,
      password,
      name: sanitizedName,
      phone: sanitizedPhone,
    });

    logSecurityEvent('USER_REGISTERED', { email: sanitizedEmail }, 'low');

    return {
      statusCode: 201,
      headers: securityHeaders,
      body: JSON.stringify({
        message: 'User registered successfully. Please check your email for verification code.',
        userId: result.userSub,
      }),
    };
  } catch (error: any) {
    console.error('Register error:', error);

    if (error.name === 'UsernameExistsException') {
      return {
        statusCode: 409,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Email already exists' }),
      };
    }

    if (error.name === 'InvalidPasswordException') {
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ error: error.message }),
      };
    }

    return {
      statusCode: 500,
      headers: securityHeaders,
      body: JSON.stringify({ error: 'Registration failed' }),
    };
  }
};

/**
 * POST /auth/login
 * Login with rate limiting and security checks
 */
export const login = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Rate limiting - brute force protection
    const clientIP = getClientIP(event);
    const rateCheck = checkAuthRateLimit(event, 'login');
    
    if (!rateCheck.allowed) {
      logSecurityEvent('BRUTE_FORCE_ATTEMPT', { endpoint: 'login', ip: clientIP }, 'high');
      return {
        statusCode: 429,
        headers: securityHeaders,
        body: JSON.stringify({ 
          error: 'Too many login attempts. Account temporarily locked. Please try again in 5 minutes.' 
        }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Email and password are required' }),
      };
    }

    // Sanitize email
    const sanitizedEmail = sanitizeInput(email).toLowerCase();

    // SQL injection check
    if (detectSQLInjection(sanitizedEmail)) {
      logSecurityEvent('SQL_INJECTION_ATTEMPT', { endpoint: 'login', email: sanitizedEmail }, 'high');
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Invalid input detected' }),
      };
    }

    const result = await cognito.signIn({
      email: sanitizedEmail,
      password,
    });

    logSecurityEvent('USER_LOGGED_IN', { email: sanitizedEmail, ip: clientIP }, 'low');

    return {
      statusCode: 200,
      headers: securityHeaders,
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
      logSecurityEvent('FAILED_LOGIN', { email: sanitizeInput(JSON.parse(event.body || '{}').email || '') }, 'medium');
      return {
        statusCode: 401,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Invalid email or password' }),
      };
    }

    if (error.name === 'UserNotConfirmedException') {
      return {
        statusCode: 403,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Email not verified. Please check your email.' }),
      };
    }

    return {
      statusCode: 500,
      headers: securityHeaders,
      body: JSON.stringify({ error: 'Login failed' }),
    };
  }
};

/**
 * POST /auth/verify
 * Verify email with security checks
 */
export const verifyEmail = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { email, code } = JSON.parse(event.body);

    if (!email || !code) {
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Email and verification code are required' }),
      };
    }

    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    const sanitizedCode = sanitizeInput(code);

    // Verify code format (6 digits)
    if (!/^\d{6}$/.test(sanitizedCode)) {
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Invalid verification code format' }),
      };
    }

    await cognito.confirmSignUp(sanitizedEmail, sanitizedCode);

    return {
      statusCode: 200,
      headers: securityHeaders,
      body: JSON.stringify({ message: 'Email verified successfully' }),
    };
  } catch (error: any) {
    console.error('Verify email error:', error);

    if (error.name === 'CodeMismatchException') {
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Invalid verification code' }),
      };
    }

    return {
      statusCode: 500,
      headers: securityHeaders,
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
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { email } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Email is required' }),
      };
    }

    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    await cognito.resendConfirmationCode(sanitizedEmail);

    return {
      statusCode: 200,
      headers: securityHeaders,
      body: JSON.stringify({ message: 'Verification code resent' }),
    };
  } catch (error: any) {
    console.error('Resend code error:', error);
    return {
      statusCode: 500,
      headers: securityHeaders,
      body: JSON.stringify({ error: 'Failed to resend code' }),
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
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { refreshToken: token } = JSON.parse(event.body);

    if (!token) {
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Refresh token is required' }),
      };
    }

    const result = await cognito.refreshTokens(token);

    return {
      statusCode: 200,
      headers: securityHeaders,
      body: JSON.stringify({
        token: result.tokens.idToken,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: result.tokens.expiresIn,
      }),
    };
  } catch (error: any) {
    console.error('Refresh token error:', error);
    return {
      statusCode: 401,
      headers: securityHeaders,
      body: JSON.stringify({ error: 'Invalid refresh token' }),
    };
  }
};

/**
 * POST /auth/logout
 * Logout user
 */
export const logout = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    const accessToken = authHeader?.replace('Bearer ', '');

    if (accessToken) {
      await cognito.signOut(accessToken);
    }

    logSecurityEvent('USER_LOGGED_OUT', { ip: getClientIP(event) }, 'low');

    return {
      statusCode: 200,
      headers: securityHeaders,
      body: JSON.stringify({ message: 'Logged out successfully' }),
    };
  } catch (error: any) {
    console.error('Logout error:', error);
    return {
      statusCode: 200,
      headers: securityHeaders,
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
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Authorization header required' }),
      };
    }

    const user = await cognito.getUser(accessToken);

    return {
      statusCode: 200,
      headers: securityHeaders,
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
    return {
      statusCode: 401,
      headers: securityHeaders,
      body: JSON.stringify({ error: 'Invalid or expired token' }),
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
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { email } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Email is required' }),
      };
    }

    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    await cognito.forgotPassword(sanitizedEmail);

    return {
      statusCode: 200,
      headers: securityHeaders,
      body: JSON.stringify({ message: 'Password reset code sent to your email' }),
    };
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return {
      statusCode: 200,
      headers: securityHeaders,
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
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { email, code, newPassword } = JSON.parse(event.body);

    if (!email || !code || !newPassword) {
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Email, code, and new password are required' }),
      };
    }

    // Validate new password strength
    const passwordCheck = validatePasswordStrength(newPassword);
    if (!passwordCheck.valid) {
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ 
          error: 'New password does not meet security requirements',
          details: passwordCheck.errors,
        }),
      };
    }

    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    await cognito.confirmForgotPassword(sanitizedEmail, code, newPassword);

    logSecurityEvent('PASSWORD_RESET', { email: sanitizedEmail }, 'medium');

    return {
      statusCode: 200,
      headers: securityHeaders,
      body: JSON.stringify({ message: 'Password reset successful' }),
    };
  } catch (error: any) {
    console.error('Reset password error:', error);
    return {
      statusCode: 400,
      headers: securityHeaders,
      body: JSON.stringify({ error: 'Password reset failed' }),
    };
  }
};

/**
 * POST /auth/google
 * Google OAuth login
 */
export const googleLogin = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { token, user: googleUser } = JSON.parse(event.body);

    if (!token || !googleUser?.email) {
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Google token and user info are required' }),
      };
    }

    // Validate Google email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(googleUser.email)) {
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Invalid email format' }),
      };
    }

    const result = await cognito.handleGoogleSignIn(
      {
        email: sanitizeInput(googleUser.email),
        name: sanitizeInput(googleUser.name),
        picture: googleUser.picture,
        sub: googleUser.sub || googleUser.id,
      },
      token
    );

    logSecurityEvent('GOOGLE_LOGIN', { email: googleUser.email }, 'low');

    return {
      statusCode: 200,
      headers: securityHeaders,
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
      headers: securityHeaders,
      body: JSON.stringify({ error: 'Google login failed' }),
    };
  }
};
