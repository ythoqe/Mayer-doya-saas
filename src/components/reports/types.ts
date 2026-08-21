import { Order, Client, Supplier, InventoryItem, Expense, Account, Transaction, Employee } from '../../types';

export type ReportCategory = 
  | 'overview' 
  | 'production' 
  | 'orders' 
  | 'clients' 
  | 'suppliers' 
  | 'inventory' 
  | 'finance' 
  | 'expenses' 
  | 'employees' 
  | 'print_center';

export type DateRangePreset = 
  | 'all_time'
  | 'today' 
  | 'yesterday' 
  | 'this_week' 
  | 'this_month' 
  | 'last_month' 
  | 'this_year' 
  | 'custom';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  preset: DateRangePreset;
}

export type PrintDocumentType = 
  | 'executive_pnl'
  | 'production_sheet'
  | 'client_receivables'
  | 'supplier_payables'
  | 'inventory_valuation'
  | 'expense_audit'
  | 'salary_sheet';
