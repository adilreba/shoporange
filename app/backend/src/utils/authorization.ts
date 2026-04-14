import { APIGatewayProxyEvent } from 'aws-lambda';

export interface DecodedToken {
  sub: string;
  email?: string;
  'cognito:groups'?: string[];
  'custom:role'?: string;
  exp?: number;
  iss?: string;
}

/**
 * Decode a Cognito JWT ID token without verification.
 * In API Gateway with Cognito Authorizer, the token is already verified.
 * This is used inside Lambda to read group/role claims.
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
    return JSON.parse(payload) as DecodedToken;
  } catch (error) {
    console.error('[decodeToken] Failed to decode token:', error);
    return null;
  }
}

export function getTokenFromEvent(event: APIGatewayProxyEvent): string | null {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.substring(7);
}

export function getUserGroups(event: APIGatewayProxyEvent): string[] {
  const token = getTokenFromEvent(event);
  if (!token) return [];
  const decoded = decodeToken(token);
  return decoded?.['cognito:groups'] || [];
}

export function getUserRole(event: APIGatewayProxyEvent): string | null {
  const token = getTokenFromEvent(event);
  if (!token) return null;
  const decoded = decodeToken(token);
  return decoded?.['custom:role'] || null;
}

export function isInGroup(event: APIGatewayProxyEvent, group: string): boolean {
  return getUserGroups(event).includes(group);
}

export function isSuperAdmin(event: APIGatewayProxyEvent): boolean {
  return isInGroup(event, 'super_admin');
}

export function isAdmin(event: APIGatewayProxyEvent): boolean {
  return isInGroup(event, 'admin') || isSuperAdmin(event);
}

export function isStaff(event: APIGatewayProxyEvent): boolean {
  const groups = getUserGroups(event);
  return groups.includes('super_admin') || groups.includes('admin') || groups.includes('editor') || groups.includes('support');
}

// Map admin API paths to required groups
const PATH_GROUP_REQUIREMENTS: Record<string, string[]> = {
  // Super admin only
  '/admin/seed': ['super_admin'],
  '/admin/users': ['super_admin', 'admin'],
  '/admin/audit-logs': ['super_admin'],
  '/admin/parasut': ['super_admin', 'admin'],
  '/admin/payment-methods': ['super_admin', 'admin'],
  '/admin/settings': ['super_admin', 'admin'],
  '/admin/shipping': ['super_admin', 'admin'],
  '/admin/invoices': ['super_admin', 'admin'],
  '/admin/coupons': ['super_admin', 'admin'],
  '/admin/campaigns': ['super_admin', 'admin', 'editor'],
  '/admin/categories': ['super_admin', 'admin', 'editor'],
  '/admin/legal-pages': ['super_admin', 'admin', 'editor'],
  '/admin/support': ['super_admin', 'admin', 'support'],
  '/admin/products': ['super_admin', 'admin', 'editor'],
  '/admin/orders': ['super_admin', 'admin', 'support'],
  '/admin/stock': ['super_admin', 'admin', 'editor'],
  '/admin/images/upload-url': ['super_admin', 'admin', 'editor'],
};

export function checkAdminAccess(event: APIGatewayProxyEvent): { allowed: boolean; reason?: string } {
  const token = getTokenFromEvent(event);
  if (!token) {
    return { allowed: false, reason: 'Missing authentication token' };
  }

  const decoded = decodeToken(token);
  if (!decoded) {
    return { allowed: false, reason: 'Invalid token' };
  }

  // Check token expiration
  if (decoded.exp && decoded.exp * 1000 < Date.now()) {
    return { allowed: false, reason: 'Token expired' };
  }

  const groups = decoded['cognito:groups'] || [];

  // Super admin bypass
  if (groups.includes('super_admin')) {
    return { allowed: true };
  }

  const path = event.path;
  const method = event.httpMethod;

  // Find matching path pattern
  for (const [pathPattern, requiredGroups] of Object.entries(PATH_GROUP_REQUIREMENTS)) {
    if (path === pathPattern || path.endsWith(pathPattern) || (pathPattern !== '/' && path.includes(pathPattern))) {
      const hasAccess = requiredGroups.some(g => groups.includes(g));
      if (!hasAccess) {
        return { allowed: false, reason: `Access denied. Required groups: ${requiredGroups.join(', ')}` };
      }
      return { allowed: true };
    }
  }

  // For unknown admin paths, default to admin/super_admin only
  if (path.startsWith('/admin')) {
    const isAdminOrHigher = groups.includes('admin');
    if (!isAdminOrHigher) {
      return { allowed: false, reason: 'Admin access required' };
    }
  }

  return { allowed: true };
}
