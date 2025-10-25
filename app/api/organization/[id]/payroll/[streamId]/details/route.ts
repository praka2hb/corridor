/**
 * Payroll Stream Details API
 * Fetches detailed information about a specific payroll stream using Grid's getStandingOrder
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { db } from '@/lib/db';
import * as gridClient from '@/lib/grid/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; streamId: string } }
) {
  try {
    const organizationId = params.id;
    const streamId = params.streamId;
    
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Check user is member of organization
    const membership = await db.organizationMember.findFirst({
      where: {
        userId: user.userId,
        organizationId,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'You are not a member of this organization' },
        { status: 403 }
      );
    }

    // 3. Get payroll stream from database
    const stream = await db.payrollStream.findFirst({
      where: {
        id: streamId,
        employee: {
          orgId: organizationId,
        },
      },
      include: {
        employee: true,
      },
    });

    if (!stream) {
      return NextResponse.json(
        { success: false, error: 'Payroll stream not found' },
        { status: 404 }
      );
    }

    // 4. Get user data if employee has userId
    let userData = null;
    if (stream.employee.userId) {
      userData = await db.user.findUnique({
        where: { id: stream.employee.userId },
        select: {
          email: true,
          username: true,
          publicKey: true,
          kycStatus: true,
        },
      });
    }

    // 5. Get organization to access account address
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization?.creatorAccountAddress) {
      return NextResponse.json(
        { success: false, error: 'Organization does not have an account address' },
        { status: 404 }
      );
    }

    // 6. Fetch standing order details from Grid
    let standingOrderDetails = null;
    let gridStatus = stream.status;
    let gridNextExecutionDate = stream.nextRunAt?.toISOString();
    let gridLastExecutionDate = null;
    let gridRemainingAmount = null;
    
    if (stream.gridStandingOrderId) {
      try {
        const gridResponse = await gridClient.getStandingOrder(
          organization.creatorAccountAddress,
          stream.gridStandingOrderId
        );
        standingOrderDetails = gridResponse?.data || null;
        
        // Extract Grid fields
        if (standingOrderDetails) {
          gridStatus = standingOrderDetails.status;
          gridNextExecutionDate = standingOrderDetails.next_execution_date;
          gridLastExecutionDate = standingOrderDetails.last_execution_date;
          gridRemainingAmount = standingOrderDetails.remaining_amount;
        }
      } catch (error) {
        console.error('[PayrollDetailsAPI] Failed to fetch Grid standing order:', error);
      }
    }

    // 7. Get execution history from database
    const executions = await db.streamRun.findMany({
      where: {
        streamId: streamId,
      },
      orderBy: {
        runAt: 'desc',
      },
      take: 20, // Limit to recent executions
    });

    // 8. Calculate statistics
    const totalExecuted = executions.reduce((sum, exec) => sum + (exec.status === 'completed' ? stream.amountMonthly : 0), 0);
    const executionCount = executions.filter(exec => exec.status === 'completed').length;

    // 9. Format response - return structured data with Grid fields
    const response = {
      success: true,
      standingOrder: {
        id: stream.id,
        status: gridStatus, // Use Grid status
        amount: stream.amountMonthly,
        currency: stream.currency,
        cadence: stream.cadence,
        gridNextExecutionDate, // From Grid
        lastExecutionDate: gridLastExecutionDate, // From Grid
        remainingAmount: gridRemainingAmount, // From Grid
        totalExecuted,
        executionCount,
        executionHistory: executions.map(exec => ({
          id: exec.id,
          executedAt: exec.runAt.toISOString(),
          amount: stream.amountMonthly,
          status: exec.status,
          signature: exec.transferId,
        })),
      },
      employee: {
        name: stream.employee.name,
        email: stream.employee.email || userData?.email || '',
        walletAddress: stream.employee.payoutWallet || userData?.publicKey || '',
        kycStatus: userData?.kycStatus || stream.employee.kycStatus || 'Not verified',
      },
      // Include raw Grid response for debugging
      gridResponse: standingOrderDetails,
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('[PayrollDetailsAPI] Error fetching payroll details:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch payroll details' 
      },
      { status: 500 }
    );
  }
}
