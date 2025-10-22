import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/jwt-service";
import { db } from "@/lib/db";

export const runtime = 'nodejs';

/**
 * POST /api/kyc/mark-approved
 * 
 * Marks the user's KYC status as approved when Grid redirects back successfully.
 * This is called when Grid redirects to /organization/kyb-callback after successful verification.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Get authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log('[Mark Approved] Marking KYC as approved for user:', user.userId);

    // 2. Get user from database
    const dbUser = await db.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        kycId: true,
        kycStatus: true,
        kycType: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // 3. Check if user has KYC ID (meaning they started the process)
    if (!dbUser.kycId) {
      console.log('[Mark Approved] No KYC ID found for user');
      return NextResponse.json(
        { success: false, error: "No KYC verification found for this user" },
        { status: 400 }
      );
    }

    // 4. Update KYC status to approved
    const updatedUser = await db.user.update({
      where: { id: dbUser.id },
      data: {
        kycStatus: 'approved',
        // Note: kycVerificationLevel will be updated by webhook if Grid sends it
      },
      select: {
        id: true,
        email: true,
        kycStatus: true,
        kycType: true,
        kycVerificationLevel: true,
      },
    });

    console.log('[Mark Approved] ✅ KYC status updated to approved');
    console.log('[Mark Approved] User:', updatedUser.email);
    console.log('[Mark Approved] Status:', updatedUser.kycStatus);
    console.log('[Mark Approved] Type:', updatedUser.kycType);

    return NextResponse.json({
      success: true,
      message: 'KYC status updated to approved',
      user: {
        kycStatus: updatedUser.kycStatus,
        kycType: updatedUser.kycType,
        kycVerificationLevel: updatedUser.kycVerificationLevel,
      },
    });

  } catch (error) {
    console.error('[Mark Approved] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update KYC status' 
      },
      { status: 500 }
    );
  }
}
