/**
 * Grid Multisig Client Wrapper
 * Provides methods for updating multisig accounts, signing, and sending transactions
 */

import { SDKGridClient } from './sdkClient';

// Import types from Grid SDK to ensure compatibility
import type { 
  AccountSigner, 
  SignerRole, 
  SignerPermission 
} from '@sqds/grid';

export interface UpdateAccountPayload {
  accountAddress: string;
  signers: string[]; // Array of Solana addresses - will be converted to AccountSigner format
  threshold: number;
  timeLock?: number; // Optional time lock in seconds
  signerProviders?: Record<string, string>; // Optional map of address -> provider (e.g., 'privy', 'turnkey', 'external')
}

export interface SignPayload {
  sessionSecrets: any[]; // Array of Grid keypairs (TaggedKeyPair[] | Keypair[])
  transactionPayload: any; // Grid transaction data
  session: any; // Grid auth session
}

export interface SignAndSendPayload {
  sessionSecrets: any[]; // Array of Grid keypairs (TaggedKeyPair[] | Keypair[])
  transactionPayload: any; // Grid transaction data
  session: any; // Grid auth session
  address: string; // Account address
}

/**
 * Update a multisig account (add/remove signers, change threshold)
 * Uses Grid SDK's updateAccount method
 * @param payload - Account update configuration
 * @returns Grid transaction object to be signed and sent
 */
export async function updateAccount(payload: UpdateAccountPayload) {
  const client = SDKGridClient.getInstance();
  
  try {
    console.log('[Grid] Updating account:', payload.accountAddress);
    console.log('[Grid] Requested signers:', payload.signers);
    console.log('[Grid] Requested threshold:', payload.threshold);
    
    // Format signers for Grid SDK - use AccountSigner format from @sqds/grid
    const formattedSigners: AccountSigner[] = payload.signers.map((address, index) => ({
      address,
      role: (index === 0 ? 'primary' : 'backup') as SignerRole,
      permissions: ['CAN_INITIATE', 'CAN_VOTE', 'CAN_EXECUTE'] as SignerPermission[],
      provider: payload.signerProviders?.[address] || 'external', // Use provided provider or default to external
    }));
    
    console.log('[Grid] Formatted signers:', JSON.stringify(formattedSigners, null, 2));
    
    // Prepare update request for Grid SDK
    const updateRequest = {
      signers: formattedSigners,
      threshold: payload.threshold,
      ...(payload.timeLock !== undefined && { time_lock: payload.timeLock }),
    };
    
    console.log('[Grid] Calling SDK updateAccount with:', JSON.stringify(updateRequest, null, 2));
    
    // Use Grid SDK to update account - returns transaction payload
    const result = await client.updateAccount(payload.accountAddress, updateRequest);
    
    console.log('[Grid] Account update transaction created:', JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error('[Grid] Account update failed:', error);
    console.error('[Grid] Error details:', {
      code: error.code,
      message: error.message,
      cause: error.cause,
      details: error.details,
      stack: error.stack,
    });
    console.error('[Grid] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    throw error;
  }
}

/**
 * Sign a transaction using Grid MPC
 * This creates a signature that can be used later with send()
 * @param payload - Signing parameters
 * @returns Signed transaction payload
 */
export async function sign(payload: SignPayload) {
  const client = SDKGridClient.getFrontendClient();
  
  try {
    console.log('[Grid] Signing transaction with MPC');
    console.log('[Grid] Transaction payload:', JSON.stringify(payload.transactionPayload, null, 2));
    
    // Use Grid SDK sign() to create signature
    // Per Grid SDK types: interface SignRequest { sessionSecrets, session?, transactionPayload }
    const signedPayload = await client.sign({
      sessionSecrets: payload.sessionSecrets,
      transactionPayload: payload.transactionPayload,
      session: payload.session,
    });
    
    console.log('[Grid] Transaction signed successfully');
    return signedPayload;
  } catch (error) {
    console.error('[Grid] Signing failed:', error);
    throw error;
  }
}

/**
 * Send a previously signed transaction to the blockchain
 * @param accountAddress - Grid account address
 * @param signedPayload - The signed transaction payload from sign()
 * @returns Transaction result
 */
export async function send(accountAddress: string, signedPayload: any) {
  const client = SDKGridClient.getInstance();
  
  try {
    console.log('[Grid] Sending signed transaction for account:', accountAddress);
    
    // Grid's send() submits the signed transaction to blockchain
    const result = await client.send({
      signedTransactionPayload: signedPayload,
      address: accountAddress,
    });
    
    console.log('[Grid] Transaction sent to blockchain:', result);
    return result;
  } catch (error) {
    console.error('[Grid] Send failed:', error);
    throw error;
  }
}

/**
 * Sign and send a transaction in one step
 * This is the recommended method for most use cases
 * @param payload - Transaction and signing parameters
 * @returns Transaction result
 */
export async function signAndSend(payload: SignAndSendPayload) {
  const client = SDKGridClient.getFrontendClient();
  
  try {
    console.log('[Grid] Signing and sending transaction for:', payload.address);
    
    // Grid SDK's signAndSend handles both operations
    const result = await client.signAndSend({
      sessionSecrets: payload.sessionSecrets,
      transactionPayload: payload.transactionPayload,
      session: payload.session,
      address: payload.address,
    });
    
    console.log('[Grid] Transaction signed and sent:', result);
    return result;
  } catch (error) {
    console.error('[Grid] Sign and send failed:', error);
    throw error;
  }
}

/**
 * Get transaction status from Grid
 * Uses Grid SDK's getTransfers method to query transaction/transfer status
 * @param accountAddress - Grid account address
 * @param transactionId - Optional transaction ID to filter
 * @returns Transaction/transfer data
 */
export async function getTransactionStatus(accountAddress: string, transactionId?: string) {
  const client = SDKGridClient.getInstance();
  
  try {
    console.log('[Grid] Getting transfers for account:', accountAddress);
    
    const transfers = await client.getTransfers(accountAddress);
    
    // If transaction ID provided, filter for that specific transaction
    if (transactionId && transfers?.data) {
      const transaction = transfers.data.find(
        (t: any) => t.id === transactionId || t.transaction_signature === transactionId
      );
      return transaction || transfers;
    }
    
    return transfers;
  } catch (error) {
    console.error('[Grid] Failed to get transaction status:', error);
    throw error;
  }
}
