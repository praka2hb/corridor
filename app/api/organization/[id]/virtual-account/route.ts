/**
 * Virtual Account API Route
 * 
 * Virtual accounts feature has been removed. Organizations now use the creator's account directly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Virtual accounts are no longer supported
    return NextResponse.json(
      { 
        success: false, 
        error: 'Virtual accounts feature is not available. Organization uses creator account directly.' 
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('[RequestVirtualAccount] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to request virtual account' 
      },
      { status: 500 }
    );
  }
}

/**
 * Get Virtual Account Details
 * 
 * Retrieves existing virtual account information for an organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = params.id;
    
    console.log('[GetVirtualAccount] Fetching virtual account for organization:', organizationId);

    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get organization with member check
    const organization = await db.organization.findFirst({
      where: {
        id: organizationId,
        members: {
          some: {
            userId: user.userId,
          }
        }
      },
      select: {
        id: true,
        name: true,
        creatorAccountAddress: true,
      }
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found or access denied' },
        { status: 404 }
      );
    }

    // Virtual accounts are no longer supported - removed treasury account feature
    return NextResponse.json({
      success: true,
      hasVirtualAccount: false,
      message: 'Virtual accounts feature is not available. Organization uses creator account.',
    });

  } catch (error) {
    console.error('[GetVirtualAccount] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get virtual account' 
      },
      { status: 500 }
    );
  }
}
