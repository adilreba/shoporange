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
  AdminGetUserCommand,
  ChangePasswordCommand,
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

// ===== PHONE VALIDATION =====
function validateTurkishPhone(phone: string): { valid: boolean; e164?: string; message?: string } {
  const cleaned = phone.replace(/\s+/g, '').replace(/[()-]/g, '');
  const e164 = cleaned.startsWith('+')
    ? cleaned
    : cleaned.startsWith('0')
    ? `+9${cleaned}`
    : `+90${cleaned}`;

  if (!e164.startsWith('+90')) {
    return { valid: false, message: 'Sadece Türkiye cep telefon numaraları kabul edilmektedir.' };
  }

  const national = e164.replace('+90', '');
  if (!/^5[0-9]{9}$/.test(national)) {
    return { valid: false, message: 'Geçerli bir Türkiye cep telefon numarası giriniz. Örn: 05XX XXX XX XX' };
  }

  return { valid: true, e164 };
}

// ===== COGNITO FUNCTIONS =====
async function signUp(input: { email: string; password: string; name: string; phone?: string; marketingConsent?: boolean }): Promise<{ userSub: string }> {
  const phoneCheck = validateTurkishPhone(input.phone || '');
  const e164Phone = phoneCheck.valid ? phoneCheck.e164 : undefined;
  if (input.phone && !phoneCheck.valid) {
    throw new Error(phoneCheck.message);
  }

  const command = new SignUpCommand({
    ClientId: CLIENT_ID,
    Username: input.email,
    Password: input.password,
    UserAttributes: [
      { Name: 'email', Value: input.email },
      { Name: 'name', Value: input.name },
      ...(e164Phone ? [{ Name: 'phone_number', Value: e164Phone }] : []),
      { Name: 'custom:role', Value: 'user' },
      ...(input.marketingConsent !== undefined ? [{ Name: 'custom:marketingConsent', Value: input.marketingConsent ? 'true' : 'false' }] : []),
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
  login: { max: 10, window: 300000 }, // 10 deneme, 5 dakika
  register: { max: 10, window: 3600000 }, // 10 deneme, 1 saat
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

    const { email, password, name, phone, marketingConsent } = JSON.parse(event.body);

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

    // Validate Turkish phone number
    if (sanitizedPhone) {
      const phoneCheck = validateTurkishPhone(sanitizedPhone);
      if (!phoneCheck.valid) {
        return {
          statusCode: 400,
          headers: securityHeaders,
          body: JSON.stringify({ error: phoneCheck.message }),
        };
      }
    }

    const result = await signUp({
      email: sanitizedEmail,
      password,
      name: sanitizedName,
      phone: sanitizedPhone,
      marketingConsent: typeof marketingConsent === 'boolean' ? marketingConsent : false,
    });

    logSecurityEvent('USER_REGISTERED', { email: sanitizedEmail }, 'low');

    return {
      statusCode: 201,
      headers: securityHeaders,
      body: JSON.stringify({
        message: 'User registered successfully. Please check your SMS for verification code.',
        userId: result.userSub,
      }),
    };
  } catch (error: any) {
    console.error('Register error:', error);

    if (error.name === 'UsernameExistsException') {
      try {
        // Kullanıcı zaten kayıtlıysa, doğrulama kodunu tekrar göndermeyi dene
        // (Eğer kullanıcı zaten confirmed ise bu da hata verir, o zaman 'already exists' döneriz)
        await resendConfirmationCode(JSON.parse(event.body || '{}').email || '');
        return {
          statusCode: 200,
          headers: securityHeaders,
          body: JSON.stringify({
            message: 'Verification code resent. Please check your SMS.',
            needsVerification: true,
          }),
        };
      } catch (resendError: any) {
        // Kod tekrar gönderilemezse (örn. zaten confirmed), kayıtlı olduğunu söyle
        return {
          statusCode: 409,
          headers: securityHeaders,
          body: JSON.stringify({ error: 'Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın veya şifrenizi sıfırlayın.' }),
        };
      }
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

/**
 * POST /auth/change-password
 * Change user password with old password verification
 */
export const changePassword = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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

    if (!event.body) {
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { oldPassword, newPassword } = JSON.parse(event.body);

    if (!oldPassword || !newPassword) {
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Old password and new password are required' }),
      };
    }

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

    const command = new ChangePasswordCommand({
      AccessToken: accessToken,
      PreviousPassword: oldPassword,
      ProposedPassword: newPassword,
    });
    await cognitoClient.send(command);

    logSecurityEvent('PASSWORD_CHANGED', { ip: getClientIP(event) }, 'medium');

    return {
      statusCode: 200,
      headers: securityHeaders,
      body: JSON.stringify({ message: 'Password changed successfully' }),
    };
  } catch (error: any) {
    console.error('Change password error:', error);

    if (error.name === 'NotAuthorizedException' || error.name === 'InvalidPasswordException') {
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Invalid old password or new password is too weak' }),
      };
    }

    return {
      statusCode: 500,
      headers: securityHeaders,
      body: JSON.stringify({ error: 'Password change failed' }),
    };
  }
};
