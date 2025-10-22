/**
 * Quick Fix Script: Update User KYC Status
 * 
 * Run this to manually approve a user's KYC status
 * Usage: node scripts/fix-kyc-status.js <userId>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateKycStatus(userId: string, status: string = 'approved') {
  try {
    console.log('Updating KYC status...');
    console.log('User ID:', userId);
    console.log('New Status:', status);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { kycStatus: status },
      select: {
        id: true,
        email: true,
        kycStatus: true,
        kycId: true,
        gridUserId: true,
      }
    });

    console.log('\n✅ Success!');
    console.log('Updated user:', {
      id: user.id,
      email: user.email,
      kycStatus: user.kycStatus,
      kycId: user.kycId,
      gridUserId: user.gridUserId,
    });

    return user;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get args from command line
const userId = process.argv[2];
const status = process.argv[3] || 'approved';

if (!userId) {
  console.error('Usage: tsx scripts/fix-kyc-status.ts <userId> [status]');
  console.error('Example: tsx scripts/fix-kyc-status.ts cmgy1s4ci0000t3igjgla1kvl approved');
  process.exit(1);
}

updateKycStatus(userId, status);
