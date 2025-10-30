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
  const client = SDKGridClient.getInstance();
  
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

/**
 * Create a standing order (recurring payment)
 * @param accountAddress - The account address
 * @param standingOrderConfig - Standing order configuration matching Grid SDK CreateStandingOrderRequest
 * @returns Grid standing order response
 */
export async function createStandingOrder(accountAddress: string, standingOrderConfig: import('@/lib/types/payroll').StandingOrderConfig) {
  const client = SDKGridClient.getInstance();
  try {
    console.log('[Grid] Creating standing order for account:', accountAddress);
    console.log('[Grid] Standing order config:', JSON.stringify(standingOrderConfig, null, 2));
    const result = await client.createStandingOrder(accountAddress, standingOrderConfig);
    console.log('[Grid] Standing order created successfully:', result);
    return result;
  } catch (error) {
    console.error('[Grid] Failed to create standing order:', error);
    throw error;
  }
}

/**
 * Get all standing orders for an account
 * @param accountAddress - The account address
 * @returns Grid standing orders response
 */
export async function getStandingOrders(accountAddress: string) {
  const client = SDKGridClient.getInstance();
  try {
    console.log('[Grid] Getting standing orders for account:', accountAddress);
    const result = await client.getStandingOrders(accountAddress);
    console.log('[Grid] Retrieved standing orders:', result?.data?.length || 0);
    return result;
  } catch (error) {
    console.error('[Grid] Failed to get standing orders:', error);
    throw error;
  }
}

/**
 * Get a specific standing order
 * @param accountAddress - The account address
 * @param standingOrderId - The standing order ID
 * @returns Grid standing order details
 */
export async function getStandingOrder(accountAddress: string, standingOrderId: string) {
  const client = SDKGridClient.getInstance();
  try {
    console.log('[Grid] Getting standing order:', standingOrderId);
    const result = await client.getStandingOrder(accountAddress, standingOrderId);
    console.log('[Grid] Retrieved standing order details');
    return result;
  } catch (error) {
    console.error('[Grid] Failed to get standing order:', error);
    throw error;
  }
}

/**
 * Prepare an arbitrary Solana transaction for signing
 * This allows employees to sign custom transactions (e.g., Kamino deposits/withdrawals)
 * with their Grid-managed wallet
 * 
 * @param accountAddress - Employee's Grid account address
 * @param serializedTransaction - Base64 encoded serialized Solana transaction
 * @param transactionVersion - Transaction version: 'legacy' or 0 (for versioned transactions with lookup tables)
 * @returns Prepared transaction payload ready for signing
 */
export async function prepareArbitraryTransaction(
  accountAddress: string,
  serializedTransaction: string,
  transactionVersion?: 'legacy' | 0
) {
  const client = SDKGridClient.getInstance();
  
  try {
    console.log('[Grid] Preparing arbitrary transaction for account:', accountAddress);
    console.log('[Grid] Transaction version:', transactionVersion || 'legacy');
    
    // Check if Grid SDK supports arbitrary transaction preparation
    // Note: This is a placeholder - actual Grid SDK method may differ
    // You may need to check Grid SDK documentation for the exact method name
    
    if (typeof (client as any).prepareTransaction === 'function') {
      // If Grid has a prepareTransaction method
      const result = await (client as any).prepareTransaction({
        accountAddress,
        serializedTransaction,
        version: transactionVersion || 'legacy',
      });
      
      console.log('[Grid] Arbitrary transaction prepared successfully');
      return result;
    } else {
      // Fallback: Grid may handle this differently
      // For now, we'll return the serialized transaction as-is
      // The employee will sign it directly with their Grid session
      console.warn('[Grid] prepareTransaction method not found in SDK');
      console.warn('[Grid] Returning serialized transaction for direct signing');
      
      return {
        serializedTransaction,
        accountAddress,
        version: transactionVersion || 'legacy',
        requiresDirectSigning: true,
      };
    }
  } catch (error) {
    console.error('[Grid] Failed to prepare arbitrary transaction:', error);
    throw new Error(`Failed to prepare transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Submit a signed arbitrary transaction to the Solana blockchain
 * 
 * @param signedTransaction - Base64 encoded signed transaction
 * @returns Transaction signature and confirmation status
 */
export async function submitArbitraryTransaction(signedTransaction: string) {
  const client = SDKGridClient.getInstance();
  
  try {
    console.log('[Grid] Submitting signed arbitrary transaction');
    
    // Check if Grid SDK has a method to submit arbitrary transactions
    if (typeof (client as any).submitTransaction === 'function') {
      const result = await (client as any).submitTransaction({
        signedTransaction,
      });
      
      console.log('[Grid] Transaction submitted:', result);
      return result;
    } else {
      // If Grid doesn't have this method, we'll need to submit directly to Solana RPC
      console.warn('[Grid] submitTransaction method not found in SDK');
      throw new Error('Grid SDK does not support arbitrary transaction submission. Use Solana RPC directly.');
    }
  } catch (error) {
    console.error('[Grid] Failed to submit arbitrary transaction:', error);
    throw error;
  }
}
