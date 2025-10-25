/**
 * Individual Payroll Stream API
 * Handles updating and deleting specific payroll streams
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { db } from '@/lib/db';
import { 
  pausePayrollStream, 
  resumePayrollStream, 
  stopPayrollStream 
} from '@/lib/services/payroll-service';

/**
 * PATCH - Update payroll stream (pause/resume/stop)
 */
export async function PATCH(
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

    // 3. Verify stream belongs to organization
    const stream = await db.payrollStream.findFirst({
      where: {
        id: streamId,
        employee: {
          orgId: organizationId,
        },
      },
    });

    if (!stream) {
      return NextResponse.json(
        { success: false, error: 'Payroll stream not found' },
        { status: 404 }
      );
    }

    // 4. Parse request body
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: status' },
        { status: 400 }
      );
    }

    // 5. Update stream based on status
    let updatedStream;

    switch (status) {
      case 'paused':
        updatedStream = await pausePayrollStream(streamId);
        break;
      case 'active':
        updatedStream = await resumePayrollStream(streamId);
        break;
      case 'stopped':
        updatedStream = await stopPayrollStream(streamId);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid status. Must be: active, paused, or stopped' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      stream: updatedStream,
    });

  } catch (error: any) {
    console.error('[PayrollStreamAPI] Error updating payroll stream:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update payroll stream' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Cancel payroll stream
 */
export async function DELETE(
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

    // 3. Verify stream belongs to organization
    const stream = await db.payrollStream.findFirst({
      where: {
        id: streamId,
        employee: {
          orgId: organizationId,
        },
      },
    });

    if (!stream) {
      return NextResponse.json(
        { success: false, error: 'Payroll stream not found' },
        { status: 404 }
      );
    }

    // 4. Stop the stream (which cancels the Grid standing order)
    const stoppedStream = await stopPayrollStream(streamId);

    return NextResponse.json({
      success: true,
      stream: stoppedStream,
      message: 'Payroll stream has been canceled',
    });

  } catch (error: any) {
    console.error('[PayrollStreamAPI] Error deleting payroll stream:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to delete payroll stream' 
      },
      { status: 500 }
    );
  }
}
