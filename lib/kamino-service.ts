/**
 * Kamino Finance Service
 * High-level business logic for Kamino lending operations
 */

import { db } from './db';
import { getStakingYields } from './kamino-client';
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { 
  KaminoMarket, 
  KaminoAction, 
  VanillaObligation 
} from '@kamino-finance/klend-sdk';
import { config, getKaminoMarketAddress } from './config';
import { getAssociatedTokenAddress } from '@solana/spl-token';
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
 * Helper function to create a no-op signer for unsigned transactions
 * (transactions to be signed by the client)
 */
function noopSigner(addr: string): any {
  const signer = {
    address: addr,
    async signTransactions(): Promise<readonly any[]> {
      return [];
    },
  };
  return signer;
}

/**
 * Helper function to convert SDK Instruction to web3.js TransactionInstruction
 */
function convertInstructionToWeb3js(ix: any): TransactionInstruction {
  // AccountRole values: READONLY = 0, WRITABLE = 1, READONLY_SIGNER = 2, WRITABLE_SIGNER = 3
  return new TransactionInstruction({
    keys: ix.accounts?.map((acc: any) => ({
      pubkey: new PublicKey(acc.address),
      isSigner: acc.role === 2 || acc.role === 3,
      isWritable: acc.role === 1 || acc.role === 3,
    })) || [],
    programId: new PublicKey(ix.programAddress),
    data: ix.data ? Buffer.from(ix.data) : Buffer.alloc(0),
  });
}

/**
 * Helper function to create RPC-like object from Connection
 * The SDK expects an RPC object but we'll pass the Connection directly
 * since KaminoMarket.load() accepts both
 */
function getRpcOrConnection(connection: Connection): any {
  // Return the connection - the SDK can work with it
  return connection;
}

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
 * Build deposit transaction using Kamino Lend SDK
 * Returns serialized transaction for employee to sign with their wallet
 */
export async function buildAndSendDepositTx(
  params: DepositParams & { employeeWallet: string }
): Promise<{
  serializedTransaction: string;
  obligationAddress?: string;
  kTokenMint: string;
  reserveAddress: string;
  blockhashExpiry: number;
}> {
  try {
    // Validate employee exists
    const employee = await db.employeeProfile.findUnique({
      where: { id: params.employeeId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    if (!params.employeeWallet) {
      throw new Error('Employee wallet address is required');
    }

    // Validate minimum deposit amount
    const MIN_DEPOSIT = 0.01;
    if (params.amount < MIN_DEPOSIT) {
      throw new Error(`Minimum deposit is ${MIN_DEPOSIT} ${params.assetSymbol}`);
    }

    // Initialize Solana connection and RPC
    const connection = new Connection(config.solana.rpcEndpoint, {
      commitment: config.solana.commitment,
    });
    const rpc = createRpcFromConnection(connection);

    const employeeWalletPubkey = new PublicKey(params.employeeWallet);
    const employeeWalletAddress = address(params.employeeWallet);

    // Map asset symbols to known mint addresses
    const assetMints: Record<string, { mint: string; decimals: number }> = {
      'USDC': {
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        decimals: 6,
      },
      'SOL': {
        mint: 'So11111111111111111111111111111111111111112',
        decimals: 9,
      },
      'mSOL': {
        mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
        decimals: 9,
      },
      'JitoSOL': {
        mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
        decimals: 9,
      },
    };

    const assetInfo = assetMints[params.assetSymbol];
    if (!assetInfo) {
      throw new Error(`Unsupported asset: ${params.assetSymbol}`);
    }

    const assetMint = new PublicKey(assetInfo.mint);

    // Check employee has sufficient balance
    const employeeTokenAccount = await getAssociatedTokenAddress(
      assetMint,
      employeeWalletPubkey,
      true
    );

    const tokenAccountInfo = await connection.getAccountInfo(employeeTokenAccount);
    if (!tokenAccountInfo) {
      throw new Error(`No ${params.assetSymbol} token account found for employee`);
    }

    console.log('[Kamino Service] Loading Kamino market:', getKaminoMarketAddress());

    // Load Kamino market
    const marketAddress = address(getKaminoMarketAddress());
    const market = await KaminoMarket.load(
      rpc,
      marketAddress,
      50 // DEFAULT_RECENT_SLOT_DURATION_MS value
    );

    if (!market) {
      throw new Error('Failed to load Kamino market');
    }

    // Load reserves
    await market.loadReserves();

    // Get the reserve for the asset
    const assetMintAddress = address(assetInfo.mint);
    const reserve = market.getReserveByMint(assetMintAddress);
    if (!reserve) {
      throw new Error(`Reserve not found for ${params.assetSymbol}`);
    }

    console.log('[Kamino Service] Reserve found:', {
      symbol: params.assetSymbol,
      address: reserve.address.toString(),
      // availableLiquidity: reserve.stats.availableLiquidity.toString(), // TODO: Check if stats property exists
    });

    // Check if market is paused for deposits
    if (reserve.state.config.depositLimit.toNumber() === 0) {
      throw new Error('Kamino market is paused for deposits');
    }

    // Check if employee has existing obligation
    const programAddress = address(market.programId.toString());
    const vanillaObligation = new VanillaObligation(programAddress);
    let obligation = await market.getObligationByWallet(employeeWalletAddress, vanillaObligation);
    let obligationAddress: string;

    if (!obligation) {
      console.log('[Kamino Service] No existing obligation found, will create new one');
      // Obligation will be created as part of the deposit transaction
      // Derive the PDA address for tracking
      const obligationPda = await vanillaObligation.toPda(marketAddress, employeeWalletAddress);
      obligationAddress = obligationPda.toString();
    } else {
      obligationAddress = obligation.obligationAddress.toString();
      console.log('[Kamino Service] Using existing obligation:', obligationAddress);
    }

    // Convert amount to lamports/smallest unit
    const amountLamports = Math.floor(params.amount * Math.pow(10, assetInfo.decimals));

    console.log('[Kamino Service] Building deposit instructions:', {
      amount: params.amount,
      amountLamports,
      asset: params.assetSymbol,
      obligation: obligationAddress,
    });

    // Build deposit instructions using Kamino SDK
    const ownerSigner = noopSigner(employeeWalletAddress);
    
    const depositAction = await KaminoAction.buildDepositTxns(
      market,
      amountLamports.toString(),
      assetMintAddress,
      ownerSigner,
      obligation || vanillaObligation, // Use VanillaObligation if no existing obligation
      true, // useV2Ixs - use V2 instructions for better efficiency
      undefined, // scopeRefreshConfig - no custom scope refresh needed
      0, // extraComputeBudget - no extra compute budget
      true // includeAtaIxs - include ATA creation if needed
    );

    // Create transaction from instructions
    // Convert @solana/kit instructions to @solana/web3.js TransactionInstructions
    const transaction = new Transaction();
    const allInstructions = KaminoAction.actionToIxs(depositAction);
    allInstructions.forEach((ix) => {
      const webIx = convertInstructionToWeb3js(ix);
      transaction.add(webIx);
    });

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(
      config.solana.commitment
    );
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = employeeWalletPubkey;

    // Serialize transaction for employee to sign
    const serializedTransaction = transaction
      .serialize({ requireAllSignatures: false, verifySignatures: false })
      .toString('base64');

    // Get kToken mint (receipt token)
    const kTokenMint = reserve.state.collateral.mintPubkey.toString();

    console.log('[Kamino Service] Transaction prepared:', {
      obligationAddress,
      kTokenMint,
      reserveAddress: reserve.address.toString(),
      blockhash,
      lastValidBlockHeight,
    });

    // Store transaction metadata in database for confirmation later
    await db.providerLedger.create({
      data: {
        employeeId: params.employeeId,
        provider: 'kamino',
        type: 'stake',
        strategyId: assetInfo.mint,
        amount: params.amount,
        status: 'pending',
        metadata: JSON.stringify({
          txPreparedAt: new Date().toISOString(),
          employeeWallet: params.employeeWallet,
          obligationAddress,
          kTokenMint,
          reserveAddress: reserve.address.toString(),
          blockhash,
          lastValidBlockHeight,
          assetSymbol: params.assetSymbol,
        }),
      },
    });

    return {
      serializedTransaction,
      obligationAddress,
      kTokenMint,
      reserveAddress: reserve.address.toString(),
      blockhashExpiry: lastValidBlockHeight,
    };
  } catch (error) {
    console.error('[Kamino Service] Deposit failed:', error);
    throw new Error(`Deposit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Build withdraw transaction using Kamino Lend SDK
 * Returns serialized transaction for employee to sign with their wallet
 */
export async function buildAndSendWithdrawTx(
  params: WithdrawParams & { employeeWallet: string }
): Promise<{
  serializedTransaction: string;
  obligationAddress: string;
  withdrawAmount: number;
  blockhashExpiry: number;
}> {
  try {
    // Validate employee exists
    const employee = await db.employeeProfile.findUnique({
      where: { id: params.employeeId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    if (!params.employeeWallet) {
      throw new Error('Employee wallet address is required');
    }

    // Initialize Solana connection and RPC
    const connection = new Connection(config.solana.rpcEndpoint, {
      commitment: config.solana.commitment,
    });
    const rpc = createRpcFromConnection(connection);

    const employeeWalletPubkey = new PublicKey(params.employeeWallet);
    const employeeWalletAddress = address(params.employeeWallet);

    // Map asset symbols to known mint addresses
    const assetMints: Record<string, { mint: string; decimals: number }> = {
      'USDC': {
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        decimals: 6,
      },
      'SOL': {
        mint: 'So11111111111111111111111111111111111111112',
        decimals: 9,
      },
      'mSOL': {
        mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
        decimals: 9,
      },
      'JitoSOL': {
        mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
        decimals: 9,
      },
    };

    const assetInfo = assetMints[params.assetSymbol];
    if (!assetInfo) {
      throw new Error(`Unsupported asset: ${params.assetSymbol}`);
    }

    const assetMintAddress = address(assetInfo.mint);

    console.log('[Kamino Service] Loading Kamino market for withdrawal');

    // Load Kamino market
    const marketAddress = address(getKaminoMarketAddress());
    const market = await KaminoMarket.load(
      rpc,
      marketAddress,
      50 // DEFAULT_RECENT_SLOT_DURATION_MS value
    );

    if (!market) {
      throw new Error('Failed to load Kamino market');
    }

    // Load reserves
    await market.loadReserves();

    // Get the reserve for the asset
    const reserve = market.getReserveByMint(assetMintAddress);
    if (!reserve) {
      throw new Error(`Reserve not found for ${params.assetSymbol}`);
    }

    // Get employee's obligation
    const programAddress = address(market.programId.toString());
    const vanillaObligation = new VanillaObligation(programAddress);
    const obligation = await market.getObligationByWallet(employeeWalletAddress, vanillaObligation);
    if (!obligation) {
      throw new Error('No obligation found for employee. Nothing to withdraw.');
    }

    const obligationAddress = obligation.obligationAddress.toString();

    // Get deposited balance from obligation
    const depositPosition = obligation.getDepositByReserve(reserve.address);
    if (!depositPosition || depositPosition.amount.isZero()) {
      throw new Error(`No ${params.assetSymbol} deposits found in obligation`);
    }

    const depositedBalanceLamports = depositPosition.amount.toNumber();

    console.log('[Kamino Service] Current deposited balance:', {
      asset: params.assetSymbol,
      balance: depositedBalanceLamports,
      obligationAddress,
    });

    // Determine withdrawal amount
    let withdrawAmountLamports: number;
    if (params.amount) {
      withdrawAmountLamports = Math.floor(params.amount * Math.pow(10, assetInfo.decimals));
    } else if (params.shares) {
      withdrawAmountLamports = params.shares;
    } else {
      // Withdraw all
      withdrawAmountLamports = depositedBalanceLamports;
    }

    // Validate sufficient balance
    if (withdrawAmountLamports > depositedBalanceLamports) {
      throw new Error('Insufficient deposited balance for withdrawal');
    }

    // Note: Reserve liquidity check would require accessing reserve.stats which may have changed in v2
    // For now, we'll let the transaction fail if there's insufficient liquidity

    // Check for active borrows that might prevent withdrawal
    if (obligation.borrows && obligation.borrows.size > 0) {
      console.warn('[Kamino Service] Obligation has active borrows, withdrawal may be restricted');
    }

    console.log('[Kamino Service] Building withdraw instructions:', {
      amount: withdrawAmountLamports / Math.pow(10, assetInfo.decimals),
      amountLamports: withdrawAmountLamports,
      asset: params.assetSymbol,
      obligation: obligationAddress,
    });

    // Build withdraw instructions using Kamino SDK
    const ownerSigner = noopSigner(employeeWalletAddress);
    
    const withdrawAction = await KaminoAction.buildWithdrawTxns(
      market,
      withdrawAmountLamports.toString(),
      assetMintAddress,
      ownerSigner,
      obligation,
      true, // useV2Ixs - use V2 instructions for better efficiency
      undefined, // scopeRefreshConfig - no custom scope refresh needed
      0, // extraComputeBudget - no extra compute budget
      true // includeAtaIxs - include ATA creation if needed
    );

    // Create transaction from instructions
    // Convert @solana/kit instructions to @solana/web3.js TransactionInstructions
    const transaction = new Transaction();
    const allInstructions = KaminoAction.actionToIxs(withdrawAction);
    allInstructions.forEach((ix) => {
      const webIx = convertInstructionToWeb3js(ix);
      transaction.add(webIx);
    });

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(
      config.solana.commitment
    );
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = employeeWalletPubkey;

    // Serialize transaction for employee to sign
    const serializedTransaction = transaction
      .serialize({ requireAllSignatures: false, verifySignatures: false })
      .toString('base64');

    const withdrawAmount = withdrawAmountLamports / Math.pow(10, assetInfo.decimals);

    console.log('[Kamino Service] Withdrawal transaction prepared:', {
      obligationAddress,
      withdrawAmount,
      blockhash,
      lastValidBlockHeight,
    });

    // Store transaction metadata in database for confirmation later
    await db.providerLedger.create({
      data: {
        employeeId: params.employeeId,
        provider: 'kamino',
        type: 'unstake',
        strategyId: assetInfo.mint,
        amount: withdrawAmount,
        status: 'pending',
        metadata: JSON.stringify({
          txPreparedAt: new Date().toISOString(),
          employeeWallet: params.employeeWallet,
          obligationAddress,
          reserveAddress: reserve.address.toString(),
          blockhash,
          lastValidBlockHeight,
          assetSymbol: params.assetSymbol,
        }),
      },
    });

    return {
      serializedTransaction,
      obligationAddress,
      withdrawAmount,
      blockhashExpiry: lastValidBlockHeight,
    };
  } catch (error) {
    console.error('[Kamino Service] Withdraw failed:', error);
    throw new Error(`Withdraw failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

