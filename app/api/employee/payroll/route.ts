/**
 * Employee Payroll API
 * Allows employees to view their own payroll streams and payment history
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { getEmployeePayrollHistory } from '@/lib/services/payroll-service';
import { db } from '@/lib/db';
import * as gridClient from '@/lib/grid/client';

export const dynamic = 'force-dynamic';

/**
 * GET - Get employee's own payroll streams and history
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

    // 2. Get employee payroll history
    const { employeeProfiles, totalEarnedThisMonth, totalEarnedThisYear } = 
      await getEmployeePayrollHistory(user.userId);

    // 3. Get user's investment percentage
    const userData = await db.user.findUnique({
      where: { id: user.userId },
      select: { investmentPercentage: true },
    });

    // 4. Get active streams with organization details (filter sensitive data)
    const streams = await db.payrollStream.findMany({
      where: {
        employee: {
          userId: user.userId,
        },
      },
      include: {
        employee: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                creatorAccountAddress: true, // Needed for Grid API calls
                // Exclude sensitive data: virtual accounts, treasury balance
              },
            },
          },
        },
        runs: {
          orderBy: { runAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 5. Enrich streams with Grid standing order details
    const enrichedStreams = await Promise.all(
      streams.map(async (stream) => {
        let standingOrderDetails = null;
        let totalPaid = 0;

        // Calculate total paid
        stream.runs.forEach((run) => {
          if (run.status === 'completed') {
            totalPaid += stream.amountMonthly;
          }
        });

        // Get standing order details from Grid
        if (stream.gridStandingOrderId && stream.employee.organization?.creatorAccountAddress) {
          try {
            const result = await gridClient.getStandingOrder(
              stream.employee.organization.creatorAccountAddress,
              stream.gridStandingOrderId
            );
            standingOrderDetails = result?.data || null;
          } catch (error) {
            console.error('[EmployeePayrollAPI] Failed to get standing order details:', error);
          }
        }

        return {
          ...stream,
          totalPaid,
          standingOrderDetails,
        };
      })
    );

    return NextResponse.json({
      success: true,
      streams: enrichedStreams,
      totalEarnedThisMonth,
      totalEarnedThisYear,
      investmentPercentage: userData?.investmentPercentage ?? 0,
    });

  } catch (error: any) {
    console.error('[EmployeePayrollAPI] Error fetching employee payroll:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch employee payroll' 
      },
      { status: 500 }
    );
  }
}
