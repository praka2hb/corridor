import { NextRequest, NextResponse } from 'next/server';
import { getKaminoApiClient } from '@/lib/kamino-api-client';

/**
 * GET /api/investments/strategies
 * List allowlisted Kamino investment strategies with current APYs
 * Phase 2: Using server-side API client without WASM dependencies
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') || 'kamino';
    const type = searchParams.get('type') || 'lend'; // 'lend' or 'stake'

    if (provider !== 'kamino') {
      return NextResponse.json(
        { success: false, error: 'Only Kamino provider supported currently' },
        { status: 400 }
      );
    }

    // Use Kamino Lend reserves for lending
    if (type === 'lend') {
      // Fetch reserves using the new API client (no WASM!)
      const apiClient = getKaminoApiClient();
      const reserves = await apiClient.fetchReserves();

      // Map to strategy format expected by frontend
      const strategies = reserves.map(reserve => ({
        id: reserve.mint,
        provider: 'kamino' as const,
        strategyId: reserve.mint,
        symbol: reserve.symbol,
        asset: reserve.symbol,
        apy: reserve.supplyAPY,
        riskLabel: getRiskLabel(reserve.symbol),
        status: 'active' as const,
        allowlisted: true,
        tokenMint: reserve.mint,
        borrowAPY: reserve.borrowAPY,
        utilizationRate: reserve.utilizationRate,
        totalDeposits: reserve.totalSupply,
        availableLiquidity: reserve.availableLiquidity,
        cTokenMint: reserve.cTokenMint,
      }));

      return NextResponse.json({
        success: true,
        data: strategies,
      });
    }

    // Fall back to legacy staking strategies
    const mockLegacyStrategies = [
      {
        id: 'legacy-usdc-1',
        provider: 'kamino' as const,
        strategyId: 'legacy-usdc-1',
        symbol: 'USDC',
        asset: 'USDC',
        apy: 7.5,
        riskLabel: 'Low',
        status: 'active' as const,
        allowlisted: true,
        tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      },
    ];

    return NextResponse.json({
      success: true,
      data: mockLegacyStrategies,
    });
  } catch (error) {
    console.error('[API] Failed to fetch investment strategies:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch investment strategies',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to determine risk label based on asset
 */
function getRiskLabel(symbol: string): string {
  switch (symbol) {
    case 'USDC':
    case 'USDT':
      return 'Low';
    case 'SOL':
    case 'mSOL':
    case 'JitoSOL':
      return 'Low-Medium';
    default:
      return 'Medium';
  }
}

