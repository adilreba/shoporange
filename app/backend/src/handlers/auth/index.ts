import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  GetUserCommand,
  GlobalSignOutCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ResendConfirmationCodeCommand,
  ConfirmSignUpCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  securityHeaders,
  sanitizeInput,
  checkRateLimit,
  getClientIP,
  detectSQLInjection,
  validatePasswordStrength,
  logSecurityEvent,
} from '../../utils/security';

// ===== COGNITO CLIENT SETUP =====
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'eu-west-1',
});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';
const CLIENT_ID = process.env.COGNITO_CLIENT_ID || '';

// ===== COGNITO FUNCTIONS =====
async function signUp(input: { email: string; password: string; name: string; phone?: string }): Promise<{ userSub: string }> {
  const command = new SignUpCommand({
    ClientId: CLIENT_ID,
    Username: input.email,
    Password: input.password,
    UserAttributes: [
      { Name: 'email', Value: input.email },
      { Name: 'name', Value: input.name },
      ...(input.phone ? [{ Name: 'phone_number', Value: input.phone }] : []),
      { Name: 'custom:role', Value: 'user' },
    ],
  });
  const response = await cognitoClient.send(command);
  return { userSub: response.UserSub! };
}

async function confirmSignUp(email: string, code: string): Promise<void> {
  const command = new ConfirmSignUpCommand({
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
  });
  await cognitoClient.send(command);
}

async function resendConfirmationCode(email: string): Promise<void> {
  const command = new ResendConfirmationCodeCommand({
    ClientId: CLIENT_ID,
    Username: email,
  });
  await cognitoClient.send(command);
}

async function signIn(input: { email: string; password: string }): Promise<{ user: any; tokens: any }> {
  const command = new InitiateAuthCommand({
    ClientId: CLIENT_ID,
    AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
    AuthParameters: {
      USERNAME: input.email,
      PASSWORD: input.password,
    },
  });
  const response = await cognitoClient.send(command);
  const authResult = response.AuthenticationResult;

  if (!authResult?.AccessToken || !authResult?.IdToken || !authResult?.RefreshToken) {
    throw new Error('Authentication failed');
  }

  const user = await getUser(authResult.AccessToken);

  return {
    user: {
      id: user.sub,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role || 'user',
    },
    tokens: {
      accessToken: authResult.AccessToken,
      idToken: authResult.IdToken,
      refreshToken: authResult.RefreshToken,
      expiresIn: authResult.ExpiresIn || 3600,
    },
  };
}

async function refreshTokens(refreshToken: string): Promise<{ tokens: any }> {
  const command = new InitiateAuthCommand({
    ClientId: CLIENT_ID,
    AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
    AuthParameters: { REFRESH_TOKEN: refreshToken },
  });
  const response = await cognitoClient.send(command);
  const authResult = response.AuthenticationResult;

  if (!authResult?.AccessToken || !authResult?.IdToken) {
    throw new Error('Token refresh failed');
  }

  return {
    tokens: {
      accessToken: authResult.AccessToken,
      idToken: authResult.IdToken,
      refreshToken: refreshToken,
      expiresIn: authResult.ExpiresIn || 3600,
    },
  };
}

async function getUser(accessToken: string): Promise<any> {
  const command = new GetUserCommand({ AccessToken: accessToken });
  const response = await cognitoClient.send(command);

  const attributes: Record<string, string> = {};
  response.UserAttributes?.forEach((attr) => {
    if (attr.Name && attr.Value) {
      attributes[attr.Name] = attr.Value;
    }
  });

  return {
    sub: attributes.sub,
    email: attributes.email,
    name: attributes.name,
    phone: attributes.phone_number,
    role: attributes['custom:role'] || 'user',
  };
}

async function signOut(accessToken: string): Promise<void> {
  const command = new GlobalSignOutCommand({ AccessToken: accessToken });
  await cognitoClient.send(command);
}

async function sendForgotPasswordCode(email: string): Promise<void> {
  const command = new ForgotPasswordCommand({
    ClientId: CLIENT_ID,
    Username: email,
  });
  await cognitoClient.send(command);
}

async function confirmForgotPasswordCode(email: string, code: string, newPassword: string): Promise<void> {
  const command = new ConfirmForgotPasswordCommand({
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
    Password: newPassword,
  });
  await cognitoClient.send(command);
}

async function adminCreateUser(email: string, name: string, tempPassword: string, role: string = 'user'): Promise<void> {
  const command = new AdminCreateUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: email,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'email_verified', Value: 'true' },
      { Name: 'name', Value: name },
      { Name: 'custom:role', Value: role },
    ],
    TemporaryPassword: tempPassword,
    MessageAction: 'SUPPRESS',
  });
  await cognitoClient.send(command);

  const setPasswordCommand = new (await import('@aws-sdk/client-cognito-identity-provider')).AdminSetUserPasswordCommand({
    UserPoolId: USER_POOL_ID,
    Username: email,
    Password: tempPassword,
    Permanent: true,
  });
  await cognitoClient.send(setPasswordCommand);
}

async function handleGoogleSignIn(googleUser: any, idToken: string): Promise<any> {
  try {
    return await signIn({
      email: googleUser.email,
      password: `google_${googleUser.sub}`,
    });
  } catch (error) {
    const tempPassword = `google_${googleUser.sub}_${Date.now()}`;
    await adminCreateUser(googleUser.email, googleUser.name, tempPassword, 'user');
    return await signIn({ email: googleUser.email, password: tempPassword });
  }
}

// ===== RATE LIMIT CONFIG =====

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

    const result = await signUp({
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

    const result = await signIn({
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
    // Rate limiting
    const rateCheck = checkAuthRateLimit(event, 'login');
    if (!rateCheck.allowed) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { endpoint: 'verifyEmail', ip: getClientIP(event) }, 'medium');
      return {
        statusCode: 429,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Too many verification attempts. Please try again later.' }),
      };
    }

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

    await confirmSignUp(sanitizedEmail, sanitizedCode);

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
    // Rate limiting
    const rateCheck = checkAuthRateLimit(event, 'login');
    if (!rateCheck.allowed) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { endpoint: 'resendCode', ip: getClientIP(event) }, 'medium');
      return {
        statusCode: 429,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Too many resend attempts. Please try again later.' }),
      };
    }

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
    await resendConfirmationCode(sanitizedEmail);

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

    const result = await refreshTokens(token);

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
      await signOut(accessToken);
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

    const user = await getUser(accessToken);

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
    await sendForgotPasswordCode(sanitizedEmail);

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
    await confirmForgotPasswordCode(sanitizedEmail, code, newPassword);

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

    const result = await handleGoogleSignIn(
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
