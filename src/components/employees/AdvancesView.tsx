import React, { useState, useMemo } from 'react';
import { Employee } from '../../types';
import { useERP } from '../../context/ERPContext';
import { AdvanceRecord } from './types';
import { formatCurrency } from '../../utils/translation';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Filter, 
  TrendingDown, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  Calendar,
  Building2
} from 'lucide-react';
import { motion } from 'motion/react';

interface AdvancesViewProps {
  employees: Employee[];
  advanceRecords: AdvanceRecord[];
  onOpenAddModal: () => void;
}

export const AdvancesView: React.FC<AdvancesViewProps> = ({
  employees,
  advanceRecords,
  onOpenAddModal
}) => {
  const { t, language, currentUser } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const canManageAdvances = currentUser && ['super_admin', 'admin', 'accounts_manager'].includes(currentUser.role);

  // Aggregate metrics
  const totalIssued = advanceRecords.reduce((sum, a) => sum + a.amount, 0);
  const totalDeducted = advanceRecords.reduce((sum, a) => sum + a.deductedAmount, 0);
  const totalBalance = advanceRecords.reduce((sum, a) => sum + a.balance, 0);
  const activeLoansCount = advanceRecords.filter(a => a.balance > 0).length;

  const filteredAdvances = useMemo(() => {
    return advanceRecords.filter(adv => {
      const matchSearch = adv.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        adv.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        adv.purpose.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'all' || adv.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [advanceRecords, searchQuery, statusFilter]);

  const getStatusBadge = (status: AdvanceRecord['status']) => {
    switch (status) {
      case 'deducted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E5F8F1] text-[#1E9B71] border border-[#27B082]/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Fully Deducted
          </span>
        );
      case 'partially_deducted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF6E6] text-[#D98218] border border-[#D98218]/20">
            <Clock className="w-3.5 h-3.5" /> Partially Deducted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEEBFF] text-[#8178F2] border border-[#8178F2]/20">
            <AlertCircle className="w-3.5 h-3.5" /> Pending Recovery
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Advance Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Outstanding Balance */}
        <div className="bg-white p-5 rounded-[22px] border border-[#D9EAEB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#688285] block">{t('balanceCol')}</span>
            <div className="text-xl font-black text-red-500 mt-1">
              {formatCurrency(totalBalance, language)}
            </div>
            <span className="text-[11px] text-[#8EA3A5] block mt-0.5">{activeLoansCount} active advances</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Total Issued */}
        <div className="bg-white p-5 rounded-[22px] border border-[#D9EAEB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#688285] block">Total Issued</span>
            <div className="text-xl font-black text-[#17383B] mt-1">
              {formatCurrency(totalIssued, language)}
            </div>
            <span className="text-[11px] text-[#8EA3A5] block mt-0.5">Floor loans & emergency</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#FFF3DF] text-[#D98218] flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Deducted So Far */}
        <div className="bg-white p-5 rounded-[22px] border border-[#D9EAEB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#688285] block">{t('deductedCol')}</span>
            <div className="text-xl font-black text-[#1E9B71] mt-1">
              {formatCurrency(totalDeducted, language)}
            </div>
            <span className="text-[11px] font-bold text-[#1E9B71]">
              {totalIssued > 0 ? Math.round((totalDeducted / totalIssued) * 100) : 0}% recovered
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#E5F8F1] text-[#1E9B71] flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Active Accounts */}
        <div className="bg-white p-5 rounded-[22px] border border-[#D9EAEB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#688285] block">Borrowing Workers</span>
            <div className="text-xl font-black text-[#8178F2] mt-1">
              {activeLoansCount}
            </div>
            <span className="text-[11px] text-[#8EA3A5] block mt-0.5">Salary linked recovery</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#EEEBFF] text-[#8178F2] flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="bg-white p-4 rounded-[20px] border border-[#D9EAEB] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative min-w-[240px] flex-1">
          <Search className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'bn' ? 'কর্মী, বিভাগ বা অগ্রিমের কারণ খুঁজুন...' : 'Search advances by staff or purpose...'}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#D9EAEB] bg-[#F8FCFC] text-[#17383B] focus:outline-none focus:border-[#0B9FA5]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label={t('statusCol')}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-[#D9EAEB] bg-white text-[#17383B] focus:outline-none focus:border-[#0B9FA5]"
          >
            <option value="all">All Loan Statuses</option>
            <option value="pending">Pending</option>
            <option value="partially_deducted">Partially Deducted</option>
            <option value="deducted">Fully Deducted</option>
          </select>

          {canManageAdvances && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D98218] to-[#F3B562] hover:from-[#c27313] hover:to-[#D98218] text-white text-xs font-bold shadow-[0_4px_14px_rgba(217,130,24,0.25)] flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t('newAdvanceBtn')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Advances Table */}
      <div className="bg-white rounded-[22px] border border-[#D9EAEB] shadow-xs overflow-hidden">
        {filteredAdvances.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8EA3A5]">
            {language === 'bn' ? 'কোনো অগ্রিম রেকর্ডের তথ্য মেলেনি।' : 'No advance records found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F8FCFC] border-b border-[#D9EAEB] text-[#688285] font-bold">
                <tr>
                  <th className="py-3 px-4">{t('employeeCol')}</th>
                  <th className="py-3 px-4">{t('departmentCol')}</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4 text-right">{t('advanceAmountCol')}</th>
                  <th className="py-3 px-4 text-right">{t('deductedCol')}</th>
                  <th className="py-3 px-4 text-right">{t('balanceCol')}</th>
                  <th className="py-3 px-4">{t('statusCol')}</th>
                  <th className="py-3 px-4">{t('purposeCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6F0F1]">
                {filteredAdvances.map((adv) => (
                  <tr key={adv.id} className="hover:bg-[#F1FAFA]/60 transition-colors">
                    {/* Employee */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#FFF3DF] text-[#D98218] flex items-center justify-center font-bold text-xs shrink-0">
                          {adv.employeeName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-extrabold text-xs text-[#17383B] block">{adv.employeeName}</span>
                          <span className="text-[10px] text-[#8EA3A5] block">{adv.designation}</span>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4 font-semibold text-[#17383B]">
                      {adv.department}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-[#688285]">
                      {adv.date}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right font-bold text-[#17383B]">
                      {formatCurrency(adv.amount, language)}
                    </td>

                    {/* Deducted */}
                    <td className="py-3 px-4 text-right font-bold text-[#1E9B71]">
                      {formatCurrency(adv.deductedAmount, language)}
                    </td>

                    {/* Balance */}
                    <td className="py-3 px-4 text-right font-black text-red-500">
                      {formatCurrency(adv.balance, language)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {getStatusBadge(adv.status)}
                    </td>

                    {/* Purpose / Notes */}
                    <td className="py-3 px-4 text-[#688285] max-w-[200px]">
                      <span className="font-medium block truncate text-[#17383B]">{adv.purpose}</span>
                      {adv.notes && <span className="text-[10px] text-[#8EA3A5] block truncate">{adv.notes}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
