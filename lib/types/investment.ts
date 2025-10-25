/**
 * Investment Types
 */

export interface PersonalHoldings {
  totalInvested: number;
  currentValue: number;
  yieldGenerated: number;
  yieldPercentage: number;
  autoInvestEnabled: boolean;
}

export interface GrowthDataPoint {
  date: string;
  value: number;
}

export interface InvestmentData {
  personalHoldings: PersonalHoldings;
  growthHistory: GrowthDataPoint[];
  availableStrategies: AvailableStrategy[];
  loading: boolean;
}

export interface AvailableStrategy {
  id: string;
  name: string;
  symbol: string;
  apy: number;
  riskLevel: 'low' | 'medium' | 'high';
  asset: string;
  provider: string;
}
