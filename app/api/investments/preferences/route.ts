import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET - Get user's investment preferences
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userData = await db.user.findUnique({
      where: { id: user.userId },
      select: { 
        investmentPercentage: true,
      },
    });

    // For now, we'll store strategy preference in a simple way
    // In the future, this could be expanded to a separate table
    const percentage = userData?.investmentPercentage ?? 0;
    
    // Default strategy is lending
    const strategy = 'lending';

    return NextResponse.json({
      success: true,
      percentage,
      strategy,
    });

  } catch (error: any) {
    console.error('[InvestmentPreferencesAPI] Error fetching preferences:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch investment preferences' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Update user's investment preferences
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { percentage, strategy } = body;

    // Validate percentage
    if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
      return NextResponse.json(
        { success: false, error: 'Percentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Validate strategy
    const validStrategies = ['lending', 'liquidity', 'dca'];
    if (strategy && !validStrategies.includes(strategy)) {
      return NextResponse.json(
        { success: false, error: 'Invalid strategy' },
        { status: 400 }
      );
    }

    // Update user preferences
    await db.user.update({
      where: { id: user.userId },
      data: { 
        investmentPercentage: percentage,
        // Note: strategy would need a new field in the schema
        // For now, we're just storing the percentage
      },
    });

    console.log(`[InvestmentPreferencesAPI] Updated preferences for user ${user.userId}:`, {
      percentage,
      strategy,
    });

    return NextResponse.json({
      success: true,
      percentage,
      strategy,
    });

  } catch (error: any) {
    console.error('[InvestmentPreferencesAPI] Error updating preferences:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update investment preferences' 
      },
      { status: 500 }
    );
  }
}
