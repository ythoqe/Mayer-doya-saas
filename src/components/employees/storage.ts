import { Employee } from '../../types';
import { AttendanceRecord, AdvanceRecord, PayrollRecord, PayrollPaymentStatus } from './types';

// Helper to format today's date YYYY-MM-DD
export const getTodayDateString = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

export const getCurrentMonthString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// Initial realistic attendance records for factory floor
export const getInitialAttendance = (employees: Employee[]): AttendanceRecord[] => {
  const today = getTodayDateString();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const records: AttendanceRecord[] = [];

  employees.forEach((emp, idx) => {
    // Today's attendance
    let status: AttendanceRecord['status'] = 'present';
    let checkIn = '08:00 AM';
    let checkOut = '05:00 PM';
    let workingHours = 9;
    let remarks = 'On-time shift';

    if (emp.status === 'on_leave' || idx === 6) {
      status = 'on_leave';
      checkIn = '-';
      checkOut = '-';
      workingHours = 0;
      remarks = 'Approved medical/annual leave';
    } else if (idx === 2) {
      status = 'present';
      checkIn = '08:00 PM';
      checkOut = '05:00 AM';
      workingHours = 9;
      remarks = 'Night shift hydro line';
    } else if (idx === 3) {
      status = 'late';
      checkIn = '08:45 AM';
      checkOut = '05:00 PM';
      workingHours = 8.25;
      remarks = 'Traffic delay at Gazipur intersection';
    }

    records.push({
      id: `att-today-${emp.id}`,
      employeeId: emp.id,
      employeeName: emp.name,
      designation: emp.designation,
      department: emp.department,
      date: today,
      status,
      checkIn,
      checkOut,
      workingHours,
      remarks
    });

    // Yesterday's attendance
    records.push({
      id: `att-yest-${emp.id}`,
      employeeId: emp.id,
      employeeName: emp.name,
      designation: emp.designation,
      department: emp.department,
      date: yesterday,
      status: idx === 6 ? 'on_leave' : (idx === 4 ? 'late' : 'present'),
      checkIn: idx === 6 ? '-' : '08:10 AM',
      checkOut: idx === 6 ? '-' : '05:15 PM',
      workingHours: idx === 6 ? 0 : 9,
      remarks: idx === 6 ? 'Approved leave' : 'Normal duty completed'
    });
  });

  return records;
};

// Initial realistic advance records
export const getInitialAdvances = (employees: Employee[]): AdvanceRecord[] => {
  return [
    {
      id: 'adv-101',
      employeeId: 'emp-2',
      employeeName: 'Shah Alam',
      designation: 'Senior Washing Supervisor',
      department: 'Washing',
      amount: 5000,
      date: '2026-08-05',
      purpose: 'Family medical expense emergency',
      status: 'partially_deducted',
      deductedAmount: 2500,
      balance: 2500,
      notes: 'Approved by Managing Director. 50% deducted in Aug salary.'
    },
    {
      id: 'adv-102',
      employeeId: 'emp-3',
      employeeName: 'Biplob Mia',
      designation: 'Hydro & Dryer Operator',
      department: 'Hydro & Drying',
      amount: 3000,
      date: '2026-08-10',
      purpose: 'House rent assistance',
      status: 'pending',
      deductedAmount: 0,
      balance: 3000,
      notes: 'To be deducted from August monthly payroll.'
    }
  ];
};

// Initial realistic payroll records
export const getInitialPayroll = (employees: Employee[], advances: AdvanceRecord[]): PayrollRecord[] => {
  const currentMonth = getCurrentMonthString();

  return employees.map((emp) => {
    // Check if employee has advance deductions
    const empAdvances = advances.filter(a => a.employeeId === emp.id && a.balance > 0);
    const advanceDeduction = empAdvances.reduce((sum, a) => sum + (a.status === 'partially_deducted' ? 2500 : 0), 0);
    const otherDeductions = 0;
    const bonus = emp.department === 'Dyeing' ? 2000 : 0; // Performance overtime for dyeing master
    const netSalary = emp.salary - advanceDeduction - otherDeductions + bonus;

    // Simulate payment status
    let paymentStatus: PayrollPaymentStatus = 'pending';
    let paidAmount = 0;
    let paymentDate: string | undefined = undefined;
    let accountId: string | undefined = undefined;
    let accountName: string | undefined = undefined;
    let reference: string | undefined = undefined;

    if (emp.id === 'emp-1') {
      paymentStatus = 'paid';
      paidAmount = netSalary;
      paymentDate = '2026-08-10';
      accountId = 'acc-1';
      accountName = 'Prime Bank Factory Current A/C';
      reference = 'BEFTN-SAL-AUG-01';
    }

    return {
      id: `pay-${currentMonth}-${emp.id}`,
      employeeId: emp.id,
      employeeName: emp.name,
      designation: emp.designation,
      department: emp.department,
      month: currentMonth,
      basicSalary: emp.salary,
      advanceDeduction,
      otherDeductions,
      bonus,
      netSalary,
      paymentStatus,
      paidAmount,
      paymentDate,
      accountId,
      accountName,
      reference,
      notes: `Monthly payroll calculation for ${emp.name}`
    };
  });
};
