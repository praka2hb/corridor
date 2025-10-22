import { NextRequest, NextResponse } from 'next/server';
import { initiateAuth } from '@/lib/services/auth-service';

// GET /api/accounts - List all accounts or get current user accounts
export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Validate required parameters
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // TODO: Implement account listing functionality
    return NextResponse.json(
      { success: false, error: 'Not implemented' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

// POST /api/accounts - Create a new account or authenticate existing user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Use auth-service to handle authentication logic
    const authResult = await initiateAuth(email);

    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Failed to start authentication' },
        { status: 500 }
      );
    }

    const isExistingUser = authResult.authFlow === 'login';

    const response = NextResponse.json(
      { 
        success: true, 
        message: 'OTP sent to email for verification', 
        authFlow: authResult.authFlow,
        email: authResult.email,
        provider: authResult.provider,
        type: authResult.type,
        isExistingUser 
      },
      { status: 201 }
    );

    // Store userData from createAccount (required for completeAuthAndCreateAccount)
    if (authResult.userData) {
      console.log('[API] 💾 Storing user data in cookie for OTP verification');
      response.cookies.set({
        name: 'grid_user_data',
        value: JSON.stringify(authResult.userData),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 5, // 5 minutes
      });
    }

    // Store auth flow to determine which completion method to use
    response.cookies.set({
      name: 'grid_auth_flow',
      value: authResult.authFlow,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 5, // 5 minutes
    });

    return response;
  } catch (error: any) {
    console.error('[API] Error in authentication flow:', error);
    
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to start authentication. Please try again.' },
      { status: 500 }
    );
  }
}
