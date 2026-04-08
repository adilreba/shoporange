/**
 * Frontend Security Utilities
 * Password hashing and validation (bcryptjs for mock mode)
 */

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash password using bcryptjs
 * Used in mock mode for realistic password handling
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
 * Verify password using bcryptjs
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
 */
export function isBcryptHash(hash: string): boolean {
  return /^\$2[aby]\$/.test(hash);
}

/**
 * Legacy password verification (for migration support)
 * Supports both old pbkdf2 format and new bcrypt format
 */
export async function verifyPasswordLegacy(password: string, hashedPassword: string): Promise<boolean> {
  // Check if it's a bcrypt hash
  if (isBcryptHash(hashedPassword)) {
    return verifyPassword(password, hashedPassword);
  }
  
  // Legacy pbkdf2 format (salt:hash)
  const [salt, hash] = hashedPassword.split(':');
  if (!salt || !hash) return false;
  
  // Simple hash comparison for legacy (not secure, only for migration)
  // In real scenario, we'd use the same pbkdf2 algorithm
  return false; // Force password reset for legacy users
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
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
    errors.push('En az bir özel karakter içermelidir (!@#$%^&* gibi)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check password strength
 * Legacy compatibility - delegates to validatePasswordStrength
 */
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
  isValid: boolean;
  valid: boolean; // Legacy compatibility
} {
  const validation = validatePasswordStrength(password);
  const isValid = validation.isValid;
  return {
    score: isValid ? 4 : validation.errors.length > 2 ? 1 : 2,
    feedback: validation.errors,
    isValid: isValid,
    valid: isValid, // Legacy compatibility alias
  };
}

/**
 * Client-side rate limiter for auth operations
 */
export class ClientRateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();

  /**
   * Check if an attempt is allowed (legacy compatibility)
   * @param identifier Unique identifier (e.g., 'login', 'register')
   * @param maxAttempts Maximum allowed attempts
   * @param windowMs Time window in milliseconds
   */
  check(identifier: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record || now > record.resetTime) {
      // Reset window
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (record.count >= maxAttempts) {
      return false;
    }

    record.count++;
    return true;
  }

  /**
   * Legacy compatibility - same as check()
   */
  canAttempt(identifier: string, maxAttempts?: number, windowMs?: number): boolean {
    return this.check(identifier, maxAttempts, windowMs);
  }
}

/**
 * Mask sensitive data in logs
 */
export function maskSensitiveData(data: string, type: 'email' | 'phone' | 'card'): string {
  switch (type) {
    case 'email':
      if (!data || !data.includes('@')) return data;
      const [local, domain] = data.split('@');
      return `${local[0]}***@${domain}`;
    
    case 'phone':
      if (!data) return data;
      const digits = data.replace(/\D/g, '');
      if (digits.length < 4) return data;
      return `***${digits.slice(-4)}`;
    
    case 'card':
      if (!data) return data;
      const cardDigits = data.replace(/\D/g, '');
      if (cardDigits.length < 4) return data;
      return `**** **** **** ${cardDigits.slice(-4)}`;
    
    default:
      return data;
  }
}
