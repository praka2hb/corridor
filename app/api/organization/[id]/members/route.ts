import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/jwt-service'
import { db } from '@/lib/db'
import { sendOrganizationInvitation } from '@/lib/services/email-service'
import crypto from 'crypto'

// GET - List all organization members
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
    const memberCheck = await db.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: user.userId,
          organizationId,
        },
      },
    })

    if (!memberCheck) {
      return NextResponse.json(
        { error: 'You are not a member of this organization' },
        { status: 403 }
      )
    }

    // Fetch all members with user data
    const members = await db.organizationMember.findMany({
      where: { organizationId },
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
      orderBy: [
        { role: 'asc' }, // owner first, then admin, then member
        { createdAt: 'asc' },
      ],
    })

    return NextResponse.json({
      success: true,
      members: members.map((member) => ({
        id: member.id,
        userId: member.userId,
        role: member.role,
        position: member.position,
        canManageTreasury: member.canManageTreasury,
        joinedAt: member.createdAt,
        user: {
          email: member.user.email,
          username: member.user.username,
          publicKey: member.user.publicKey,
        },
      })),
    })
  } catch (error: any) {
    console.error('[Members API] Error fetching members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Add member or send invitation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: organizationId } = params
    const body = await request.json()
    const { email, role = 'member', position } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user is owner or admin
    const requesterMember = await db.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: user.userId,
          organizationId,
        },
      },
      include: {
        organization: true,
        user: true,
      },
    })

    if (!requesterMember || !['owner', 'admin'].includes(requesterMember.role)) {
      return NextResponse.json(
        { error: 'Only owners and admins can invite members' },
        { status: 403 }
      )
    }

    // Check if email is already a member
    const existingMemberByEmail = await db.user.findUnique({
      where: { email },
      include: {
        organizations: {
          where: { organizationId },
        },
      },
    })

    if (existingMemberByEmail && existingMemberByEmail.organizations.length > 0) {
      return NextResponse.json(
        { error: 'User is already a member of this organization' },
        { status: 400 }
      )
    }

    // Flow A: Existing User
    if (existingMemberByEmail) {
      console.log('[Members API] Adding existing user to organization')
      
      const newMember = await db.organizationMember.create({
        data: {
          userId: existingMemberByEmail.id,
          organizationId,
          role,
          position,
        },
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
        type: 'existing_user',
        message: 'User added to organization',
        member: {
          id: newMember.id,
          userId: newMember.userId,
          role: newMember.role,
          position: newMember.position,
          user: newMember.user,
        },
      })
    }

    // Flow B: New User - Send Invitation
    console.log('[Members API] Sending invitation to new user')

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    // Create invitation
    const invitation = await db.organizationInvitation.create({
      data: {
        organizationId,
        email,
        invitedBy: user.userId,
        role,
        position,
        token,
        expiresAt,
      },
    })

    // Send invitation email
    try {
      await sendOrganizationInvitation({
        email,
        organizationName: requesterMember.organization.name,
        inviterName: requesterMember.user.email || 'A team member',
        token,
        role,
        position,
      })

      return NextResponse.json({
        success: true,
        type: 'invitation_sent',
        message: 'Invitation sent successfully',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          position: invitation.position,
          expiresAt: invitation.expiresAt,
        },
      })
    } catch (emailError: any) {
      // Delete invitation if email fails
      await db.organizationInvitation.delete({ where: { id: invitation.id } })
      
      console.error('[Members API] Email error:', emailError)
      return NextResponse.json(
        { error: 'Failed to send invitation email', details: emailError.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[Members API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    )
  }
}
