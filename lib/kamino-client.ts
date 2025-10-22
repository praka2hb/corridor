/**
 * Kamino Finance API Client
 * Low-level HTTP client for Kamino Finance public API
 * Docs: https://github.com/Kamino-Finance/kamino-api-docs
 */

import { featureFlags } from './feature-flags';
import type { KaminoStakingYield } from './types/kamino';

const KAMINO_API_BASE = featureFlags.kamino.apiBase;

export class KaminoClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'KaminoClientError';
  }
}

/**
 * Fetch staking yields from Kamino v2 API
 * GET https://api.kamino.finance/v2/staking-yields
 */
export async function getStakingYields(): Promise<KaminoStakingYield[]> {
  try {
    const response = await fetch(`${KAMINO_API_BASE}/v2/staking-yields`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Cache for 5 minutes
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new KaminoClientError(
        `Failed to fetch staking yields`,
        response.status
      );
    }

    const data = await response.json();
    return data as KaminoStakingYield[];
  } catch (error) {
    if (error instanceof KaminoClientError) {
      throw error;
    }
    throw new KaminoClientError(
      'Failed to fetch staking yields from Kamino',
      500,
      error
    );
  }
}

/**
 * Fetch median staking yields from Kamino v2 API
 * GET https://api.kamino.finance/v2/staking-yields/median
 */
export async function getMedianStakingYield(): Promise<{ apy: string }> {
  try {
    const response = await fetch(`${KAMINO_API_BASE}/v2/staking-yields/median`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new KaminoClientError(
        `Failed to fetch median staking yield`,
        response.status
      );
    }

    const data = await response.json();
    return data as { apy: string };
  } catch (error) {
    if (error instanceof KaminoClientError) {
      throw error;
    }
    throw new KaminoClientError(
      'Failed to fetch median staking yield from Kamino',
      500,
      error
    );
  }
}

/**
 * Get strategy metadata (placeholder - extend when needed)
 */
export async function getStrategyMeta(strategyId: string): Promise<unknown> {
  // TODO: Implement when Kamino provides a dedicated strategy details endpoint
  // For now, return a placeholder
  return {
    strategyId,
    placeholder: true,
  };
}

