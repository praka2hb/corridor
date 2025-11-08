import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/jwt-service'
import { db } from '@/lib/db'
import { SDKGridClient } from '@/lib/grid/sdkClient'

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
    const type = searchParams.get('type') // 'payroll' or null

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

    // Fetch transfers from Grid SDK
    console.log('[Transfers API] Fetching transfers for:', organization.creatorAccountAddress)
    
    const gridClient = SDKGridClient.getInstance()
    const transfersResponse = await gridClient.getTransfers(
      organization.creatorAccountAddress
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

    // Filter transfers if type is specified
    let filteredTransfers = allTransfers
    if (type === 'payroll') {
      // Get all payroll stream IDs for this organization
      const payrollStreams = await db.payrollStream.findMany({
        where: {
          employee: {
            orgId: organizationId,
          },
        },
        select: {
          id: true,
          gridStandingOrderId: true,
          employee: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      })

      // Get all StreamRun records with transferIds for these streams
      const streamIds = payrollStreams.map(s => s.id)
      const streamRuns = await db.streamRun.findMany({
        where: {
          streamId: { in: streamIds },
          transferId: { not: null },
        },
        select: {
          transferId: true,
          streamId: true,
        },
      })

      // Create a map of transferId -> streamId for quick lookup
      const transferIdToStreamId = new Map<string, string>()
      streamRuns.forEach(run => {
        if (run.transferId) {
          transferIdToStreamId.set(run.transferId, run.streamId)
        }
      })

      // Create a map of streamId -> employee info
      const streamIdToEmployee = new Map()
      payrollStreams.forEach(stream => {
        streamIdToEmployee.set(stream.id, {
          employeeName: stream.employee.name,
          employeeEmail: stream.employee.email,
          gridStandingOrderId: stream.gridStandingOrderId,
        })
      })

      // Filter transfers that are related to payroll streams
      filteredTransfers = allTransfers.filter((transfer: any) => {
        // First check StreamRun records (most reliable)
        if (transferIdToStreamId.has(transfer.id)) {
          return true
        }
        
        // Fall back to signature/metadata matching for transfers not yet in StreamRun
        return payrollStreams.some(stream => 
          transfer.signature?.includes(stream.gridStandingOrderId) ||
          transfer.metadata?.standingOrderId === stream.gridStandingOrderId
        )
      }).map((transfer: any) => {
        // Add employee information to payroll transfers
        let employeeInfo = null
        
        // First try to get employee info from StreamRun mapping
        const streamId = transferIdToStreamId.get(transfer.id)
        if (streamId) {
          employeeInfo = streamIdToEmployee.get(streamId)
        }
        
        // Fall back to signature/metadata matching
        if (!employeeInfo) {
          const payrollStream = payrollStreams.find(stream => 
            transfer.signature?.includes(stream.gridStandingOrderId) ||
            transfer.metadata?.standingOrderId === stream.gridStandingOrderId
          )
          if (payrollStream) {
            employeeInfo = {
              employeeName: payrollStream.employee.name,
              employeeEmail: payrollStream.employee.email,
            }
          }
        }
        
        return {
          ...transfer,
          employeeName: employeeInfo?.employeeName,
          employeeEmail: employeeInfo?.employeeEmail,
          isPayrollTransfer: true,
        }
      })
    }

    // Manual pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const transfers = filteredTransfers.slice(startIndex, endIndex)

    return NextResponse.json({
      success: true,
      transfers,
      pagination: {
        page,
        limit,
        total: filteredTransfers.length,
        hasMore: endIndex < filteredTransfers.length,
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
