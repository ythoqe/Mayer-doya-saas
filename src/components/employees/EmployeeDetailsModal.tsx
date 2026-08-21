import React, { useState } from 'react';
import { Employee } from '../../types';
import { useERP } from '../../context/ERPContext';
import { AttendanceRecord, AdvanceRecord, PayrollRecord } from './types';
import { formatCurrency } from '../../utils/translation';
import { 
  X, 
  User, 
  Phone, 
  Calendar, 
  Clock, 
  Building2, 
  Briefcase, 
  DollarSign, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Clock3, 
  AlertCircle,
  FileText,
  Printer,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EmployeeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  attendanceRecords: AttendanceRecord[];
  payrollRecords: PayrollRecord[];
  advanceRecords: AdvanceRecord[];
  onEdit: (emp: Employee) => void;
  onPrint?: (emp: Employee) => void;
}

export const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({
  isOpen,
  onClose,
  employee,
  attendanceRecords,
  payrollRecords,
  advanceRecords,
  onEdit,
  onPrint
}) => {
  const { t, language, currentUser } = useERP();
  const [activeTab, setActiveTab] = useState<'profile' | 'attendance' | 'payroll' | 'advances'>('profile');

  if (!isOpen || !employee) return null;

  // RBAC permission for financial information
  const canViewFinancials = currentUser && ['super_admin', 'admin', 'accounts_manager', 'auditor'].includes(currentUser.role);

  const empAttendance = attendanceRecords.filter(a => a.employeeId === employee.id);
  const empPayroll = payrollRecords.filter(p => p.employeeId === employee.id);
  const empAdvances = advanceRecords.filter(a => a.employeeId === employee.id);

  const getStatusBadge = (status: Employee['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E5F8F1] text-[#1E9B71] border border-[#27B082]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E9B71]" />
            {t('activeStatus')}
          </span>
        );
      case 'on_leave':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF6E6] text-[#D98218] border border-[#D98218]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D98218]" />
            {t('leaveStatus')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            {t('inactiveStatus')}
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-[#17383B]/45 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl bg-white rounded-[24px] shadow-[0_24px_60px_rgba(23,56,59,0.22)] border border-[#D9EAEB] overflow-hidden my-6 flex flex-col max-h-[90vh]"
        >
          {/* Top Header Profile Banner */}
          <div className="p-6 bg-gradient-to-r from-[#F1FAFA] via-[#EAF6F6] to-white border-b border-[#E6F0F1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0B9FA5] to-[#2FD1C5] text-white flex items-center justify-center font-black text-2xl shadow-[0_6px_18px_rgba(11,159,165,0.28)] shrink-0">
                {employee.name.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-extrabold text-[#17383B] tracking-tight">{employee.name}</h2>
                  {getStatusBadge(employee.status)}
                </div>
                <p className="text-xs font-semibold text-[#0B9FA5] flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{employee.designation}</span>
                  <span className="text-[#8EA3A5]">•</span>
                  <span className="text-[#688285]">{employee.department}</span>
                </p>
                <div className="flex items-center gap-3 text-[11px] text-[#8EA3A5]">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#0B9FA5]" /> {employee.phone}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#0B9FA5]" /> Joined {employee.joinDate}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => onEdit(employee)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#D9EAEB] hover:bg-[#F1FAFA] text-[#17383B] text-xs font-bold transition-colors shadow-xs"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#0B9FA5]" />
                <span>{language === 'bn' ? 'সম্পাদন' : 'Edit'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-black/5 text-[#8EA3A5] hover:text-[#17383B] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div className="px-6 border-b border-[#E6F0F1] bg-white flex gap-2 overflow-x-auto select-none">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'border-[#0B9FA5] text-[#0B9FA5]'
                  : 'border-transparent text-[#688285] hover:text-[#17383B]'
              }`}
            >
              {language === 'bn' ? 'প্রোফাইল বিবরণ' : 'Profile & Job'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'attendance'
                  ? 'border-[#0B9FA5] text-[#0B9FA5]'
                  : 'border-transparent text-[#688285] hover:text-[#17383B]'
              }`}
            >
              <span>{t('attendanceHistory')}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#DDF4F3] text-[#0B9FA5]">
                {empAttendance.length}
              </span>
            </button>
            {canViewFinancials && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('payroll')}
                  className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'payroll'
                      ? 'border-[#0B9FA5] text-[#0B9FA5]'
                      : 'border-transparent text-[#688285] hover:text-[#17383B]'
                  }`}
                >
                  <span>{t('salaryHistory')}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#EEEBFF] text-[#8178F2]">
                    {empPayroll.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('advances')}
                  className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'advances'
                      ? 'border-[#0B9FA5] text-[#0B9FA5]'
                      : 'border-transparent text-[#688285] hover:text-[#17383B]'
                  }`}
                >
                  <span>{t('advancesHistory')}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#FFF3DF] text-[#D98218]">
                    {empAdvances.length}
                  </span>
                </button>
              </>
            )}
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Employment Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[#F8FCFC] border border-[#D9EAEB]">
                    <span className="text-[10px] font-bold text-[#8EA3A5] uppercase tracking-wider block">
                      {t('departmentCol')}
                    </span>
                    <span className="text-xs font-extrabold text-[#17383B] mt-1 block">
                      {employee.department}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F8FCFC] border border-[#D9EAEB]">
                    <span className="text-[10px] font-bold text-[#8EA3A5] uppercase tracking-wider block">
                      {t('shiftCol')}
                    </span>
                    <span className="text-xs font-extrabold text-[#0B9FA5] capitalize mt-1 block">
                      {employee.shift === 'day' ? t('dayShift') : employee.shift === 'night' ? t('nightShift') : t('generalShift')}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F8FCFC] border border-[#D9EAEB]">
                    <span className="text-[10px] font-bold text-[#8EA3A5] uppercase tracking-wider block">
                      {t('joiningDateCol')}
                    </span>
                    <span className="text-xs font-extrabold text-[#17383B] mt-1 block">
                      {employee.joinDate}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F8FCFC] border border-[#D9EAEB]">
                    <span className="text-[10px] font-bold text-[#8EA3A5] uppercase tracking-wider block">
                      {t('salaryCol')}
                    </span>
                    <span className="text-xs font-extrabold text-[#1E9B71] mt-1 block">
                      {canViewFinancials ? formatCurrency(employee.salary, language) : '••••••'}
                    </span>
                  </div>
                </div>

                {/* Factory Details */}
                <div className="p-4 rounded-2xl bg-white border border-[#D9EAEB] space-y-3 shadow-xs">
                  <h4 className="text-xs font-extrabold text-[#17383B] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#0B9FA5]" />
                    <span>{language === 'bn' ? 'ফ্যাক্টরি দায়িত্ব ও অবস্থান' : 'Factory Role & Workstation'}</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[#8EA3A5] block">{language === 'bn' ? 'প্রধান কার্যক্ষেত্র:' : 'Primary Assignment:'}</span>
                      <span className="font-semibold text-[#17383B]">
                        {employee.department} Washing & Finishing Floor
                      </span>
                    </div>
                    <div>
                      <span className="text-[#8EA3A5] block">{language === 'bn' ? 'তত্ত্বাবধানকারী / রিপোর্ট টু:' : 'Supervised By:'}</span>
                      <span className="font-semibold text-[#17383B]">Factory General Manager</span>
                    </div>
                    <div>
                      <span className="text-[#8EA3A5] block">{language === 'bn' ? 'অফিসিয়াল যোগাযোগ:' : 'Official Phone:'}</span>
                      <span className="font-semibold text-[#17383B]">{employee.phone}</span>
                    </div>
                    <div>
                      <span className="text-[#8EA3A5] block">{language === 'bn' ? 'স্ট্যাটাস যাচাই:' : 'Status Verification:'}</span>
                      <span className="font-semibold text-[#1E9B71]">Verified Factory Staff</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="space-y-4">
                {empAttendance.length === 0 ? (
                  <div className="text-center py-8 text-[#8EA3A5] text-xs">
                    {t('noAttendanceForDate')}
                  </div>
                ) : (
                  <div className="border border-[#D9EAEB] rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8FCFC] border-b border-[#D9EAEB] text-[#688285]">
                        <tr>
                          <th className="py-2.5 px-4 font-bold">Date</th>
                          <th className="py-2.5 px-4 font-bold">{t('statusCol')}</th>
                          <th className="py-2.5 px-4 font-bold">{t('checkInCol')}</th>
                          <th className="py-2.5 px-4 font-bold">{t('checkOutCol')}</th>
                          <th className="py-2.5 px-4 font-bold">{t('hoursCol')}</th>
                          <th className="py-2.5 px-4 font-bold">{t('remarksCol')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6F0F1]">
                        {empAttendance.map((att) => (
                          <tr key={att.id} className="hover:bg-[#F1FAFA]/60 transition-colors">
                            <td className="py-2.5 px-4 font-bold text-[#17383B]">{att.date}</td>
                            <td className="py-2.5 px-4">
                              {att.status === 'present' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1E9B71]">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> {t('presentCount')}
                                </span>
                              ) : att.status === 'late' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D98218]">
                                  <Clock3 className="w-3.5 h-3.5" /> {t('lateCount')}
                                </span>
                              ) : att.status === 'on_leave' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8178F2]">
                                  <AlertCircle className="w-3.5 h-3.5" /> {t('leaveCount')}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-500">
                                  <XCircle className="w-3.5 h-3.5" /> {t('absentCount')}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-[#688285]">{att.checkIn || '-'}</td>
                            <td className="py-2.5 px-4 text-[#688285]">{att.checkOut || '-'}</td>
                            <td className="py-2.5 px-4 font-semibold text-[#17383B]">{att.workingHours ? `${att.workingHours} hrs` : '-'}</td>
                            <td className="py-2.5 px-4 text-[#8EA3A5] truncate max-w-[160px]">{att.remarks || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payroll' && canViewFinancials && (
              <div className="space-y-4">
                {empPayroll.length === 0 ? (
                  <div className="text-center py-8 text-[#8EA3A5] text-xs">
                    {t('noPayrollFound')}
                  </div>
                ) : (
                  <div className="border border-[#D9EAEB] rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8FCFC] border-b border-[#D9EAEB] text-[#688285]">
                        <tr>
                          <th className="py-2.5 px-4 font-bold">Month</th>
                          <th className="py-2.5 px-4 font-bold">{t('basicSalaryCol')}</th>
                          <th className="py-2.5 px-4 font-bold">{t('advanceCol')}</th>
                          <th className="py-2.5 px-4 font-bold">{t('netSalaryCol')}</th>
                          <th className="py-2.5 px-4 font-bold">{t('paymentStatusCol')}</th>
                          <th className="py-2.5 px-4 font-bold">Payment Info</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6F0F1]">
                        {empPayroll.map((pay) => (
                          <tr key={pay.id} className="hover:bg-[#F1FAFA]/60 transition-colors">
                            <td className="py-2.5 px-4 font-bold text-[#17383B]">{pay.month}</td>
                            <td className="py-2.5 px-4 font-medium">{formatCurrency(pay.basicSalary, language)}</td>
                            <td className="py-2.5 px-4 text-red-500 font-medium">{pay.advanceDeduction > 0 ? `-${formatCurrency(pay.advanceDeduction, language)}` : '৳ 0'}</td>
                            <td className="py-2.5 px-4 font-black text-[#0B9FA5]">{formatCurrency(pay.netSalary, language)}</td>
                            <td className="py-2.5 px-4">
                              {pay.paymentStatus === 'paid' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E5F8F1] text-[#1E9B71]">
                                  {t('paidStatus')}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF6E6] text-[#D98218]">
                                  {t('pendingStatus')}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-[11px] text-[#8EA3A5]">
                              {pay.paymentDate ? `${pay.paymentDate} • ${pay.accountName || 'Bank'}` : 'Not disbursed'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'advances' && canViewFinancials && (
              <div className="space-y-4">
                {empAdvances.length === 0 ? (
                  <div className="text-center py-8 text-[#8EA3A5] text-xs">
                    {language === 'bn' ? 'কোনো অগ্রিম ঋণ বা কর্তনের রেকর্ড নেই।' : 'No active advances or loans for this employee.'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {empAdvances.map((adv) => (
                      <div key={adv.id} className="p-4 rounded-2xl bg-white border border-[#D9EAEB] flex items-center justify-between shadow-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-[#17383B]">{adv.purpose}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF3DF] text-[#D98218]">
                              {adv.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#8EA3A5]">Issued: {adv.date} • {adv.notes || 'Floor Loan'}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-[#17383B] block">{formatCurrency(adv.amount, language)}</span>
                          <span className="text-[10px] text-red-500 font-bold">Balance: {formatCurrency(adv.balance, language)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#E6F0F1] bg-[#F8FCFC] flex items-center justify-between">
            <span className="text-[11px] text-[#8EA3A5]">
              Mayer Doya ERP • Factory Workforce Database
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-white border border-[#D9EAEB] hover:bg-gray-50 text-[#17383B] text-xs font-bold transition-colors"
            >
              {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
