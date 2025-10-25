import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate payroll runway in months
 * @param balance Current balance
 * @param monthlyObligation Monthly payroll obligation
 * @returns Number of months of runway
 */
export function calculatePayrollRunway(balance: number, monthlyObligation: number): number {
  if (monthlyObligation <= 0) return Infinity;
  return balance / monthlyObligation;
}

/**
 * Get the earliest next payroll date from a list of streams
 * @param streams Array of payroll streams with nextRunAt dates
 * @returns Earliest date or null
 */
export function getNextPayrollDate(streams: Array<{ nextRunAt: string | null }>): Date | null {
  const dates = streams
    .map(s => s.nextRunAt ? new Date(s.nextRunAt) : null)
    .filter((date): date is Date => date !== null)
    .sort((a, b) => a.getTime() - b.getTime());
  
  return dates[0] || null;
}

/**
 * Calculate total monthly obligation from payroll streams
 * @param streams Array of payroll streams with monthly amounts
 * @returns Total monthly obligation
 */
export function calculateMonthlyObligation(streams: Array<{ amountMonthly: number; status: string }>): number {
  return streams
    .filter(s => s.status === 'active')
    .reduce((sum, stream) => sum + (stream.amountMonthly || 0), 0);
}

/**
 * Format currency with $ and commas
 * @param amount Amount to format
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, decimals: number = 2): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

/**
 * Format percentage with + and %
 * @param value Percentage value
 * @param decimals Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}
