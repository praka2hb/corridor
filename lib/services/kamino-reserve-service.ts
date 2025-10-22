/**
 * Kamino Reserve Service
 * Fetches and formats reserve data from Kamino Lend markets
 */

import { KaminoReserve } from '@kamino-finance/klend-sdk';
import { getKaminoLendClient } from '../kamino-lend-client';
import Decimal from 'decimal.js';

export interface ReserveData {
  symbol: string;
  name: string;
  mintAddress: string;
  depositAPY: number;
  borrowAPY: number;
  totalDeposits: number;
  totalBorrows: number;
  utilizationRate: number;
  availableLiquidity: number;
  reserveAddress: string;
}

export class KaminoReserveServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'KaminoReserveServiceError';
  }
}

/**
 * Get all reserves from the market with formatted data
 */
export async function getAllReserves(): Promise<ReserveData[]> {
  try {
    const client = getKaminoLendClient();
    const reserves = await client.loadReserves();

    const formattedReserves = reserves.map(reserve => formatReserveData(reserve));
    
    // Filter out any reserves with invalid data
    return formattedReserves.filter(r => r !== null) as ReserveData[];
  } catch (error) {
    throw new KaminoReserveServiceError(
      'Failed to fetch all reserves',
      'FETCH_RESERVES_FAILED',
      error
    );
  }
}

/**
 * Get a specific reserve by symbol
 */
export async function getReserveBySymbol(symbol: string): Promise<ReserveData | null> {
  try {
    const client = getKaminoLendClient();
    const reserve = await client.getReserve(symbol);

    if (!reserve) {
      return null;
    }

    return formatReserveData(reserve);
  } catch (error) {
    throw new KaminoReserveServiceError(
      `Failed to fetch reserve for ${symbol}`,
      'FETCH_RESERVE_FAILED',
      error
    );
  }
}

/**
 * Format reserve data for API consumption
 */
function formatReserveData(reserve: KaminoReserve): ReserveData | null {
  try {
    const stats = reserve.stats;
    
    // Get APY values (convert from basis points if needed)
    const depositAPY = stats.depositApy ? Number(stats.depositApy) : 0;
    const borrowAPY = stats.borrowApy ? Number(stats.borrowApy) : 0;

    // Get total deposits and borrows
    const totalDeposits = stats.totalDepositsWads 
      ? Number(new Decimal(stats.totalDepositsWads.toString()).div(1e18)) 
      : 0;
    
    const totalBorrows = stats.totalBorrowsWads
      ? Number(new Decimal(stats.totalBorrowsWads.toString()).div(1e18))
      : 0;

    // Calculate utilization rate
    const utilizationRate = totalDeposits > 0 
      ? (totalBorrows / totalDeposits) * 100 
      : 0;

    // Available liquidity
    const availableLiquidity = totalDeposits - totalBorrows;

    return {
      symbol: reserve.symbol,
      name: reserve.symbol, // Use symbol as name for now
      mintAddress: reserve.getLiquidityMint().toString(),
      depositAPY,
      borrowAPY,
      totalDeposits,
      totalBorrows,
      utilizationRate,
      availableLiquidity,
      reserveAddress: reserve.address.toString(),
    };
  } catch (error) {
    console.error(`Failed to format reserve data for ${reserve.symbol}:`, error);
    return null;
  }
}

/**
 * Get allowlisted reserves only
 * Filters reserves based on a predefined allowlist
 */
export async function getAllowlistedReserves(
  allowedSymbols: string[] = ['USDC', 'SOL', 'mSOL', 'JitoSOL']
): Promise<ReserveData[]> {
  try {
    const allReserves = await getAllReserves();
    return allReserves.filter(r => allowedSymbols.includes(r.symbol));
  } catch (error) {
    throw new KaminoReserveServiceError(
      'Failed to fetch allowlisted reserves',
      'FETCH_ALLOWLISTED_FAILED',
      error
    );
  }
}

/**
 * Get reserve statistics summary
 */
export async function getReserveSummary(): Promise<{
  totalValueLocked: number;
  totalBorrowed: number;
  averageDepositAPY: number;
  reserveCount: number;
}> {
  try {
    const reserves = await getAllReserves();

    const totalValueLocked = reserves.reduce((sum, r) => sum + r.totalDeposits, 0);
    const totalBorrowed = reserves.reduce((sum, r) => sum + r.totalBorrows, 0);
    const averageDepositAPY = reserves.length > 0
      ? reserves.reduce((sum, r) => sum + r.depositAPY, 0) / reserves.length
      : 0;

    return {
      totalValueLocked,
      totalBorrowed,
      averageDepositAPY,
      reserveCount: reserves.length,
    };
  } catch (error) {
    throw new KaminoReserveServiceError(
      'Failed to calculate reserve summary',
      'SUMMARY_FAILED',
      error
    );
  }
}

