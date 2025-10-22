import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/jwt-service'
import { db } from '@/lib/db'
import { gridClient } from '@/lib/grid-client'

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
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

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

    if (!organization.treasuryAccountId) {
      return NextResponse.json(
        { error: 'Organization does not have a treasury account' },
        { status: 404 }
      )
    }

    // Fetch transfers from Grid SDK
    console.log('[Transfers API] Fetching transfers for:', organization.treasuryAccountId)
    
    const transfersResponse = await gridClient.getTransfers(
      organization.treasuryAccountId
    )

    console.log('[Transfers API] Transfers response:', transfersResponse)

    // Format the transfer data
    const allTransfers = (transfersResponse.data || []).map((transfer: any) => ({
      id: transfer.id,
      type: transfer.type, // 'incoming' | 'outgoing'
      amount: transfer.amount,
      currency: transfer.currency,
      status: transfer.status,
      from: transfer.from,
      to: transfer.to,
      signature: transfer.signature,
      createdAt: transfer.createdAt,
      completedAt: transfer.completedAt,
      metadata: transfer.metadata,
    }))

    // Manual pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const transfers = allTransfers.slice(startIndex, endIndex)

    return NextResponse.json({
      success: true,
      transfers,
      pagination: {
        page,
        limit,
        total: allTransfers.length,
        hasMore: endIndex < allTransfers.length,
      },
    })
  } catch (error: any) {
    console.error('[Transfers API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch transfers',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
