/**
 * User Investment Preference API
 * Manages user's global investment percentage for auto-investing payroll
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { db } from '@/lib/db';

/**
 * GET - Fetch current user's investment percentage
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get user's investment percentage
    const userData = await db.user.findUnique({
      where: { id: user.userId },
      select: { investmentPercentage: true },
    });

    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      investmentPercentage: userData.investmentPercentage ?? 0,
    });

  } catch (error: any) {
    console.error('[InvestmentPreferenceAPI] Error fetching preference:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch investment preference' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Update user's investment percentage
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const { percentage } = body;

    if (typeof percentage !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Percentage must be a number' },
        { status: 400 }
      );
    }

    if (percentage < 0 || percentage > 100) {
      return NextResponse.json(
        { success: false, error: 'Percentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    // 3. Update user's investment percentage
    const updatedUser = await db.user.update({
      where: { id: user.userId },
      data: { investmentPercentage: Math.round(percentage) },
      select: { investmentPercentage: true },
    });

    return NextResponse.json({
      success: true,
      investmentPercentage: updatedUser.investmentPercentage,
      message: 'Investment preference updated successfully',
    });

  } catch (error: any) {
    console.error('[InvestmentPreferenceAPI] Error updating preference:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update investment preference' 
      },
      { status: 500 }
    );
  }
}
