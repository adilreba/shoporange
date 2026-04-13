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
  AdminUpdateUserAttributesCommand,
  AdminGetUserCommand,
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider';

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'eu-west-1',
});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';
const CLIENT_ID = process.env.COGNITO_CLIENT_ID || '';

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignInOutput {
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: string;
  };
  tokens: {
    accessToken: string;
    idToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface UserAttributes {
  sub: string;
  email: string;
  name: string;
  phone?: string;
  'custom:role'?: string;
}

/**
 * Sign up a new user with email/password
 */
export async function signUp(input: SignUpInput): Promise<{ userSub: string }> {
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

  const response = await client.send(command);
  return { userSub: response.UserSub! };
}

/**
 * Confirm sign up with verification code
 */
export async function confirmSignUp(email: string, code: string): Promise<void> {
  const command = new ConfirmSignUpCommand({
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
  });

  await client.send(command);
}

/**
 * Resend confirmation code
 */
export async function resendConfirmationCode(email: string): Promise<void> {
  const command = new ResendConfirmationCodeCommand({
    ClientId: CLIENT_ID,
    Username: email,
  });

  await client.send(command);
}

/**
 * Sign in with email/password
 */
export async function signIn(input: SignInInput): Promise<SignInOutput> {
  const command = new InitiateAuthCommand({
    ClientId: CLIENT_ID,
    AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
    AuthParameters: {
      USERNAME: input.email,
      PASSWORD: input.password,
    },
  });

  const response = await client.send(command);
  const authResult = response.AuthenticationResult;

  if (!authResult?.AccessToken || !authResult?.IdToken || !authResult?.RefreshToken) {
    throw new Error('Authentication failed');
  }

  // Get user details
  const user = await getUser(authResult.AccessToken);

  return {
    user: {
      id: user.sub,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user['custom:role'] || 'user',
    },
    tokens: {
      accessToken: authResult.AccessToken,
      idToken: authResult.IdToken,
      refreshToken: authResult.RefreshToken,
      expiresIn: authResult.ExpiresIn || 3600,
    },
  };
}

/**
 * Refresh tokens
 */
export async function refreshTokens(refreshToken: string): Promise<Omit<SignInOutput, 'user'>> {
  const command = new InitiateAuthCommand({
    ClientId: CLIENT_ID,
    AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
    },
  });

  const response = await client.send(command);
  const authResult = response.AuthenticationResult;

  if (!authResult?.AccessToken || !authResult?.IdToken) {
    throw new Error('Token refresh failed');
  }

  return {
    tokens: {
      accessToken: authResult.AccessToken,
      idToken: authResult.IdToken,
      refreshToken: refreshToken, // Keep the same refresh token
      expiresIn: authResult.ExpiresIn || 3600,
    },
  };
}

/**
 * Get user details from access token
 */
export async function getUser(accessToken: string): Promise<UserAttributes> {
  const command = new GetUserCommand({
    AccessToken: accessToken,
  });

  const response = await client.send(command);

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
    'custom:role': attributes['custom:role'],
  } as UserAttributes;
}

/**
 * Sign out user globally
 */
export async function signOut(accessToken: string): Promise<void> {
  const command = new GlobalSignOutCommand({
    AccessToken: accessToken,
  });

  await client.send(command);
}

/**
 * Forgot password - send reset code
 */
export async function forgotPassword(email: string): Promise<void> {
  const command = new ForgotPasswordCommand({
    ClientId: CLIENT_ID,
    Username: email,
  });

  await client.send(command);
}

/**
 * Confirm forgot password - reset with code
 */
export async function confirmForgotPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  const command = new ConfirmForgotPasswordCommand({
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
    Password: newPassword,
  });

  await client.send(command);
}

/**
 * Admin create user (for creating admin users)
 */
export async function adminCreateUser(
  email: string,
  name: string,
  temporaryPassword: string,
  role: string = 'user'
): Promise<void> {
  const command = new AdminCreateUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: email,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'email_verified', Value: 'true' },
      { Name: 'name', Value: name },
      { Name: 'custom:role', Value: role },
    ],
    TemporaryPassword: temporaryPassword,
    MessageAction: 'SUPPRESS', // Don't send welcome email
  });

  await client.send(command);

  // Set permanent password
  const setPasswordCommand = new AdminSetUserPasswordCommand({
    UserPoolId: USER_POOL_ID,
    Username: email,
    Password: temporaryPassword,
    Permanent: true,
  });

  await client.send(setPasswordCommand);
}

/**
 * Admin: Update user role (custom:role attribute)
 */
export async function adminUpdateUserRole(
  email: string,
  newRole: string
): Promise<void> {
  const command = new AdminUpdateUserAttributesCommand({
    UserPoolId: USER_POOL_ID,
    Username: email,
    UserAttributes: [
      { Name: 'custom:role', Value: newRole },
    ],
  });

  await client.send(command);
}

/**
 * Admin: Get user details including custom attributes
 */
export async function adminGetUser(email: string): Promise<any> {
  const command = new AdminGetUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: email,
  });

  const response = await client.send(command);
  
  // Convert attributes to object
  const attributes: Record<string, string> = {};
  response.UserAttributes?.forEach((attr) => {
    if (attr.Name && attr.Value) {
      attributes[attr.Name] = attr.Value;
    }
  });

  return {
    username: response.Username,
    email: attributes.email,
    name: attributes.name,
    role: attributes['custom:role'] || 'user',
    emailVerified: attributes.email_verified === 'true',
    createdAt: response.UserCreateDate,
    lastModifiedAt: response.UserLastModifiedDate,
    status: response.UserStatus,
  };
}

/**
 * Handle Google sign in - create or get existing user
 */
export async function handleGoogleSignIn(
  googleUser: {
    email: string;
    name: string;
    picture?: string;
    sub: string;
  },
  idToken: string
): Promise<SignInOutput> {
  try {
    // First try to sign in (user might already exist)
    return await signIn({
      email: googleUser.email,
      password: `google_${googleUser.sub}`, // Not used for actual auth
    });
  } catch (error) {
    // User doesn't exist, create them
    const tempPassword = `google_${googleUser.sub}_${Date.now()}`;
    
    await adminCreateUser(
      googleUser.email,
      googleUser.name,
      tempPassword,
      'user'
    );

    // Now sign in
    return await signIn({
      email: googleUser.email,
      password: tempPassword,
    });
  }
}
