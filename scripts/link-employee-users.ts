/**
 * Migration Script: Link Employee Profiles to User Accounts
 * 
 * This script links existing EmployeeProfile records to User accounts
 * based on matching email addresses. This enables employees to access
 * organization dashboards with their employee view.
 * 
 * Run with: npx tsx scripts/link-employee-users.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function linkEmployeeUsers() {
  console.log('🔗 Starting employee-user linking process...\n')

  try {
    // Get all employee profiles that don't have a userId yet
    const employeesWithoutUser = await prisma.employeeProfile.findMany({
      where: {
        userId: null,
        email: {
          not: null,
        },
        status: 'active',
      },
      select: {
        id: true,
        email: true,
        name: true,
        orgId: true,
      },
    })

    console.log(`📊 Found ${employeesWithoutUser.length} employees without linked user accounts\n`)

    if (employeesWithoutUser.length === 0) {
      console.log('✅ All employees are already linked to user accounts!')
      return
    }

    let linkedCount = 0
    let notFoundCount = 0

    for (const employee of employeesWithoutUser) {
      if (!employee.email) continue

      // Find matching user by email
      const user = await prisma.user.findUnique({
        where: {
          email: employee.email.toLowerCase(),
        },
        select: {
          id: true,
          email: true,
        },
      })

      if (user) {
        // Link the employee profile to the user
        await prisma.employeeProfile.update({
          where: {
            id: employee.id,
          },
          data: {
            userId: user.id,
          },
        })

        console.log(`✅ Linked: ${employee.name} (${employee.email}) -> User ID: ${user.id}`)
        linkedCount++
      } else {
        console.log(`⚠️  No user found for: ${employee.name} (${employee.email})`)
        notFoundCount++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📈 Summary:')
    console.log(`   ✅ Successfully linked: ${linkedCount} employees`)
    console.log(`   ⚠️  No matching user: ${notFoundCount} employees`)
    console.log('='.repeat(60))

    if (notFoundCount > 0) {
      console.log('\n💡 Tip: Employees without matching user accounts need to:')
      console.log('   1. Sign up with the same email address used in their employee profile')
      console.log('   2. Or have an admin update their employee email to match their user account')
    }

  } catch (error) {
    console.error('❌ Error during migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
linkEmployeeUsers()
  .then(() => {
    console.log('\n✨ Migration completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error)
    process.exit(1)
  })
