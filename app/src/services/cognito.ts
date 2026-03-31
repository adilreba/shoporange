import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
  CognitoRefreshToken,
} from 'amazon-cognito-identity-js';

// Cognito configuration from environment variables
const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
};

const userPool = new CognitoUserPool(poolData);

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number; // Timestamp when access token expires
}

export interface UserData {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  createdAt?: string;
}

export interface SignInResult {
  user: UserData;
  tokens: AuthTokens;
}

/**
 * Get current authenticated user from local storage
 */
export function getCurrentUser(): CognitoUser | null {
  return userPool.getCurrentUser();
}

/**
 * Sign up a new user
 */
export function signUp(data: SignUpData): Promise<{ userSub: string }> {
  return new Promise((resolve, reject) => {
    const attributeList: CognitoUserAttribute[] = [
      new CognitoUserAttribute({ Name: 'email', Value: data.email }),
      new CognitoUserAttribute({ Name: 'name', Value: data.name }),
      ...(data.phone ? [new CognitoUserAttribute({ Name: 'phone_number', Value: data.phone })] : []),
      new CognitoUserAttribute({ Name: 'custom:role', Value: 'user' }),
    ];

    userPool.signUp(data.email, data.password, attributeList, [], (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ userSub: result?.userSub || '' });
    });
  });
}

/**
 * Confirm sign up with verification code
 */
export function confirmSignUp(email: string, code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.confirmRegistration(code, true, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

/**
 * Resend confirmation code
 */
export function resendConfirmationCode(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.resendConfirmationCode((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

/**
 * Parse user data from Cognito attributes
 */
function parseUserData(_cognitoUser: CognitoUser, session: CognitoUserSession): UserData {
  const idToken = session.getIdToken();
  const payload = idToken.payload;

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    phone: payload.phone_number,
    role: payload['custom:role'] || 'user',
  };
}

/**
 * Extract tokens from session
 */
function extractTokens(session: CognitoUserSession): AuthTokens {
  const accessToken = session.getAccessToken();
  const idToken = session.getIdToken();
  const refreshToken = session.getRefreshToken();

  // Calculate expiration time
  const expiresIn = accessToken.getExpiration() - Math.floor(Date.now() / 1000);

  return {
    accessToken: accessToken.getJwtToken(),
    idToken: idToken.getJwtToken(),
    refreshToken: refreshToken.getToken(),
    expiresAt: Date.now() + expiresIn * 1000,
  };
}

/**
 * Sign in user
 */
export function signIn(data: SignInData): Promise<SignInResult> {
  return new Promise((resolve, reject) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: data.email,
      Password: data.password,
    });

    const cognitoUser = new CognitoUser({
      Username: data.email,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (session) => {
        const user = parseUserData(cognitoUser, session);
        const tokens = extractTokens(session);
        resolve({ user, tokens });
      },
      onFailure: (err) => {
        reject(err);
      },
      newPasswordRequired: () => {
        reject(new Error('New password required'));
      },
    });
  });
}

/**
 * Sign out user
 */
export function signOut(): Promise<void> {
  return new Promise((resolve) => {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut(() => {
        resolve();
      });
    } else {
      resolve();
    }
  });
}

/**
 * Global sign out (invalidates all tokens)
 */
export function globalSignOut(): Promise<void> {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.globalSignOut({
        onSuccess: () => resolve(),
        onFailure: (err) => reject(err),
      });
    } else {
      resolve();
    }
  });
}

/**
 * Get current session
 */
export function getCurrentSession(): Promise<{ user: UserData; tokens: AuthTokens } | null> {
  return new Promise((resolve) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      resolve(null);
      return;
    }

    cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session || !session.isValid()) {
        resolve(null);
        return;
      }

      const user = parseUserData(cognitoUser, session);
      const tokens = extractTokens(session);
      resolve({ user, tokens });
    });
  });
}

/**
 * Refresh tokens using refresh token
 */
export function refreshSession(refreshToken: string): Promise<AuthTokens> {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      reject(new Error('No current user'));
      return;
    }

    const RefreshToken = new CognitoRefreshToken({ RefreshToken: refreshToken });

    cognitoUser.refreshSession(RefreshToken, (err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session) {
        reject(err || new Error('Failed to refresh session'));
        return;
      }

      resolve(extractTokens(session));
    });
  });
}

/**
 * Forgot password - send reset code
 */
export function forgotPassword(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.forgotPassword({
      onSuccess: () => resolve(),
      onFailure: (err) => reject(err),
    });
  });
}

/**
 * Confirm forgot password - reset with code
 */
export function confirmForgotPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.confirmPassword(code, newPassword, {
      onSuccess: () => resolve(),
      onFailure: (err) => reject(err),
    });
  });
}

/**
 * Change password for logged in user
 */
export function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      reject(new Error('No current user'));
      return;
    }

    cognitoUser.changePassword(oldPassword, newPassword, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

/**
 * Get access token for API calls
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getCurrentSession();
  return session?.tokens.accessToken || null;
}

/**
 * Get ID token for API calls
 */
export async function getIdToken(): Promise<string | null> {
  const session = await getCurrentSession();
  return session?.tokens.idToken || null;
}

/**
 * Check if token needs refresh (expires in less than 5 minutes)
 */
export function needsTokenRefresh(tokens: AuthTokens): boolean {
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() + fiveMinutes >= tokens.expiresAt;
}

/**
 * Complete new password challenge (for admin-created users)
 */
export function completeNewPasswordChallenge(
  email: string,
  tempPassword: string,
  newPassword: string,
  userAttributes: Record<string, string> = {}
): Promise<SignInResult> {
  return new Promise((resolve, reject) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: tempPassword,
    });

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (session) => {
        const user = parseUserData(cognitoUser, session);
        const tokens = extractTokens(session);
        resolve({ user, tokens });
      },
      onFailure: (err) => {
        reject(err);
      },
      newPasswordRequired: () => {
        cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, {
          onSuccess: (session) => {
            const user = parseUserData(cognitoUser, session);
            const tokens = extractTokens(session);
            resolve({ user, tokens });
          },
          onFailure: (err) => {
            reject(err);
          },
        });
      },
    });
  });
}
