/**
 * Security Utilities
 * IP extraction, security headers, and request validation
 * Updated: bcrypt for password hashing
 */

import bcrypt from 'bcrypt';
import { APIGatewayProxyEvent } from 'aws-lambda';

export interface PasswordStrengthResult {
  isValid: boolean;
  valid: boolean; // Legacy alias
  errors: string[];
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Şifre en az 8 karakter olmalıdır');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('En az bir büyük harf içermelidir');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('En az bir küçük harf içermelidir');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('En az bir rakam içermelidir');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('En az bir özel karakter içermelidir');
  }
  
  return {
    isValid: errors.length === 0,
    valid: errors.length === 0, // Legacy compatibility
    errors,
  };
}

/**
 * SQL Injection detection
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(\b(OR|AND)\b.*=.*)/i,
    /(--|#|\/\*)/,
    /(\bUNION\b.*\bSELECT\b)/i,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Log security event (legacy compatibility)
 * Supports multiple signatures for backward compatibility
 */
export async function logSecurityEvent(
  eventOrType: string | {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    details?: Record<string, any>;
  },
  details?: Record<string, any>,
  severity?: 'low' | 'medium' | 'high' | 'critical'
): Promise<void> {
  // Handle string signature: logSecurityEvent('TYPE', { details }, 'medium')
  if (typeof eventOrType === 'string') {
    console.log(JSON.stringify({
      _logType: 'SECURITY_EVENT',
      timestamp: new Date().toISOString(),
      type: eventOrType,
      details: details || {},
      severity: severity || 'medium',
    }));
    return;
  }
  
  // Handle object signature
  console.log(JSON.stringify({
    _logType: 'SECURITY_EVENT',
    timestamp: new Date().toISOString(),
    ...eventOrType,
  }));
}

/**
 * Extract client IP from various sources
 */
export function getClientIP(event: APIGatewayProxyEvent): string {
  return (
    event.headers?.['X-Forwarded-For']?.split(',')[0]?.trim() ||
    event.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    event.requestContext?.identity?.sourceIp ||
    'unknown'
  );
}

/**
 * Security headers for all responses
 */
// CORS origin: Environment variable'dan al, yoksa guvenlik icin '*' kullanma
const CORS_ORIGIN = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '';

export const securityHeaders = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': "default-src 'self'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  // GUVENLIK: CORS_ORIGIN env var'i bos ise istek reddedilmeli
  'Access-Control-Allow-Origin': CORS_ORIGIN || '',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format (basic)
 */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Sanitize string input (basic XSS prevention)
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

/**
 * ⚠️ DEPRECATED: This in-memory rate limiter does NOT work in AWS Lambda.
 * Lambda is stateless - each invocation gets a fresh process.
 * Use API Gateway throttling (already configured: Burst 100, Rate 50)
 * or implement DynamoDB/Redis-based rate limiting for Lambda-level protection.
 * 
 * For brute-force protection on auth endpoints, use WAF or Cognito native rate limiting.
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  console.warn('[DEPRECATED] checkRateLimit() uses in-memory store and is ineffective in Lambda. Use API Gateway throttling or DynamoDB-based rate limiting.');
  
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Generate cryptographically secure random token
 * Uses crypto.randomBytes for security (NOT Math.random)
 */
import { randomBytes } from 'crypto';

export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('base64url');
}

// Bcrypt configuration
const SALT_ROUNDS = 12; // Industry standard (10-12 rounds)

/**
 * Hash password using bcrypt
 * Industry-standard password hashing with automatic salt
 * @param password Plain text password
 * @returns Bcrypt hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify password using bcrypt
 * @param password Plain text password
 * @param hashedPassword Bcrypt hashed password
 * @returns boolean indicating if password matches
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Check if a password hash is using bcrypt format
 * bcrypt hashes start with $2a$, $2b$, or $2y$
 */
export function isBcryptHash(hash: string): boolean {
  return /^\$2[aby]\$/.test(hash);
}

/**
 * Legacy password verification (for migration)
 * Supports both old pbkdf2 format and new bcrypt format
 */
export async function verifyPasswordLegacy(password: string, hashedPassword: string): Promise<boolean> {
  // Check if it's a bcrypt hash
  if (isBcryptHash(hashedPassword)) {
    return verifyPassword(password, hashedPassword);
  }
  
  // Legacy pbkdf2 format (salt:hash)
  const crypto = await import('crypto');
  const [salt, hash] = hashedPassword.split(':');
  if (!salt || !hash) return false;
  
  const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}
