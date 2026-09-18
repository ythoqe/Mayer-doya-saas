import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { BankLoan, LoanType, LoanStatus } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { AddLoanModal } from './AddLoanModal';
import { LoanInstallmentModal } from './LoanInstallmentModal';
import { LoanStatementModal } from './LoanStatementModal';
import { ConfirmDeleteModal } from '../ui/ConfirmDeleteModal';
import { 
  Building2, 
  Plus, 
  DollarSign, 
  Search, 
  Filter, 
  Receipt, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Edit, 
  Trash2,
  Calendar,
  Layers,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/translation';

export const BankLoans: React.FC = () => {
  const { bankLoans, deleteBankLoan, language, t } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modals state
  const [isAddLoanModalOpen, setIsAddLoanModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<BankLoan | null>(null);
  const [payingLoan, setPayingLoan] = useState<BankLoan | null>(null);
  const [statementLoan, setStatementLoan] = useState<BankLoan | null>(null);
  const [loanToDelete, setLoanToDelete] = useState<BankLoan | null>(null);

  // Filtered loans list
  const filteredLoans = (bankLoans || []).filter(loan => {
    if (!loan) return false;
    const matchesSearch = 
      (loan.bankName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loan.loanTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loan.branchName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loan.accountNumber || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    const matchesType = typeFilter === 'all' || loan.loanType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Financial aggregates
  const totalLoansCount = bankLoans.length;
  const activeLoans = bankLoans.filter(l => l.status === 'active');
  const totalSanctioned = bankLoans.reduce((sum, l) => sum + (Number(l.sanctionAmount) || 0), 0);
  const totalOutstanding = bankLoans.reduce((sum, l) => sum + (Number(l.currentOutstanding) || 0), 0);
  const totalPrincipalRepaid = bankLoans.reduce((sum, l) => sum + (Number(l.totalPrincipalPaid) || 0), 0);
  const totalInterestPaid = bankLoans.reduce((sum, l) => sum + (Number(l.totalInterestPaid) || 0), 0);
  const totalMonthlyCommitment = activeLoans.reduce((sum, l) => sum + (Number(l.monthlyInstallment) || 0), 0);

  const getLoanTypeLabel = (type: LoanType) => {
    switch (type) {
      case 'term_loan': return language === 'bn' ? 'টার্ম লোন' : 'Term Loan';
      case 'cc_loan': return language === 'bn' ? 'সিসি লোন' : 'CC Loan';
      case 'machinery_loan': return language === 'bn' ? 'মেশিনারি লিজ' : 'Machinery Lease';
      case 'sme_loan': return language === 'bn' ? 'এসএমই লোন' : 'SME Loan';
      case 'short_term': return language === 'bn' ? 'স্বল্পমেয়াদী লোন' : 'Short Term';
      case 'mortgage': return language === 'bn' ? 'মর্টগেজ লোন' : 'Mortgage';
      default: return type;
    }
  };

  const getStatusBadge = (status: LoanStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
            {language === 'bn' ? 'সক্রিয়' : 'Active'}
          </span>
        );
      case 'closed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200">
            {language === 'bn' ? 'পরিশোধিত' : 'Closed'}
          </span>
        );
      case 'overdue':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
            {language === 'bn' ? 'বকেয়া' : 'Overdue'}
          </span>
        );
      case 'defaulted':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">
            {language === 'bn' ? 'খেলাপি' : 'Defaulted'}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#17383B] tracking-tight">
              {language === 'bn' ? 'ব্যাংক ঋণ ও কিস্তি ব্যবস্থাপনা' : 'Bank Loans & Facilities'}
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#E6F8F8] text-[#0B9FA5] border border-[#0B9FA5]/20">
              {totalLoansCount} {language === 'bn' ? 'টি ঋণ' : 'Loans'}
            </span>
          </div>
          <p className="text-xs text-[#688285] mt-1">
            {language === 'bn'
              ? 'কারখানার দীর্ঘমেয়াদী ব্যাংক ঋণ, সিসি হাইপো ও মাসিক কিস্তির তদারকি'
              : 'Track corporate term loans, cash credits, EMIs and factory credit liabilities'
            }
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setPayingLoan(null);
              setIsAddLoanModalOpen(false);
              // Open installment modal directly
              setPayingLoan(bankLoans[0] || null);
            }}
            className="px-4 py-2.5 rounded-xl bg-white border border-[#D9EAEB] hover:bg-[#F8FCFC] text-[#17383B] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-[#0B9FA5]" />
            <span>{language === 'bn' ? 'কিস্তি জমা দিন' : 'Pay Installment'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingLoan(null);
              setIsAddLoanModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#0B9FA5] hover:bg-[#078A90] text-white text-xs font-black shadow-md shadow-[#0B9FA5]/25 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'bn' ? 'নতুন ঋণ অনুমোদন' : 'Sanction New Loan'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Outstanding */}
        <GlassCard padding="sm" className="relative overflow-hidden border border-[#D9EAEB]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#688285] uppercase tracking-wider">
                {language === 'bn' ? 'বর্তমান মোট বকেয়া' : 'Total Outstanding'}
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
                {formatCurrency(totalOutstanding, language)}
              </h3>
              <p className="text-[10px] text-[#8EA3A5] mt-0.5">
                {activeLoans.length} {language === 'bn' ? 'টি সক্রিয় ব্যাংক অ্যাকাউন্টে' : 'in active loan accounts'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </GlassCard>

        {/* Total Sanctioned */}
        <GlassCard padding="sm" className="relative overflow-hidden border border-[#D9EAEB]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#688285] uppercase tracking-wider">
                {language === 'bn' ? 'মোট অনুমোদিত ঋণ' : 'Total Sanctioned'}
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-[#17383B] mt-1">
                {formatCurrency(totalSanctioned, language)}
              </h3>
              <p className="text-[10px] text-[#8EA3A5] mt-0.5">
                {language === 'bn' ? 'কারখানা প্রজেক্ট ও টার্ম লোন' : 'Project & Term facilities'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#EAF7F8] border border-[#0B9FA5]/20 flex items-center justify-center text-[#0B9FA5]">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </GlassCard>

        {/* Principal Repaid */}
        <GlassCard padding="sm" className="relative overflow-hidden border border-[#D9EAEB]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#688285] uppercase tracking-wider">
                {language === 'bn' ? 'পরিশোধিত আসল' : 'Principal Repaid'}
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
                {formatCurrency(totalPrincipalRepaid, language)}
              </h3>
              <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                {language === 'bn' ? 'প্রদত্ত সুদ: ' : 'Interest Paid: '} {formatCurrency(totalInterestPaid, language)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </GlassCard>

        {/* Monthly Commitment */}
        <GlassCard padding="sm" className="relative overflow-hidden border border-[#D9EAEB]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#688285] uppercase tracking-wider">
                {language === 'bn' ? 'মাসিক কিস্তির দায় (EMI)' : 'Monthly EMI Commitment'}
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-[#0B9FA5] mt-1">
                {formatCurrency(totalMonthlyCommitment, language)}
              </h3>
              <p className="text-[10px] text-[#8EA3A5] mt-0.5">
                {language === 'bn' ? 'প্রতি মাসের নির্ধারিত কিস্তি' : 'Scheduled regular installments'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F0EEFF] border border-[#6366F1]/20 flex items-center justify-center text-[#6366F1]">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#D9EAEB] flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder={language === 'bn' ? 'ব্যাংক, শাখা বা অ্যাকাউন্ট খুঁজুন...' : 'Search bank, branch or account...'}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F8FCFC] text-xs font-semibold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] outline-hidden transition-colors"
          />
          <Search className="w-4 h-4 text-[#8EA3A5] absolute left-3 top-3" />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#D9EAEB] bg-[#F8FCFC] text-xs font-semibold text-[#17383B] focus:border-[#0B9FA5] outline-hidden cursor-pointer"
          >
            <option value="all">{language === 'bn' ? 'সকল অবস্থা (All Status)' : 'All Status'}</option>
            <option value="active">{language === 'bn' ? 'সক্রিয় (Active)' : 'Active'}</option>
            <option value="closed">{language === 'bn' ? 'পরিশোধিত (Closed)' : 'Closed'}</option>
            <option value="overdue">{language === 'bn' ? 'বকেয়া (Overdue)' : 'Overdue'}</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#D9EAEB] bg-[#F8FCFC] text-xs font-semibold text-[#17383B] focus:border-[#0B9FA5] outline-hidden cursor-pointer"
          >
            <option value="all">{language === 'bn' ? 'সকল ঋণের ধরন' : 'All Loan Types'}</option>
            <option value="term_loan">{language === 'bn' ? 'টার্ম লোন' : 'Term Loan'}</option>
            <option value="cc_loan">{language === 'bn' ? 'সিসি লোন' : 'CC Loan'}</option>
            <option value="machinery_loan">{language === 'bn' ? 'মেশিনারি লোন' : 'Machinery Loan'}</option>
            <option value="sme_loan">{language === 'bn' ? 'এসএমই লোন' : 'SME Loan'}</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-[#D9EAEB] overflow-hidden shadow-xs">
        {filteredLoans.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 text-[#8EA3A5] mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-black text-[#17383B]">
              {language === 'bn' ? 'কোনো ব্যাংক ঋণ পাওয়া যায়নি' : 'No Bank Loans Found'}
            </h3>
            <p className="text-xs text-[#688285] max-w-sm mx-auto mt-1 mb-4">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? (language === 'bn' ? 'ফিল্টারের সাথে মিলে এমন কোনো ঋণ নেই।' : 'No loans matched the selected filters.')
                : (language === 'bn' ? 'কারখানার প্রথম ব্যাংক ঋণ বা সিসি সুবিধা যোগ করতে নিচের বাটনে ক্লিক করুন।' : 'Add your factory financing facilities to track EMIs and statements.')
              }
            </p>
            <button
              type="button"
              onClick={() => setIsAddLoanModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B9FA5] hover:bg-[#078A90] text-white text-xs font-black shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'bn' ? 'প্রথম ঋণ যুক্ত করুন' : 'Add First Loan'}</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FCFC] text-[#688285] font-bold border-b border-[#D9EAEB] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5 sm:p-4">{language === 'bn' ? 'ব্যাংক ও ঋণ বিবরণ' : 'Bank & Loan Facility'}</th>
                  <th className="p-3.5 sm:p-4">{language === 'bn' ? 'ধরন' : 'Type'}</th>
                  <th className="p-3.5 sm:p-4">{language === 'bn' ? 'অনুমোদিত ও বকেয়া' : 'Sanctioned vs Outstanding'}</th>
                  <th className="p-3.5 sm:p-4">{language === 'bn' ? 'সুদের হার ও মেয়াদ' : 'Rate & Tenure'}</th>
                  <th className="p-3.5 sm:p-4">{language === 'bn' ? 'মাসিক কিস্তি (EMI)' : 'Monthly EMI'}</th>
                  <th className="p-3.5 sm:p-4">{language === 'bn' ? 'অবস্থা' : 'Status'}</th>
                  <th className="p-3.5 sm:p-4 text-right">{language === 'bn' ? 'পদক্ষেপ' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9EAEB] text-[#17383B]">
                {filteredLoans.map(loan => {
                  const percentPaid = loan.sanctionAmount > 0
                    ? Math.min(100, Math.round(((loan.totalPrincipalPaid || 0) / loan.sanctionAmount) * 100))
                    : 0;

                  return (
                    <tr key={loan.id} className="hover:bg-[#F8FCFC] transition-colors">
                      <td className="p-3.5 sm:p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#EAF7F8] border border-[#0B9FA5]/20 flex items-center justify-center text-[#0B9FA5] shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-[#17383B] text-xs sm:text-sm">{loan.loanTitle}</p>
                            <p className="text-[11px] text-[#688285] font-medium">{loan.bankName} - {loan.branchName || 'Head Branch'}</p>
                            {loan.accountNumber && (
                              <p className="text-[10px] font-mono text-[#8EA3A5]">A/C: {loan.accountNumber}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 sm:p-4">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#F1FAFA] text-[#0B9FA5] border border-[#D9EAEB]">
                          {getLoanTypeLabel(loan.loanType)}
                        </span>
                      </td>

                      <td className="p-3.5 sm:p-4">
                        <div>
                          <div className="flex justify-between items-center text-[11px] mb-1">
                            <span className="font-bold text-rose-600">
                              {formatCurrency(loan.currentOutstanding, language)}
                            </span>
                            <span className="text-[10px] text-[#8EA3A5]">
                              {percentPaid}% paid
                            </span>
                          </div>
                          <div className="w-32 h-1.5 rounded-full bg-[#E5F1F2] overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#0B9FA5] to-emerald-500 rounded-full"
                              style={{ width: `${percentPaid}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-[#8EA3A5] mt-1">
                            {language === 'bn' ? 'অনুমোদিত: ' : 'Sanction: '} {formatCurrency(loan.sanctionAmount, language)}
                          </p>
                        </div>
                      </td>

                      <td className="p-3.5 sm:p-4">
                        <p className="font-bold text-[#17383B]">{loan.interestRateAnnual}%</p>
                        <p className="text-[11px] text-[#688285]">{loan.tenureMonths} {language === 'bn' ? 'মাস' : 'Months'}</p>
                      </td>

                      <td className="p-3.5 sm:p-4">
                        <p className="font-black text-[#0B9FA5]">{formatCurrency(loan.monthlyInstallment, language)}</p>
                        {loan.nextDueDate && (
                          <p className="text-[10px] text-[#8EA3A5] flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            <span>{loan.nextDueDate}</span>
                          </p>
                        )}
                      </td>

                      <td className="p-3.5 sm:p-4">
                        {getStatusBadge(loan.status)}
                      </td>

                      <td className="p-3.5 sm:p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Pay EMI */}
                          {loan.status !== 'closed' && (
                            <button
                              type="button"
                              onClick={() => setPayingLoan(loan)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#EAF7F8] hover:bg-[#0B9FA5] text-[#0B9FA5] hover:text-white font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                              title={language === 'bn' ? 'কিস্তি জমা দিন' : 'Pay EMI'}
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{language === 'bn' ? 'কিস্তি' : 'Pay'}</span>
                            </button>
                          )}

                          {/* Statement */}
                          <button
                            type="button"
                            onClick={() => setStatementLoan(loan)}
                            className="p-1.5 rounded-lg text-[#688285] hover:text-[#17383B] hover:bg-[#F1FAFA] transition-colors cursor-pointer"
                            title={language === 'bn' ? 'বিবরণী দেখুন' : 'View Statement'}
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLoan(loan);
                              setIsAddLoanModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-[#688285] hover:text-[#0B9FA5] hover:bg-[#F1FAFA] transition-colors cursor-pointer"
                            title={language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setLoanToDelete(loan)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title={language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Loan Modal */}
      <AddLoanModal
        isOpen={isAddLoanModalOpen}
        onClose={() => {
          setIsAddLoanModalOpen(false);
          setEditingLoan(null);
        }}
        initialLoan={editingLoan}
      />

      {/* Pay Installment Modal */}
      <LoanInstallmentModal
        isOpen={Boolean(payingLoan)}
        onClose={() => setPayingLoan(null)}
        selectedLoan={payingLoan}
      />

      {/* Statement & Schedule Modal */}
      <LoanStatementModal
        isOpen={Boolean(statementLoan)}
        onClose={() => setStatementLoan(null)}
        loan={statementLoan}
        onPayInstallment={(loan) => setPayingLoan(loan)}
      />

      {/* Safe Delete Confirmation */}
      <ConfirmDeleteModal
        isOpen={Boolean(loanToDelete)}
        title={language === 'bn' ? 'ব্যাংক ঋণ মুছে ফেলবেন?' : 'Delete Bank Loan Record?'}
        message={
          language === 'bn'
            ? `আপনি কি নিশ্চিতভাবে "${loanToDelete?.bankName} - ${loanToDelete?.loanTitle}" ঋণ রেকর্ডটি মুছে ফেলতে চান? সংশ্লিষ্ট কিস্তিসমূহ মুছে যাবে।`
            : `Are you sure you want to permanently delete "${loanToDelete?.bankName} - ${loanToDelete?.loanTitle}"? This cannot be undone.`
        }
        confirmLabel={language === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete'}
        onConfirm={() => {
          if (loanToDelete) {
            deleteBankLoan(loanToDelete.id);
            setLoanToDelete(null);
          }
        }}
        onCancel={() => setLoanToDelete(null)}
      />
    </div>
  );
};
