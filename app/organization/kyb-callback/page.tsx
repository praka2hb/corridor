'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Grid KYC/KYB Callback Handler
 * 
 * Grid redirects here after KYC/KYB completion with parameters:
 * - treasury: The organization's treasury public key
 * - Other Grid-specific parameters
 * 
 * This page handles the redirect and navigates to the appropriate destination
 */
function KybCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  
  useEffect(() => {
    const treasury = searchParams.get('treasury');
    
    console.log('[KYB Callback] Grid redirected to kyb-callback');
    console.log('[KYB Callback] Treasury:', treasury);
    console.log('[KYB Callback] All params:', window.location.search);
    
    // Update KYC status to approved since Grid redirected back successfully
    const updateKycStatus = async () => {
      try {
        const response = await fetch('/api/kyc/mark-approved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        
        const data = await response.json();
        
        if (data.success) {
          console.log('[KYB Callback] KYC status updated to approved');
          setStatus('success');
          
          // Clear any pending KYC/KYB links from localStorage
          localStorage.removeItem('pendingKycLink');
          localStorage.removeItem('kycType');
          
          // Wait a moment to show success, then redirect
          setTimeout(() => {
            router.push('/organization');
          }, 1500);
        } else {
          console.error('[KYB Callback] Failed to update KYC status:', data.error);
          setStatus('error');
          
          // Still redirect after showing error
          setTimeout(() => {
            router.push('/organization');
          }, 3000);
        }
      } catch (error) {
        console.error('[KYB Callback] Error updating KYC status:', error);
        setStatus('error');
        
        // Still redirect after showing error
        setTimeout(() => {
          router.push('/organization');
        }, 3000);
      }
    };
    
    updateKycStatus();
  }, [router, searchParams]);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-900">Verification complete!</p>
            <p className="text-sm text-gray-600 mt-2">Processing your verification...</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-medium text-green-900">Verification Approved!</p>
            <p className="text-sm text-gray-600 mt-2">Redirecting to your organizations...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="rounded-full h-12 w-12 bg-yellow-100 flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-yellow-900">Verification Complete</p>
            <p className="text-sm text-gray-600 mt-2">Redirecting to your organizations...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function KybCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-900">Loading...</p>
        </div>
      </div>
    }>
      <KybCallbackContent />
    </Suspense>
  );
}
