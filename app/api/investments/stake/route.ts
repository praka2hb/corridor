import { NextRequest, NextResponse } from 'next/server';
import { buildAndSendStakeTx, buildAndSendDepositTx } from '@/lib/kamino-service';
import { db } from '@/lib/db';

/**
 * POST /api/investments/stake
 * Prepare Kamino Lend deposit transaction for employee to sign
 * 
 * Body: 
 * - New format: { employeeId, assetSymbol, amount, idempotencyKey, employeeWallet }
 * - Legacy format: { employeeId, strategyId, amount, idempotencyKey }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, assetSymbol, strategyId, amount, idempotencyKey, employeeWallet } = body;

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
    const MIN_STAKE = 0.01; // 0.01 USDC minimum
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
      if (!employeeWallet) {
        return NextResponse.json(
          {
            success: false,
            error: 'employeeWallet is required for Kamino Lend deposits',
          },
          { status: 400 }
        );
      }

      // Build transaction for employee to sign
      const result = await buildAndSendDepositTx({
        employeeId,
        assetSymbol,
        amount,
        idempotencyKey,
        employeeWallet,
      });

      // Find the ledger entry we just created
      const ledgerEntry = await db.providerLedger.findFirst({
        where: {
          employeeId,
          provider: 'kamino',
          type: 'stake',
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
          kTokenMint: result.kTokenMint,
          reserveAddress: result.reserveAddress,
          blockhashExpiry: result.blockhashExpiry,
          ledgerId: ledgerEntry?.id,
          amount,
          assetSymbol,
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

