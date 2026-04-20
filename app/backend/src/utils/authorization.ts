import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export interface AuthUser {
  userId: string;
  email: string;
  name?: string;
  role: string;
  groups: string[];
}

/**
 * Extract user information from Cognito Authorizer claims
 */
export function getUserFromToken(event: APIGatewayProxyEvent): AuthUser | null {
  const claims = event.requestContext.authorizer?.claims;
  
  if (!claims || !claims.sub) {
    return null;
  }

  // Parse cognito:groups - can be an array or a string representation of array
  let groups: string[] = [];
  const rawGroups = claims['cognito:groups'];
  
  if (rawGroups) {
    if (Array.isArray(rawGroups)) {
      groups = rawGroups;
    } else if (typeof rawGroups === 'string') {
      // Sometimes Cognito sends groups as a string like "[admin, editor]" or JSON array
      const trimmed = rawGroups.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          groups = JSON.parse(trimmed);
        } catch {
          // Fallback: split by comma
          groups = trimmed
            .slice(1, -1)
            .split(',')
            .map((g: string) => g.trim().replace(/^"|"$/g, ''))
            .filter(Boolean);
        }
      } else {
        groups = [trimmed];
      }
    }
  }

  // Determine role: prefer cognito:groups, then custom:role, default to 'user'
  const role = groups.length > 0 
    ? groups[0] 
    : (claims['custom:role'] || 'user');

  return {
    userId: claims.sub,
    email: claims.email || '',
    name: claims.name || claims.email || '',
    role,
    groups,
  };
}

/**
 * Get user ID from token, with optional fallback for local testing
 */
export function getUserId(event: APIGatewayProxyEvent): string {
  const user = getUserFromToken(event);
  if (user) {
    return user.userId;
  }

  // Local test fallback - ONLY for development without authorizer
  // NEVER enable in production - security risk
  const isLocalDev = process.env.NODE_ENV === 'development' || process.env.AWS_SAM_LOCAL === 'true';
  if (isLocalDev) {
    const mockUserId = event.headers['x-mock-user-id'] || event.queryStringParameters?.userId;
    if (mockUserId) {
      return mockUserId;
    }
  }

  return 'guest';
}

/**
 * Require authentication - returns user or throws an error response
 */
export function requireAuth(event: APIGatewayProxyEvent): AuthUser {
  const user = getUserFromToken(event);
  
  if (!user) {
    // NEVER allow mock headers in production - major security risk
    const isLocalDev = process.env.NODE_ENV === 'development' || process.env.AWS_SAM_LOCAL === 'true';
    if (isLocalDev) {
      const mockUserId = event.headers['x-mock-user-id'];
      const mockEmail = event.headers['x-mock-user-email'];
      
      if (mockUserId && mockEmail) {
        return {
          userId: mockUserId,
          email: mockEmail,
          name: event.headers['x-mock-user-name'] || mockEmail,
          role: event.headers['x-mock-user-role'] || 'user',
          groups: [],
        };
      }
    }
    
    throw new Error('UNAUTHORIZED');
  }

  return user;
}

/**
 * Check if user has required role
 */
export function requireRole(event: APIGatewayProxyEvent, allowedRoles: string[]): AuthUser {
  const user = requireAuth(event);
  
  const userRoles = [user.role, ...user.groups];
  const hasRole = userRoles.some(role => allowedRoles.includes(role));
  
  if (!hasRole) {
    throw new Error('FORBIDDEN');
  }

  return user;
}

/**
 * Check if user is admin or super_admin
 */
export function requireAdmin(event: APIGatewayProxyEvent): AuthUser {
  return requireRole(event, ['admin', 'super_admin']);
}

/**
 * Check if user has staff privileges (admin, super_admin, editor, support)
 */
export function requireStaff(event: APIGatewayProxyEvent): AuthUser {
  return requireRole(event, ['admin', 'super_admin', 'editor', 'support']);
}

/**
 * Create standardized unauthorized response
 */
export function unauthorizedResponse(message = 'Authentication required'): APIGatewayProxyResult {
  return {
    statusCode: 401,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '',
    },
    body: JSON.stringify({ error: message, timestamp: new Date().toISOString() }),
  };
}

/**
 * Check if user is super_admin
 */
export function isSuperAdmin(event: APIGatewayProxyEvent): boolean {
  const user = getUserFromToken(event);
  if (!user) return false;
  const userRoles = [user.role, ...user.groups];
  return userRoles.includes('super_admin');
}

/**
 * Legacy admin access check returning detailed result object
 */
export function checkAdminAccess(event: APIGatewayProxyEvent): { allowed: boolean; reason?: string } {
  const user = getUserFromToken(event);
  
  if (!user) {
    return { allowed: false, reason: 'Authentication required' };
  }
  
  const userRoles = [user.role, ...user.groups];
  const isAdmin = userRoles.some(role => ['admin', 'super_admin'].includes(role));
  
  if (!isAdmin) {
    return { allowed: false, reason: 'Admin access required' };
  }
  
  return { allowed: true };
}

/**
 * Check if user is super_admin (legacy boolean return)
 */
export function checkSuperAdmin(event: APIGatewayProxyEvent): boolean {
  return isSuperAdmin(event);
}

/**
 * Create standardized forbidden response
 */
export function forbiddenResponse(message = 'Insufficient permissions'): APIGatewayProxyResult {
  return {
    statusCode: 403,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '',
    },
    body: JSON.stringify({ error: message, timestamp: new Date().toISOString() }),
  };
}
