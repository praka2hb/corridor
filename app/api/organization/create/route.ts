/**
 * Create Organization API
 * 
 * Creates a new organization using the creator's existing Grid account
 * 
 * Flow:
 * 1. Verify user authentication
 * 2. Store organization with creator's account address
 * 3. Creator's personal Grid account is used for organization operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { db } from '@/lib/db';

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

    // 3. Get user details
    const dbUser = await db.user.findUnique({
      where: { id: user.userId },
      select: { 
        publicKey: true, 
        email: true,
        gridUserId: true,
      }
    });

    if (!dbUser?.publicKey) {
      return NextResponse.json(
        { success: false, error: 'User does not have a Grid account. Please complete sign in first.' },
        { status: 400 }
      );
    }

    console.log('=== CREATING ORGANIZATION ===');
    console.log('Creator Email:', dbUser.email);
    console.log('Creator Public Key:', dbUser.publicKey);
    console.log('=============================');

    // 4. Create organization in database using creator's account
    const organization = await db.organization.create({
      data: {
        name: organizationName.trim(),
        creatorAccountAddress: dbUser.publicKey, // Creator's account address
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
        creatorAccountAddress: organization.creatorAccountAddress,
      },
      message: 'Organization created successfully.',
    });

  } catch (error) {
    console.error('Organization creation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create organization' 
      },
      { status: 500 }
    );
  }
}
