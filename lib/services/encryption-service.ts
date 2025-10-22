/**
 * Session Secrets Encryption Service
 * 
 * Provides secure encryption/decryption for Grid session secrets using AES-256-GCM.
 * Session secrets are cryptographic keys that authorize Grid MPC transactions.
 * 
 * Security:
 * - AES-256-GCM (Galois/Counter Mode) with authentication
 * - Unique IV (Initialization Vector) per encryption
 * - Authentication tag prevents tampering
 * - Encryption key stored in environment variable
 */

import crypto from 'crypto';
import { SessionSecrets } from '@sqds/grid';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment
 * Should be a 64-character hex string (32 bytes)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.SESSION_SECRETS_ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error(
      'SESSION_SECRETS_ENCRYPTION_KEY not found in environment variables. ' +
      'Generate one with: openssl rand -hex 32'
    );
  }

  if (key.length !== 64) {
    throw new Error(
      'SESSION_SECRETS_ENCRYPTION_KEY must be 64 characters (32 bytes in hex). ' +
      'Current length: ' + key.length
    );
  }

  return Buffer.from(key, 'hex');
}

/**
 * Encrypted session secrets data structure
 */
export interface EncryptedSessionData {
  encrypted: string;  // Hex-encoded encrypted data
  iv: string;         // Hex-encoded initialization vector
  authTag: string;    // Hex-encoded authentication tag
}

/**
 * Encrypt session secrets
 * 
 * @param sessionSecrets - The session secrets from Grid SDK
 * @returns Encrypted data with IV and auth tag
 */
export function encryptSessionSecrets(sessionSecrets: SessionSecrets): EncryptedSessionData {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Serialize session secrets to JSON
    const plaintext = JSON.stringify(sessionSecrets);
    
    // Encrypt
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ]);
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  } catch (error: any) {
    console.error('[Encryption] Failed to encrypt session secrets:', error.message);
    throw new Error('Failed to encrypt session secrets');
  }
}

/**
 * Decrypt session secrets
 * 
 * @param encryptedData - Encrypted session data
 * @returns Decrypted session secrets (as-is from Grid, with publicKey/privateKey strings)
 */
export function decryptSessionSecrets(encryptedData: EncryptedSessionData): SessionSecrets {
  try {
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    // Set authentication tag
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedData.encrypted, 'hex')),
      decipher.final()
    ]);
    
    // Parse JSON - Grid's session secrets are just {publicKey, privateKey, provider, tag}
    return JSON.parse(decrypted.toString('utf8'));
  } catch (error: any) {
    console.error('[Encryption] Failed to decrypt session secrets:', error.message);
    throw new Error('Failed to decrypt session secrets. Session may be corrupted or key changed.');
  }
}

/**
 * Check if encryption key is configured
 */
export function isEncryptionConfigured(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a new encryption key (for setup/rotation)
 * Returns a 64-character hex string
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}
