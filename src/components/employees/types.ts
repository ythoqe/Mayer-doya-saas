import { Employee } from '../../types';

export type AttendanceStatus = 'present' | 'absent' | 'on_leave' | 'late';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  department: Employee['department'];
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  workingHours?: number;
  remarks?: string;
}

export type AdvanceStatus = 'pending' | 'partially_deducted' | 'deducted';

export interface AdvanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  department: Employee['department'];
  amount: number;
  date: string; // YYYY-MM-DD
  purpose: string;
  status: AdvanceStatus;
  deductedAmount: number;
  balance: number;
  notes?: string;
}

export type PayrollPaymentStatus = 'paid' | 'pending' | 'partially_paid';

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  department: Employee['department'];
  month: string; // YYYY-MM (e.g. 2026-08)
  basicSalary: number;
  advanceDeduction: number;
  otherDeductions: number;
  bonus: number;
  netSalary: number;
  paymentStatus: PayrollPaymentStatus;
  paidAmount: number;
  paymentDate?: string;
  accountId?: string;
  accountName?: string;
  reference?: string;
  notes?: string;
}
