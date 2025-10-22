/**
 * Grid SDK Client Service
 * Implements secure payment flow with separated frontend/backend clients
 * 
 * Architecture:
 * - Backend client (with API key): createPaymentIntent() and send()
 * - Frontend client (no API key): sign() only
 */

import { GridClient } from '@sqds/grid';

// Singleton backend client instance (with API key)
let backendClientInstance: GridClient | null = null;

// Frontend client instance (without API key for secure signing)
let frontendClientInstance: GridClient | null = null;

export class SDKGridClient {
  /**
   * Get backend Grid client instance (with API key)
   * Used for: createPaymentIntent() and send()
   * Should only be called from backend API routes
   */
  static getInstance(): GridClient {
    if (!backendClientInstance) {
      const apiKey = process.env.GRID_API_KEY;
      
      if (!apiKey) {
        throw new Error('[Grid] API key not found in environment variables');
      }
      
      const environment = process.env.GRID_ENVIRONMENT === 'sandbox' ? 'sandbox' : 'production';
      
      backendClientInstance = new GridClient({
        environment,
        apiKey,
      });
      
      console.log(`[Grid] Backend client initialized in ${environment} mode`);
    }
    
    return backendClientInstance;
  }
  
  /**
   * Get frontend Grid client instance (without API key)
   * Used for: sign() only
   * Safe to call from frontend - no API key exposure
   */
  static getFrontendClient(): GridClient {
    if (!frontendClientInstance) {
      const environment = process.env.NEXT_PUBLIC_GRID_ENVIRONMENT === 'sandbox' ? 'sandbox' : 'production';
      
      frontendClientInstance = new GridClient({
        environment,
        // No API key - frontend client only signs locally
      });
      
      console.log(`[Grid] Frontend client initialized in ${environment} mode (no API key)`);
    }
    
    return frontendClientInstance;
  }
}
