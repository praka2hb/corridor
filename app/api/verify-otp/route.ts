import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/services/auth-service';
import { generateToken, setAuthCookie, setGridUserIdCookie } from '@/lib/services/jwt-service';
import { gridClient } from '@/lib/grid-client';
import { db } from '@/lib/db';

// Force Node.js runtime for JWT compatibility
export const runtime = 'nodejs';

// POST /api/verify-otp - Verify OTP code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { otp, user: requestUser } = body;

    if (!otp || !requestUser) {
      return NextResponse.json(
        { success: false, error: 'OTP code and user are required' },
        { status: 400 }
      );
    }

    // Normalize and validate OTP (must be exactly 6 digits)
    const normalizedOtp = String(otp).trim();
    const isValidOtp = /^\d{6}$/.test(normalizedOtp);
    if (!isValidOtp) {
      return NextResponse.json(
        { success: false, error: 'Invalid OTP format. Please enter 6 digits. 🔢' },
        { status: 400 }
      );
    }

    // Extract email
    const email = requestUser.email || requestUser.identifier;
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get the auth flow and user data from cookies
    const authFlow = request.cookies.get('grid_auth_flow')?.value as 'signup' | 'login' | undefined;
    const userDataCookie = request.cookies.get('grid_user_data')?.value;
    
    console.log('[API] 📂 Auth flow from cookie:', authFlow);
    console.log('[API] 📦 User data cookie exists:', !!userDataCookie);

    if (!userDataCookie) {
      return NextResponse.json(
        { success: false, error: 'Session expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Parse the user data from createAccount
    const userData = JSON.parse(userDataCookie);
    console.log('[API] 👤 User data from cookie:', JSON.stringify(userData, null, 2));

    // Use auth-service to verify OTP with the user data from createAccount
    const verifyResult = await verifyAuth(email, normalizedOtp, userData, authFlow);

    if (!verifyResult.success) {
      return NextResponse.json(
        { success: false, error: verifyResult.error || 'Incorrect OTP code. Please check and try again. 🔐' },
        { status: 401 }
      );
    }

    console.log('[API] Authentication successful:', {
      userId: verifyResult.userId,
      authFlow: verifyResult.authFlow,
      isNewAccount: verifyResult.isNewAccount,
    });

    // Fetch user from database to get username
    const dbUser = await db.user.findUnique({
      where: { id: verifyResult.userId! },
      select: { username: true }
    });

    const username = dbUser?.username || undefined;

    console.log('[API] User username from database:', username || 'not set');

    // Generate JWT token with username if it exists
    const token = await generateToken({
      userId: verifyResult.userId!,
      email: email,
      username: username,
      accountAddress: verifyResult.address,
      gridUserId: verifyResult.gridUserId,
    });

    // Set auth cookie and grid user ID cookie
    await setAuthCookie(token);
    
    // Set grid_user_id in a separate cookie accessible from frontend
    if (verifyResult.gridUserId) {
      await setGridUserIdCookie(verifyResult.gridUserId);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful! ✨',
      authFlow: verifyResult.authFlow,
      isNewAccount: verifyResult.isNewAccount,
      hasUsername: !!username, // Flag to indicate if username is set
    });

    // Clear user data and auth flow cookies after successful verification
    response.cookies.set({
      name: 'grid_user_data',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    response.cookies.set({
      name: 'grid_auth_flow',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error: any) {
    console.error('[API] Error verifying OTP:', error);

    // Check for specific error messages
    const errorMessage = error?.message || '';
    if (errorMessage.includes('Invalid or expired OTP')) {
      return NextResponse.json(
        { success: false, error: 'Incorrect OTP code. Please check and try again. 🔐' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Verification failed. Please try again. ⚠️' },
      { status: 500 }
    );
  }
}
