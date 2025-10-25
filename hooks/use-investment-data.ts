"use client"

import { useState, useEffect } from 'react';
import type { InvestmentData, PersonalHoldings, GrowthDataPoint, AvailableStrategy } from '@/lib/types/investment';

// Mockup personal investment data
const MOCK_PERSONAL_HOLDINGS: PersonalHoldings = {
  totalInvested: 5000,
  currentValue: 5200,
  yieldGenerated: 200,
  yieldPercentage: 4.0,
  autoInvestEnabled: true,
};

// Mockup growth history (3-6 months)
const MOCK_GROWTH_HISTORY: GrowthDataPoint[] = [
  { date: '2024-08', value: 5000 },
  { date: '2024-09', value: 5050 },
  { date: '2024-10', value: 5080 },
  { date: '2024-11', value: 5150 },
  { date: '2024-12', value: 5180 },
  { date: '2025-01', value: 5200 },
];

export function useInvestmentData() {
  const [investmentData, setInvestmentData] = useState<InvestmentData>({
    personalHoldings: MOCK_PERSONAL_HOLDINGS,
    growthHistory: MOCK_GROWTH_HISTORY,
    availableStrategies: [],
    loading: true,
  });

  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        // Fetch real Kamino strategies from existing infrastructure
        const response = await fetch('/api/kamino/strategies');
        
        if (response.ok) {
          const data = await response.json();
          
          // Transform Kamino strategies to our format
          const strategies: AvailableStrategy[] = (data.strategies || []).map((strategy: any) => ({
            id: strategy.id,
            name: strategy.symbol,
            symbol: strategy.symbol,
            apy: strategy.apy || 0,
            riskLevel: strategy.riskLabel?.toLowerCase() || 'medium',
            asset: strategy.asset || 'USDC',
            provider: 'kamino',
          }));

          setInvestmentData(prev => ({
            ...prev,
            availableStrategies: strategies,
            loading: false,
          }));
        } else {
          // If API fails, use empty strategies but keep mockup data
          setInvestmentData(prev => ({
            ...prev,
            loading: false,
          }));
        }
      } catch (error) {
        console.error('[Investment Data] Failed to fetch strategies:', error);
        setInvestmentData(prev => ({
          ...prev,
          loading: false,
        }));
      }
    };

    fetchStrategies();
  }, []);

  return investmentData;
}
