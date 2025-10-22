/**
 * Prepare and Sign Payment (Server-Side Only)
 * 
 * This endpoint handles both payment preparation and signing on the server
 * Session secrets never leave the backend - they are used server-side only
 */

import { NextRequest, NextResponse } from 'next/server';
import { SDKGridClient } from '@/lib/grid/sdkClient';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { getSessionSecrets, getAuthSession } from '@/lib/services/database-service';
import type { CreatePaymentIntentRequest } from '@sqds/grid';

export async function POST(request: NextRequest) {
  try {
    console.log('[PrepareAndSignPayment] ========================================');
    console.log('[PrepareAndSignPayment] Creating and signing payment...');
    
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
    const { 
      fromAddress,
      toAddress, 
      amount,
      gridUserId 
    } = body;

    if (!fromAddress || !toAddress || !amount || !gridUserId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: fromAddress, toAddress, amount, gridUserId' 
        },
        { status: 400 }
      );
    }

    // Convert amount to base units (USDC has 6 decimals)
    const amountInBaseUnits = Math.floor(amount * 1_000_000);

    console.log('[PrepareAndSignPayment] Payment details:', {
      from: fromAddress,
      to: toAddress,
      amount,
      amountInBaseUnits,
      gridUserId
    });

    // 3. Get session secrets from database (server-side only)
    const sessionSecrets = await getSessionSecrets(user.userId);
    if (!sessionSecrets) {
      console.error('[PrepareAndSignPayment] No session secrets found');
      return NextResponse.json(
        { success: false, error: 'Session secrets not found. Please try logging in again.' },
        { status: 404 }
      );
    }

    // 4. Get authentication session from database (server-side only)
    const authSession = await getAuthSession(user.userId);
    if (!authSession) {
      console.error('[PrepareAndSignPayment] No authentication session found');
      return NextResponse.json(
        { success: false, error: 'Authentication session not found. Please try logging in again.' },
        { status: 404 }
      );
    }

    console.log('[PrepareAndSignPayment] ✅ Session credentials retrieved (server-side)');

    // 5. Create payment intent
    const gridClient = SDKGridClient.getInstance();
    
    const paymentRequest: CreatePaymentIntentRequest = {
      amount: amountInBaseUnits.toString(),
      grid_user_id: gridUserId,
      source: {
        account: fromAddress,
        currency: 'usdc',
      },
      destination: {
        address: toAddress,
        currency: 'usdc',
      },
    };

    console.log('[PrepareAndSignPayment] Creating payment intent...');
    console.log('[PrepareAndSignPayment] Payment request details:', {
      source_account: fromAddress,
      destination_address: toAddress,
      amount_usdc: amount,
      amount_base_units: amountInBaseUnits,
      grid_user_id: gridUserId
    });

    const response = await gridClient.createPaymentIntent(
      fromAddress,
      paymentRequest
    );

    if (!response || response.error) {
      const error = response?.error || 'Unknown error';
      console.error('[PrepareAndSignPayment] Failed to create payment intent:', error);
      return NextResponse.json(
        { success: false, error: `Failed to create payment intent: ${error}` },
        { status: 500 }
      );
    }

    if (!response.data) {
      console.error('[PrepareAndSignPayment] No data in response');
      return NextResponse.json(
        { success: false, error: 'No data returned from payment intent' },
        { status: 500 }
      );
    }

    const transactionPayload = (response.data as any)?.transactionPayload;
    if (!transactionPayload) {
      console.error('[PrepareAndSignPayment] No transaction payload in response');
      return NextResponse.json(
        { success: false, error: 'No transaction payload received from payment intent' },
        { status: 500 }
      );
    }

    console.log('[PrepareAndSignPayment] ✅ Payment intent created');

    // 6. Sign transaction (server-side only - sessionSecrets never leave backend)
    console.log('[PrepareAndSignPayment] Signing transaction (server-side)...');

    const frontendClient = SDKGridClient.getFrontendClient();
    const signedPayload = await frontendClient.sign({
      sessionSecrets,
      session: authSession,
      transactionPayload,
    });

    console.log('[PrepareAndSignPayment] ✅ Transaction signed (server-side)');
    console.log('[PrepareAndSignPayment] ========================================');

    // 7. Return signed payload for final confirmation
    return NextResponse.json({
      success: true,
      signedTransactionPayload: signedPayload,
      address: fromAddress,
    });

  } catch (error) {
    console.error('[PrepareAndSignPayment] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
