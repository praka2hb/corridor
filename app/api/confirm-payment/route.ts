/**
 * Step 3: Send Signed Transaction (Backend)
 * 
 * Sends the signed transaction payload to the blockchain
 * This endpoint uses the backend client with API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { SDKGridClient } from '@/lib/grid/sdkClient';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { sendPaymentReceivedEmail } from '@/lib/services/email-service';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('[ConfirmPayment] ========================================');
    console.log('[ConfirmPayment] Sending signed transaction...');
    
    // 1. Verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { address, signedTransactionPayload, recipientEmail } = body;

    if (!address || !signedTransactionPayload) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: address, signedTransactionPayload' 
        },
        { status: 400 }
      );
    }

    console.log('[ConfirmPayment] Sending transaction for address:', address);

    // 3. Send signed transaction
    const gridClient = SDKGridClient.getInstance();
    const response = await gridClient.send({
      signedTransactionPayload,
      address,
    });

    console.log('[ConfirmPayment] Send result:', {
      hasTransactionSignature: !!response?.transaction_signature,
      confirmedAt: response?.confirmed_at
    });

    if (!response || !response.transaction_signature) {
      console.error('[ConfirmPayment] Failed to send transaction - no signature returned');
      return NextResponse.json(
        { success: false, error: 'Failed to send transaction - no signature returned' },
        { status: 500 }
      );
    }

    const signature = response.transaction_signature;
    console.log('[ConfirmPayment] ✅ Transaction sent successfully');
    console.log('[ConfirmPayment] Signature:', signature);
    console.log('[ConfirmPayment] Confirmed at:', response.confirmed_at);
    
    // Send email notification to recipient if email is provided
    if (recipientEmail) {
      try {
        // Get recipient user info
        const recipientUser = await db.user.findUnique({
          where: { email: recipientEmail },
          select: { email: true, username: true }
        });
        
        // Get sender info
        const senderUser = await db.user.findUnique({
          where: { id: user.userId },
          select: { email: true }
        });

        if (recipientUser) {
          const transactionLink = `https://solscan.io/tx/${signature}`;
          
          await sendPaymentReceivedEmail({
            recipientEmail: recipientUser.email,
            recipientName: recipientUser.username || recipientUser.email,
            senderEmail: senderUser?.email || 'Unknown',
            amount: body.amount || 0,
            currency: 'USDC',
            transactionLink,
          });
          
          console.log('[ConfirmPayment] ✅ Email notification sent');
        }
      } catch (emailError) {
        console.error('[ConfirmPayment] Failed to send email notification:', emailError);
        // Don't fail the transaction if email fails
      }
    }
    
    console.log('[ConfirmPayment] ========================================');

    return NextResponse.json({
      success: true,
      signature,
      confirmedAt: response.confirmed_at,
    });

  } catch (error) {
    console.error('[ConfirmPayment] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
