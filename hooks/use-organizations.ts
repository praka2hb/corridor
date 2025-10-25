"use client"

import { useState, useEffect } from 'react';

export interface Organization {
  id: string;
  name: string;
  creatorAccountAddress: string | null;
  createdAt: string;
  updatedAt: string;
  role: 'owner' | 'admin' | 'member' | 'employee';
  employeeId?: string; // Present if user is an employee
  employeeName?: string;
  employeeEmail?: string;
  activePayrollStreams?: number; // For employee role
}

export interface OrganizationWithDetails extends Organization {
  memberCount?: number;
  balance?: number;
  activePayrollStreams?: number;
}

export interface OrganizationsResponse {
  success: boolean;
  organizations: Organization[];
  error?: string;
}

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<OrganizationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both member organizations and employee organizations in parallel
      const [memberOrgsResponse, employeeOrgsResponse] = await Promise.all([
        fetch('/api/organization'),
        fetch('/api/employee/organizations'),
      ]);

      const memberOrgsData: OrganizationsResponse = await memberOrgsResponse.json();
      const employeeOrgsData: OrganizationsResponse = await employeeOrgsResponse.json();

      // Combine organizations from both sources
      const allOrgs = new Map<string, Organization>();

      // Add member organizations
      if (memberOrgsData.success && memberOrgsData.organizations) {
        memberOrgsData.organizations.forEach(org => {
          allOrgs.set(org.id, org);
        });
      }

      // Add employee organizations (or merge if user is both member and employee)
      if (employeeOrgsData.success && employeeOrgsData.organizations) {
        employeeOrgsData.organizations.forEach(org => {
          const existing = allOrgs.get(org.id);
          if (existing) {
            // User is both a member and employee - keep member role but add employee info
            existing.employeeId = org.employeeId;
            existing.employeeName = org.employeeName;
            existing.employeeEmail = org.employeeEmail;
          } else {
            // User is only an employee
            allOrgs.set(org.id, org);
          }
        });
      }

      // Fetch additional details for each organization
      const organizationsWithDetails = await Promise.all(
        Array.from(allOrgs.values()).map(async (org) => {
          const details: OrganizationWithDetails = { ...org };
          
          try {
            // Fetch member count
            const membersResponse = await fetch(`/api/organization/${org.id}/members`);
            if (membersResponse.ok) {
              const membersData = await membersResponse.json();
              details.memberCount = membersData.members?.length || 0;
            }

            // Fetch balance and payroll streams if user is owner/admin
            if (org.role === 'owner' || org.role === 'admin') {
              try {
                const balanceResponse = await fetch(`/api/organization/${org.id}/balance`);
                if (balanceResponse.ok) {
                  const balanceData = await balanceResponse.json();
                  details.balance = balanceData.balances?.USDC || 0;
                }

                const payrollResponse = await fetch(`/api/organization/${org.id}/payroll`);
                if (payrollResponse.ok) {
                  const payrollData = await payrollResponse.json();
                  details.activePayrollStreams = payrollData.streams?.filter((s: any) => s.status === 'active').length || 0;
                }
              } catch (err) {
                console.warn(`Failed to fetch details for org ${org.id}:`, err);
              }
            } else if (org.role === 'employee') {
              // For employees, activePayrollStreams is already included from the API
              // Just ensure it's set
              details.activePayrollStreams = org.activePayrollStreams || 0;
            }

            return details;
          } catch (err) {
            console.warn(`Failed to fetch details for org ${org.id}:`, err);
            return details;
          }
        })
      );

      setOrganizations(organizationsWithDetails);
      
      console.log('[useOrganizations] Organizations fetched:', {
        count: organizationsWithDetails.length,
        orgs: organizationsWithDetails.map(o => ({ name: o.name, role: o.role, isEmployee: !!o.employeeId }))
      });

    } catch (err: any) {
      console.error('[useOrganizations] Error fetching organizations:', err);
      setError(err.message || 'Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  return {
    organizations,
    loading,
    error,
    refetch: fetchOrganizations
  };
}
