/**
 * Debug Endpoint: Check Employee Profile Linking
 * 
 * This endpoint helps diagnose if employees are properly linked to user accounts
 * Access at: /api/debug/employee-check
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('[EmployeeCheck] ========================================');
    
    // 1. Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
      }, { status: 401 });
    }

    console.log('[EmployeeCheck] User ID:', user.userId);

    // 2. Get user details
    const userDetails = await db.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
      }
    });

    console.log('[EmployeeCheck] User email:', userDetails?.email);

    // 3. Check for employee profiles linked to this user
    const employeeProfiles = await db.employeeProfile.findMany({
      where: {
        userId: user.userId,
        status: 'active',
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    console.log('[EmployeeCheck] Found employee profiles:', employeeProfiles.length);

    // 4. Check for employee profiles with matching email but no userId
    const unmatchedProfiles = await db.employeeProfile.findMany({
      where: {
        email: userDetails?.email,
        userId: null,
        status: 'active',
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    console.log('[EmployeeCheck] Unmatched profiles (same email, no userId):', unmatchedProfiles.length);

    // 5. Check for organization memberships
    const memberships = await db.organizationMember.findMany({
      where: {
        userId: user.userId,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    console.log('[EmployeeCheck] Organization memberships:', memberships.length);
    console.log('[EmployeeCheck] ========================================');

    return NextResponse.json({
      success: true,
      debug: {
        user: {
          id: user.userId,
          email: userDetails?.email,
        },
        employeeProfiles: employeeProfiles.map(ep => ({
          id: ep.id,
          name: ep.name,
          email: ep.email,
          organization: ep.organization.name,
          organizationId: ep.organization.id,
          userId: ep.userId,
        })),
        unmatchedProfiles: unmatchedProfiles.map(ep => ({
          id: ep.id,
          name: ep.name,
          email: ep.email,
          organization: ep.organization.name,
          organizationId: ep.organization.id,
          needsMigration: true,
        })),
        memberships: memberships.map(m => ({
          role: m.role,
          organization: m.organization.name,
          organizationId: m.organization.id,
        })),
        summary: {
          hasEmployeeProfiles: employeeProfiles.length > 0,
          hasUnmatchedProfiles: unmatchedProfiles.length > 0,
          hasMemberships: memberships.length > 0,
          needsToRunMigration: unmatchedProfiles.length > 0,
        }
      }
    });

  } catch (error) {
    console.error('[EmployeeCheck] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to check employee status' 
      },
      { status: 500 }
    );
  }
}
