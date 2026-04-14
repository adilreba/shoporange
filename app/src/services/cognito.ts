import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
  CognitoRefreshToken,
} from 'amazon-cognito-identity-js';

// Mock mode kontrolü
const FORCE_MOCK_MODE = import.meta.env.VITE_FORCE_MOCK_MODE === 'true';
const isMockMode = () => {
  if (FORCE_MOCK_MODE) return true;
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || envUrl === '') return true;
  if (envUrl.includes('your-api-gateway-url')) return true;
  return false;
};

// Cognito configuration - sadece mock mode değilse initialize et
const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
};

// Lazy initialization - sadece gerektiğinde oluştur
let userPoolInstance: CognitoUserPool | null = null;
const getUserPool = () => {
  if (isMockMode()) return null;
  if (!userPoolInstance) {
    userPoolInstance = new CognitoUserPool(poolData);
  }
  return userPoolInstance;
};

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
  if (isMockMode()) return null;
  const pool = getUserPool();
  return pool ? pool.getCurrentUser() : null;
}

/**
 * Sign up a new user
 */
export function signUp(data: SignUpData): Promise<{ userSub: string }> {
  return new Promise((resolve, reject) => {
    if (isMockMode()) {
      reject(new Error('Mock mode - Cognito not available'));
      return;
    }
    
    const pool = getUserPool();
    if (!pool) {
      reject(new Error('Cognito not initialized'));
      return;
    }
    
    const attributeList: CognitoUserAttribute[] = [
      new CognitoUserAttribute({ Name: 'email', Value: data.email }),
      new CognitoUserAttribute({ Name: 'name', Value: data.name }),
      ...(data.phone ? [new CognitoUserAttribute({ Name: 'phone_number', Value: data.phone })] : []),
      new CognitoUserAttribute({ Name: 'custom:role', Value: 'user' }),
    ];

    pool.signUp(data.email, data.password, attributeList, [], (err, result) => {
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
    if (isMockMode()) {
      resolve();
      return;
    }
    
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: getUserPool()!,
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
    if (isMockMode()) {
      resolve();
      return;
    }
    
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: getUserPool()!,
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

  // Prefer cognito:groups over custom:role for RBAC
  const groups = payload['cognito:groups'];
  const role = Array.isArray(groups) && groups.length > 0
    ? groups[0]
    : (payload['custom:role'] || 'user');

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    phone: payload.phone_number,
    role,
    createdAt: payload['custom:created_at'] || new Date().toISOString(),
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
    if (isMockMode()) {
      reject(new Error('Mock mode - Cognito not available'));
      return;
    }
    
    const authenticationDetails = new AuthenticationDetails({
      Username: data.email,
      Password: data.password,
    });

    const cognitoUser = new CognitoUser({
      Username: data.email,
      Pool: getUserPool()!,
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
    if (isMockMode()) {
      resolve();
      return;
    }
    
    const cognitoUser = getUserPool()?.getCurrentUser();
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
    if (isMockMode()) {
      resolve();
      return;
    }
    
    const cognitoUser = getUserPool()?.getCurrentUser();
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
    if (isMockMode()) {
      resolve(null);
      return;
    }
    
    const cognitoUser = getUserPool()?.getCurrentUser();
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
    if (isMockMode()) {
      reject(new Error('Mock mode'));
      return;
    }
    
    const cognitoUser = getUserPool()?.getCurrentUser();
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
    if (isMockMode()) {
      resolve();
      return;
    }
    
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: getUserPool()!,
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
    if (isMockMode()) {
      resolve();
      return;
    }
    
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: getUserPool()!,
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
    if (isMockMode()) {
      resolve();
      return;
    }
    
    const cognitoUser = getUserPool()?.getCurrentUser();
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
  if (isMockMode()) return 'mock_token';
  const session = await getCurrentSession();
  return session?.tokens.accessToken || null;
}

/**
 * Get ID token for API calls
 */
export async function getIdToken(): Promise<string | null> {
  if (isMockMode()) return 'mock_token';
  const session = await getCurrentSession();
  return session?.tokens.idToken || null;
}

/**
 * Check if token needs refresh (expires in less than 5 minutes)
 */
export function needsTokenRefresh(tokens: AuthTokens): boolean {
  if (isMockMode()) return false;
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
    if (isMockMode()) {
      reject(new Error('Mock mode'));
      return;
    }
    
    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: tempPassword,
    });

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: getUserPool()!,
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
