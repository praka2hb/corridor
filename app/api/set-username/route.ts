import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, generateToken, setAuthCookie } from '@/lib/services/jwt-service';
import { db } from '@/lib/db';

// Force Node.js runtime for JWT compatibility
export const runtime = 'nodejs';

// POST /api/set-username - Set username for authenticated user
export async function POST(request: NextRequest) {
  try {
    // Get current user from JWT
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username } = body;

    // Validate username
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      );
    }

    // Username validation: alphanumeric, underscore, hyphen, 3-20 characters
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Username must be 3-20 characters and contain only letters, numbers, underscores, or hyphens' 
        },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await db.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existingUser && existingUser.id !== currentUser.userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: `The username "${username}" is already taken. Please try another one! 🤔` 
        },
        { status: 409 }
      );
    }

    // Update user with username
    const updatedUser = await db.user.update({
      where: { id: currentUser.userId },
      data: { 
        username: username.toLowerCase(),
        updatedAt: new Date(),
      },
    });

    // Generate new token with username
    const newToken = await generateToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username || undefined,
      accountAddress: currentUser.accountAddress,
      gridUserId: updatedUser.gridUserId || undefined,
    });

    // Set new cookie
    await setAuthCookie(newToken);

    return NextResponse.json({
      success: true,
      message: `Welcome, @${username}! 🎉`,
      username: updatedUser.username,
    });

  } catch (error: any) {
    console.error('[API] Set username error:', error);

    // Handle Prisma unique constraint error
    if (error.code === 'P2002') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'This username is already taken. Please choose another! 💫' 
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to set username. Please try again.' 
      },
      { status: 500 }
    );
  }
}

