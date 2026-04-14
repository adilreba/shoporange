/**
 * AWS KMS Encryption Utilities
 * PII encryption at rest for GDPR/HIPAA compliance
 */

import { KMSClient, EncryptCommand, DecryptCommand, GenerateDataKeyCommand } from '@aws-sdk/client-kms';

// KMS Client
const kms = new KMSClient({ region: process.env.AWS_REGION || 'eu-west-1' });
const KMS_KEY_ID = process.env.KMS_KEY_ID;

// Field-level encryption configuration
const ENCRYPTED_FIELD_MARKER = '__ENC__';

/**
 * Encrypt a single field value using KMS
 */
export async function encryptField(
  plaintext: string,
  context: Record<string, string>
): Promise<string> {
  if (!KMS_KEY_ID) {
    console.error('KMS_KEY_ID not configured');
    throw new Error('Encryption service unavailable');
  }

  if (!plaintext) return plaintext;

  try {
    const command = new EncryptCommand({
      KeyId: KMS_KEY_ID,
      Plaintext: Buffer.from(plaintext, 'utf-8'),
      EncryptionContext: context,
    });

    const result = await kms.send(command);
    const encrypted = Buffer.from(result.CiphertextBlob!).toString('base64');
    
    return `${ENCRYPTED_FIELD_MARKER}${encrypted}`;
  } catch (error) {
    console.error('KMS encryption error:', error);
    throw new Error('Failed to encrypt sensitive data');
  }
}

/**
 * Decrypt a single field value using KMS
 */
export async function decryptField(
  encrypted: string,
  context: Record<string, string>
): Promise<string> {
  if (!encrypted || !encrypted.startsWith(ENCRYPTED_FIELD_MARKER)) {
    return encrypted;
  }

  const ciphertext = encrypted.slice(ENCRYPTED_FIELD_MARKER.length);

  try {
    const command = new DecryptCommand({
      CiphertextBlob: Buffer.from(ciphertext, 'base64'),
      EncryptionContext: context,
    });

    const result = await kms.send(command);
    return Buffer.from(result.Plaintext!).toString('utf-8');
  } catch (error) {
    console.error('KMS decryption error:', error);
    throw new Error('Failed to decrypt sensitive data');
  }
}

/**
 * Encrypt object fields recursively
 */
export async function encryptObjectFields<T extends Record<string, any>>(
  obj: T,
  fieldsToEncrypt: string[],
  context: Record<string, string> = { service: 'orders', purpose: 'pii-protection' }
): Promise<T> {
  const encrypted: Record<string, any> = { ...obj };

  for (const field of fieldsToEncrypt) {
    if (obj[field]) {
      if (typeof obj[field] === 'object') {
        // Recursively encrypt nested objects
        encrypted[field] = await encryptObjectFields(
          obj[field],
          Object.keys(obj[field]),
          context
        );
      } else if (typeof obj[field] === 'string') {
        encrypted[field] = await encryptField(obj[field], context);
      }
    }
  }

  return encrypted as T;
}

/**
 * Decrypt object fields recursively
 */
export async function decryptObjectFields<T extends Record<string, any>>(
  obj: T,
  fieldsToDecrypt: string[],
  context: Record<string, string> = { service: 'orders', purpose: 'pii-protection' }
): Promise<T> {
  const decrypted: Record<string, any> = { ...obj };

  for (const field of fieldsToDecrypt) {
    if (obj[field]) {
      if (typeof obj[field] === 'object') {
        // Recursively decrypt nested objects
        decrypted[field] = await decryptObjectFields(
          obj[field],
          Object.keys(obj[field]),
          context
        );
      } else if (typeof obj[field] === 'string') {
        decrypted[field] = await decryptField(obj[field], context);
      }
    }
  }

  return decrypted as T;
}

/**
 * Generate data key for envelope encryption (useful for large data)
 */
export async function generateDataKey(): Promise<{
  ciphertext: string;
  plaintext: Buffer;
}> {
  if (!KMS_KEY_ID) {
    throw new Error('KMS_KEY_ID not configured');
  }

  const command = new GenerateDataKeyCommand({
    KeyId: KMS_KEY_ID,
    KeySpec: 'AES_256',
  });

  const result = await kms.send(command);
  return {
    ciphertext: Buffer.from(result.CiphertextBlob!).toString('base64'),
    plaintext: Buffer.from(result.Plaintext!),
  };
}

/**
 * Check if a value is encrypted
 */
export function isEncrypted(value: string): boolean {
  return typeof value === 'string' && value.startsWith(ENCRYPTED_FIELD_MARKER);
}

/**
 * Mask sensitive data for logging/display
 */
export function maskSensitiveData<T extends Record<string, any>>(
  obj: T,
  fieldsToMask: string[]
): T {
  const masked: Record<string, any> = { ...obj };

  for (const field of fieldsToMask) {
    if (obj[field]) {
      if (typeof obj[field] === 'string') {
        if (field === 'email') {
          masked[field] = maskEmail(obj[field]);
        } else if (field === 'phone') {
          masked[field] = maskPhone(obj[field]);
        } else if (field === 'creditCard') {
          masked[field] = maskCreditCard(obj[field]);
        } else {
          masked[field] = '***';
        }
      }
    }
  }

  return masked as T;
}

/**
 * Mask email address
 * example: user@example.com -> u***@example.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  const maskedLocal = local[0] + '***';
  return `${maskedLocal}@${domain}`;
}

/**
 * Mask phone number
 * example: +90 555 123 45 67 -> +90 *** ** ** 67
 */
export function maskPhone(phone: string): string {
  if (!phone) return phone;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return phone;
  
  const last4 = digits.slice(-4);
  const countryCode = phone.startsWith('+') ? phone.split(' ')[0] : '';
  return `${countryCode} *** ** ** ${last4}`;
}

/**
 * Mask credit card number
 * example: 4532 **** **** 1234
 */
export function maskCreditCard(card: string): string {
  if (!card) return card;
  const digits = card.replace(/\D/g, '');
  if (digits.length < 4) return card;
  
  const last4 = digits.slice(-4);
  return `**** **** **** ${last4}`;
}

/**
 * Hash sensitive data (one-way, for comparison/anonymization)
 */
export async function hashSensitiveData(
  data: string,
  salt?: string
): Promise<string> {
  const crypto = await import('crypto');
  const hash = crypto.createHash('sha256');
  hash.update(data + (salt || process.env.HASH_SALT || 'default_salt'));
  return hash.digest('hex');
}

/**
 * Legacy compatibility exports
 */
export async function encryptSensitiveData(
  plaintext: string,
  context: Record<string, string>
): Promise<string> {
  return encryptField(plaintext, context);
}

export async function decryptSensitiveData(
  encrypted: string,
  context: Record<string, string>
): Promise<string> {
  return decryptField(encrypted, context);
}
