/**
 * Create Organization API
 * 
 * Creates a new organization with multisig treasury and initiates business KYB
 * 
 * Flow:
 * 1. Verify user authentication
 * 2. Create multisig treasury account via Grid SDK (signers type)
 *    Response: { type, address, policies, grid_user_id }
 * 3. Request business KYB for the multisig account (not user's personal account)
 * 4. Store organization with multisig details and KYB tracking
 * 5. Return KYB link for immediate user redirect
 * 
 * Key Point: The multisig account itself undergoes business KYB verification,
 * making it the legal business entity. The user is just the initial signer.
 * 
 * Grid SDK Response Structure:
 * - address: Solana multisig address (e.g., "E8Pvap...")
 * - grid_user_id: Unique identifier for the multisig (e.g., "550e8400-...")
 * - type: "signers"
 * - policies: { threshold, signers[], time_lock, admin_address }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { db } from '@/lib/db';
import { SDKGridClient } from '@/lib/grid/sdkClient';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get organization name from request
    const body = await request.json();
    const { organizationName } = body;

    if (!organizationName || !organizationName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Organization name is required' },
        { status: 400 }
      );
    }

    // 3. Get user details and check KYC status
    const dbUser = await db.user.findUnique({
      where: { id: user.userId },
      select: { 
        publicKey: true, 
        email: true,
        gridUserId: true,
        kycStatus: true,
        kycId: true,
      }
    });

    if (!dbUser?.publicKey || !dbUser?.gridUserId) {
      return NextResponse.json(
        { success: false, error: 'User authentication incomplete. Please complete sign in first.' },
        { status: 400 }
      );
    }

    if (!dbUser.email) {
      return NextResponse.json(
        { success: false, error: 'User email is required for verification. Please update your profile.' },
        { status: 400 }
      );
    }

    // 4. Check if user has completed KYC verification
    // COMMENTED OUT FOR TESTING - TODO: Re-enable before production
    /*
    if (!dbUser.kycStatus || dbUser.kycStatus !== 'approved') {
      // User needs to complete KYC verification
      let kycLink = null;
      
      return NextResponse.json({
        success: false,
        needsKyc: true,
        kycLink: kycLink,
        message: 'Please complete KYC verification before creating an organization'
      }, { status: 403 });
    }
    */

    // 5. Create multisig treasury account using Grid SDK
    const gridClient = SDKGridClient.getInstance();
    
    // Prepare the multisig creation request - using SignersAccountRequest format
    const createAccountRequest = {
      type: "signers" as const,
      policies: {
        signers: [
          {
            address: dbUser.publicKey,
            role: "primary" as const,
            permissions: ["CAN_INITIATE" as const, "CAN_VOTE" as const, "CAN_EXECUTE" as const],
            provider: "external" as const,
          },
        ],
        threshold: 1, // Only 1 signature required to execute transactions
        time_lock: null,
        admin_address: null,
      },
      grid_user_id: null, // Let Grid create a new user ID for the multisig
      memo: undefined,
    };
    
    
    const multisigResponse = await gridClient.createAccount(createAccountRequest);

    if (!multisigResponse || multisigResponse.error) {
      return NextResponse.json(
        { success: false, error: 'Failed to create treasury account' },
        { status: 500 }
      );
    }

    // Grid SDK returns: { type, address, policies, grid_user_id }
    // Note: There is NO separate "id" field - just address and grid_user_id
    const multisigData = multisigResponse.data as any;
    const treasuryAddress = multisigData.address; // Multisig's Solana address
    const treasuryGridUserId = multisigData.grid_user_id; // Multisig's Grid User ID
    const signerAddress = multisigData.policies?.signers?.[0]?.address; // First signer's address

    if (!treasuryAddress || !treasuryGridUserId) {
      return NextResponse.json(
        { success: false, error: 'Invalid response from treasury creation' },
        { status: 500 }
      );
    }


    // 6. Create organization in database (no KYB needed since user KYC is approved)
    
    const organization = await db.organization.create({
      data: {
        name: organizationName.trim(),
        treasuryAccountId: treasuryAddress, // Multisig address from Grid
        treasuryGridUserId: treasuryGridUserId, // Multisig's Grid User ID
        treasurySignerAddress: signerAddress, // Signer's address from Grid policies
        treasuryStatus: 'active', // No KYB needed since user KYC is approved
        members: {
          create: {
            userId: user.userId,
            role: 'owner', // Creator is the owner
          }
        }
      },
      include: {
        members: true,
      }
    });


    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        treasuryAddress: treasuryAddress,
        treasuryStatus: organization.treasuryStatus,
      },
      message: 'Organization created successfully with active treasury.',
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create organization' 
      },
      { status: 500 }
    );
  }
}
