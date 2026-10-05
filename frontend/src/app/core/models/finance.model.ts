export type FinancialRecordType = 'expense' | 'income' | 'donation' | 'receipt' | 'debt';
export type FinancialPaymentStatus = 'pending' | 'paid';

export interface FinancialRecord {
  id: number;
  type: number;
  paymentStatus: number;
  payerName: string;
  description: string;
  amount: number;
  date: string;
  paymentFor: string | null;
  createdAt: string;
}

export interface FinanceTotals {
  expenses: number;
  incomes: number;
  donations: number;
  receipts: number;
  debts: number;
  paidDebts: number;
  pendingDebts: number;
}

export interface PayerDebtStatus {
  payerName: string;
  totalAmount: number;
  recordCount: number;
}

export interface FinanceDashboard {
  totals: FinanceTotals;
  paidPayers: PayerDebtStatus[];
  pendingPayers: PayerDebtStatus[];
  latestRecords: FinancialRecord[];
}

export interface CreateFinancialRecordRequest {
  type: number;
  paymentStatus: number;
  payerName: string;
  description: string;
  amount: number;
  date: string;
  paymentFor?: string | null;
}

export interface FinancialRecordQuery {
  type?: number | null;
  paymentStatus?: number | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  fromDate?: string | null;
  toDate?: string | null;
  search?: string | null;
}
