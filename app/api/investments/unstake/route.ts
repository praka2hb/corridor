import { NextRequest, NextResponse } from 'next/server';
import { buildAndSendUnstakeTx, buildAndSendWithdrawTx } from '@/lib/kamino-service';

/**
 * POST /api/investments/unstake
 * Withdraw from Kamino Lend reserve (or legacy unstake)
 * 
 * Body: 
 * - New format: { employeeId, assetSymbol, amount?, shares?, idempotencyKey }
 * - Legacy format: { employeeId, strategyId, shares?, amount?, idempotencyKey }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, assetSymbol, strategyId, shares, amount, idempotencyKey } = body;

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
      const result = await buildAndSendWithdrawTx({
        employeeId,
        assetSymbol,
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

