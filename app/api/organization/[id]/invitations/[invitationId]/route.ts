import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/jwt-service'
import { db } from '@/lib/db'

// DELETE - Cancel/remove invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; invitationId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: organizationId, invitationId } = params

    // Check if user is owner or admin
    const member = await db.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: user.userId,
          organizationId,
        },
      },
    })

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only owners and admins can cancel invitations' },
        { status: 403 }
      )
    }

    // Check if invitation exists and belongs to this organization
    const invitation = await db.organizationInvitation.findUnique({
      where: { id: invitationId },
    })

    if (!invitation || invitation.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Delete the invitation
    await db.organizationInvitation.delete({
      where: { id: invitationId },
    })

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled successfully',
    })
  } catch (error: any) {
    console.error('[Delete Invitation API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel invitation', details: error.message },
      { status: 500 }
    )
  }
}
