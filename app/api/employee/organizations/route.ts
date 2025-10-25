/**
 * Employee Organizations API
 * Returns organizations where the user is an employee (has an EmployeeProfile)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET - Get organizations where user is an employee
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

    // 2. Find all EmployeeProfiles for this user
    const employeeProfiles = await db.employeeProfile.findMany({
      where: {
        userId: user.userId,
        status: 'active', // Only active employees
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        streams: {
          where: {
            status: 'active',
          },
          select: {
            id: true,
            amountMonthly: true,
            cadence: true,
            status: true,
            nextRunAt: true,
          },
        },
      },
    });

    // 3. Transform to organization format with employee context
    const organizations = employeeProfiles.map((profile) => ({
      id: profile.organization.id,
      name: profile.organization.name,
      createdAt: profile.organization.createdAt.toISOString(),
      updatedAt: profile.organization.updatedAt.toISOString(),
      role: 'employee' as const, // Mark as employee relationship
      employeeId: profile.id,
      employeeName: profile.name,
      employeeEmail: profile.email,
      activePayrollStreams: profile.streams.length,
      creatorAccountAddress: null, // Don't expose to employees
    }));

    console.log('[EmployeeOrganizationsAPI] Employee orgs fetched:', {
      userId: user.userId,
      count: organizations.length,
      orgs: organizations.map(o => ({ name: o.name, streams: o.activePayrollStreams }))
    });

    return NextResponse.json({
      success: true,
      organizations,
    });

  } catch (error: any) {
    console.error('[EmployeeOrganizationsAPI] Error fetching employee organizations:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch employee organizations' 
      },
      { status: 500 }
    );
  }
}
