/**
 * Production-ready Authentication Service
 */

import { SDKGridClient } from '../grid/sdkClient';
import { createOrUpdateUser, storeSessionSecrets, getSessionSecrets, storeAuthSession, getAuthSession } from './database-service';
import { PrismaClient } from '@prisma/client';
import { SessionSecrets } from '@sqds/grid';

const prisma = new PrismaClient();

export interface AuthInitResult {
  success: boolean;
  email: string;
  authFlow: 'signup' | 'login';
  provider?: string;
  type?: string;
  error?: string;
  userData?: any; // User data from createAccount to pass to completeAuthAndCreateAccount
}

export interface AuthVerifyResult {
  success: boolean;
  address: string;
  gridUserId: string;
  isNewAccount: boolean;
  userId?: string;
  policies?: any;
  data?: any;
  error?: string;
  authFlow?: 'signup' | 'login';
}

export async function initiateAuth(email: string): Promise<AuthInitResult> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const client = SDKGridClient.getInstance();
    
    // Try createAccount first (for new users)
    const createResult: any = await client.createAccount({
      email: normalizedEmail
    });

    if (createResult?.data) {
      return {
        success: true,
        email: normalizedEmail,
        authFlow: 'signup',
        provider: createResult.data.provider || 'privy',
        type: createResult.data.type,
        userData: createResult.data, // Store the user data from createAccount
      };
    }

    // If we get here, createAccount failed
    throw new Error(createResult?.error || 'Failed to initiate authentication');
    
  } catch (error: any) {
    const errorMessage = error?.message || '';
    
    // Check if account already exists (Grid returns this specific error)
    if (errorMessage.includes('already exists') || errorMessage.includes('grid_account_already_exists_for_user')) {      
      try {
        const client = SDKGridClient.getInstance();
        
        // Use initAuth for existing users
        const initResult: any = await client.initAuth({
          email: normalizedEmail,
        });
        if (initResult?.data) {      
          return {
            success: true,
            email: normalizedEmail,
            authFlow: 'login',
            provider: initResult.data.provider || 'privy',
            type: initResult.data.type,
            userData: initResult.data, // Store the user data from initAuth
          };
        }

        throw new Error(initResult?.error || 'Failed to initiate authentication for existing user');
      } catch (initError: any) {
        throw new Error(initError?.message || 'Failed to authenticate existing user');
      }
    }

    // For other errors, throw them
    console.error('[AuthService] Auth initiation failed:', error);
    throw new Error(errorMessage || 'Failed to initiate authentication');
  }
}

export async function verifyAuth(
  email: string,
  otpCode: string,
  userData: any, // User data from createAccount()
  authFlow?: 'signup' | 'login'
): Promise<AuthVerifyResult> {
  const normalizedEmail = email.trim().toLowerCase();
  
  try {
    const client = SDKGridClient.getInstance();
    
    // Step 2: Generate session secrets
    const sessionSecrets: SessionSecrets = await client.generateSessionSecrets();

    // Use different completion method based on authFlow
    const isNewUser = authFlow === 'signup';

    const result: any = isNewUser 
      ? await client.completeAuthAndCreateAccount({
          user: userData,
          otpCode,
          sessionSecrets,
        })
      : await client.completeAuth({
          user: userData,
          otpCode,
          sessionSecrets,
        });

    if (!result || result.success === false || result.error) {
      throw new Error(result?.error || 'Invalid or expired OTP');
    }

    const accountAddress = result?.data?.address || result?.address;
    const gridUserId = result?.data?.grid_user_id || result?.grid_user_id;

    if (!accountAddress) {
      throw new Error('Authentication failed - no account address returned');
    }

    const dbUser = await createOrUpdateUser({
      email: normalizedEmail,
      gridUserId: gridUserId || '',
      publicKey: accountAddress,
    });

    // IMPORTANT: Always store fresh session secrets on every authentication
    // Per Grid docs: "Session secrets must be stored immediately after generation"
    // These are fresh cryptographic keys generated during completeAuth/completeAuthAndCreateAccount
    // They authorize Grid MPC transactions and must be stored for each new session
    await storeSessionSecrets(dbUser.id, sessionSecrets);
    
    // Also store the authentication session if present
    const authenticationSession = result?.data?.authentication;
    if (authenticationSession && Array.isArray(authenticationSession)) {
      await storeAuthSession(dbUser.id, authenticationSession);
    }

    return {
      success: true,
      address: accountAddress,
      gridUserId: gridUserId || '',
      isNewAccount: isNewUser,
      authFlow,
      userId: dbUser.id,
      data: result.data || result,
    };
  } catch (error: any) {
    console.error('[AuthService] Verification failed:', error);
    throw new Error(error?.message || 'Failed to verify OTP');
  } finally {
    await prisma.$disconnect();
  }
}
