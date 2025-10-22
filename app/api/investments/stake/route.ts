import { NextRequest, NextResponse } from 'next/server';
import { buildAndSendStakeTx, buildAndSendDepositTx } from '@/lib/kamino-service';

/**
 * POST /api/investments/stake
 * Deposit into Kamino Lend reserve (or legacy stake)
 * 
 * Body: 
 * - New format: { employeeId, assetSymbol, amount, idempotencyKey }
 * - Legacy format: { employeeId, strategyId, amount, idempotencyKey }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, assetSymbol, strategyId, amount, idempotencyKey } = body;

    // Validation
    if (!employeeId || !amount || !idempotencyKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: employeeId, amount, idempotencyKey',
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

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Enforce min/max limits
    const MIN_STAKE = 1; // 1 USDC
    const MAX_STAKE = 10000; // 10k USDC per transaction

    if (amount < MIN_STAKE || amount > MAX_STAKE) {
      return NextResponse.json(
        {
          success: false,
          error: `Amount must be between ${MIN_STAKE} and ${MAX_STAKE}`,
        },
        { status: 400 }
      );
    }

    // TODO: Check idempotency key in cache/DB to prevent duplicates

    // Use new deposit flow for Kamino Lend
    if (assetSymbol) {
      const result = await buildAndSendDepositTx({
        employeeId,
        assetSymbol,
        amount,
        idempotencyKey,
      });

      return NextResponse.json({
        success: true,
        data: {
          txSig: result.txSig,
          positionId: result.positionId,
          receiptTokenMint: result.receiptTokenMint,
          shares: result.shares,
        },
      });
    }

    // Legacy stake flow
    const result = await buildAndSendStakeTx({
      employeeId,
      strategyId: strategyId!,
      amount,
      idempotencyKey,
    });

    return NextResponse.json({
      success: true,
      data: {
        txSig: result.txSig,
        positionId: result.positionId,
        receiptTokenMint: result.receiptTokenMint,
        shares: result.shares,
      },
    });
  } catch (error) {
    console.error('[API] Stake/Deposit operation failed:', error);
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

