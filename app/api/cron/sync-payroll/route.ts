/**
 * Payroll Sync Cron Job
 * Syncs standing order executions from Grid and creates notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncStandingOrderExecutions } from '@/lib/services/payroll-service';

/**
 * POST - Sync standing order executions
 * This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[PayrollSync] Starting payroll sync cron job...');

    // Optional: Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Sync standing order executions
    const result = await syncStandingOrderExecutions();

    console.log('[PayrollSync] Cron job completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Payroll sync completed',
      syncedCount: result.syncedCount,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[PayrollSync] Cron job failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Payroll sync failed' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Manual trigger for testing
 * Only available in development
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Not available in production' },
      { status: 404 }
    );
  }

  try {
    console.log('[PayrollSync] Manual sync trigger...');

    const result = await syncStandingOrderExecutions();

    return NextResponse.json({
      success: true,
      message: 'Manual payroll sync completed',
      syncedCount: result.syncedCount,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[PayrollSync] Manual sync failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Manual payroll sync failed' 
      },
      { status: 500 }
    );
  }
}

