/**
 * Grid Service
 * High-level service for Grid API interactions
 */

import { SDKGridClient } from '@/lib/grid/sdkClient';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { config } from '@/lib/config';

// Custom error class for Grid-specific errors
export class GridError extends Error {
  constructor(message: string, public code?: string, public statusCode?: number) {
    super(message);
    this.name = 'GridError';
  }
}

// Known token mints
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const USDC_DEVNET_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
const USDT_MINT = new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');

export interface AccountBalance {
  accountId: string;
  balance: number;
  availableBalance: number;
  currency: string;
  status: string;
  mint?: string;
  decimals?: number;
}

export interface AccountBalancesResponse {
  success: boolean;
  balances?: AccountBalance[];
  error?: string;
}

export class GridService {
  /**
   * Get account balances for a user (SOL + SPL tokens like USDC)
   */
  async getAccountBalances(accountAddress: string): Promise<AccountBalancesResponse> {
    try {
      console.log('[GridService] ========================================');
      console.log('[GridService] Fetching balances for account:', accountAddress);
      console.log('[GridService] ========================================');
      
      const balances: AccountBalance[] = [];
      
      // Initialize Solana connection
      const connection = new Connection(config.solana.rpcEndpoint, {
        commitment: config.solana.commitment,
      });
      
      console.log('[GridService] Using RPC endpoint:', config.solana.rpcEndpoint);
      
      const publicKey = new PublicKey(accountAddress);
      
      // 1. Get SOL balance
      try {
        const lamports = await connection.getBalance(publicKey);
        const sol = lamports / 1_000_000_000; // Convert lamports to SOL
        
        if (sol > 0) {
          balances.push({
            accountId: accountAddress,
            balance: sol,
            availableBalance: sol,
            currency: 'SOL',
            status: 'active',
            decimals: 9
          });
          console.log('[GridService] SOL balance:', sol);
        }
      } catch (error) {
        console.error('[GridService] Error fetching SOL balance:', error);
      }
      
      // 2. Get SPL token balances (USDC, USDT, etc.)
      const tokenMints = [
        { mint: USDC_MINT, symbol: 'USDC', decimals: 6 },
        { mint: USDT_MINT, symbol: 'USDT', decimals: 6 },
        { mint: USDC_DEVNET_MINT, symbol: 'USDC_DEVNET', decimals: 6 }
      ];
      
      for (const { mint, symbol, decimals } of tokenMints) {
        try {
          // Get associated token account address
          const tokenAccount = await getAssociatedTokenAddress(
            mint,
            publicKey,
            true // allowOwnerOffCurve for PDAs (Grid accounts)
          );
          
          console.log(`[GridService] Checking ${symbol} token account:`, tokenAccount.toString());
          
          // Try to fetch the token account
          const accountInfo = await connection.getAccountInfo(tokenAccount);
          
          console.log(`[GridService] ${symbol} account info:`, {
            exists: !!accountInfo,
            owner: accountInfo?.owner?.toString(),
            dataLength: accountInfo?.data?.length
          });
          
          if (accountInfo) {
            // Parse the token account data
            const tokenAccountData = await getAccount(
              connection,
              tokenAccount,
              'confirmed',
              TOKEN_PROGRAM_ID
            );
            
            console.log(`[GridService] ${symbol} token account data:`, {
              mint: tokenAccountData.mint.toString(),
              owner: tokenAccountData.owner.toString(),
              amount: tokenAccountData.amount.toString(),
              decimals: decimals
            });
            
            // Convert amount to human-readable format
            const amount = Number(tokenAccountData.amount) / Math.pow(10, decimals);
            
            // Always include token if account exists, even with 0 balance
            balances.push({
              accountId: accountAddress,
              balance: amount,
              availableBalance: amount,
              currency: symbol,
              status: 'active',
              mint: mint.toString(),
              decimals: decimals
            });
            console.log(`[GridService] ✅ ${symbol} balance:`, amount, '(token account exists)');
          } else {
            // Token account doesn't exist yet - show as 0 balance for USDC (common stablecoin)
            if (symbol === 'USDC') {
              balances.push({
                accountId: accountAddress,
                balance: 0,
                availableBalance: 0,
                currency: symbol,
                status: 'inactive', // Mark as inactive since account doesn't exist yet
                mint: mint.toString(),
                decimals: decimals
              });
              console.log(`[GridService] ${symbol} token account not found - showing 0 balance`);
            } else {
              console.log(`[GridService] No ${symbol} token account found - will not display in balances`);
            }
          }
        } catch (error: any) {
          // Token account doesn't exist or other error
          console.log(`[GridService] ${symbol} error:`, error.message);
          
          // For USDC, show 0 balance even on error
          if (symbol === 'USDC') {
            balances.push({
              accountId: accountAddress,
              balance: 0,
              availableBalance: 0,
              currency: symbol,
              status: 'inactive',
              mint: mint.toString(),
              decimals: decimals
            });
            console.log(`[GridService] ${symbol} error occurred - showing 0 balance`);
          }
        }
      }
      
      console.log('[GridService] ========================================');
      console.log('[GridService] Total balances found:', balances.length);
      console.log('[GridService] Balances:', JSON.stringify(balances, null, 2));
      console.log('[GridService] ========================================');

      return {
        success: true,
        balances
      };

    } catch (error: any) {
      console.error('[GridService] Error in getAccountBalances:', error);
      
      if (error instanceof GridError) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: false,
        error: 'Unexpected error fetching account balances'
      };
    }
  }

  /**
   * Get a single account by ID
   */
  async getAccount(accountId: string): Promise<any> {
    try {
      console.log('[GridService] Fetching account:', accountId);
      
      const client = SDKGridClient.getInstance();
      const result = await client.getAccount(accountId);
      
      if (!result || result.error) {
        console.error('[GridService] Error fetching account:', result?.error);
        throw new Error(result?.error || 'Account not found');
      }

      return result;
    } catch (error: any) {
      console.error('[GridService] Error in getAccount:', error);
      throw error;
    }
  }

  /**
   * List accounts for a user (uses getAccount as Grid SDK doesn't have listAccounts)
   */
  async listAccounts(userId: string, options?: any): Promise<any> {
    try {
      console.log('[GridService] Listing accounts for user:', userId);
      
      // Grid SDK doesn't have listAccounts, so we return the single account
      const client = SDKGridClient.getInstance();
      const result = await client.getAccount(userId);
      
      if (!result || result.error) {
        console.error('[GridService] Error listing accounts:', result?.error);
        throw new Error(result?.error || 'Failed to list accounts');
      }

      // Return as array for consistency
      return { data: [result] };
    } catch (error: any) {
      console.error('[GridService] Error in listAccounts:', error);
      throw error;
    }
  }

  /**
   * Create a new account (method not available in Grid SDK)
   */
  async createAccount(params: any): Promise<any> {
    throw new Error('createAccount method not available in Grid SDK');
  }

  /**
   * Execute a transaction (placeholder - method not available in GridClient)
   */
  async executeTransaction(params: any): Promise<any> {
    throw new Error('executeTransaction method not available in GridClient');
  }
}

// Export singleton instance
export const gridService = new GridService();
