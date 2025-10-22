"use client"

import { useState, useEffect } from 'react';

export interface UserData {
  id: string;
  email: string;
  username?: string;
  accountAddress: string;
  gridUserId?: string;
}

export interface BalanceData {
  amount: number;
  availableBalance: number;
  currency: string;
  status: string;
  mint?: string;
  decimals?: number;
}

export interface UserDataResponse {
  success: boolean;
  user: UserData;
  balances: BalanceData[];
  balance: BalanceData | null; // Legacy field for backward compatibility
  error?: string;
}

export function useUserData() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [balances, setBalances] = useState<BalanceData[]>([]);
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user-data');
      const data: UserDataResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch user data');
      }

      setUserData(data.user);
      setBalances(data.balances || []);
      setBalance(data.balance);
      
      console.log('[useUserData] User data fetched:', {
        username: data.user.username,
        balancesCount: data.balances?.length || 0,
        balances: data.balances?.map(b => `${b.amount} ${b.currency}`).join(', ')
      });

    } catch (err: any) {
      console.error('[useUserData] Error fetching user data:', err);
      setError(err.message || 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const refreshBalance = async () => {
    try {
      const response = await fetch('/api/user-data');
      const data: UserDataResponse = await response.json();

      if (response.ok && data.success) {
        setBalances(data.balances || []);
        setBalance(data.balance);
      }
    } catch (err) {
      console.error('[useUserData] Error refreshing balance:', err);
    }
  };

  return {
    userData,
    balances, // Array of all balances (SOL, USDC, USDT, etc.)
    balance,  // Legacy: First balance or null
    loading,
    error,
    refreshBalance
  };
}

