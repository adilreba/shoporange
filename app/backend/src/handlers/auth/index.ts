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
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { OAuth2Client } from 'google-auth-library';
import {
  securityHeaders,
  sanitizeInput,
  getClientIP,
  detectSQLInjection,
  validatePasswordStrength,
  logSecurityEvent,
} from '../../utils/security';
import { checkAuthRateLimit } from '../../utils/rateLimiter';
import { encryptField } from '../../utils/encryption';

// ===== COGNITO CLIENT SETUP =====
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'eu-west-1',
});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';
const CLIENT_ID = process.env.COGNITO_CLIENT_ID || '';

// ===== DYNAMODB CLIENT SETUP =====
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'eu-west-1',
});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const USERS_TABLE = process.env.USERS_TABLE || '';

// ===== S3 CLIENT SETUP =====
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-1',
});
const IMAGE_BUCKET = process.env.IMAGE_BUCKET || '';
const CDN_URL = process.env.CDN_URL || '';

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

// ===== GOOGLE AUTH HELPERS =====

/**
 * Find user by email using DynamoDB GSI
 */
async function findUserByEmail(email: string): Promise<any | null> {
  if (!USERS_TABLE) return null;
  try {
    const result = await dynamodb.send(new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
      Limit: 1,
    }));
    return result.Items?.[0] || null;
  } catch (error) {
    console.error('[findUserByEmail] Error:', error);
    return null;
  }
}

/**
 * Download Google avatar and upload to S3
 */
async function downloadAndStoreAvatar(pictureUrl: string, userId: string): Promise<string> {
  try {
    if (!pictureUrl || !IMAGE_BUCKET || !CDN_URL) {
      return '';
    }

    // Fetch avatar from Google
    const response = await fetch(pictureUrl, { timeout: 5000 } as any);
    if (!response.ok) {
      console.warn('[downloadAndStoreAvatar] Failed to fetch avatar:', response.status);
      return '';
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine content type
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const key = `avatars/${userId}.${ext}`;

    // Upload to S3
    await s3Client.send(new PutObjectCommand({
      Bucket: IMAGE_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000',
    }));

    const avatarUrl = `https://${CDN_URL}/${key}`;
    console.log('[downloadAndStoreAvatar] Stored avatar:', avatarUrl);
    return avatarUrl;
  } catch (error) {
    console.error('[downloadAndStoreAvatar] Error:', error);
    return '';
  }
}

/**
 * Create user profile in DynamoDB for Google users
 */
async function createUserProfile(userData: {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  auth_provider: string;
  google_sub?: string;
  avatar_source?: string;
}): Promise<void> {
  if (!USERS_TABLE) return;

  const encryptionContext = { userId: userData.id, service: 'auth', purpose: 'google-signup' };

  let encryptedEmail: string;
  try {
    encryptedEmail = await encryptField(userData.email, encryptionContext);
  } catch (encError) {
    console.warn('[createUserProfile] Encryption failed, using plain email:', encError);
    encryptedEmail = userData.email;
  }

  const userProfile = {
    id: userData.id,
    email: encryptedEmail,
    name: userData.name,
    avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`,
    phone: '',
    address: [],
    role: 'user',
    marketingConsent: false,
    isActive: true,
    auth_provider: userData.auth_provider,
    google_sub: userData.google_sub || undefined,
    avatar_source: userData.avatar_source || 'google',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await dynamodb.send(new PutCommand({
    TableName: USERS_TABLE,
    Item: userProfile,
  }));

  console.log('[createUserProfile] Created profile for:', userData.email);
}

/**
 * Update existing user profile with Google auth info (account linking)
 */
async function linkGoogleAccount(userId: string, googleSub: string, avatarUrl?: string): Promise<void> {
  if (!USERS_TABLE) return;
  
  const updateExpressions: string[] = ['SET google_sub = :googleSub, auth_provider = :authProvider, updatedAt = :updatedAt'];
  const expressionValues: any = {
    ':googleSub': googleSub,
    ':authProvider': 'both',
    ':updatedAt': new Date().toISOString(),
  };

  if (avatarUrl) {
    updateExpressions.push('avatar = :avatar, avatar_source = :avatarSource');
    expressionValues[':avatar'] = avatarUrl;
    expressionValues[':avatarSource'] = 'google';
  }

  await dynamodb.send(new UpdateCommand({
    TableName: USERS_TABLE,
    Key: { id: userId },
    UpdateExpression: updateExpressions.join(', '),
    ExpressionAttributeValues: expressionValues,
  }));

  console.log('[linkGoogleAccount] Linked Google account for user:', userId);
}

async function handleGoogleSignIn(googleUser: any, idToken: string): Promise<any> {
  // Deterministic password from Google sub - same user always gets same password
  // Meets Cognito policy: uppercase (G), lowercase, number (sub), special char (!)
  const basePassword = `Google_${googleUser.sub}_Auth!`;

  // 1. Check if user exists in DynamoDB by email (account linking)
  const existingDbUser = await findUserByEmail(googleUser.email);

  if (existingDbUser) {
    console.log('[handleGoogleSignIn] Existing user found, linking Google account:', googleUser.email);

    // User exists - link Google account if not already linked
    if (!existingDbUser.google_sub) {
      // Download and store avatar
      const avatarUrl = googleUser.picture
        ? await downloadAndStoreAvatar(googleUser.picture, existingDbUser.id)
        : undefined;
      
      await linkGoogleAccount(existingDbUser.id, googleUser.sub, avatarUrl);
    }

    // Ensure user exists in Cognito
    try {
      await cognitoClient.send(new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: googleUser.email,
      }));
    } catch (cognitoError: any) {
      if (cognitoError.name === 'UserNotFoundException') {
        // User in DB but not in Cognito - create in Cognito
        console.log('[handleGoogleSignIn] User in DB but not in Cognito, creating:', googleUser.email);
        await adminCreateUser(googleUser.email, googleUser.name, basePassword, 'user');
      } else {
        throw cognitoError;
      }
    }

    // Update password and sign in
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: googleUser.email,
      Password: basePassword,
      Permanent: true,
    });
    await cognitoClient.send(setPasswordCommand);

    return await signIn({ email: googleUser.email, password: basePassword });
  }

  // 2. New user - create in Cognito and DynamoDB
  console.log('[handleGoogleSignIn] New user, creating:', googleUser.email);

  try {
    await adminCreateUser(googleUser.email, googleUser.name, basePassword, 'user');
  } catch (createError: any) {
    if (createError.name === 'UsernameExistsException' || 
        createError.message?.includes('already exists')) {
      console.log('[handleGoogleSignIn] Cognito user exists but no DB profile, continuing...');
    } else {
      throw createError;
    }
  }

  // Get the Cognito user to get the sub (user ID)
  const cognitoUser = await cognitoClient.send(new AdminGetUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: googleUser.email,
  }));
  const userSub = cognitoUser.UserAttributes?.find((a: any) => a.Name === 'sub')?.Value || '';

  // Download and store avatar
  const avatarUrl = googleUser.picture
    ? await downloadAndStoreAvatar(googleUser.picture, userSub)
    : undefined;

  // Create DynamoDB profile
  await createUserProfile({
    id: userSub,
    email: googleUser.email,
    name: googleUser.name,
    avatar: avatarUrl,
    auth_provider: 'google',
    google_sub: googleUser.sub,
    avatar_source: 'google',
  });

  // Sign in
  return await signIn({ email: googleUser.email, password: basePassword });
}

// ===== GOOGLE TOKEN VERIFICATION =====
const GOOGLE_CLIENT_ID = '334193988536-m66kr69futlq4hq9odsplok1uldpd3bk.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

async function verifyGoogleToken(token: string): Promise<any> {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid Google token - no payload');
    }
    return payload;
  } catch (error: any) {
    console.error('Google token verification error:', {
      message: error.message,
      code: error.code,
      status: error.status,
      stack: error.stack,
      clientId: GOOGLE_CLIENT_ID,
      tokenLength: token?.length,
      tokenPrefix: token?.substring(0, 20) + '...',
    });
    throw error;
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
const applyAuthRateLimit = async (
  event: APIGatewayProxyEvent,
  type: keyof typeof RATE_LIMITS
) => {
  const clientIP = getClientIP(event);
  return checkAuthRateLimit(`${clientIP}:${type}`);
};

/**
 * POST /auth/register
 * Register a new user with security checks
 */
export const register = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Rate limiting
    const rateCheck = await applyAuthRateLimit(event, 'register');
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
    const rateCheck = await applyAuthRateLimit(event, 'login');
    
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
    const rateCheck = await applyAuthRateLimit(event, 'login');
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
    const rateCheck = await applyAuthRateLimit(event, 'login');
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
// Decode JWT token without verifying signature (for reading claims)
function decodeJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64').toString('utf8')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const getMe = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return {
        statusCode: 401,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Authorization header required' }),
      };
    }

    // Decode Cognito IdToken to get user claims
    const payload = decodeJwtPayload(token);
    if (!payload) {
      return {
        statusCode: 401,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Invalid token format' }),
      };
    }

    return {
      statusCode: 200,
      headers: securityHeaders,
      body: JSON.stringify({
        id: payload.sub,
        email: payload.email,
        name: payload.name || payload.email?.split('@')[0] || '',
        phone: payload.phone_number || '',
        role: payload['custom:role'] || 'user',
      }),
    };
  } catch (error: any) {
    console.error('[getMe] Error:', error);
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

    const { token } = JSON.parse(event.body);

    if (!token) {
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Google token is required' }),
      };
    }

    // Verify Google ID token cryptographically
    const payload = await verifyGoogleToken(token);

    if (!payload.email) {
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Google token does not contain email' }),
      };
    }

    // Validate Google email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      return {
        statusCode: 400,
        headers: securityHeaders,
        body: JSON.stringify({ error: 'Invalid email format' }),
      };
    }

    const googleUser = {
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture,
      sub: payload.sub,
    };

    const result = await handleGoogleSignIn(
      {
        email: sanitizeInput(googleUser.email),
        name: sanitizeInput(googleUser.name),
        picture: googleUser.picture,
        sub: googleUser.sub,
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
    console.error('Google login error:', {
      message: error.message,
      code: error.code,
      status: error.status,
      stack: error.stack,
    });
    return {
      statusCode: 401,
      headers: securityHeaders,
      body: JSON.stringify({
        error: 'Google login failed: Invalid or expired token',
        details: error.message,
        code: error.code || 'UNKNOWN',
      }),
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
