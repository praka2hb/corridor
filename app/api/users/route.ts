/**
 * Users API
 * Handles user lookup and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET - Lookup user by email or public address
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const publicAddress = searchParams.get('publicAddress');

    if (!email && !publicAddress) {
      return NextResponse.json(
        { success: false, error: 'Either email or publicAddress parameter is required' },
        { status: 400 }
      );
    }

    // 3. Find user by email or public address
    let foundUser;
    if (email) {
      foundUser = await db.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
          publicKey: true,
          gridUserId: true,
          kycStatus: true,
          kycType: true,
          createdAt: true,
        },
      });
    } else if (publicAddress) {
      foundUser = await db.user.findFirst({
        where: { publicKey: publicAddress },
        select: {
          id: true,
          email: true,
          username: true,
          publicKey: true,
          gridUserId: true,
          kycStatus: true,
          kycType: true,
          createdAt: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: foundUser,
    });

  } catch (error: any) {
    console.error('[UsersAPI] Error looking up user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to lookup user' 
      },
      { status: 500 }
    );
  }
}

