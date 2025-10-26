/**
 * Payroll Service
 * Business logic for managing payroll streams and standing orders
 */

import { db } from '@/lib/db';
import * as gridClient from '@/lib/grid/client';
import { createNotification } from './notification-service';
import { sendPayrollCreatedEmail, sendPaymentExecutedEmail } from './email-service';
import { getSessionSecrets, getAuthSession } from './database-service';
import type { StandingOrderConfig, GridAccountDetails, SolanaDetails } from '@/lib/types/payroll';

export async function createPayrollStream({
  organizationId,
  employeeEmail,
  amountPerPayment,
  cadence,
  startDate,
  endDate,
  teamId,
  createdByUserId,
}: {
  organizationId: string;
  employeeEmail: string;
  amountPerPayment: number;
  cadence: 'weekly' | 'monthly'; // Grid only supports weekly and monthly
  startDate: string;
  endDate?: string;
  teamId?: string;
  createdByUserId: string;
}) {
  try {
    // 1. Get organization details
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // 2. Find employee by email or public address (must be onboarded user)
    // Check if employeeEmail is actually a public address (starts with common Solana address prefix)
    const isPublicAddress = /^[A-Za-z0-9]{32,44}$/.test(employeeEmail);
    
    let user;
    if (isPublicAddress) {
      // Lookup by public address
      user = await db.user.findFirst({
        where: { publicKey: employeeEmail },
      });
    } else {
      // Lookup by email
      user = await db.user.findUnique({
        where: { email: employeeEmail },
      });
    }

    if (!user) {
      throw new Error('User not found. Employee must be onboarded to the platform first.');
    }

    if (!user.gridUserId) {
      throw new Error('User does not have a Grid account. Please complete onboarding first.');
    }

    // 3. Find or create employee profile
    let employee = await db.employeeProfile.findFirst({
      where: {
        orgId: organizationId,
        userId: user.id,
      },
    });

    if (!employee) {
      // Create employee profile
      employee = await db.employeeProfile.create({
        data: {
          orgId: organizationId,
          userId: user.id,
          name: user.username || user.email,
          email: user.email,
          payoutWallet: user.publicKey,
          status: 'active',
        },
      });
    }

    if (!user.publicKey) {
      throw new Error('User does not have a public key. Please complete wallet setup first.');
    }

    // 4. Calculate amount in base units (USDC has 6 decimals)
    const amountInBaseUnits = Math.floor(amountPerPayment * 1_000_000);
    
    console.log('[PayrollService] Amount calculation:', {
      amountPerPayment,
      cadence,
      amountInBaseUnits,
      minimumRequired: 100_000
    });
    
    // Ensure minimum amount (at least $0.10 per payment)
    if (amountInBaseUnits < 100_000) {
      throw new Error(`Minimum payment amount is $0.10 USDC per payment. Calculated amount: $${amountPerPayment} (${amountInBaseUnits} base units)`);
    }

    // 5. Create Grid standing order
    // Parse and normalize dates
    const startDateObj = new Date(startDate);
    let endDateObj = endDate ? new Date(endDate) : null;
    
    // Ensure start date is at least 24 hours in the future (Grid requirement)
    const now = new Date();
    const minStartDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    if (startDateObj < minStartDate) {
      // Set to minimum start date
      startDateObj.setTime(minStartDate.getTime());
    }
    
    // Set time to 10:00 AM UTC (Grid best practice from documentation)
    startDateObj.setUTCHours(10, 0, 0, 0);
    
    // Validate minimum duration
    if (!endDateObj) {
      // Set reasonable defaults based on frequency
      switch (cadence) {
        case 'weekly':
          endDateObj = new Date(startDateObj.getTime() + 4 * 7 * 24 * 60 * 60 * 1000); // 4 weeks default
          break;
        case 'monthly':
          endDateObj = new Date(startDateObj.getTime() + 3 * 30 * 24 * 60 * 60 * 1000); // 3 months default
          break;
      }
    } else {
      // Ensure end date is also at 10:00 AM UTC for consistency
      endDateObj.setUTCHours(10, 0, 0, 0);
      
      // Validate that end date is far enough from start date for the frequency
      const daysDiff = Math.floor((endDateObj.getTime() - startDateObj.getTime()) / (24 * 60 * 60 * 1000));
      
      if (cadence === 'weekly' && daysDiff < 7) {
        throw new Error(`For weekly payroll, end date must be at least 7 days after start date. Current difference: ${daysDiff} days.`);
      }
      
      if (cadence === 'monthly' && daysDiff < 30) {
        throw new Error(`For monthly payroll, end date must be at least 30 days after start date. Current difference: ${daysDiff} days.`);
      }
    }
    
    // Type the source and destination explicitly to match Grid SDK types
    const source: GridAccountDetails = {
      account: organization.creatorAccountAddress,
      currency: 'usdc',
    };

    const destination: SolanaDetails = {
      address: user.publicKey, // Use user's public key as destination address
      currency: 'usdc',
    };

    const standingOrderConfig: StandingOrderConfig = {
      amount: amountInBaseUnits.toString(),
      grid_user_id: user.gridUserId, // Required at root level
      source,
      destination,
      frequency: cadence, // Grid supports weekly, monthly
      start_date: startDateObj.toISOString(),
      end_date: endDateObj ? endDateObj.toISOString() : undefined,
    };

    console.log('[PayrollService] Creating standing order:', standingOrderConfig);

    const standingOrderResponse = await gridClient.createStandingOrder(
      organization.creatorAccountAddress,
      standingOrderConfig
    );

    // Check for Grid API errors
    if (!standingOrderResponse || standingOrderResponse.success === false) {
      const errorMsg = (standingOrderResponse as any)?.error || 'Unknown error';
      throw new Error(`Failed to create standing order on Grid: ${errorMsg}`);
    }

    if (!standingOrderResponse?.data?.id) {
      throw new Error('Failed to create standing order on Grid: No standing order ID returned');
    }

    const gridStandingOrderId = standingOrderResponse.data.id;
    const gridNextExecutionDate = (standingOrderResponse.data as any).next_execution_date;
    const standingOrderStatus = (standingOrderResponse.data as any).status;
    const transactionPayload = (standingOrderResponse.data as any).transactionPayload || (standingOrderResponse.data as any).transaction;
    const kmsPayloads = (standingOrderResponse.data as any).kms_payloads;

    // ALWAYS sign and submit immediately after creation
    // Grid only returns transactionPayload during creation, not in getStandingOrder()
    if (transactionPayload) {
      console.log('[PayrollService] Transaction payload received, signing and submitting immediately...');
      console.log('[PayrollService] KMS payloads included:', kmsPayloads?.length || 0, 'payloads');
      
      try {
        // Get organization owner's session secrets and auth session
        const organizationOwner = await db.organizationMember.findFirst({
          where: {
            organizationId,
            role: 'owner',
          },
          include: {
            user: true,
          },
        });

        if (!organizationOwner?.user) {
          throw new Error('Organization owner not found');
        }

        const sessionSecrets = await getSessionSecrets(organizationOwner.user.id);
        if (!sessionSecrets) {
          throw new Error('Organization owner session secrets not found. Please log in again.');
        }

        const authSession = await getAuthSession(organizationOwner.user.id);
        if (!authSession) {
          throw new Error('Organization owner auth session not found. Please log in again.');
        }

        // Sign and submit the transaction immediately
        // Construct TransactionPayload from Grid response
        const transactionPayloadData = {
          transaction: transactionPayload,
          kms_payloads: kmsPayloads,
          transaction_signers: (standingOrderResponse.data as any).transaction_signers || []
        };
        
        console.log('[PayrollService] Signing and submitting standing order transaction with KMS payloads...');
        const signedResult = await gridClient.signAndSend({
          sessionSecrets,
          transactionPayload: transactionPayloadData,
          session: authSession,
          address: organization.creatorAccountAddress,
        });

        console.log('[PayrollService] ✅ Standing order transaction signed and submitted:', signedResult);
        
        if (signedResult?.transaction_signature) {
          console.log('[PayrollService] ✅ Standing order is now active on blockchain');
        } else {
          console.warn('[PayrollService] ⚠️ Submission completed but no signature returned');
        }
      } catch (signError: any) {
        console.error('[PayrollService] ❌ CRITICAL: Failed to sign and submit standing order:', signError);
        console.error('[PayrollService] Error details:', {
          message: signError.message,
          stack: signError.stack,
        });
        // This is a critical error - the standing order was created but can't be activated
        // We should throw this error so the user knows something went wrong
        throw new Error(`Failed to activate standing order: ${signError.message}. Please contact support.`);
      }
    } else {
      console.warn('[PayrollService] ⚠️ No transaction payload returned from Grid. Standing order may already be active or there was an issue.');
    }

    // 6. Create PayrollStream record
    const stream = await db.payrollStream.create({
      data: {
        employeeId: employee.id,
        teamId,
        amountMonthly: amountPerPayment, // Store per-payment amount as monthly for database compatibility
        currency: 'USDC',
        cadence,
        status: 'active',
        gridStandingOrderId,
        nextRunAt: gridNextExecutionDate ? new Date(gridNextExecutionDate) : new Date(startDate),
      },
      include: {
        employee: true,
      },
    });

    // 7. Create notification for employee
    await createNotification({
      userId: user.id,
      type: 'payroll_created',
      title: 'Payroll Stream Created',
      body: `You've been added to ${organization.name}'s payroll. You'll receive ${amountPerPayment} USDC ${cadence}.`,
      metadata: {
        streamId: stream.id,
        organizationId,
        amount: amountPerPayment,
        cadence,
      },
    });

    // 8. Send email notification
    await sendPayrollCreatedEmail({
      email: user.email,
      employeeName: employee.name,
      organizationName: organization.name,
      amount: amountPerPayment,
      frequency: cadence,
      startDate,
    });

    console.log('[PayrollService] Payroll stream created:', stream.id);

    return stream;
  } catch (error) {
    console.error('[PayrollService] Failed to create payroll stream:', error);
    throw error;
  }
}

function calculatePaymentAmount(
  amountMonthly: number,
  cadence: 'weekly' | 'monthly'
): number {
  switch (cadence) {
    case 'weekly':
      return amountMonthly / 4.33; // More accurate: 52 weeks / 12 months
    case 'monthly':
      return amountMonthly;
    default:
      return amountMonthly;
  }
}

export async function pausePayrollStream(streamId: string) {
  try {
    const stream = await db.payrollStream.findUnique({
      where: { id: streamId },
      include: { employee: { include: { organization: true } } },
    });

    if (!stream) {
      throw new Error('Payroll stream not found');
    }

    // Update local record only (Grid doesn't support pause/resume)
    const updatedStream = await db.payrollStream.update({
      where: { id: streamId },
      data: { status: 'paused' },
      include: { employee: true },
    });

    // Notify employee
    if (stream.employee.userId) {
      await createNotification({
        userId: stream.employee.userId,
        type: 'payroll_paused',
        title: 'Payroll Stream Paused',
        body: `Your payroll stream with ${stream.employee.organization.name} has been paused.`,
        metadata: { streamId },
      });
    }

    return updatedStream;
  } catch (error) {
    console.error('[PayrollService] Failed to pause payroll stream:', error);
    throw error;
  }
}

export async function resumePayrollStream(streamId: string) {
  try {
    const stream = await db.payrollStream.findUnique({
      where: { id: streamId },
      include: { employee: { include: { organization: true } } },
    });

    if (!stream) {
      throw new Error('Payroll stream not found');
    }

    // Update local record only (Grid doesn't support pause/resume)
    const updatedStream = await db.payrollStream.update({
      where: { id: streamId },
      data: { status: 'active' },
      include: { employee: true },
    });

    // Notify employee
    if (stream.employee.userId) {
      await createNotification({
        userId: stream.employee.userId,
        type: 'payroll_created',
        title: 'Payroll Stream Resumed',
        body: `Your payroll stream with ${stream.employee.organization.name} has been resumed.`,
        metadata: { streamId },
      });
    }

    return updatedStream;
  } catch (error) {
    console.error('[PayrollService] Failed to resume payroll stream:', error);
    throw error;
  }
}

export async function stopPayrollStream(streamId: string) {
  try {
    const stream = await db.payrollStream.findUnique({
      where: { id: streamId },
      include: { employee: { include: { organization: true } } },
    });

    if (!stream) {
      throw new Error('Payroll stream not found');
    }

    // Update local record only (Grid doesn't support canceling standing orders)
    const updatedStream = await db.payrollStream.update({
      where: { id: streamId },
      data: { status: 'stopped' },
      include: { employee: true },
    });

    // Notify employee
    if (stream.employee.userId) {
      await createNotification({
        userId: stream.employee.userId,
        type: 'payroll_stopped',
        title: 'Payroll Stream Stopped',
        body: `Your payroll stream with ${stream.employee.organization.name} has been stopped.`,
        metadata: { streamId },
      });
    }

    return updatedStream;
  } catch (error) {
    console.error('[PayrollService] Failed to stop payroll stream:', error);
    throw error;
  }
}

export async function getEmployeePayrollHistory(userId: string) {
  try {
    const employeeProfiles = await db.employeeProfile.findMany({
      where: { userId },
      include: {
        streams: {
          include: {
            runs: {
              where: { status: 'completed' },
              orderBy: { runAt: 'desc' },
            },
          },
        },
      },
    });

    // Calculate totals
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYearStart = new Date(now.getFullYear(), 0, 1);

    let totalEarnedThisMonth = 0;
    let totalEarnedThisYear = 0;

    employeeProfiles.forEach((profile) => {
      profile.streams.forEach((stream) => {
        stream.runs.forEach((run) => {
          const amount = calculatePaymentAmount(stream.amountMonthly, stream.cadence as 'weekly' | 'monthly');
          if (run.runAt >= thisMonthStart) {
            totalEarnedThisMonth += amount;
          }
          if (run.runAt >= thisYearStart) {
            totalEarnedThisYear += amount;
          }
        });
      });
    });

    return {
      employeeProfiles,
      totalEarnedThisMonth,
      totalEarnedThisYear,
    };
  } catch (error) {
    console.error('[PayrollService] Failed to get employee payroll history:', error);
    throw error;
  }
}

export async function syncStandingOrderExecutions() {
  try {
    console.log('[PayrollService] Starting standing order sync...');

    // Get all active streams
    const activeStreams = await db.payrollStream.findMany({
      where: {
        status: 'active',
        gridStandingOrderId: { not: null },
      },
      include: {
        employee: {
          include: {
            organization: true,
          },
        },
      },
    });

    let syncedCount = 0;

    for (const stream of activeStreams) {
      try {
        if (!stream.gridStandingOrderId) continue;

        const accountAddress = stream.employee.organization.creatorAccountAddress;

        // Get standing order details from Grid
        const standingOrderDetails = await gridClient.getStandingOrder(
          accountAddress,
          stream.gridStandingOrderId
        );

        if (!standingOrderDetails?.data) continue;

        // Note: Grid API doesn't provide execution history in getStandingOrder response
        // Payment tracking would need to be implemented using transfer history API
        // For now, we only update the next execution date

        // Update both nextRunAt and status based on Grid's data
        const updateData: any = {};
        
        if (standingOrderDetails.data.next_execution_date) {
          updateData.nextRunAt = new Date(standingOrderDetails.data.next_execution_date);
        }
        
        // Map Grid status to our local status if needed
        if (standingOrderDetails.data.status) {
          // Map Grid statuses to our local statuses
          let localStatus: 'active' | 'paused' | 'stopped' = stream.status as 'active' | 'paused' | 'stopped'; // Default to current status
          const gridStatus = standingOrderDetails.data.status as string;
          switch (gridStatus) {
            case 'awaiting_confirmation':
            case 'active':
              localStatus = 'active';
              break;
            case 'paused':
              localStatus = 'paused';
              break;
            case 'stopped':
            case 'cancelled':
              localStatus = 'stopped';
              break;
          }
          updateData.status = localStatus;
        }
        
        // Only update if we have changes
        if (Object.keys(updateData).length > 0) {
          await db.payrollStream.update({
            where: { id: stream.id },
            data: updateData,
          });
          syncedCount++;
        }
      } catch (error) {
        console.error('[PayrollService] Failed to sync stream:', stream.id, error);
        // Continue with next stream
      }
    }

    console.log('[PayrollService] Sync completed. Synced', syncedCount, 'new executions');
    return { syncedCount };
  } catch (error) {
    console.error('[PayrollService] Failed to sync standing order executions:', error);
    throw error;
  }
}
