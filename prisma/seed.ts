/**
 * Prisma Database Seed Script
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed Kamino USDC strategy (mSOL as example)
  const msolStrategy = await prisma.investmentStrategy.upsert({
    where: { strategyId: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So' },
    update: {},
    create: {
      provider: 'kamino',
      strategyId: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
      symbol: 'mSOL',
      asset: 'USDC',
      apy: 25.26, // Will be updated from API
      riskLabel: 'Low',
      status: 'active',
      allowlisted: true,
    },
  });

  console.log('✅ Created strategy:', msolStrategy.symbol);

  // Optional: Seed a demo organization and user for testing
  const demoOrg = await prisma.organization.upsert({
    where: { id: 'demo-org' },
    update: {},
    create: {
      id: 'demo-org',
      name: 'Demo Organization',
      gridOrgId: null,
      // Note: This demo org does not have a treasury account
      // Real organizations should have treasury created via /api/organization/create
      treasuryAccountId: null,
      treasuryStatus: 'pending', // Changed from 'active' to 'pending'
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@corridor.finance' },
    update: {},
    create: {
      email: 'demo@corridor.finance',
      kycStatus: 'approved',
    },
  });

  const demoEmployee = await prisma.employeeProfile.upsert({
    where: { id: 'demo-employee' },
    update: {},
    create: {
      id: 'demo-employee',
      orgId: demoOrg.id,
      userId: demoUser.id,
      name: 'Demo Employee',
      email: 'demo@corridor.finance',
      payoutWallet: 'DemoWallet123456789',
      status: 'active',
      kycStatus: 'approved',
    },
  });

  console.log('✅ Created demo org, user, and employee');
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

