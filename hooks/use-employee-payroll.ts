"use client"

import { useState, useEffect } from 'react';

export interface EmployeePayrollStream {
  id: string;
  employee: {
    name: string;
    email: string;
  };
  amountMonthly: number;
  cadence: string;
  status: string;
  nextRunAt: string | null;
  createdAt: string;
}

export interface EmployeePayrollResponse {
  success: boolean;
  streams: EmployeePayrollStream[];
  error?: string;
}

export function useEmployeePayroll() {
  const [payrollStreams, setPayrollStreams] = useState<EmployeePayrollStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployeePayroll = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the dedicated employee payroll endpoint which queries by userId
      const response = await fetch('/api/employee/payroll');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch employee payroll');
      }

      // The API returns streams where the user is the employee
      setPayrollStreams(data.streams || []);
      
      console.log('[useEmployeePayroll] Employee payroll fetched:', {
        count: data.streams?.length || 0,
        streams: data.streams?.map((s: any) => ({ 
          org: s.employee?.organization?.name, 
          amount: s.amountMonthly 
        })) || []
      });

    } catch (err: any) {
      console.error('[useEmployeePayroll] Error fetching employee payroll:', err);
      setError(err.message || 'Failed to fetch employee payroll');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeePayroll();
  }, []);

  return {
    payrollStreams,
    loading,
    error,
    refetch: fetchEmployeePayroll
  };
}
