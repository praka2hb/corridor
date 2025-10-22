/**
 * Solana Transaction Service
 * Handles transaction building, sending, and confirmation for Kamino operations
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  Signer,
  TransactionSignature,
  Commitment,
  VersionedTransaction,
} from '@solana/web3.js';
import { config } from '../config';

export class SolanaTransactionError extends Error {
  constructor(
    message: string,
    public code?: string,
    public txSignature?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'SolanaTransactionError';
  }
}

export interface TransactionResult {
  signature: string;
  slot: number;
  confirmationStatus: 'processed' | 'confirmed' | 'finalized';
}

export interface SendTransactionOptions {
  skipPreflight?: boolean;
  maxRetries?: number;
  commitment?: Commitment;
}

/**
 * Solana Transaction Service
 * Manages transaction lifecycle on Solana
 */
export class SolanaTransactionService {
  private connection: Connection;
  private readonly DEFAULT_MAX_RETRIES = 3;
  private readonly DEFAULT_TIMEOUT_MS = 90000; // 90 seconds

  constructor(connection?: Connection) {
    this.connection = connection || new Connection(
      config.solana.rpcEndpoint,
      {
        commitment: config.solana.commitment,
      }
    );
  }

  /**
   * Send and confirm a transaction
   * Handles retries and confirmation polling
   */
  async sendAndConfirmTransaction(
    transaction: Transaction,
    signers: Signer[],
    options?: SendTransactionOptions
  ): Promise<TransactionResult> {
    const maxRetries = options?.maxRetries ?? this.DEFAULT_MAX_RETRIES;
    const commitment = options?.commitment ?? config.solana.commitment;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash(commitment);
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;
        transaction.feePayer = signers[0].publicKey;

        // Send transaction
        const signature = await sendAndConfirmTransaction(
          this.connection,
          transaction,
          signers,
          {
            skipPreflight: options?.skipPreflight ?? false,
            commitment,
          }
        );

        // Get slot info
        const status = await this.connection.getSignatureStatus(signature);
        const slot = status.value?.slot ?? 0;

        return {
          signature,
          slot,
          confirmationStatus: commitment,
        };
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries - 1) {
          // Wait before retrying (exponential backoff)
          await this.sleep(1000 * Math.pow(2, attempt));
          continue;
        }
      }
    }

    throw new SolanaTransactionError(
      `Transaction failed after ${maxRetries} attempts`,
      'TX_FAILED',
      undefined,
      lastError
    );
  }

  /**
   * Send a versioned transaction
   */
  async sendVersionedTransaction(
    transaction: VersionedTransaction,
    options?: SendTransactionOptions
  ): Promise<TransactionResult> {
    const maxRetries = options?.maxRetries ?? this.DEFAULT_MAX_RETRIES;
    const commitment = options?.commitment ?? config.solana.commitment;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const signature = await this.connection.sendTransaction(transaction, {
          skipPreflight: options?.skipPreflight ?? false,
          maxRetries: 0, // Handle retries ourselves
        });

        // Wait for confirmation
        const confirmation = await this.confirmTransaction(signature, commitment);

        return {
          signature,
          slot: confirmation.slot,
          confirmationStatus: commitment,
        };
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries - 1) {
          await this.sleep(1000 * Math.pow(2, attempt));
          continue;
        }
      }
    }

    throw new SolanaTransactionError(
      `Versioned transaction failed after ${maxRetries} attempts`,
      'VERSIONED_TX_FAILED',
      undefined,
      lastError
    );
  }

  /**
   * Confirm a transaction
   */
  async confirmTransaction(
    signature: TransactionSignature,
    commitment?: Commitment
  ): Promise<{ slot: number }> {
    const comm = commitment ?? config.solana.commitment;
    const startTime = Date.now();

    while (Date.now() - startTime < this.DEFAULT_TIMEOUT_MS) {
      const status = await this.connection.getSignatureStatus(signature);

      if (status.value?.err) {
        throw new SolanaTransactionError(
          'Transaction failed',
          'TX_FAILED',
          signature,
          status.value.err
        );
      }

      if (status.value?.confirmationStatus === comm || 
          status.value?.confirmationStatus === 'finalized') {
        return {
          slot: status.value.slot,
        };
      }

      await this.sleep(1000);
    }

    throw new SolanaTransactionError(
      'Transaction confirmation timeout',
      'CONFIRMATION_TIMEOUT',
      signature
    );
  }

  /**
   * Get transaction details
   */
  async getTransaction(signature: string, commitment?: Commitment) {
    try {
      return await this.connection.getTransaction(signature, {
        commitment: commitment ?? 'confirmed',
        maxSupportedTransactionVersion: 0,
      });
    } catch (error) {
      throw new SolanaTransactionError(
        'Failed to fetch transaction',
        'TX_FETCH_FAILED',
        signature,
        error
      );
    }
  }

  /**
   * Simulate a transaction before sending
   */
  async simulateTransaction(transaction: Transaction): Promise<{
    success: boolean;
    logs?: string[];
    error?: string;
  }> {
    try {
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      const simulation = await this.connection.simulateTransaction(transaction);

      return {
        success: !simulation.value.err,
        logs: simulation.value.logs ?? undefined,
        error: simulation.value.err ? JSON.stringify(simulation.value.err) : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Simulation failed',
      };
    }
  }

  /**
   * Build a transaction from instructions
   */
  async buildTransaction(
    instructions: TransactionInstruction[],
    payer: PublicKey,
    additionalSigners?: PublicKey[]
  ): Promise<Transaction> {
    const transaction = new Transaction();
    transaction.add(...instructions);
    transaction.feePayer = payer;

    // Get recent blockhash
    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    return transaction;
  }

  /**
   * Get the connection instance
   */
  getConnection(): Connection {
    return this.connection;
  }

  /**
   * Check if an address has sufficient SOL for transaction fees
   */
  async hasSufficientSOL(
    address: PublicKey,
    minBalance: number = 0.01 // Default 0.01 SOL
  ): Promise<boolean> {
    try {
      const balance = await this.connection.getBalance(address);
      return balance >= minBalance * 1e9; // Convert SOL to lamports
    } catch (error) {
      return false;
    }
  }

  /**
   * Get SOL balance
   */
  async getSOLBalance(address: PublicKey): Promise<number> {
    try {
      const balance = await this.connection.getBalance(address);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      throw new SolanaTransactionError(
        'Failed to get SOL balance',
        'BALANCE_FETCH_FAILED',
        undefined,
        error
      );
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let solanaService: SolanaTransactionService | null = null;

/**
 * Get or create the Solana transaction service instance
 */
export function getSolanaTransactionService(connection?: Connection): SolanaTransactionService {
  if (!solanaService || connection) {
    solanaService = new SolanaTransactionService(connection);
  }
  return solanaService;
}

