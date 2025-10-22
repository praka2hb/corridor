import { NextRequest, NextResponse } from 'next/server';
import { getPositionsForEmployee } from '@/lib/kamino-service';

/**
 * GET /api/investments/positions?employeeId=xxx
 * Get employee's current investment positions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'employeeId query parameter is required',
        },
        { status: 400 }
      );
    }

    const positions = await getPositionsForEmployee(employeeId);

    return NextResponse.json({
      success: true,
      data: positions,
    });
  } catch (error) {
    console.error('[API] Failed to fetch positions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch positions',
      },
      { status: 500 }
    );
  }
}

