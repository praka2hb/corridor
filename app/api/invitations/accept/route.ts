import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/jwt-service'
import { db } from '@/lib/db'

// POST - Accept organization invitation
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to accept an invitation' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      )
    }

    // Find the invitation
    const invitation = await db.organizationInvitation.findUnique({
      where: { token },
      include: {
        organization: true,
      },
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      )
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      )
    }

    // Check if already accepted
    if (invitation.status === 'accepted') {
      return NextResponse.json(
        { error: 'This invitation has already been accepted' },
        { status: 400 }
      )
    }

    // Get user from database to verify email
    const dbUser = await db.user.findUnique({
      where: { id: user.userId },
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user's email matches invitation email
    if (dbUser.email !== invitation.email) {
      return NextResponse.json(
        { error: 'This invitation was sent to a different email address' },
        { status: 403 }
      )
    }

    // Check if already a member
    const existingMember = await db.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: dbUser.id,
          organizationId: invitation.organizationId,
        },
      },
    })

    if (existingMember) {
      // Update invitation status and return
      await db.organizationInvitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted' },
      })

      return NextResponse.json({
        success: true,
        message: 'You are already a member of this organization',
        organization: {
          id: invitation.organization.id,
          name: invitation.organization.name,
        },
      })
    }

    // Create organization member and update invitation
    const [newMember, _] = await db.$transaction([
      db.organizationMember.create({
        data: {
          userId: dbUser.id,
          organizationId: invitation.organizationId,
          role: invitation.role,
          position: invitation.position,
        },
        include: {
          organization: true,
        },
      }),
      db.organizationInvitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted' },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: `Welcome to ${invitation.organization.name}!`,
      organization: {
        id: newMember.organization.id,
        name: newMember.organization.name,
      },
      member: {
        role: newMember.role,
        position: newMember.position,
      },
    })
  } catch (error: any) {
    console.error('[Invitation Accept API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to accept invitation', details: error.message },
      { status: 500 }
    )
  }
}

// GET - Verify invitation token (before login)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      )
    }

    // Find the invitation
    const invitation = await db.organizationInvitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      )
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { 
          error: 'This invitation has expired',
          expired: true 
        },
        { status: 400 }
      )
    }

    // Check if already accepted
    if (invitation.status === 'accepted') {
      return NextResponse.json(
        { 
          error: 'This invitation has already been accepted',
          alreadyAccepted: true 
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        position: invitation.position,
        organization: invitation.organization,
        expiresAt: invitation.expiresAt,
      },
    })
  } catch (error: any) {
    console.error('[Invitation Verify API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to verify invitation', details: error.message },
      { status: 500 }
    )
  }
}
