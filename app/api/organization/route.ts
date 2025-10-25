/**
 * Get Organization API
 * 
 * Retrieves the organization for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('[GetOrganization] ========================================');
    console.log('[GetOrganization] Fetching organization...');
    
    // 1. Verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[GetOrganization] User authenticated:', user.userId);

    // 2. Get user's organizations (both as member and as employee)
    const [memberOrganizations, employeeOrganizations] = await Promise.all([
      // Organizations where user is a member (admin/owner)
      db.organizationMember.findMany({
        where: { userId: user.userId },
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
        },
        orderBy: {
          createdAt: 'desc',
        }
      }),
      // Organizations where user is an employee
      db.employeeProfile.findMany({
        where: { 
          userId: user.userId,
          status: 'active',
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
        },
        orderBy: {
          createdAt: 'desc',
        }
      })
    ]);

    // Combine and deduplicate organizations
    const orgMap = new Map();
    
    // Add member organizations
    memberOrganizations.forEach(om => {
      orgMap.set(om.organization.id, {
        ...om.organization,
        role: om.role,
        isEmployee: false,
      });
    });
    
    // Add or update with employee organizations
    employeeOrganizations.forEach(ep => {
      const existing = orgMap.get(ep.organization.id);
      if (existing) {
        // User is both member and employee
        existing.isEmployee = true;
      } else {
        // User is only employee
        orgMap.set(ep.organization.id, {
          ...ep.organization,
          role: undefined, // No member role
          isEmployee: true,
        });
      }
    });

    const orgs = Array.from(orgMap.values());

    console.log('[GetOrganization] ✅ Found', orgs.length, 'organizations');
    console.log('[GetOrganization] - Member orgs:', memberOrganizations.length);
    console.log('[GetOrganization] - Employee orgs:', employeeOrganizations.length);
    console.log('[GetOrganization] ========================================');

    return NextResponse.json({
      success: true,
      organizations: orgs,
    });

  } catch (error) {
    console.error('[GetOrganization] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch organization' 
      },
      { status: 500 }
    );
  }
}
