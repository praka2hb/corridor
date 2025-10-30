import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/investments/positions?employeeId=xxx
 * Get all investment positions for an employee
 */
export async function GET(request: NextRequest) {
  // Lazy load kamino-service to avoid build-time WASM issues
  const { getPositionsForEmployee } = await import('@/lib/kamino-service');
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

