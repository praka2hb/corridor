import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/jwt-service'
import { db } from '@/lib/db'
import { GridService } from '@/lib/services/grid-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: organizationId } = params

    // Check if user is a member of this organization
    const member = await db.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: user.userId,
          organizationId,
        },
      },
      include: {
        organization: true,
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'You are not a member of this organization' },
        { status: 403 }
      )
    }

    const organization = member.organization

    if (!organization.creatorAccountAddress) {
      return NextResponse.json(
        { error: 'Organization does not have an account address' },
        { status: 404 }
      )
    }

    // Fetch balance from creator's account using GridService
    console.log('[Balance API] Fetching balance for account address:', organization.creatorAccountAddress)
    
    const gridService = new GridService()
    const balanceResponse = await gridService.getAccountBalances(organization.creatorAccountAddress)
    
    console.log('[Balance API] Balance response:', balanceResponse)

    // Convert array of balances to object format
    const balanceMap: Record<string, number> = {}
    if (balanceResponse.balances) {
      balanceResponse.balances.forEach(balance => {
        balanceMap[balance.currency] = balance.balance
      })
    }

    return NextResponse.json({
      success: true,
      accountId: organization.creatorAccountAddress,
      balances: {
        SOL: balanceMap.SOL || 0,
        USDC: balanceMap.USDC || balanceMap.USDC_DEVNET || 0,
      },
      raw: balanceResponse.balances || [],
    })
  } catch (error: any) {
    console.error('[Balance API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch balance',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
