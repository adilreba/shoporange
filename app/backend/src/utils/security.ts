/**
 * ENTERPRISE SECURITY MODULE
 * Amazon/Trendyol level security implementations
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Security Headers - HTTP Strict Transport Security, CSP, etc.
export const securityHeaders = {
  // HTTPS zorunlu - 2 yıl
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  
  // Content Security Policy - XSS koruması
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
  
  // Clickjacking koruması
  'X-Frame-Options': 'DENY',
  
  // MIME sniffing koruması
  'X-Content-Type-Options': 'nosniff',
  
  // XSS koruması
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// Input sanitization
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .trim();
}

// Rate limiting - In memory (Production'da Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const current = rateLimitMap.get(identifier);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  if (current.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  current.count++;
  return { allowed: true, remaining: maxRequests - current.count };
}

// SQL Injection detection
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|WHERE|FROM|TABLE)\b/i,
    /(--|#|\/\*)/,
    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,
  ];
  return sqlPatterns.some(pattern => pattern.test(input));
}

// Password strength
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) errors.push('En az 8 karakter');
  if (!/[A-Z]/.test(password)) errors.push('Büyük harf');
  if (!/[a-z]/.test(password)) errors.push('Küçük harf');
  if (!/[0-9]/.test(password)) errors.push('Rakam');
  if (!/[!@#$%^&*]/.test(password)) errors.push('Özel karakter');
  
  return { valid: errors.length === 0, errors };
}

// Get client IP from event
export function getClientIP(event: APIGatewayProxyEvent): string {
  return event.requestContext?.identity?.sourceIp || 
         event.headers?.['X-Forwarded-For']?.split(',')[0]?.trim() || 
         'unknown';
}

// Log security event
export function logSecurityEvent(
  event: string,
  details: Record<string, any>,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
): void {
  console.log(`[SECURITY EVENT] [${severity.toUpperCase()}] ${event}:`, JSON.stringify({
    timestamp: new Date().toISOString(),
    severity,
    ...details
  }));
}

// Secure response
export function createSecureResponse(
  statusCode: number,
  body: any
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: securityHeaders,
    body: JSON.stringify(body),
  };
}
