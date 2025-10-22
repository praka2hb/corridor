import { NextRequest, NextResponse } from 'next/server';
import { removeAuthCookie } from '@/lib/services/jwt-service';

// Force Node.js runtime for JWT compatibility
export const runtime = 'nodejs';

// POST /api/logout - Log out user by removing auth cookie
export async function POST(request: NextRequest) {
  try {
    await removeAuthCookie();
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    console.error('[API] Logout error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to logout' },
      { status: 500 }
    );
  }
}

