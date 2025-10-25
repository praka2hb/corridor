"use client"

import { useState, useEffect } from 'react';
import { useOrganizations, type OrganizationWithDetails } from './use-organizations';

export interface PayrollStream {
  id: string;
  amountMonthly: number;
  cadence: string;
  status: string;
  nextRunAt: string | null;
  standingOrderDetails?: {
    next_execution_date?: string;
    created_at?: string;
    status?: string;
  };
}

export interface OrganizationMetrics {
  id: string;
  name: string;
  role: string;
  balance: number;
  nextPaycheckDate: Date | null;
  upcomingPayrollObligation: number;
  monthlyPayrollObligation: number;
  payrollRunway: number; // in months
  employeeCount: number;
  activeStreamCount: number;
}

export interface BusinessMetrics {
  managedOrganizations: OrganizationMetrics[];
  loading: boolean;
  error: string | null;
}

export function useBusinessMetrics(): BusinessMetrics {
  const { organizations, loading: orgsLoading } = useOrganizations();
  const [metrics, setMetrics] = useState<OrganizationMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinessMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        // Filter organizations where user is owner or admin
        const managedOrgs = organizations.filter(
          org => org.role === 'owner' || org.role === 'admin'
        );

        if (managedOrgs.length === 0) {
          setMetrics([]);
          setLoading(false);
          return;
        }

        // Fetch payroll data for each managed organization
        const orgMetrics = await Promise.all(
          managedOrgs.map(async (org) => {
            try {
              // Fetch payroll streams for this organization
              const response = await fetch(`/api/organization/${org.id}/payroll`);
              
              if (!response.ok) {
                throw new Error(`Failed to fetch payroll for org ${org.id}`);
              }

              const data = await response.json();
              const streams: PayrollStream[] = data.streams || [];

              // Filter active streams
              const activeStreams = streams.filter(s => s.status === 'active');

              // Calculate next paycheck date (earliest from Grid or local)
              const nextPaycheckDate = activeStreams
                .map(s => {
                  // Prioritize Grid next execution date, fallback to local nextRunAt
                  const gridDate = s.standingOrderDetails?.next_execution_date;
                  const localDate = s.nextRunAt;
                  return gridDate ? new Date(gridDate) : (localDate ? new Date(localDate) : null);
                })
                .filter((date): date is Date => date !== null)
                .sort((a, b) => a.getTime() - b.getTime())[0] || null;

              // Calculate monthly payroll obligation
              const monthlyObligation = activeStreams.reduce((sum, stream) => {
                // All amounts are already normalized to monthly in the API
                return sum + (stream.amountMonthly || 0);
              }, 0);

              // Calculate upcoming payroll (next payment cycle)
              const upcomingObligation = monthlyObligation; // Simplified: assume monthly

              // Calculate payroll runway
              const balance = org.balance || 0;
              const runway = monthlyObligation > 0 
                ? balance / monthlyObligation 
                : Infinity;

              return {
                id: org.id,
                name: org.name,
                role: org.role,
                balance,
                nextPaycheckDate,
                upcomingPayrollObligation: upcomingObligation,
                monthlyPayrollObligation: monthlyObligation,
                payrollRunway: runway,
                employeeCount: org.memberCount || 0,
                activeStreamCount: activeStreams.length,
              };
            } catch (err) {
              console.error(`[Business Metrics] Error fetching data for org ${org.id}:`, err);
              // Return default metrics for this org
              return {
                id: org.id,
                name: org.name,
                role: org.role,
                balance: org.balance || 0,
                nextPaycheckDate: null,
                upcomingPayrollObligation: 0,
                monthlyPayrollObligation: 0,
                payrollRunway: Infinity,
                employeeCount: org.memberCount || 0,
                activeStreamCount: org.activePayrollStreams || 0,
              };
            }
          })
        );

        setMetrics(orgMetrics);
        setLoading(false);
      } catch (err) {
        console.error('[Business Metrics] Failed to fetch business metrics:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch business metrics');
        setLoading(false);
      }
    };

    if (!orgsLoading) {
      fetchBusinessMetrics();
    }
  }, [organizations, orgsLoading]);

  return {
    managedOrganizations: metrics,
    loading: loading || orgsLoading,
    error,
  };
}
