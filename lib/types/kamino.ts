/**
 * Kamino Finance Types
 */

export interface KaminoStakingYield {
  apy: string;
  tokenMint: string;
}

export interface KaminoStrategy {
  id: string;
  provider: 'kamino';
  strategyId: string;
  symbol: string;
  asset: string;
  apy: number;
  riskLabel?: string;
  status: 'active' | 'inactive';
  allowlisted: boolean;
  tokenMint?: string;
}

export interface StakeParams {
  employeeId: string;
  strategyId: string;
  amount: number;
  idempotencyKey: string;
}

export interface UnstakeParams {
  employeeId: string;
  strategyId: string;
  shares?: number;
  amount?: number;
  idempotencyKey: string;
}

export interface StakeResult {
  txSig: string;
  positionId?: string;
  receiptTokenMint?: string;
  shares: number;
}

export interface EmployeePositionSummary {
  employeeId: string;
  provider: string;
  strategyId: string;
  symbol: string;
  shares: number;
  estimatedValue: number;
  apy?: number;
}

// Kamino Lend specific types

export interface DepositParams {
  employeeId: string;
  assetSymbol: string; // e.g., "USDC", "SOL"
  amount: number;
  idempotencyKey: string;
}

export interface WithdrawParams {
  employeeId: string;
  assetSymbol: string;
  amount?: number; // Optional, if not provided, withdraw all
  shares?: number; // Alternative: withdraw by shares
  idempotencyKey: string;
}

export interface LendingPosition {
  employeeId: string;
  assetSymbol: string;
  mintAddress: string;
  depositShares: number; // cToken balance
  depositValue: number; // USD value
  apy: number;
  lastSyncedAt?: Date;
}

export interface ReserveMetadata {
  symbol: string;
  mintAddress: string;
  depositAPY: number;
  borrowAPY: number;
  totalDeposits: number;
  utilizationRate: number;
  availableLiquidity: number;
}

