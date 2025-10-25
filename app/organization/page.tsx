"use client";

import { useState, useEffect, Suspense } from "react";
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

function OrganizationPageContent() {
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
    // COMMENTED OUT FOR TESTING - Skip KYC verification check
    // Just redirect to organization creation page
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

export default function OrganizationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading organizations...</p>
        </div>
      </div>
    }>
      <OrganizationPageContent />
    </Suspense>
  );
}
