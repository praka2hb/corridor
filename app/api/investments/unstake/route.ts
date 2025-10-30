import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Force dynamic rendering to avoid build-time issues with WASM
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/investments/unstake
 * Prepare Kamino Lend withdraw transaction for employee to sign
 * 
 * Body: 
 * - New format: { employeeId, assetSymbol, amount?, shares?, idempotencyKey, employeeWallet }
 * - Legacy format: { employeeId, strategyId, shares?, amount?, idempotencyKey }
 */
export async function POST(request: NextRequest) {
  // Lazy load kamino-service to avoid build-time WASM issues
  const { buildAndSendUnstakeTx, buildAndSendWithdrawTx } = await import('@/lib/kamino-service');
  try {
    const body = await request.json();
    const { employeeId, assetSymbol, strategyId, shares, amount, idempotencyKey, employeeWallet } = body;

    // Validation
    if (!employeeId || !idempotencyKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: employeeId, idempotencyKey',
        },
        { status: 400 }
      );
    }

    if (!assetSymbol && !strategyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Must provide either assetSymbol (for Lend) or strategyId (legacy)',
        },
        { status: 400 }
      );
    }

    // Note: shares and amount are optional - if not provided, withdraws all

    // TODO: Check idempotency key in cache/DB to prevent duplicates

    // Use new withdraw flow for Kamino Lend
    if (assetSymbol) {
      if (!employeeWallet) {
        return NextResponse.json(
          {
            success: false,
            error: 'employeeWallet is required for Kamino Lend withdrawals',
          },
          { status: 400 }
        );
      }

      // Build transaction for employee to sign
      const result = await buildAndSendWithdrawTx({
        employeeId,
        assetSymbol,
        shares,
        amount,
        idempotencyKey,
        employeeWallet,
      });

      // Find the ledger entry we just created
      const ledgerEntry = await db.providerLedger.findFirst({
        where: {
          employeeId,
          provider: 'kamino',
          type: 'unstake',
          status: 'pending',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          serializedTransaction: result.serializedTransaction,
          obligationAddress: result.obligationAddress,
          withdrawAmount: result.withdrawAmount,
          blockhashExpiry: result.blockhashExpiry,
          ledgerId: ledgerEntry?.id,
          assetSymbol,
        },
      });
    }

    // Legacy unstake flow
    const result = await buildAndSendUnstakeTx({
      employeeId,
      strategyId: strategyId!,
      shares,
      amount,
      idempotencyKey,
    });

    return NextResponse.json({
      success: true,
      data: {
        txSig: result.txSig,
        shares: result.shares,
      },
    });
  } catch (error) {
    console.error('[API] Unstake/Withdraw operation failed:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Operation failed';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

