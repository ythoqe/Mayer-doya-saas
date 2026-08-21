import React, { useState, useMemo } from 'react';
import { Employee } from '../../types';
import { useERP } from '../../context/ERPContext';
import { PayrollRecord } from './types';
import { formatCurrency } from '../../utils/translation';
import { 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  CreditCard, 
  Printer, 
  Search, 
  Filter, 
  FileText, 
  ChevronRight,
  TrendingDown,
  Building2
} from 'lucide-react';
import { motion } from 'motion/react';

interface PayrollViewProps {
  employees: Employee[];
  payrollRecords: PayrollRecord[];
  onOpenProcessModal: (record: PayrollRecord) => void;
  onOpenPrintModal: (month: string) => void;
}

export const PayrollView: React.FC<PayrollViewProps> = ({
  employees,
  payrollRecords,
  onOpenProcessModal,
  onOpenPrintModal
}) => {
  const { t, language, currentUser } = useERP();

  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const canManagePayroll = currentUser && ['super_admin', 'admin', 'accounts_manager'].includes(currentUser.role);

  // Filter records for selected month
  const monthRecords = useMemo(() => {
    let records = payrollRecords.filter(p => p.month === selectedMonth);

    // If no records exist for this month yet, dynamically generate default rows from employees
    if (records.length === 0) {
      records = employees.map(emp => ({
        id: `pay-${selectedMonth}-${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.name,
        designation: emp.designation,
        department: emp.department,
        month: selectedMonth,
        basicSalary: emp.salary,
        advanceDeduction: 0,
        otherDeductions: 0,
        bonus: 0,
        netSalary: emp.salary,
        paymentStatus: 'pending',
        paidAmount: 0
      }));
    }

    return records.filter(r => {
      const matchSearch = r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = selectedDepartment === 'all' || r.department === selectedDepartment;
      const matchStatus = statusFilter === 'all' || r.paymentStatus === statusFilter;
      return matchSearch && matchDept && matchStatus;
    });
  }, [payrollRecords, selectedMonth, employees, searchQuery, selectedDepartment, statusFilter]);

  // Aggregate metrics
  const totalPayroll = monthRecords.reduce((sum, r) => sum + r.netSalary, 0);
  const paidPayroll = monthRecords.filter(r => r.paymentStatus === 'paid').reduce((sum, r) => sum + r.netSalary, 0);
  const pendingPayroll = monthRecords.filter(r => r.paymentStatus !== 'paid').reduce((sum, r) => sum + r.netSalary, 0);
  const totalAdvancesDeducted = monthRecords.reduce((sum, r) => sum + r.advanceDeduction, 0);

  const departments = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.department)));
  }, [employees]);

  return (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Payroll */}
        <div className="bg-white p-5 rounded-[22px] border border-[#D9EAEB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#688285] block">{t('totalPayrollLabel')}</span>
            <div className="text-xl font-black text-[#17383B] mt-1">
              {formatCurrency(totalPayroll, language)}
            </div>
            <span className="text-[11px] text-[#8EA3A5] block mt-0.5">{monthRecords.length} staff records</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Paid */}
        <div className="bg-white p-5 rounded-[22px] border border-[#D9EAEB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#688285] block">{t('paidPayrollLabel')}</span>
            <div className="text-xl font-black text-[#1E9B71] mt-1">
              {formatCurrency(paidPayroll, language)}
            </div>
            <span className="text-[11px] font-bold text-[#1E9B71]">
              {totalPayroll > 0 ? Math.round((paidPayroll / totalPayroll) * 100) : 0}% disbursed
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#E5F8F1] text-[#1E9B71] flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white p-5 rounded-[22px] border border-[#D9EAEB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#688285] block">{t('pendingPayrollLabel')}</span>
            <div className="text-xl font-black text-[#D98218] mt-1">
              {formatCurrency(pendingPayroll, language)}
            </div>
            <span className="text-[11px] text-[#8EA3A5] block mt-0.5">Awaiting disburse</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#FFF6E6] text-[#D98218] flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Advances Deducted */}
        <div className="bg-white p-5 rounded-[22px] border border-[#D9EAEB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#688285] block">{t('advancesDeductedLabel')}</span>
            <div className="text-xl font-black text-[#8178F2] mt-1">
              {formatCurrency(totalAdvancesDeducted, language)}
            </div>
            <span className="text-[11px] text-[#8EA3A5] block mt-0.5">Loan recovery</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#EEEBFF] text-[#8178F2] flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Month Selector & Controls */}
      <div className="bg-white p-4 rounded-[20px] border border-[#D9EAEB] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Month Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#0B9FA5]" />
            <span>{language === 'bn' ? 'বেতনের মাস:' : 'Salary Period:'}</span>
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-[#D9EAEB] bg-white text-[#17383B] focus:outline-none focus:border-[#0B9FA5]"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-[#8EA3A5] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'bn' ? 'কর্মী বা পদবী খুঁজুন...' : 'Search employee...'}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#D9EAEB] bg-[#F8FCFC] text-[#17383B] focus:outline-none focus:border-[#0B9FA5]"
            />
          </div>

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            aria-label={t('filterDepartment')}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-[#D9EAEB] bg-white text-[#17383B] focus:outline-none focus:border-[#0B9FA5]"
          >
            <option value="all">{t('allDepartments')}</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label={t('paymentStatusCol')}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-[#D9EAEB] bg-white text-[#17383B] focus:outline-none focus:border-[#0B9FA5]"
          >
            <option value="all">All Statuses</option>
            <option value="paid">{t('paidStatus')}</option>
            <option value="pending">{t('pendingStatus')}</option>
          </select>

          <button
            type="button"
            onClick={() => onOpenPrintModal(selectedMonth)}
            className="px-3.5 py-1.5 rounded-xl border border-[#D9EAEB] hover:bg-[#F1FAFA] text-[#17383B] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-[#0B9FA5]" />
            <span>{t('printSalarySheetBtn')}</span>
          </button>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-[22px] border border-[#D9EAEB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FCFC] border-b border-[#D9EAEB] text-[#688285] font-bold">
              <tr>
                <th className="py-3 px-4">{t('employeeCol')}</th>
                <th className="py-3 px-4">{t('departmentCol')}</th>
                <th className="py-3 px-4 text-right">{t('basicSalaryCol')}</th>
                <th className="py-3 px-4 text-right">{t('advanceCol')}</th>
                <th className="py-3 px-4 text-right">Overtime / Bonus</th>
                <th className="py-3 px-4 text-right">{t('netSalaryCol')}</th>
                <th className="py-3 px-4">{t('paymentStatusCol')}</th>
                <th className="py-3 px-4">Payment Account / Date</th>
                <th className="py-3 px-4 text-right">{t('actionsCol')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F0F1]">
              {monthRecords.map((record) => (
                <tr key={record.id} className="hover:bg-[#F1FAFA]/60 transition-colors">
                  {/* Name & Designation */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0B9FA5] to-[#2FD1C5] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {record.employeeName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-extrabold text-xs text-[#17383B] block">{record.employeeName}</span>
                        <span className="text-[10px] text-[#8EA3A5] block">{record.designation}</span>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="py-3 px-4 font-semibold text-[#17383B]">
                    {record.department}
                  </td>

                  {/* Basic Salary */}
                  <td className="py-3 px-4 text-right font-medium text-[#17383B]">
                    {formatCurrency(record.basicSalary, language)}
                  </td>

                  {/* Advance Deduction */}
                  <td className="py-3 px-4 text-right font-medium text-red-500">
                    {record.advanceDeduction > 0 ? `-${formatCurrency(record.advanceDeduction, language)}` : '৳ 0'}
                  </td>

                  {/* Bonus / Overtime */}
                  <td className="py-3 px-4 text-right font-medium text-[#1E9B71]">
                    {record.bonus > 0 ? `+${formatCurrency(record.bonus, language)}` : '৳ 0'}
                  </td>

                  {/* Net Payable Salary */}
                  <td className="py-3 px-4 text-right font-black text-sm text-[#0B9FA5]">
                    {formatCurrency(record.netSalary, language)}
                  </td>

                  {/* Payment Status */}
                  <td className="py-3 px-4">
                    {record.paymentStatus === 'paid' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E5F8F1] text-[#1E9B71] border border-[#27B082]/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t('paidStatus')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF6E6] text-[#D98218] border border-[#D98218]/20">
                        <Clock className="w-3.5 h-3.5" />
                        {t('pendingStatus')}
                      </span>
                    )}
                  </td>

                  {/* Payment info */}
                  <td className="py-3 px-4 text-[11px] text-[#688285]">
                    {record.paymentDate ? (
                      <div>
                        <span className="font-bold text-[#17383B] block">{record.paymentDate}</span>
                        <span className="text-[#8EA3A5] truncate block max-w-[140px]">{record.accountName || 'Bank'}</span>
                      </div>
                    ) : (
                      <span className="text-[#8EA3A5]">Not disbursed</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    {record.paymentStatus !== 'paid' && canManagePayroll ? (
                      <button
                        type="button"
                        onClick={() => onOpenProcessModal(record)}
                        className="px-3 py-1.5 rounded-xl bg-[#0B9FA5] hover:bg-[#08868C] text-white text-xs font-bold transition-all shadow-xs"
                      >
                        {t('paySalaryBtn')}
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-[#1E9B71] bg-[#E5F8F1] px-2.5 py-1 rounded-lg">
                        Disbursed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
