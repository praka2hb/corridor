import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { config } from '@/lib/config';
import { db } from '@/lib/db';

/**
 * POST /api/investments/confirm
 * Confirm a Kamino deposit/withdraw transaction after employee signs it
 * 
 * Body: { 
 *   employeeId: string,
 *   transactionSignature: string,
 *   ledgerId: string // ProviderLedger ID from the prepare step
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, transactionSignature, ledgerId } = body;

    // Validation
    if (!employeeId || !transactionSignature || !ledgerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: employeeId, transactionSignature, ledgerId',
        },
        { status: 400 }
      );
    }

    console.log('[Confirm API] Confirming transaction:', {
      employeeId,
      transactionSignature,
      ledgerId,
    });

    // Get the ledger entry
    const ledgerEntry = await db.providerLedger.findUnique({
      where: { id: ledgerId },
    });

    if (!ledgerEntry) {
      return NextResponse.json(
        { success: false, error: 'Ledger entry not found' },
        { status: 404 }
      );
    }

    if (ledgerEntry.employeeId !== employeeId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (ledgerEntry.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: `Transaction already ${ledgerEntry.status}`,
        },
        { status: 400 }
      );
    }

    // Parse metadata
    const metadata = ledgerEntry.metadata ? JSON.parse(ledgerEntry.metadata) : {};

    // Initialize Solana connection
    const connection = new Connection(config.solana.rpcEndpoint, {
      commitment: config.solana.commitment,
    });

    // Verify transaction on-chain
    console.log('[Confirm API] Fetching transaction from blockchain:', transactionSignature);
    
    let transaction;
    let retries = 0;
    const maxRetries = 5;
    
    // Transaction may not be immediately available, retry with backoff
    while (retries < maxRetries) {
      try {
        transaction = await connection.getTransaction(transactionSignature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        });
        
        if (transaction) {
          break;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));
        retries++;
      } catch (error) {
        console.error('[Confirm API] Error fetching transaction:', error);
        retries++;
        if (retries >= maxRetries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));
      }
    }

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction not found on blockchain. It may still be processing.',
        },
        { status: 404 }
      );
    }

    // Check transaction success
    if (transaction.meta?.err) {
      console.error('[Confirm API] Transaction failed on-chain:', transaction.meta.err);
      
      // Update ledger entry to failed
      await db.providerLedger.update({
        where: { id: ledgerId },
        data: {
          status: 'failed',
          error: JSON.stringify(transaction.meta.err),
          txSig: transactionSignature,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Transaction failed on blockchain',
          details: transaction.meta.err,
        },
        { status: 400 }
      );
    }

    console.log('[Confirm API] Transaction confirmed successfully');

    // Parse transaction logs for Kamino events
    const logs = transaction.meta?.logMessages || [];
    console.log('[Confirm API] Transaction logs:', logs);

    // Update ledger entry to completed
    await db.providerLedger.update({
      where: { id: ledgerId },
      data: {
        status: 'completed',
        txSig: transactionSignature,
        updatedAt: new Date(),
      },
    });

    // Update employee position based on transaction type
    if (ledgerEntry.type === 'stake') {
      // Deposit: increment shares
      await db.employeePosition.upsert({
        where: {
          employeeId_provider_strategyId: {
            employeeId: employeeId,
            provider: 'kamino',
            strategyId: ledgerEntry.strategyId,
          },
        },
        create: {
          employeeId: employeeId,
          provider: 'kamino',
          strategyId: ledgerEntry.strategyId,
          shares: ledgerEntry.amount,
          receiptTokenMint: metadata.kTokenMint,
          depositShares: ledgerEntry.amount,
          depositValue: ledgerEntry.amount, // Approximate USD value
          lastSyncedAt: new Date(),
        },
        update: {
          shares: {
            increment: ledgerEntry.amount,
          },
          depositShares: {
            increment: ledgerEntry.amount,
          },
          depositValue: {
            increment: ledgerEntry.amount,
          },
          lastSyncedAt: new Date(),
        },
      });

      // Track obligation if this was first deposit
      if (metadata.obligationAddress) {
        await db.employeeObligation.upsert({
          where: {
            obligationAddress: metadata.obligationAddress,
          },
          create: {
            employeeId: employeeId,
            obligationAddress: metadata.obligationAddress,
            marketAddress: config.kamino.marketAddress,
          },
          update: {
            updatedAt: new Date(),
          },
        });
      }
    } else if (ledgerEntry.type === 'unstake') {
      // Withdraw: decrement shares
      const position = await db.employeePosition.findUnique({
        where: {
          employeeId_provider_strategyId: {
            employeeId: employeeId,
            provider: 'kamino',
            strategyId: ledgerEntry.strategyId,
          },
        },
      });

      if (position) {
        const newShares = Math.max(0, position.shares - ledgerEntry.amount);
        const newDepositShares = Math.max(0, position.depositShares - ledgerEntry.amount);
        const newDepositValue = Math.max(0, position.depositValue - ledgerEntry.amount);

        await db.employeePosition.update({
          where: {
            employeeId_provider_strategyId: {
              employeeId: employeeId,
              provider: 'kamino',
              strategyId: ledgerEntry.strategyId,
            },
          },
          data: {
            shares: newShares,
            depositShares: newDepositShares,
            depositValue: newDepositValue,
            lastSyncedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        signature: transactionSignature,
        obligationAddress: metadata.obligationAddress,
        amount: ledgerEntry.amount,
        type: ledgerEntry.type,
        status: 'completed',
        blockTime: transaction.blockTime,
        slot: transaction.slot,
      },
    });
  } catch (error) {
    console.error('[Confirm API] Transaction confirmation failed:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Confirmation failed';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
