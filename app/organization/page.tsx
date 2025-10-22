"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Organization {
  id: string;
  name: string;
  gridOrgId: string | null;
  treasuryStatus: string;
  createdAt: string;
  updatedAt: string;
  role: string;
}

interface KycStatus {
  kycStatus: string | null;
  kycType: string | null;
  kycLink: string | null;
  kycLinkExpiresAt: string | null;
}

export default function OrganizationPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    console.log('[KYC] Organization page loaded');
    console.log('[KYC] Current URL:', window.location.href);
    console.log('[KYC] Search params:', window.location.search);
    
    // Check if we're in the KYC flow
    const shouldStartKyc = searchParams.get('kyc') === 'true';
    console.log('[KYC] shouldStartKyc:', shouldStartKyc);
    
    if (shouldStartKyc) {
      const pendingKycLink = localStorage.getItem('pendingKycLink');
      console.log('[KYC] pendingKycLink from localStorage:', pendingKycLink);
      
      if (pendingKycLink) {
        // Clear the stored link
        localStorage.removeItem('pendingKycLink');
        console.log('[KYC] Redirecting to Grid KYC:', pendingKycLink);
        // Redirect to the KYC provider
        window.location.href = pendingKycLink;
        return;
      }
      
      // User returned from KYC completion
      // Clear any KYC-related localStorage
      localStorage.removeItem('kycType');
      console.log('[KYC] User returned from KYC verification - loading organizations');
    }
    
    fetchOrganizations();
  }, [searchParams]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      
      // First, refresh KYC status from Grid API to get latest data
      console.log('[Org List] Refreshing KYC status from Grid API on mount...');
      const refreshResponse = await fetch('/api/kyc/refresh-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const refreshData = await refreshResponse.json();
      
      if (refreshResponse.ok && refreshData.success) {
        console.log('[Org List] KYC Status refreshed from Grid:', refreshData);
        setKycStatus({
          kycStatus: refreshData.kycStatus,
          kycType: refreshData.kycType,
          kycLink: refreshData.kycLink,
          kycLinkExpiresAt: null, // Grid doesn't provide this
        });
      } else {
        // Fallback to database status if Grid refresh fails
        console.log('[Org List] Grid refresh failed, falling back to database status');
        const kycResponse = await fetch("/api/kyc/status");
        const kycData = await kycResponse.json();
        if (kycData.success) {
          setKycStatus(kycData);
        }
      }
      
      // Fetch organizations
      const orgResponse = await fetch("/api/organization");
      const orgData = await orgResponse.json();

      if (orgData.success) {
        setOrganizations(orgData.organizations);
      } else {
        setError(orgData.error || "Failed to fetch organizations");
      }
    } catch (err) {
      console.error('[Org List] Error fetching data:', err);
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshKycStatus = async () => {
    try {
      setRefreshingStatus(true);
      
      const response = await fetch('/api/kyc/refresh-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update KYC status
        setKycStatus({
          kycStatus: data.kycStatus,
          kycType: data.kycType,
          kycLink: kycStatus?.kycLink || null,
          kycLinkExpiresAt: kycStatus?.kycLinkExpiresAt || null,
        });

        // Reload organizations if status changed to approved
        if (data.statusChanged && data.kycStatus === 'approved') {
          fetchOrganizations();
        }
      }
    } catch (err) {
      console.error('Failed to refresh KYC status:', err);
    } finally {
      setRefreshingStatus(false);
    }
  };

  const handleCreateOrganization = () => {
    router.push("/organization/new");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading organizations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchOrganizations}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KYC Status Banner - Show appropriate message based on status */}
        {kycStatus && kycStatus.kycStatus === 'pending' && (
          <div className="mb-6 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-amber-800">
                  ⏳ Verification In Progress
                </h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p className="mb-2">Your {kycStatus.kycType === 'business' ? 'business' : 'individual'} verification is being processed. You'll be able to create organizations once approved.</p>
                  <button
                    onClick={handleRefreshKycStatus}
                    disabled={refreshingStatus}
                    className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors text-sm disabled:opacity-50"
                  >
                    {refreshingStatus ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="ml-2">Checking...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="ml-2">Check Status</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Resume incomplete verification */}
        {kycStatus && kycStatus.kycLink && kycStatus.kycStatus !== 'pending' && kycStatus.kycStatus !== 'approved' && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  Complete Your {kycStatus.kycType === 'business' ? 'Business' : 'Individual'} Verification
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p className="mb-2">You started {kycStatus.kycType === 'business' ? 'business' : 'individual'} verification but didn't finish. Complete it to create organizations.</p>
                  <a
                    href={kycStatus.kycLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Resume Verification
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
              <p className="mt-2 text-gray-600">
                Manage your organizations and their treasuries
              </p>
            </div>
            <button
              onClick={handleCreateOrganization}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Organization
            </button>
          </div>
        </div>

        {organizations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No organizations yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first organization to get started with treasury management
            </p>
            <button
              onClick={handleCreateOrganization}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Organization
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => (
              <Link
                key={org.id}
                href={`/organization/${org.id}`}
                className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {org.name}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      org.role === "owner" 
                        ? "bg-purple-100 text-purple-800" 
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {org.role}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Treasury Status:</span>
                      <span className={`font-medium ${
                        org.treasuryStatus === "active" 
                          ? "text-green-600" 
                          : "text-yellow-600"
                      }`}>
                        {org.treasuryStatus}
                      </span>
                    </div>
                    
                    {org.gridOrgId && (
                      <div className="flex justify-between">
                        <span>Grid ID:</span>
                        <span className="font-mono text-xs">
                          {org.gridOrgId.slice(0, 8)}...
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>
                        {new Date(org.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
