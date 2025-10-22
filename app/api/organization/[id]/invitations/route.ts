import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/jwt-service'
import { db } from '@/lib/db'

// GET - List organization invitations
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: organizationId } = params

    // Check if user is a member of this organization
    const member = await db.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: user.userId,
          organizationId,
        },
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'You are not a member of this organization' },
        { status: 403 }
      )
    }

    // Only owner and admin can view invitations
    if (member.role !== 'owner' && member.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only owners and admins can view invitations' },
        { status: 403 }
      )
    }

    // Fetch all invitations for this organization
    const invitations = await db.organizationInvitation.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      invitations,
    })
  } catch (error: any) {
    console.error('[Invitations List API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitations', details: error.message },
      { status: 500 }
    )
  }
}
