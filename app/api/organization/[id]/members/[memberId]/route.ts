import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/jwt-service'
import { db } from '@/lib/db'

// PATCH - Update member role, position, or permissions
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: organizationId, memberId } = params
    const body = await request.json()
    const { role, position, canManageTreasury } = body

    // Check if requester is owner or admin
    const requesterMember = await db.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: user.userId,
          organizationId,
        },
      },
    })

    if (!requesterMember || !['owner', 'admin'].includes(requesterMember.role)) {
      return NextResponse.json(
        { error: 'Only owners and admins can update members' },
        { status: 403 }
      )
    }

    // Only owner can change roles or assign owner role
    if (role && requesterMember.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only owners can change member roles' },
        { status: 403 }
      )
    }

    // Get the member to update
    const memberToUpdate = await db.organizationMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            publicKey: true,
          },
        },
      },
    })

    if (!memberToUpdate || memberToUpdate.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Member not found in this organization' },
        { status: 404 }
      )
    }

    // Prevent changing the last owner's role
    if (memberToUpdate.role === 'owner' && role && role !== 'owner') {
      const ownerCount = await db.organizationMember.count({
        where: {
          organizationId,
          role: 'owner',
        },
      })

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner. Assign another owner first.' },
          { status: 400 }
        )
      }
    }

    // Update the member
    const updateData: any = {}
    if (role !== undefined) updateData.role = role
    if (position !== undefined) updateData.position = position
    if (canManageTreasury !== undefined) updateData.canManageTreasury = canManageTreasury

    const updatedMember = await db.organizationMember.update({
      where: { id: memberId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            publicKey: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Member updated successfully',
      member: {
        id: updatedMember.id,
        userId: updatedMember.userId,
        role: updatedMember.role,
        position: updatedMember.position,
        canManageTreasury: updatedMember.canManageTreasury,
        user: updatedMember.user,
      },
    })
  } catch (error: any) {
    console.error('[Member Update API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update member', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Remove member from organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: organizationId, memberId } = params

    // Check if requester is owner or admin
    const requesterMember = await db.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: user.userId,
          organizationId,
        },
      },
    })

    if (!requesterMember || !['owner', 'admin'].includes(requesterMember.role)) {
      return NextResponse.json(
        { error: 'Only owners and admins can remove members' },
        { status: 403 }
      )
    }

    // Get the member to delete
    const memberToDelete = await db.organizationMember.findUnique({
      where: { id: memberId },
    })

    if (!memberToDelete || memberToDelete.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Member not found in this organization' },
        { status: 404 }
      )
    }

    // Prevent deleting the last owner
    if (memberToDelete.role === 'owner') {
      const ownerCount = await db.organizationMember.count({
        where: {
          organizationId,
          role: 'owner',
        },
      })

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner' },
          { status: 400 }
        )
      }
    }

    // Delete the member
    await db.organizationMember.delete({
      where: { id: memberId },
    })

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    })
  } catch (error: any) {
    console.error('[Member Delete API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to remove member', details: error.message },
      { status: 500 }
    )
  }
}
