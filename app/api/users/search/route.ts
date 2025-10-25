import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/jwt-service'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic';

// GET - Search for users by email
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    // Search for user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        username: true,
        publicKey: true,
      },
    })

    if (!user) {
      return NextResponse.json({
        success: true,
        found: false,
        message: 'User not found',
      })
    }

    return NextResponse.json({
      success: true,
      found: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        publicKey: user.publicKey,
      },
    })
  } catch (error: any) {
    console.error('[User Search API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to search for user', details: error.message },
      { status: 500 }
    )
  }
}
