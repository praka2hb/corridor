/**
 * Step 1: Create Payment Intent (Backend)
 * 
 * Creates a payment intent for USDC transfer using Grid SDK
 * This endpoint uses the backend client with API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { SDKGridClient } from '@/lib/grid/sdkClient';
import { getCurrentUser } from '@/lib/services/jwt-service';
import type { CreatePaymentIntentRequest } from '@sqds/grid';

export async function POST(request: NextRequest) {
  try {
    console.log('[PreparePayment] ========================================');
    console.log('[PreparePayment] Creating payment intent...');
    
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

    console.log('[PreparePayment] Payment details:', {
      from: fromAddress,
      to: toAddress,
      amount,
      amountInBaseUnits,
      gridUserId
    });

    // 3. Create payment intent
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

    console.log('[PreparePayment] Creating payment intent with request:', paymentRequest);

    const response = await gridClient.createPaymentIntent(
      fromAddress,
      paymentRequest
    );

    console.log('[PreparePayment] Payment intent result:', {
      hasData: !!response?.data,
      hasError: !!response?.error,
      hasTransactionPayload: !!(response?.data as any)?.transactionPayload
    });

    if (!response || response.error) {
      const error = response?.error || 'Unknown error';
      console.error('[PreparePayment] Failed to create payment intent:', error);
      return NextResponse.json(
        { success: false, error: `Failed to create payment intent: ${error}` },
        { status: 500 }
      );
    }

    if (!response.data) {
      console.error('[PreparePayment] No data in response');
      return NextResponse.json(
        { success: false, error: 'No data returned from payment intent' },
        { status: 500 }
      );
    }

    console.log('[PreparePayment] ✅ Payment intent created successfully');
    console.log('[PreparePayment] ========================================');

    return NextResponse.json({
      success: true,
      data: response.data,
    });

  } catch (error) {
    console.error('[PreparePayment] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
