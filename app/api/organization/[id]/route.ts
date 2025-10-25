/**
 * Get Single Organization API
 * 
 * Retrieves a specific organization by ID for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[GetSingleOrganization] ========================================');
    console.log('[GetSingleOrganization] Fetching organization:', params.id);
    
    // 1. Verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[GetSingleOrganization] User authenticated:', user.userId);

    // 2. Check for both membership and employee relationships
    const [membership, employeeProfile] = await Promise.all([
      db.organizationMember.findFirst({
        where: {
          userId: user.userId,
          organizationId: params.id,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              creatorAccountAddress: true,
              createdAt: true,
              updatedAt: true,
            }
          }
        }
      }),
      db.employeeProfile.findFirst({
        where: {
          userId: user.userId,
          orgId: params.id,
          status: 'active',
        },
        select: {
          id: true,
          name: true,
          email: true,
        }
      })
    ]);

    // User must have at least one relationship
    if (!membership && !employeeProfile) {
      console.log('[GetSingleOrganization] Organization not found or access denied');
      return NextResponse.json({
        success: false,
        error: 'Organization not found or you do not have access',
      }, { status: 404 });
    }

    // Get organization data from membership or fetch separately for employee-only users
    let organization;
    if (membership) {
      organization = membership.organization;
    } else {
      organization = await db.organization.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          name: true,
          creatorAccountAddress: true,
          createdAt: true,
          updatedAt: true,
        }
      });
    }

    console.log('[GetSingleOrganization] ✅ Organization found');
    console.log('[GetSingleOrganization] Organization:', organization?.name);
    console.log('[GetSingleOrganization] Has membership:', !!membership);
    console.log('[GetSingleOrganization] Has employee profile:', !!employeeProfile);
    console.log('[GetSingleOrganization] ========================================');

    return NextResponse.json({
      success: true,
      organization: {
        ...organization,
        role: membership?.role,
        isEmployee: !!employeeProfile,
        employeeProfile: employeeProfile || undefined,
      },
    });

  } catch (error) {
    console.error('[GetSingleOrganization] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch organization' 
      },
      { status: 500 }
    );
  }
}
