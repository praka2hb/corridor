import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/jwt-service'
import { db } from '@/lib/db'
import { isValidEmail, isValidSolanaAddress } from '@/lib/utils/validation'

export const dynamic = 'force-dynamic';

// GET - Search for users by email or Solana address
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const address = searchParams.get('address')

    if (!email && !address) {
      return NextResponse.json(
        { error: 'Email or address parameter is required' },
        { status: 400 }
      )
    }

    let user = null

    // Search for user by email
    if (email) {
      if (!isValidEmail(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }

      user = await db.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          username: true,
          publicKey: true,
        },
      })
    }
    // Search for user by Solana address
    else if (address) {
      if (!isValidSolanaAddress(address)) {
        return NextResponse.json(
          { error: 'Invalid Solana address format' },
          { status: 400 }
        )
      }

      user = await db.user.findFirst({
        where: { publicKey: address },
        select: {
          id: true,
          email: true,
          username: true,
          publicKey: true,
        },
      })
    }

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
