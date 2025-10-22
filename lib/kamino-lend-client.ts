/**
 * Kamino Lend Client
 * Wrapper around @kamino-finance/klend-sdk for lending operations
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { KaminoMarket, KaminoReserve, VanillaObligation } from '@kamino-finance/klend-sdk';
import { config, getKaminoMarketAddress } from './config';

export class KaminoLendClientError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'KaminoLendClientError';
  }
}

/**
 * Kamino Lend Client
 * Provides high-level interface to Kamino lending markets
 */
export class KaminoLendClient {
  private connection: Connection;
  private market: KaminoMarket | null = null;
  private marketAddress: PublicKey;
  private lastRefresh: number = 0;
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  constructor(rpcEndpoint?: string) {
    const endpoint = rpcEndpoint || config.solana.rpcEndpoint;
    this.connection = new Connection(endpoint, {
      commitment: config.solana.commitment,
    });
    this.marketAddress = new PublicKey(getKaminoMarketAddress());
  }

  /**
   * Load the Kamino market
   * Cached for CACHE_DURATION_MS
   */
  async loadMarket(force: boolean = false): Promise<KaminoMarket> {
    const now = Date.now();
    
    if (!force && this.market && (now - this.lastRefresh) < this.CACHE_DURATION_MS) {
      return this.market;
    }

    try {
      this.market = await KaminoMarket.load(
        this.connection,
        this.marketAddress,
        this.CACHE_DURATION_MS
      );
      this.lastRefresh = now;
      
      return this.market;
    } catch (error) {
      throw new KaminoLendClientError(
        'Failed to load Kamino market',
        'MARKET_LOAD_FAILED',
        error
      );
    }
  }

  /**
   * Load all reserves in the market
   */
  async loadReserves(): Promise<KaminoReserve[]> {
    try {
      const market = await this.loadMarket();
      await market.loadReserves();
      return market.reserves;
    } catch (error) {
      throw new KaminoLendClientError(
        'Failed to load market reserves',
        'RESERVES_LOAD_FAILED',
        error
      );
    }
  }

  /**
   * Get a specific reserve by symbol (e.g., "USDC", "SOL")
   */
  async getReserve(symbol: string): Promise<KaminoReserve | undefined> {
    try {
      const market = await this.loadMarket();
      return market.getReserve(symbol);
    } catch (error) {
      throw new KaminoLendClientError(
        `Failed to get reserve for ${symbol}`,
        'RESERVE_NOT_FOUND',
        error
      );
    }
  }

  /**
   * Get reserve by mint address
   */
  async getReserveByMint(mint: PublicKey): Promise<KaminoReserve | undefined> {
    try {
      const reserves = await this.loadReserves();
      return reserves.find(r => 
        r.getLiquidityMint().equals(mint)
      );
    } catch (error) {
      throw new KaminoLendClientError(
        'Failed to get reserve by mint',
        'RESERVE_BY_MINT_FAILED',
        error
      );
    }
  }

  /**
   * Get user's vanilla obligation
   * Creates a new obligation reference if one doesn't exist
   */
  async getUserVanillaObligation(
    walletPubkey: PublicKey
  ): Promise<VanillaObligation> {
    try {
      const market = await this.loadMarket();
      
      // Try to get existing obligation
      const obligation = await market.getUserVanillaObligation(walletPubkey);
      
      if (obligation) {
        return obligation;
      }

      // Return a new VanillaObligation instance
      // This will be created on-chain during the first deposit transaction
      return new VanillaObligation(market.programId);
    } catch (error) {
      throw new KaminoLendClientError(
        'Failed to get user obligation',
        'OBLIGATION_FETCH_FAILED',
        error
      );
    }
  }

  /**
   * Get all user obligations for a wallet
   */
  async getAllUserObligations(walletPubkey: PublicKey) {
    try {
      const market = await this.loadMarket();
      return await market.getAllUserObligations(walletPubkey);
    } catch (error) {
      throw new KaminoLendClientError(
        'Failed to get all user obligations',
        'ALL_OBLIGATIONS_FAILED',
        error
      );
    }
  }

  /**
   * Check if a reserve is used in an obligation
   */
  async isReserveInObligation(
    obligation: VanillaObligation,
    reserve: KaminoReserve
  ): Promise<boolean> {
    try {
      const market = await this.loadMarket();
      return market.isReserveInObligation(obligation, reserve);
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh market data (forces reload)
   */
  async refreshMarket(): Promise<KaminoMarket> {
    return this.loadMarket(true);
  }

  /**
   * Get the current connection
   */
  getConnection(): Connection {
    return this.connection;
  }

  /**
   * Get the market address
   */
  getMarketAddress(): PublicKey {
    return this.marketAddress;
  }

  /**
   * Get the cached market instance (may be null)
   */
  getCachedMarket(): KaminoMarket | null {
    return this.market;
  }
}

// Singleton instance
let kaminoLendClient: KaminoLendClient | null = null;

/**
 * Get or create the Kamino Lend client instance
 */
export function getKaminoLendClient(rpcEndpoint?: string): KaminoLendClient {
  if (!kaminoLendClient || rpcEndpoint) {
    kaminoLendClient = new KaminoLendClient(rpcEndpoint);
  }
  return kaminoLendClient;
}

