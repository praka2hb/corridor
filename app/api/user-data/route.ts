import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { gridService } from '@/lib/services/grid-service';

export const runtime = 'nodejs';

// GET /api/user-data - Get current user data including username and balance
export async function GET(request: NextRequest) {
  try {
    // Get current user from JWT token
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('[UserData] Fetching data for user:', user.userId);
    console.log('[UserData] User account address (from JWT):', user.accountAddress);
    console.log('[UserData] Grid User ID:', user.gridUserId);

    // Fetch account balances from Solana (SOL + SPL tokens)
    let balances: any[] = [];
    try {
      const balanceResult = await gridService.getAccountBalances(user.accountAddress);
      console.log('[UserData] Balance result:', { 
        accountAddress: user.accountAddress,
        success: balanceResult.success, 
        balancesCount: balanceResult.balances?.length 
      });
      
      if (balanceResult.success && balanceResult.balances) {
        balances = balanceResult.balances.map(b => ({
          amount: b.balance,
          availableBalance: b.availableBalance,
          currency: b.currency,
          status: b.status,
          mint: b.mint,
          decimals: b.decimals
        }));
        
        console.log('[UserData] Balances found:', balances.map(b => `${b.amount} ${b.currency}`).join(', '));
      }
    } catch (error) {
      console.error('[UserData] Error fetching balance:', error);
      // Continue without balance data if fetch fails
    }

    // Return user data with all balances
    const userData = {
      success: true,
      user: {
        id: user.userId,
        email: user.email,
        username: user.username,
        accountAddress: user.accountAddress,
        gridUserId: user.gridUserId
      },
      balances: balances,
      // Legacy support: keep 'balance' field for backward compatibility (use first balance or null)
      balance: balances.length > 0 ? balances[0] : null
    };

    console.log('[UserData] Returning user data:', { 
      userId: user.userId, 
      username: user.username,
      gridUserId: user.gridUserId,
      balancesCount: balances.length
    });

    return NextResponse.json(userData);

  } catch (error: any) {
    console.error('[UserData] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
