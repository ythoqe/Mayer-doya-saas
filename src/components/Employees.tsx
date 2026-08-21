import React, { useState, useEffect } from 'react';
import { useERP } from '../context/ERPContext';
import { Employee } from '../types';
import { AttendanceRecord, AdvanceRecord, PayrollRecord, AttendanceStatus } from './employees/types';
import { getInitialAttendance, getInitialAdvances, getInitialPayroll, getTodayDateString, getCurrentMonthString } from './employees/storage';
import { EmployeeDirectory } from './employees/EmployeeDirectory';
import { AttendanceView } from './employees/AttendanceView';
import { PayrollView } from './employees/PayrollView';
import { AdvancesView } from './employees/AdvancesView';
import { DepartmentOverview } from './employees/DepartmentOverview';
import { EmployeeFormModal } from './employees/EmployeeFormModal';
import { EmployeeDetailsModal } from './employees/EmployeeDetailsModal';
import { MarkAttendanceModal } from './employees/MarkAttendanceModal';
import { ProcessSalaryModal } from './employees/ProcessSalaryModal';
import { AddAdvanceModal } from './employees/AddAdvanceModal';
import { PrintPayrollModal } from './employees/PrintPayrollModal';
import { formatCurrency } from '../utils/translation';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  Plus, 
  Printer, 
  Building2, 
  TrendingDown,
  Clock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Employees: React.FC = () => {
  const { 
    employees, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee, 
    accounts,
    addExpense,
    t, 
    language, 
    currentUser 
  } = useERP();

  // Active sub-tab state
  const [activeTab, setActiveTab] = useState<'directory' | 'attendance' | 'payroll' | 'advances' | 'workforce'>('directory');

  // Local persistent state for attendance, advances, payroll
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('mayer_doya_attendance');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return getInitialAttendance(employees);
  });

  const [advanceRecords, setAdvanceRecords] = useState<AdvanceRecord[]>(() => {
    const saved = localStorage.getItem('mayer_doya_advances');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return getInitialAdvances(employees);
  });

  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(() => {
    const saved = localStorage.getItem('mayer_doya_payroll');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return getInitialPayroll(employees, advanceRecords);
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('mayer_doya_attendance', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('mayer_doya_advances', JSON.stringify(advanceRecords));
  }, [advanceRecords]);

  useEffect(() => {
    localStorage.setItem('mayer_doya_payroll', JSON.stringify(payrollRecords));
  }, [payrollRecords]);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);

  const [selectedEmployeeForDetails, setSelectedEmployeeForDetails] = useState<Employee | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [isMarkAttendanceOpen, setIsMarkAttendanceOpen] = useState(false);
  const [markAttendanceDate, setMarkAttendanceDate] = useState(getTodayDateString());

  const [isProcessSalaryOpen, setIsProcessSalaryOpen] = useState(false);
  const [payrollRecordToProcess, setPayrollRecordToProcess] = useState<PayrollRecord | null>(null);

  const [isAddAdvanceOpen, setIsAddAdvanceOpen] = useState(false);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printMode, setPrintMode] = useState<'payroll' | 'attendance'>('payroll');
  const [printMonth, setPrintMonth] = useState(getCurrentMonthString());
  const [printDate, setPrintDate] = useState(getTodayDateString());

  // RBAC checks
  const canManageWorkforce = currentUser && ['super_admin', 'admin', 'hr_manager', 'general_manager'].includes(currentUser.role);
  const canViewFinancials = currentUser && ['super_admin', 'admin', 'accounts_manager', 'auditor'].includes(currentUser.role);

  // Top KPIs
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const todayStr = getTodayDateString();
  const presentToday = attendanceRecords.filter(r => r.date === todayStr && (r.status === 'present' || r.status === 'late')).length;
  const totalMonthlyPayroll = employees.reduce((sum, e) => sum + e.salary, 0);

  // Handlers
  const handleSaveEmployee = (empData: Omit<Employee, 'id'>) => {
    if (employeeToEdit) {
      updateEmployee(employeeToEdit.id, empData);
      // Also update name/dept in attendance and payroll records
      setAttendanceRecords(prev => prev.map(r => r.employeeId === employeeToEdit.id ? { ...r, employeeName: empData.name, department: empData.department, designation: empData.designation } : r));
      setPayrollRecords(prev => prev.map(p => p.employeeId === employeeToEdit.id ? { ...p, employeeName: empData.name, department: empData.department, designation: empData.designation, basicSalary: empData.salary, netSalary: empData.salary - p.advanceDeduction + p.bonus } : p));
      setAdvanceRecords(prev => prev.map(a => a.employeeId === employeeToEdit.id ? { ...a, employeeName: empData.name, department: empData.department, designation: empData.designation } : a));
    } else {
      addEmployee(empData);
    }
    setEmployeeToEdit(null);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEmployeeToEdit(emp);
    setIsFormModalOpen(true);
  };

  const handleOpenDetails = (emp: Employee) => {
    setSelectedEmployeeForDetails(emp);
    setIsDetailsModalOpen(true);
  };

  const handleSaveAttendance = (newRecords: AttendanceRecord[]) => {
    setAttendanceRecords(prev => {
      const filtered = prev.filter(r => r.date !== newRecords[0]?.date);
      return [...filtered, ...newRecords];
    });
  };

  const handleQuickStatusChange = (recordId: string, newStatus: AttendanceStatus) => {
    setAttendanceRecords(prev => prev.map(r => {
      if (r.id === recordId) {
        return {
          ...r,
          status: newStatus,
          checkIn: newStatus === 'absent' || newStatus === 'on_leave' ? '-' : (r.checkIn && r.checkIn !== '-' ? r.checkIn : '08:00 AM'),
          checkOut: newStatus === 'absent' || newStatus === 'on_leave' ? '-' : (r.checkOut && r.checkOut !== '-' ? r.checkOut : '05:00 PM'),
          workingHours: newStatus === 'present' || newStatus === 'late' ? 9 : 0
        };
      }
      return r;
    }));
  };

  const handleConfirmSalaryPayment = (recordId: string, paymentData: {
    accountId: string;
    accountName: string;
    amount: number;
    paymentDate: string;
    reference: string;
    notes?: string;
  }) => {
    // 1. Update payroll record
    setPayrollRecords(prev => prev.map(p => {
      if (p.id === recordId) {
        return {
          ...p,
          paymentStatus: 'paid',
          paidAmount: paymentData.amount,
          paymentDate: paymentData.paymentDate,
          accountId: paymentData.accountId,
          accountName: paymentData.accountName,
          reference: paymentData.reference,
          notes: paymentData.notes
        };
      }
      return p;
    }));

    // 2. Automatically record in ERP expense / accounts
    addExpense({
      voucherNo: paymentData.reference || `SAL-${Date.now().toString().slice(-4)}`,
      date: paymentData.paymentDate,
      category: 'Labor',
      amount: paymentData.amount,
      accountId: paymentData.accountId,
      accountName: paymentData.accountName,
      paidBy: currentUser?.name || 'Accounts Dept',
      notes: paymentData.notes || `Salary Disbursement (${payrollRecordToProcess?.employeeName || 'Staff'})`
    });
  };

  const handleSaveAdvance = (advanceData: Omit<AdvanceRecord, 'id' | 'status' | 'deductedAmount' | 'balance'>) => {
    const newRecord: AdvanceRecord = {
      ...advanceData,
      id: `adv-${Date.now()}`,
      status: 'pending',
      deductedAmount: 0,
      balance: advanceData.amount
    };
    setAdvanceRecords(prev => [newRecord, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#17383B] tracking-tight flex items-center gap-2.5">
            <span>{t('employeesHeading')}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DDF4F3] text-[#0B9FA5] border border-[#0B9FA5]/20">
              {totalEmployees} {language === 'bn' ? 'জনবল' : 'Staff'}
            </span>
          </h1>
          <p className="text-xs text-[#688285] mt-1">
            {t('employeesSubheading')}
          </p>
        </div>

        {/* Global Header Actions */}
        <div className="flex items-center gap-2">
          {canManageWorkforce && (
            <button
              type="button"
              onClick={() => {
                setEmployeeToEdit(null);
                setIsFormModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#08868C] hover:to-[#0B9FA5] text-white text-xs font-bold shadow-[0_4px_16px_rgba(11,159,165,0.28)] transition-all hover:-translate-y-0.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addEmployeeBtn')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div className="bg-white p-5 rounded-[22px] border border-[#D9EAEB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#688285] block">{t('totalEmployeesLabel')}</span>
            <div className="text-2xl font-black text-[#17383B] mt-1">
              {totalEmployees}
            </div>
            <span className="text-[11px] text-[#8EA3A5] block mt-0.5">8 Factory Departments</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-white p-5 rounded-[22px] border border-[#D9EAEB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#688285] block">{t('presentTodayLabel')}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-[#1E9B71]">
                {presentToday > 0 ? presentToday : activeEmployees}
              </span>
              <span className="text-[11px] font-bold text-[#1E9B71] bg-[#E5F8F1] px-1.5 py-0.5 rounded-md">
                {totalEmployees > 0 ? Math.round(((presentToday || activeEmployees) / totalEmployees) * 100) : 0}% on floor
              </span>
            </div>
            <span className="text-[11px] text-[#8EA3A5] block mt-0.5">Day & Night Lines</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#E5F8F1] text-[#1E9B71] flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Active Workforce */}
        <div className="bg-white p-5 rounded-[22px] border border-[#D9EAEB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#688285] block">{t('activeEmployeesLabel')}</span>
            <div className="text-2xl font-black text-[#0B9FA5] mt-1">
              {activeEmployees}
            </div>
            <span className="text-[11px] text-[#8EA3A5] block mt-0.5">{totalEmployees - activeEmployees} On Leave / Inactive</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Monthly Payroll Budget (Guarded) */}
        <div className="bg-white p-5 rounded-[22px] border border-[#D9EAEB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#688285] block">{t('monthlyPayrollLabel')}</span>
            <div className="text-xl font-black text-[#17383B] mt-1">
              {canViewFinancials ? formatCurrency(totalMonthlyPayroll, language) : '••••••••'}
            </div>
            <span className="text-[11px] text-[#8EA3A5] block mt-0.5">Estimated gross</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#EEEBFF] text-[#8178F2] flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Navigation Segmented Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-[#D9EAEB] shadow-xs flex gap-1 overflow-x-auto select-none">
        <button
          type="button"
          onClick={() => setActiveTab('directory')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'directory'
              ? 'bg-[#0B9FA5] text-white shadow-xs'
              : 'text-[#688285] hover:text-[#17383B] hover:bg-[#F1FAFA]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t('tabDirectory')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'attendance'
              ? 'bg-[#0B9FA5] text-white shadow-xs'
              : 'text-[#688285] hover:text-[#17383B] hover:bg-[#F1FAFA]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{t('tabAttendance')}</span>
        </button>

        {canViewFinancials && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('payroll')}
              className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'payroll'
                  ? 'bg-[#0B9FA5] text-white shadow-xs'
                  : 'text-[#688285] hover:text-[#17383B] hover:bg-[#F1FAFA]'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>{t('tabPayroll')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('advances')}
              className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'advances'
                  ? 'bg-[#0B9FA5] text-white shadow-xs'
                  : 'text-[#688285] hover:text-[#17383B] hover:bg-[#F1FAFA]'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>{t('tabAdvances')}</span>
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('workforce')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'workforce'
              ? 'bg-[#0B9FA5] text-white shadow-xs'
              : 'text-[#688285] hover:text-[#17383B] hover:bg-[#F1FAFA]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{t('tabWorkforce')}</span>
        </button>
      </div>

      {/* Tab Content Display */}
      {activeTab === 'directory' && (
        <EmployeeDirectory
          employees={employees}
          onSelectEmployee={handleOpenDetails}
          onEditEmployee={handleOpenEdit}
          onDeleteEmployee={deleteEmployee}
        />
      )}

      {activeTab === 'attendance' && (
        <AttendanceView
          employees={employees}
          attendanceRecords={attendanceRecords}
          onOpenMarkModal={(date) => {
            setMarkAttendanceDate(date);
            setIsMarkAttendanceOpen(true);
          }}
          onOpenPrintModal={(date) => {
            setPrintMode('attendance');
            setPrintDate(date);
            setIsPrintModalOpen(true);
          }}
          onQuickStatusChange={handleQuickStatusChange}
        />
      )}

      {activeTab === 'payroll' && canViewFinancials && (
        <PayrollView
          employees={employees}
          payrollRecords={payrollRecords}
          onOpenProcessModal={(record) => {
            setPayrollRecordToProcess(record);
            setIsProcessSalaryOpen(true);
          }}
          onOpenPrintModal={(month) => {
            setPrintMode('payroll');
            setPrintMonth(month);
            setIsPrintModalOpen(true);
          }}
        />
      )}

      {activeTab === 'advances' && canViewFinancials && (
        <AdvancesView
          employees={employees}
          advanceRecords={advanceRecords}
          onOpenAddModal={() => setIsAddAdvanceOpen(true)}
        />
      )}

      {activeTab === 'workforce' && (
        <DepartmentOverview employees={employees} />
      )}

      {/* Modals */}
      <EmployeeFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        employeeToEdit={employeeToEdit}
        onSave={handleSaveEmployee}
      />

      <EmployeeDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        employee={selectedEmployeeForDetails}
        attendanceRecords={attendanceRecords}
        payrollRecords={payrollRecords}
        advanceRecords={advanceRecords}
        onEdit={(emp) => {
          setIsDetailsModalOpen(false);
          handleOpenEdit(emp);
        }}
      />

      <MarkAttendanceModal
        isOpen={isMarkAttendanceOpen}
        onClose={() => setIsMarkAttendanceOpen(false)}
        employees={employees}
        selectedDate={markAttendanceDate}
        existingRecords={attendanceRecords}
        onSaveAttendance={handleSaveAttendance}
      />

      <ProcessSalaryModal
        isOpen={isProcessSalaryOpen}
        onClose={() => setIsProcessSalaryOpen(false)}
        payrollRecord={payrollRecordToProcess}
        onConfirmPayment={handleConfirmSalaryPayment}
      />

      <AddAdvanceModal
        isOpen={isAddAdvanceOpen}
        onClose={() => setIsAddAdvanceOpen(false)}
        employees={employees}
        onSaveAdvance={handleSaveAdvance}
      />

      <PrintPayrollModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        mode={printMode}
        payrollRecords={payrollRecords.filter(p => p.month === printMonth)}
        attendanceRecords={attendanceRecords.filter(a => a.date === printDate)}
        currentMonth={printMonth}
        currentDate={printDate}
      />
    </div>
  );
};
