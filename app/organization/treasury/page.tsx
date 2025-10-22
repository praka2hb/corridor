'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Temporary redirect page to handle Grid's KYC redirect
 * Grid is redirecting to /organization/treasury instead of /organization?kyc=true
 * This page redirects users to the correct organization list page
 */
export default function TreasuryRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    console.log('[KYC] Redirecting from treasury to organization list');
    
    // Clear any pending KYC link (user has returned from Grid)
    localStorage.removeItem('pendingKycLink');
    localStorage.removeItem('kycType');
    
    // Redirect to organization list
    router.push('/organization');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-lg font-medium text-gray-900">Verification complete!</p>
        <p className="text-sm text-gray-600 mt-2">Redirecting to your organizations...</p>
      </div>
    </div>
  );
}
