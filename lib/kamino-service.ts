/**
 * Kamino Finance Service
 * High-level business logic for Kamino lending operations
 */

import { db } from './db';
import { getStakingYields } from './kamino-client';
import type {
  KaminoStrategy,
  StakeParams,
  UnstakeParams,
  StakeResult,
  EmployeePositionSummary,
  DepositParams,
  WithdrawParams,
} from './types/kamino';

/**
 * List allowlisted Kamino strategies with current APYs
 */
export async function listAllowlistedStrategies(): Promise<KaminoStrategy[]> {
  try {
    // Fetch current APYs from Kamino API
    const yields = await getStakingYields();

    // Get allowlisted strategies from DB
    const strategies = await db.investmentStrategy.findMany({
      where: {
        provider: 'kamino',
        allowlisted: true,
        status: 'active',
      },
    });

    // Merge APYs with our strategies
    const merged = strategies.map((strategy) => {
      const yieldData = yields.find((y) => y.tokenMint === strategy.strategyId);
      return {
        id: strategy.id,
        provider: 'kamino' as const,
        strategyId: strategy.strategyId,
        symbol: strategy.symbol,
        asset: strategy.asset,
        apy: yieldData ? parseFloat(yieldData.apy) * 100 : strategy.apy || 0,
        riskLabel: strategy.riskLabel || undefined,
        status: strategy.status as 'active' | 'inactive',
        allowlisted: strategy.allowlisted,
        tokenMint: strategy.strategyId,
      };
    });

    return merged;
  } catch (error) {
    console.error('[Kamino Service] Failed to list allowlisted strategies:', error);
    throw new Error('Failed to fetch Kamino strategies');
  }
}

/**
 * Quote stake operation (placeholder - extend with actual pricing)
 */
export async function quoteStake(params: {
  strategyId: string;
  amount: number;
}): Promise<{ estimatedShares: number; fee: number }> {
  // TODO: Integrate with Kamino simulator/pricing endpoints when available
  // For now, return a simple 1:1 estimate
  return {
    estimatedShares: params.amount,
    fee: 0,
  };
}

/**
 * Build and send stake transaction
 * Note: This is a placeholder. Actual implementation requires:
 * - Solana transaction building
 * - Kamino program interaction
 * - Proper signer/treasury management
 */
export async function buildAndSendStakeTx(
  params: StakeParams
): Promise<StakeResult> {
  // Validate employee exists
  const employee = await db.employeeProfile.findUnique({
    where: { id: params.employeeId },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  // Validate strategy is allowlisted
  const strategy = await db.investmentStrategy.findFirst({
    where: {
      strategyId: params.strategyId,
      provider: 'kamino',
      allowlisted: true,
      status: 'active',
    },
  });

  if (!strategy) {
    throw new Error('Strategy not found or not allowlisted');
  }

  // TODO: Build and send actual Solana transaction to Kamino program
  // For now, create a mock transaction signature
  const mockTxSig = `stake_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const shares = params.amount; // 1:1 for now

  // Record in provider ledger
  await db.providerLedger.create({
    data: {
      employeeId: params.employeeId,
      provider: 'kamino',
      type: 'stake',
      strategyId: params.strategyId,
      amount: params.amount,
      txSig: mockTxSig,
      status: 'pending', // Will be updated by webhook/polling
    },
  });

  // Upsert employee position
  await db.employeePosition.upsert({
    where: {
      employeeId_provider_strategyId: {
        employeeId: params.employeeId,
        provider: 'kamino',
        strategyId: params.strategyId,
      },
    },
    create: {
      employeeId: params.employeeId,
      provider: 'kamino',
      strategyId: params.strategyId,
      shares,
      receiptTokenMint: strategy.strategyId, // Mock: use tokenMint as receipt
    },
    update: {
      shares: {
        increment: shares,
      },
    },
  });

  return {
    txSig: mockTxSig,
    receiptTokenMint: strategy.strategyId,
    shares,
  };
}

/**
 * Build and send unstake transaction
 */
export async function buildAndSendUnstakeTx(
  params: UnstakeParams
): Promise<StakeResult> {
  // Validate employee position
  const position = await db.employeePosition.findUnique({
    where: {
      employeeId_provider_strategyId: {
        employeeId: params.employeeId,
        provider: 'kamino',
        strategyId: params.strategyId,
      },
    },
  });

  if (!position) {
    throw new Error('Position not found');
  }

  const sharesToUnstake = params.shares || position.shares;

  if (sharesToUnstake > position.shares) {
    throw new Error('Insufficient shares');
  }

  // TODO: Build and send actual Solana unstake transaction
  const mockTxSig = `unstake_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Record in provider ledger
  await db.providerLedger.create({
    data: {
      employeeId: params.employeeId,
      provider: 'kamino',
      type: 'unstake',
      strategyId: params.strategyId,
      amount: sharesToUnstake,
      txSig: mockTxSig,
      status: 'pending',
    },
  });

  // Update employee position
  await db.employeePosition.update({
    where: {
      employeeId_provider_strategyId: {
        employeeId: params.employeeId,
        provider: 'kamino',
        strategyId: params.strategyId,
      },
    },
    data: {
      shares: {
        decrement: sharesToUnstake,
      },
    },
  });

  return {
    txSig: mockTxSig,
    shares: sharesToUnstake,
  };
}

/**
 * Get employee positions with estimated values
 */
export async function getPositionsForEmployee(
  employeeId: string
): Promise<EmployeePositionSummary[]> {
  const positions = await db.employeePosition.findMany({
    where: {
      employeeId,
      provider: 'kamino',
    },
  });

  const strategies = await db.investmentStrategy.findMany({
    where: {
      provider: 'kamino',
    },
  });

  const summary: EmployeePositionSummary[] = positions.map((pos) => {
    const strategy = strategies.find((s) => s.strategyId === pos.strategyId);
    const apy: number | undefined = strategy?.apy == null ? undefined : strategy.apy;
    return {
      employeeId: pos.employeeId,
      provider: pos.provider,
      strategyId: pos.strategyId,
      symbol: strategy?.symbol || 'UNKNOWN',
      shares: pos.shares,
      estimatedValue: pos.shares, // 1:1 for now, TODO: fetch actual NAV
      ...(apy !== undefined ? { apy } : {}),
    };
  });

  return summary;
}

/**
 * Build and send deposit transaction using Kamino Lend SDK
 * Phase 1: Server-side version without SDK calls to avoid WASM issues
 * Client provides reserve data from client-side SDK
 */
export async function buildAndSendDepositTx(
  params: DepositParams
): Promise<StakeResult> {
  try {
    // Validate employee exists
    const employee = await db.employeeProfile.findUnique({
      where: { id: params.employeeId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Map asset symbols to known mint addresses
    // In Phase 2, we'll get this from API
    const assetMints: Record<string, { mint: string; cTokenMint: string; decimals: number }> = {
      'USDC': {
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        cTokenMint: 'Amig8TisuLpzun8XyGfC5HJHHGUQEscjLgoTWsCCKihg', // kUSDC
        decimals: 6,
      },
      'SOL': {
        mint: 'So11111111111111111111111111111111111111112',
        cTokenMint: 'Bqfgxk8nqhUr9V6LoJmHH8ZSUDqnS1hJq5dYgNQpWCQc', // kSOL
        decimals: 9,
      },
      'mSOL': {
        mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
        cTokenMint: '4xTaW9BqSCnPbRqKFcBqEKdaX6JDuufqLCj1J8gqKt9G', // kmSOL
        decimals: 9,
      },
      'JitoSOL': {
        mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
        cTokenMint: 'HxLEyiRDLYRxLJWVoZ9KvwYHGbMVdV8quXL91QsNtqKg', // kJitoSOL
        decimals: 9,
      },
    };

    const assetInfo = assetMints[params.assetSymbol];
    if (!assetInfo) {
      throw new Error(`Unsupported asset: ${params.assetSymbol}`);
    }

    // TEMPORARY: For development, we'll create a mock transaction
    // TODO: Implement Squads multisig proposal creation
    const mockTxSig = `deposit_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    console.log('[Kamino Service] Deposit transaction (mock):', {
      employee: params.employeeId,
      asset: params.assetSymbol,
      amount: params.amount,
      mint: assetInfo.mint,
    });

    // Calculate shares (cToken amount)
    // This is approximate - actual shares will be determined on-chain
    const shares = params.amount;

    // Record in provider ledger
    await db.providerLedger.create({
      data: {
        employeeId: params.employeeId,
        provider: 'kamino',
        type: 'stake',
        strategyId: assetInfo.mint,
        amount: params.amount,
        txSig: mockTxSig,
        status: 'pending',
      },
    });

    // Upsert employee position
    await db.employeePosition.upsert({
      where: {
        employeeId_provider_strategyId: {
          employeeId: params.employeeId,
          provider: 'kamino',
          strategyId: assetInfo.mint,
        },
      },
      create: {
        employeeId: params.employeeId,
        provider: 'kamino',
        strategyId: assetInfo.mint,
        shares,
        receiptTokenMint: assetInfo.cTokenMint,
      },
      update: {
        shares: {
          increment: shares,
        },
      },
    });

    return {
      txSig: mockTxSig,
      receiptTokenMint: assetInfo.cTokenMint,
      shares,
    };
  } catch (error) {
    console.error('[Kamino Service] Deposit failed:', error);
    throw new Error(`Deposit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Build and send withdraw transaction using Kamino Lend SDK
 * Phase 1: Server-side version without SDK calls to avoid WASM issues
 */
export async function buildAndSendWithdrawTx(
  params: WithdrawParams
): Promise<StakeResult> {
  try {
    // Map asset symbols to known mint addresses
    const assetMints: Record<string, { mint: string; cTokenMint: string; decimals: number }> = {
      'USDC': {
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        cTokenMint: 'Amig8TisuLpzun8XyGfC5HJHHGUQEscjLgoTWsCCKihg',
        decimals: 6,
      },
      'SOL': {
        mint: 'So11111111111111111111111111111111111111112',
        cTokenMint: 'Bqfgxk8nqhUr9V6LoJmHH8ZSUDqnS1hJq5dYgNQpWCQc',
        decimals: 9,
      },
      'mSOL': {
        mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
        cTokenMint: '4xTaW9BqSCnPbRqKFcBqEKdaX6JDuufqLCj1J8gqKt9G',
        decimals: 9,
      },
      'JitoSOL': {
        mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
        cTokenMint: 'HxLEyiRDLYRxLJWVoZ9KvwYHGbMVdV8quXL91QsNtqKg',
        decimals: 9,
      },
    };

    const assetInfo = assetMints[params.assetSymbol];
    if (!assetInfo) {
      throw new Error(`Unsupported asset: ${params.assetSymbol}`);
    }

    // Validate employee position
    const position = await db.employeePosition.findUnique({
      where: {
        employeeId_provider_strategyId: {
          employeeId: params.employeeId,
          provider: 'kamino',
          strategyId: assetInfo.mint,
        },
      },
    });

    if (!position) {
      throw new Error('Position not found');
    }

    const sharesToWithdraw = params.shares || position.shares;

    if (sharesToWithdraw > position.shares) {
      throw new Error('Insufficient shares');
    }

    // Validate employee exists
    const employee = await db.employeeProfile.findUnique({
      where: { id: params.employeeId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // TEMPORARY: Mock transaction for development
    const mockTxSig = `withdraw_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    console.log('[Kamino Service] Withdraw transaction (mock):', {
      employee: params.employeeId,
      asset: params.assetSymbol,
      amount: params.amount || sharesToWithdraw,
      mint: assetInfo.mint,
    });

    // Record in provider ledger
    await db.providerLedger.create({
      data: {
        employeeId: params.employeeId,
        provider: 'kamino',
        type: 'unstake',
        strategyId: assetInfo.mint,
        amount: sharesToWithdraw,
        txSig: mockTxSig,
        status: 'pending',
      },
    });

    // Update employee position
    await db.employeePosition.update({
      where: {
        employeeId_provider_strategyId: {
          employeeId: params.employeeId,
          provider: 'kamino',
          strategyId: assetInfo.mint,
        },
      },
      data: {
        shares: {
          decrement: sharesToWithdraw,
        },
      },
    });

    return {
      txSig: mockTxSig,
      shares: sharesToWithdraw,
    };
  } catch (error) {
    console.error('[Kamino Service] Withdraw failed:', error);
    throw new Error(`Withdraw failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

