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

    // 2. Get organization with membership check
    const membership = await db.organizationMember.findFirst({
      where: {
        userId: user.userId,
        organizationId: params.id,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            gridOrgId: true,
            treasuryStatus: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      }
    });

    if (!membership) {
      console.log('[GetSingleOrganization] Organization not found or access denied');
      return NextResponse.json({
        success: false,
        error: 'Organization not found or you do not have access',
      }, { status: 404 });
    }

    console.log('[GetSingleOrganization] ✅ Organization found');
    console.log('[GetSingleOrganization] Organization:', membership.organization.name);
    console.log('[GetSingleOrganization] ========================================');

    return NextResponse.json({
      success: true,
      organization: {
        ...membership.organization,
        role: membership.role,
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
