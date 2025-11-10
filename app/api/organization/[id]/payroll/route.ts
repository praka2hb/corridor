/**
 * Payroll Management API
 * Handles creating and listing payroll streams for an organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { db } from '@/lib/db';
import { createPayrollStream } from '@/lib/services/payroll-service';
import * as gridClient from '@/lib/grid/client';

/**
 * POST - Create a new payroll stream
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = params.id;
    
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Check user is admin/owner of organization
    const membership = await db.organizationMember.findFirst({
      where: {
        userId: user.userId,
        organizationId,
        role: { in: ['owner', 'admin'] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to manage payroll' },
        { status: 403 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    console.log('[PayrollAPI] Received request body:', body);
    const { employeeEmail, directAddress, amountPerPayment, cadence, startDate, endDate, teamId } = body;

    // Detailed validation with specific error messages
    const missingFields = [];
    
    // Either employeeEmail or directAddress must be provided
    if (!employeeEmail && !directAddress) {
      missingFields.push('employeeEmail or directAddress');
    }
    
    if (!amountPerPayment && amountPerPayment !== 0) missingFields.push('amountPerPayment');
    if (!cadence) missingFields.push('cadence');
    if (!startDate) missingFields.push('startDate');

    if (missingFields.length > 0) {
      console.error('[PayrollAPI] Missing required fields:', missingFields);
      console.error('[PayrollAPI] Received values:', {
        employeeEmail: employeeEmail || 'MISSING',
        directAddress: directAddress || 'MISSING',
        amountPerPayment: amountPerPayment !== undefined ? amountPerPayment : 'MISSING',
        cadence: cadence || 'MISSING',
        startDate: startDate || 'MISSING',
      });
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // 4. Create payroll stream
    const stream = await createPayrollStream({
      organizationId,
      employeeEmail,
      directAddress,
      amountPerPayment,
      cadence,
      startDate,
      endDate,
      teamId,
      createdByUserId: user.userId,
    });

    return NextResponse.json({
      success: true,
      stream,
    });

  } catch (error: any) {
    console.error('[PayrollAPI] Error creating payroll stream:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create payroll stream' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET - List all payroll streams for organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = params.id;
    
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
        { success: false, error: 'Not a member of this organization' },
        { status: 403 }
      );
    }

    // 3. Get organization
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // 4. Get payroll streams
    const streams = await db.payrollStream.findMany({
      where: {
        employee: {
          orgId: organizationId,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            payoutWallet: true,
            status: true,
            userId: true,
          },
        },
        runs: {
          where: { status: 'completed' },
          orderBy: { runAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 5. Enrich with Grid standing order details
    const enrichedStreams = await Promise.all(
      streams.map(async (stream) => {
        let standingOrderDetails = null;
        let gridStatus = null;
        let gridNextExecutionDate = null;
        let totalPaid = 0;

        // Calculate total paid
        stream.runs.forEach((run) => {
          totalPaid += calculatePaymentAmount(stream.amountMonthly, stream.cadence);
        });

        // Get standing order details from Grid for real-time status and next payment date
        if (stream.gridStandingOrderId) {
          try {
            const result = await gridClient.getStandingOrder(
              organization.creatorAccountAddress,
              stream.gridStandingOrderId
            );
            standingOrderDetails = result?.data || null;
            
            // Extract real-time status and next execution date from Grid
            if (standingOrderDetails) {
              gridStatus = standingOrderDetails.status;
              gridNextExecutionDate = standingOrderDetails.next_execution_date;
            }
          } catch (error) {
            console.error('[PayrollAPI] Failed to get standing order details:', error);
          }
        }

        return {
          ...stream,
          totalPaid,
          standingOrderDetails,
          gridStatus,
          gridNextExecutionDate,
        };
      })
    );

    return NextResponse.json({
      success: true,
      streams: enrichedStreams,
    });

  } catch (error: any) {
    console.error('[PayrollAPI] Error fetching payroll streams:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch payroll streams' 
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to calculate payment amount based on cadence
 */
function calculatePaymentAmount(
  amountMonthly: number,
  cadence: string
): number {
  switch (cadence) {
    case 'daily':
      return amountMonthly / 30;
    case 'weekly':
      return amountMonthly / 4;
    case 'biweekly':
      return amountMonthly / 2;
    case 'monthly':
      return amountMonthly;
    default:
      return amountMonthly;
  }
}
