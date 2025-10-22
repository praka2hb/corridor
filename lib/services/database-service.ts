/**
 * Database Service for User Management
 */

import { db } from '../db';
import { SessionSecrets } from '@sqds/grid';
import { 
  encryptSessionSecrets, 
  decryptSessionSecrets,
  EncryptedSessionData 
} from './encryption-service';

export interface CreateUserData {
  email: string;
  gridUserId: string;
  orgId?: string; // Optional - user can join org later
  publicKey?: string; // Grid smart account address
}

export interface UserWithOrg {
  id: string;
  email: string;
  gridUserId: string | null;
  publicKey: string | null;
  kycStatus: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  organizations: {
    id: string;
    role: string;
    organization: {
      id: string;
      name: string;
      gridOrgId: string | null;
      treasuryAccountId: string | null;
    };
  }[];
}

/**
 * Create or update user after successful Grid authentication
 * Note: Users are created without an organization - they will create/join orgs separately
 */
export async function createOrUpdateUser(userData: CreateUserData): Promise<UserWithOrg> {
  const { email, gridUserId, orgId, publicKey } = userData;

  try {
    const user = await db.user.upsert({
      where: { email },
      update: {
        gridUserId,
        publicKey,
        lastLoginAt: new Date(),
      },
      create: {
        email,
        gridUserId,
        publicKey,
        lastLoginAt: new Date(),
      },
      include: { 
        organizations: {
          include: {
            organization: true
          }
        }
      },
    });

    console.log('[DatabaseService] Upserted user:', user.email);
    return user as unknown as UserWithOrg;

  } catch (error) {
    console.error('[DatabaseService] Error creating/updating user:', error);
    throw new Error('Failed to save user data');
  }
}

/**
 * Get user by email with organization data
 */
export async function getUserByEmail(email: string): Promise<UserWithOrg | null> {
  try {
    const user = await db.user.findUnique({
      where: { email },
      include: { 
        organizations: {
          include: {
            organization: true
          }
        }
      }
    });

    return user;
  } catch (error) {
    console.error('[DatabaseService] Error fetching user:', error);
    return null;
  }
}

/**
 * Get user by Grid User ID
 */
export async function getUserByGridId(gridUserId: string): Promise<UserWithOrg | null> {
  try {
    const user = await db.user.findUnique({
      where: { gridUserId },
      include: { 
        organizations: {
          include: {
            organization: true
          }
        }
      }
    });

    return user;
  } catch (error) {
    console.error('[DatabaseService] Error fetching user by Grid ID:', error);
    return null;
  }
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(userId: string): Promise<void> {
  try {
    await db.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() }
    });
  } catch (error) {
    console.error('[DatabaseService] Error updating last login:', error);
  }
}

/**
 * Create a new organization
 */
export async function createOrganization(name: string, creatorUserId: string): Promise<any> {
  try {
    const org = await db.organization.create({
      data: {
        name,
        members: {
          create: {
            userId: creatorUserId,
            role: 'owner',
          }
        }
      },
      include: {
        members: true,
      }
    });

    console.log('[DatabaseService] Created organization:', org.name);
    return org;
  } catch (error) {
    console.error('[DatabaseService] Error creating organization:', error);
    throw new Error('Failed to create organization');
  }
}

/**
 * Add user to organization
 */
export async function addUserToOrganization(userId: string, orgId: string, role: 'ADMIN' | 'MEMBER' = 'MEMBER'): Promise<void> {
  try {
    await db.organizationMember.create({
      data: {
        userId,
        organizationId: orgId,
        role: role === 'ADMIN' ? 'admin' : 'member',
      }
    });
    console.log('[DatabaseService] Added user to organization');
  } catch (error) {
    console.error('[DatabaseService] Error adding user to organization:', error);
    throw new Error('Failed to add user to organization');
  }
}

/**
 * Store encrypted session secrets for a user
 * Session secrets are used for Grid MPC transaction signing
 */
export async function storeSessionSecrets(
  userId: string,
  sessionSecrets: SessionSecrets
): Promise<void> {
  try {
    console.log('[DatabaseService] ========================================');
    console.log('[DatabaseService] Storing session secrets for user:', userId);
    console.log('[DatabaseService] Session secrets to store:', {
      isArray: Array.isArray(sessionSecrets),
      count: sessionSecrets.length,
      providers: sessionSecrets.map((s: any) => s.provider).join(', '),
      sampleStructure: sessionSecrets[0], // Log first one to see structure
      hasKeyPairs: sessionSecrets.every((s: any) => (s as any).keyPair)
    });
    
    // Encrypt the session secrets
    console.log('[DatabaseService] Encrypting session secrets...');
    const encrypted = encryptSessionSecrets(sessionSecrets);
    
    console.log('[DatabaseService] Encrypted successfully, storing in database...');
    // Store in database
    await db.user.update({
      where: { id: userId },
      data: {
        encryptedSessionSecrets: encrypted.encrypted,
        sessionSecretsIV: encrypted.iv,
        sessionSecretsAuthTag: encrypted.authTag,
      }
    });
    
    console.log('[DatabaseService] ✅ Session secrets stored successfully');
    console.log('[DatabaseService] ========================================');
  } catch (error: any) {
    console.error('[DatabaseService] ❌ Error storing session secrets:', error.message);
    console.log('[DatabaseService] ========================================');
    throw new Error('Failed to store session secrets');
  }
}

/**
 * Retrieve and decrypt session secrets for a user
 * Returns null if no session secrets are stored
 */
export async function getSessionSecrets(userId: string): Promise<SessionSecrets | null> {
  try {
    console.log('[DatabaseService] ========================================');
    console.log('[DatabaseService] Fetching session secrets for user:', userId);
    
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        encryptedSessionSecrets: true,
        sessionSecretsIV: true,
        sessionSecretsAuthTag: true,
      }
    });
    
    if (!user || !user.encryptedSessionSecrets || !user.sessionSecretsIV || !user.sessionSecretsAuthTag) {
      console.log('[DatabaseService] ❌ No session secrets found for user:', userId);
      console.log('[DatabaseService] User record exists:', !!user);
      if (user) {
        console.log('[DatabaseService] Missing fields:', {
          hasEncrypted: !!user.encryptedSessionSecrets,
          hasIV: !!user.sessionSecretsIV,
          hasAuthTag: !!user.sessionSecretsAuthTag
        });
      }
      console.log('[DatabaseService] ========================================');
      return null;
    }
    
    console.log('[DatabaseService] ✅ Encrypted session secrets found in database');
    console.log('[DatabaseService] Encrypted data lengths:', {
      encrypted: user.encryptedSessionSecrets.length,
      iv: user.sessionSecretsIV.length,
      authTag: user.sessionSecretsAuthTag.length
    });
    
    // Decrypt the session secrets
    const encryptedData: EncryptedSessionData = {
      encrypted: user.encryptedSessionSecrets,
      iv: user.sessionSecretsIV,
      authTag: user.sessionSecretsAuthTag,
    };
    
    console.log('[DatabaseService] Decrypting session secrets...');
    const sessionSecrets = decryptSessionSecrets(encryptedData);
    
    console.log('[DatabaseService] ✅ Session secrets decrypted successfully');
    console.log('[DatabaseService] Decrypted session secrets:', {
      isArray: Array.isArray(sessionSecrets),
      count: sessionSecrets.length,
      providers: sessionSecrets.map((s: any) => s.provider).join(', ')
    });
    
    // Log detailed structure of first session secret
    if (sessionSecrets.length > 0) {
      const firstSecret = sessionSecrets[0];
      console.log('[DatabaseService] First session secret structure:', {
        provider: firstSecret.provider,
        tag: firstSecret.tag,
        hasPublicKey: !!firstSecret.publicKey,
        hasPrivateKey: !!firstSecret.privateKey,
        hasKeyPair: !!(firstSecret as any).keyPair,
        allKeys: Object.keys(firstSecret)
      });
      console.log('[DatabaseService] First session secret (full):', JSON.stringify(firstSecret, null, 2));
    }
    
    console.log('[DatabaseService] ========================================');
    
    return sessionSecrets;
  } catch (error: any) {
    console.error('[DatabaseService] ❌ Error retrieving session secrets:', error.message);
    console.error('[DatabaseService] Full error:', error);
    console.log('[DatabaseService] ========================================');
    throw new Error('Failed to retrieve session secrets. You may need to re-authenticate.');
  }
}

/**
 * Store encrypted authentication session for a user
 * This stores Grid's authentication state including provider tokens
 */
export async function storeAuthSession(userId: string, authSession: any[]): Promise<void> {
  try {
    console.log('[DatabaseService] ========================================');
    console.log('[DatabaseService] Storing authentication session for user:', userId);
    
    // Encrypt the auth session
    console.log('[DatabaseService] Encrypting authentication session...');
    const encrypted = encryptSessionSecrets(authSession as any); // Reuse same encryption
    
    console.log('[DatabaseService] Encrypted successfully, storing in database...');
    // Store in database
    await db.user.update({
      where: { id: userId },
      data: {
        encryptedAuthSession: encrypted.encrypted,
        authSessionIV: encrypted.iv,
        authSessionAuthTag: encrypted.authTag,
      }
    });
    
    console.log('[DatabaseService] ✅ Authentication session stored successfully');
    console.log('[DatabaseService] ========================================');
  } catch (error: any) {
    console.error('[DatabaseService] ❌ Error storing authentication session:', error.message);
    console.log('[DatabaseService] ========================================');
    throw new Error('Failed to store authentication session');
  }
}

/**
 * Retrieve and decrypt authentication session for a user
 * Returns null if no auth session is stored
 */
export async function getAuthSession(userId: string): Promise<any[] | null> {
  try {
    console.log('[DatabaseService] Fetching authentication session for user:', userId);
    
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        encryptedAuthSession: true,
        authSessionIV: true,
        authSessionAuthTag: true,
      }
    });
    
    if (!user || !user.encryptedAuthSession || !user.authSessionIV || !user.authSessionAuthTag) {
      console.log('[DatabaseService] ❌ No authentication session found for user:', userId);
      return null;
    }
    
    console.log('[DatabaseService] ✅ Encrypted authentication session found in database');
    
    // Decrypt the auth session
    const encryptedData: EncryptedSessionData = {
      encrypted: user.encryptedAuthSession,
      iv: user.authSessionIV,
      authTag: user.authSessionAuthTag,
    };
    
    console.log('[DatabaseService] Decrypting authentication session...');
    const authSession = decryptSessionSecrets(encryptedData);
    
    console.log('[DatabaseService] ✅ Authentication session decrypted successfully');
    
    return authSession as any;
  } catch (error: any) {
    console.error('[DatabaseService] ❌ Error retrieving authentication session:', error.message);
    console.error('[DatabaseService] Full error:', error);
    throw new Error('Failed to retrieve authentication session. You may need to re-authenticate.');
  }
}

/**
 * Verify that stored session secrets match the user's Grid account signers
 * Returns verification result with details
 */
export async function verifySessionSecrets(
  userId: string, 
  gridAccountAddress: string
): Promise<{
  valid: boolean;
  message: string;
  details?: {
    storedSigners: string[];
    gridSigners: string[];
    matchingSigners: string[];
  };
}> {
  try {
    // Get stored session secrets
    const sessionSecrets = await getSessionSecrets(userId);
    
    if (!sessionSecrets || sessionSecrets.length === 0) {
      return {
        valid: false,
        message: 'No session secrets stored for this user',
      };
    }
    
    // Extract public keys from session secrets
    const storedSigners = sessionSecrets
      .map((secret: any) => secret.publicKey?.toString() || '')
      .filter(Boolean);
    
    console.log('[DatabaseService] Stored signers from session secrets:', storedSigners);
    
    // Get Grid account policies to compare signers
    const { gridClient } = await import('../grid-client');
    const accountResult = await gridClient.getAccount(gridAccountAddress);
    
    if (!accountResult.success || !accountResult.data) {
      return {
        valid: false,
        message: 'Failed to retrieve Grid account information',
      };
    }
    
    // Extract signer addresses from Grid account policies
    const gridSigners = accountResult.data.policies?.signers?.map((s: any) => s.address) || [];
    
    console.log('[DatabaseService] Grid account signers:', gridSigners);
    
    // Find matching signers
    const matchingSigners = storedSigners.filter(signer => 
      gridSigners.includes(signer)
    );
    
    const allMatch = matchingSigners.length === storedSigners.length && 
                     matchingSigners.length === gridSigners.length;
    
    return {
      valid: allMatch,
      message: allMatch 
        ? `✅ All ${matchingSigners.length} stored session secrets match Grid account signers`
        : `⚠️ Mismatch: ${matchingSigners.length}/${storedSigners.length} stored signers match ${gridSigners.length} Grid signers`,
      details: {
        storedSigners,
        gridSigners,
        matchingSigners,
      }
    };
  } catch (error: any) {
    console.error('[DatabaseService] Error verifying session secrets:', error.message);
    return {
      valid: false,
      message: `Verification failed: ${error.message}`,
    };
  }
}
