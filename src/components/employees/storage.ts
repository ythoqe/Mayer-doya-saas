import { Employee } from '../../types';
import { AttendanceRecord, AdvanceRecord, PayrollRecord } from './types';

// Helper to format today's date YYYY-MM-DD
export const getTodayDateString = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

export const getCurrentMonthString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// Initial attendance records (empty by default - populated strictly via user entries / cloud)
export const getInitialAttendance = (_employees: Employee[]): AttendanceRecord[] => {
  return [];
};

// Initial advance records (empty by default - populated strictly via user entries / cloud)
export const getInitialAdvances = (_employees: Employee[]): AdvanceRecord[] => {
  return [];
};

// Initial payroll records (empty by default - populated strictly via user entries / cloud)
export const getInitialPayroll = (_employees: Employee[], _advances: AdvanceRecord[]): PayrollRecord[] => {
  return [];
};

