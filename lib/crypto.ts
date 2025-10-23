import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}

// Convert hex string to Buffer for the key
function getKeyBuffer(): Buffer {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not set');
  }
  
  // If key is hex string, convert it; otherwise use as-is and hash it
  if (ENCRYPTION_KEY.length === 64) {
    return Buffer.from(ENCRYPTION_KEY, 'hex');
  }
  
  // Hash the key to get 256 bits
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

interface DecryptResult {
  decrypted: string;
  success: boolean;
  error?: string;
}

/**
 * Decrypt AES-256-GCM encrypted data
 * @param encrypted - Base64 encoded encrypted data
 * @param iv - Base64 encoded initialization vector
 * @param authTag - Base64 encoded authentication tag
 * @returns Decrypted string or throws error
 */
export function decryptAESGCM(
  encrypted: string,
  iv: string,
  authTag: string
): string {
  try {
    const keyBuffer = getKeyBuffer();
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      keyBuffer,
      Buffer.from(iv, 'hex') // Changed from 'base64' to 'hex' to match encryption-service.ts
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex')); // Changed from 'base64' to 'hex'
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8'); // Changed from 'base64' to 'hex'
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Decrypt Grid session secrets from User model
 * @param user - User object with encrypted session secrets fields
 * @returns Decrypted session secrets object with proper Uint8Array restoration
 */
export function decryptSessionSecrets(user: {
  encryptedSessionSecrets: string | null;
  sessionSecretsIV: string | null;
  sessionSecretsAuthTag: string | null;
}): any {
  if (
    !user.encryptedSessionSecrets ||
    !user.sessionSecretsIV ||
    !user.sessionSecretsAuthTag
  ) {
    throw new Error('Session secrets not found or incomplete');
  }

  const decrypted = decryptAESGCM(
    user.encryptedSessionSecrets,
    user.sessionSecretsIV,
    user.sessionSecretsAuthTag
  );

  const parsed = JSON.parse(decrypted);
  
  console.log('[Crypto] Decrypting session secrets - restoring binary keys...');
  
  // Restore binary keys from base64/hex strings
  // Grid session secrets may have privateKey as base64 or hex strings
  if (Array.isArray(parsed)) {
    return parsed.map((secret: any, idx: number) => {
      if (secret.privateKey && typeof secret.privateKey === 'string') {
        console.log(`[Crypto] Converting privateKey string to Uint8Array for secret ${idx} (provider: ${secret.provider})`);
        
        try {
          // Try base64 decoding first (most common)
          const buffer = Buffer.from(secret.privateKey, 'base64');
          const uint8Array = new Uint8Array(buffer);
          console.log(`[Crypto] ✅ Restored privateKey as Uint8Array from base64 (length: ${uint8Array.length})`);
          return {
            ...secret,
            privateKey: uint8Array
          };
        } catch (e1) {
          try {
            // Try hex decoding as fallback
            const buffer = Buffer.from(secret.privateKey, 'hex');
            const uint8Array = new Uint8Array(buffer);
            console.log(`[Crypto] ✅ Restored privateKey as Uint8Array from hex (length: ${uint8Array.length})`);
            return {
              ...secret,
              privateKey: uint8Array
            };
          } catch (e2) {
            console.error(`[Crypto] ❌ Failed to decode privateKey for secret ${idx}`);
          }
        }
      }
      return secret;
    });
  }
  
  return parsed;
}

/**
 * Decrypt Grid authentication session from User model
 * @param user - User object with encrypted auth session fields
 * @returns Decrypted auth session object
 */
export function decryptAuthSession(user: {
  encryptedAuthSession: string | null;
  authSessionIV: string | null;
  authSessionAuthTag: string | null;
}): any {
  if (
    !user.encryptedAuthSession ||
    !user.authSessionIV ||
    !user.authSessionAuthTag
  ) {
    throw new Error('Auth session not found or incomplete');
  }

  const decrypted = decryptAESGCM(
    user.encryptedAuthSession,
    user.authSessionIV,
    user.authSessionAuthTag
  );

  return JSON.parse(decrypted);
}

/**
 * Encrypt data using AES-256-GCM
 * @param data - String data to encrypt
 * @returns Object with encrypted data, IV, and auth tag (all base64 encoded)
 */
export function encryptAESGCM(data: string): {
  encrypted: string;
  iv: string;
  authTag: string;
} {
  const keyBuffer = getKeyBuffer();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

  let encrypted = cipher.update(data, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}
