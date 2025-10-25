import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { SDKGridClient } from '@/lib/grid/sdkClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/transactions - Get user's transaction history
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('[Transactions] Fetching transactions for user:', user.userId);
    console.log('[Transactions] Account address:', user.accountAddress);

    // Get transfers from Grid (payment history)
    const gridClient = SDKGridClient.getInstance();
    
    try {
      const response = await gridClient.getTransfers(user.accountAddress, {
        limit: 50 // Get last 50 transfers
      });
      
      // console.log('[Transactions] Grid response:', {
      //   success: !!response,
      //   hasData: !!response?.data,
      //   transactionCount: Array.isArray(response?.data) ? response.data.length : 0
      // });

      // if (!response || !response.data) {
      //   console.log('[Transactions] No transactions found');
      //   return NextResponse.json({
      //     success: true,
      //     transactions: []
      //   });
      // }

      // // Transform Grid transfers to our format
      // const transactions = Array.isArray(response.data) ? response.data.map((tx: any) => {
      //   // Check if it's an SPL transfer (on-chain) or Bridge transfer (fiat)
      //   const isSplTransfer = 'signature' in tx;
      //   const isBridgeTransfer = 'source' in tx && 'destination' in tx;
        
      //   // Determine direction based on account address
      //   const isIncoming = isSplTransfer 
      //     ? tx.to_address === user.accountAddress || tx.main_account_address === user.accountAddress
      //     : false;
        
      //   // Get counterparty address
      //   const counterparty = isSplTransfer
      //     ? (isIncoming ? tx.from_address : tx.to_address)
      //     : tx.destination?.from_address || 'Unknown';
        
      //   // Get currency
      //   const currency = isSplTransfer 
      //     ? (tx.mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' ? 'USDC' : 'Token')
      //     : (tx.currency || 'USD');
        
      //   return {
      //     id: tx.signature || tx.id,
      //     signature: tx.signature || tx.id,
      //     direction: isIncoming ? 'in' : 'out',
      //     counterparty: formatAddress(counterparty),
      //     amount: tx.ui_amount || formatAmount(tx.amount, currency),
      //     currency: currency,
      //     descriptor: tx.blockchain_memo || 'Transfer',
      //     time: formatTime(tx.confirmed_at || tx.created_at),
      //     timestamp: tx.confirmed_at || tx.created_at,
      //     status: tx.confirmation_status || tx.state || 'Completed',
      //     type: isSplTransfer ? 'spl_transfer' : 'bridge_transfer',
      //     rawAmount: parseFloat(tx.ui_amount || tx.amount || '0')
      //   };
      // }) : [];

      // console.log('[Transactions] Transformed transactions:', transactions.length);

      // console.log('[Transactions] Grid response:', JSON.stringify(response, null, 2));

      return NextResponse.json({
        success: true,
        data: response
      });

    } catch (gridError: any) {
      console.error('[Transactions] Grid API error:', gridError);
      
      // Return empty array instead of error for better UX
      return NextResponse.json({
        success: true,
        transactions: []
      });
    }

  } catch (error: any) {
    console.error('[Transactions] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// Helper functions
function formatAddress(address: string): string {
  if (!address) return 'Unknown';
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatAmount(amount: number | string, currency: string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00';
  
  // Format with 2 decimal places for USDC, 4 for SOL
  const decimals = currency === 'SOL' ? 4 : 2;
  return num.toFixed(decimals);
}

function formatTime(timestamp: string | number | null): string {
  if (!timestamp) return 'Unknown';
  
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (error) {
    return 'Unknown';
  }
}

function getTransactionDescription(tx: any): string {
  if (tx.description || tx.memo) return tx.description || tx.memo;
  if (tx.type === 'deposit') return 'Deposit';
  if (tx.type === 'withdrawal') return 'Withdrawal';
  if (tx.type === 'transfer') return 'Transfer';
  return 'Payment';
}
