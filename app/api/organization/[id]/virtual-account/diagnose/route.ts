/**
 * Diagnose Virtual Account Issues
 * 
 * Virtual accounts feature has been removed. This endpoint now returns information
 * about the simplified organization structure.
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
    const organizationId = params.id;

    // Authenticate user
    const user = await getCurrentUser();
    if (!user?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get organization
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      include: {
        members: {
          where: { userId: user.userId },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                publicKey: true,
                gridUserId: true,
              }
            }
          }
        }
      }
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    const member = organization.members[0];
    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Not a member of this organization' },
        { status: 403 }
      );
    }

    // Return diagnostic information
    return NextResponse.json({
      success: true,
      message: 'Virtual accounts feature has been removed',
      organization: {
        id: organization.id,
        name: organization.name,
        creatorAccountAddress: organization.creatorAccountAddress,
      },
      user: {
        id: member.user.id,
        email: member.user.email,
        publicKey: member.user.publicKey,
        gridUserId: member.user.gridUserId,
      },
      membership: {
        role: member.role,
      },
      note: 'Organizations now use the creator\'s personal account directly instead of separate treasury accounts.',
    });


  } catch (error: any) {
    console.error('[DiagnoseVA] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to run diagnostics' 
      },
      { status: 500 }
    );
  }
}
