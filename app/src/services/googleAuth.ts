import type { UserData, AuthTokens } from './cognito';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export interface GoogleUser {
  email: string;
  name: string;
  picture?: string;
  sub: string;
}

export interface GoogleSignInResult {
  user: UserData;
  tokens: AuthTokens;
}

/**
 * Initialize Google Identity Services
 */
export function initGoogleAuth(): void {
  if (!GOOGLE_CLIENT_ID) {
    console.warn('Google Client ID not configured');
    return;
  }

  // Load Google Identity Services script if not already loaded
  if (!document.getElementById('google-identity-script')) {
    const script = document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }
}

/**
 * Parse JWT token from Google
 */
function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
}

/**
 * Sign in with Google credential
 * This exchanges the Google ID token for our app's tokens via backend
 */
export async function signInWithGoogle(credential: string): Promise<GoogleSignInResult> {
  const googlePayload = parseJwt(credential);
  
  if (!googlePayload) {
    throw new Error('Invalid Google credential');
  }

  const googleUser: GoogleUser = {
    email: googlePayload.email,
    name: googlePayload.name,
    picture: googlePayload.picture,
    sub: googlePayload.sub,
  };

  // Send to backend to create/get user and get tokens
  const API_URL = import.meta.env.VITE_API_URL || '';
  const response = await fetch(`${API_URL}/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token: credential,
      user: googleUser,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Google login failed');
  }

  const data = await response.json();

  return {
    user: data.user,
    tokens: {
      accessToken: data.accessToken,
      idToken: data.token, // Backend returns idToken as 'token'
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + (data.expiresIn * 1000),
    },
  };
}

/**
 * Get Google Client ID
 */
export function getGoogleClientId(): string {
  return GOOGLE_CLIENT_ID;
}

/**
 * Check if Google Auth is configured
 */
export function isGoogleAuthConfigured(): boolean {
  return !!GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your-google-client-id.apps.googleusercontent.com';
}
