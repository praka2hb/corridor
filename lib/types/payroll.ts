/**
 * Payroll Types
 * TypeScript interfaces for payroll streams, standing orders, and API request/response types
 */

// Standing Order Configuration
// Matches Grid SDK CreateStandingOrderRequest interface
export interface StandingOrderConfig {
  amount: string; // Amount in smallest unit (e.g., for USDC with 6 decimals: "1000000" = 1 USDC)
  grid_user_id: string; // Required at root level
  source: GridAccountDetails | SolanaDetails | NewExternalAccountDetails | ExistingExternalAccountDetails;
  destination: GridAccountDetails | SolanaDetails | NewExternalAccountDetails | ExistingExternalAccountDetails;
  frequency: 'weekly' | 'monthly'; // Grid only supports weekly and monthly
  start_date: string; // ISO 8601 format
  end_date?: string; // ISO 8601 format (optional)
}

// Grid Account Details (for Grid smart accounts)
export interface GridAccountDetails {
  account: string;
  currency: string;
  transaction_signers?: string[];
}

// Solana Account Details (for external Solana wallets)
export interface SolanaDetails {
  address: string;
  currency: string;
}

// New External Account Details (for ACH, SEPA, etc.)
export interface NewExternalAccountDetails {
  payment_rail: 'ach_push' | 'ach_pull' | 'sepa' | 'faster_payments' | 'wire' | 'solana' | 'smart_account';
  currency: string;
  details: any;
}

// Existing External Account Details
export interface ExistingExternalAccountDetails {
  payment_rail: 'ach_push' | 'ach_pull' | 'sepa' | 'faster_payments' | 'wire' | 'solana' | 'smart_account';
  currency: string;
  external_account_id: string;
}

// Payroll Stream (matches database model)
export interface PayrollStream {
  id: string;
  employeeId: string;
  teamId?: string;
  amountMonthly: number;
  currency: string;
  cadence: 'weekly' | 'monthly';
  status: 'active' | 'paused' | 'stopped';
  gridStandingOrderId?: string;
  nextRunAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  employee?: EmployeeInfo;
  runs?: StreamRun[];
}

// Stream Run (matches database model)
export interface StreamRun {
  id: string;
  streamId: string;
  runAt: Date;
  status: 'pending' | 'completed' | 'failed';
  transferId?: string;
  gridTransferId?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Employee Info (partial employee profile)
export interface EmployeeInfo {
  id: string;
  name: string;
  email?: string;
  payoutWallet?: string;
  userId?: string;
  status: string;
  organization?: {
    id: string;
    name: string;
    creatorAccountAddress: string;
  };
}

// API Request/Response Types

export interface CreatePayrollStreamRequest {
  employeeEmail: string;
  amountMonthly: number;
  cadence: 'weekly' | 'monthly';
  startDate: string; // ISO 8601
  endDate?: string; // ISO 8601 (optional)
  teamId?: string;
}

export interface CreatePayrollStreamResponse {
  success: boolean;
  stream?: PayrollStream;
  error?: string;
}

export interface UpdatePayrollStreamRequest {
  status?: 'active' | 'paused' | 'stopped';
  amountMonthly?: number;
}

export interface UpdatePayrollStreamResponse {
  success: boolean;
  stream?: PayrollStream;
  error?: string;
}

export interface GetPayrollStreamsResponse {
  success: boolean;
  streams?: PayrollStreamWithDetails[];
  error?: string;
}

export interface PayrollStreamWithDetails extends PayrollStream {
  employee: EmployeeInfo;
  latestRuns: StreamRun[];
  totalPaid: number;
  standingOrderDetails?: GridStandingOrderResponse; // Grid standing order details
  gridStatus?: string; // Status from Grid
  gridNextExecutionDate?: string; // Next execution date from Grid
}

export interface GetEmployeePayrollResponse {
  success: boolean;
  streams?: PayrollStreamWithDetails[];
  totalEarnedThisMonth?: number;
  totalEarnedThisYear?: number;
  error?: string;
}

// Grid Standing Order Types (based on Grid SDK)
export interface GridStandingOrder {
  id: string;
  account_address: string;
  amount: string;
  frequency: string;
  status: string;
  next_execution_date?: string;
  created_at: string;
  updated_at: string;
  executions?: GridStandingOrderExecution[];
}

// Grid Standing Order Response (from getStandingOrder/getStandingOrders)
export interface GridStandingOrderResponse {
  id: string;
  amount: string;
  currency: string;
  period: string;
  destinations: string[];
  status: string;
  remaining_amount?: string;
  last_execution_date?: string | null;
  next_execution_date?: string | null;
  created_at: string;
}

export interface GridStandingOrderExecution {
  id: string;
  standing_order_id: string;
  executed_at: string;
  amount: string;
  transfer_id: string;
  status: string;
}

// Notification Types
export interface PayrollNotification {
  type: 'payroll_created' | 'payment_executed' | 'payroll_paused' | 'payroll_stopped';
  streamId: string;
  organizationId: string;
  amount?: number;
  nextPaymentDate?: string;
}

