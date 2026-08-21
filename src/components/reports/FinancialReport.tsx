import React, { useMemo, useState } from 'react';
import { 
  Landmark, 
  Search, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Wallet, 
  Lock, 
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell, 
  Legend 
} from 'recharts';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { DateRange } from './types';
import { isDateInRange } from './dateUtils';

interface FinancialReportProps {
  dateRange: DateRange;
}

export const FinancialReport: React.FC<FinancialReportProps> = ({ dateRange }) => {
  const { accounts, transactions, expenses, currentUser, language, t } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit' | 'transfer'>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');

  // RBAC Permission check
  const isAllowed = ['super_admin', 'admin', 'accounts_manager', 'auditor'].includes(currentUser?.role || 'super_admin');

  // Filtered transactions
  const dateFilteredTransactions = useMemo(() => {
    return transactions.filter(tr => isDateInRange(tr.date || tr.createdAt, dateRange));
  }, [transactions, dateRange]);

  const tableTransactions = useMemo(() => {
    return dateFilteredTransactions.filter(tr => {
      const matchesSearch = 
        tr.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tr.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tr.referenceId && tr.referenceId.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = typeFilter === 'all' || tr.type === typeFilter;
      const matchesAccount = accountFilter === 'all' || tr.accountId === accountFilter || tr.toAccountId === accountFilter;

      return matchesSearch && matchesType && matchesAccount;
    });
  }, [dateFilteredTransactions, searchTerm, typeFilter, accountFilter]);

  // Aggregate Metrics
  const totalAccountBalance = useMemo(() => {
    return accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  }, [accounts]);

  const totalInflow = useMemo(() => {
    return dateFilteredTransactions
      .filter(tr => tr.type === 'credit')
      .reduce((sum, tr) => sum + tr.amount, 0);
  }, [dateFilteredTransactions]);

  const totalOutflow = useMemo(() => {
    return dateFilteredTransactions
      .filter(tr => tr.type === 'debit')
      .reduce((sum, tr) => sum + tr.amount, 0);
  }, [dateFilteredTransactions]);

  const netCashFlow = totalInflow - totalOutflow;

  // Chart Data: Inflow vs Outflow
  const cashFlowChartData = useMemo(() => {
    return [
      { name: language === 'bn' ? 'মোট জমা (ইনফ্লো)' : 'Total Inflow (Credit)', amount: totalInflow, fill: '#10b981' },
      { name: language === 'bn' ? 'মোট খরচ (আউটফ্লো)' : 'Total Outflow (Debit)', amount: totalOutflow, fill: '#f43f5e' },
      { name: language === 'bn' ? 'নেট ক্যাশ ফ্লো' : 'Net Cash Flow', amount: Math.abs(netCashFlow), fill: netCashFlow >= 0 ? '#0d9488' : '#e11d48' },
    ];
  }, [totalInflow, totalOutflow, netCashFlow, language]);

  // Account Balances Chart Data
  const accountBalancesData = useMemo(() => {
    return accounts.map(a => ({
      name: a.accountName.length > 15 ? a.accountName.slice(0, 13) + '..' : a.accountName,
      fullName: a.accountName,
      balance: a.currentBalance,
      type: a.accountType
    }));
  }, [accounts]);

  if (!isAllowed) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">{t('restrictedReportNotice')}</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          {t('restrictedReportDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Cash & Bank Balance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'মোট ব্যাংক ও ক্যাশ তহবিল' : 'Total Cash & Bank Balance'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {formatCurrency(totalAccountBalance, language)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'সচল হিসাব:' : 'Active Accounts:'}</span>
            <span className="font-semibold text-teal-600">{accounts.length} Accounts</span>
          </div>
        </div>

        {/* Total Inflow */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'তহবিল জমা (ইনফ্লো)' : 'Total Inflow (Credit)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            {formatCurrency(totalInflow, language)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'ক্রেডিট লেনদেন:' : 'Credit Entries:'}</span>
            <span className="font-semibold text-slate-700">
              {dateFilteredTransactions.filter(tr => tr.type === 'credit').length}
            </span>
          </div>
        </div>

        {/* Total Outflow */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'তহবিল খরচ (আউটফ্লো)' : 'Total Outflow (Debit)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-2">
            {formatCurrency(totalOutflow, language)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'ডেবিট লেনদেন:' : 'Debit Entries:'}</span>
            <span className="font-semibold text-slate-700">
              {dateFilteredTransactions.filter(tr => tr.type === 'debit').length}
            </span>
          </div>
        </div>

        {/* Net Cash Flow */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'নেট ক্যাশ ফ্লো' : 'Net Cash Flow'}
            </span>
            <div className={`w-8 h-8 rounded-xl ${netCashFlow >= 0 ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'} flex items-center justify-center`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-bold mt-2 ${netCashFlow >= 0 ? 'text-teal-700' : 'text-rose-700'}`}>
            {formatCurrency(netCashFlow, language)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'ব্যালেন্স প্রভাব:' : 'Period Net:'}</span>
            <span className={`font-semibold ${netCashFlow >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
              {netCashFlow >= 0 ? '+ Surplus' : '- Deficit'}
            </span>
          </div>
        </div>
      </div>

      {/* Account Balances Grid */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-1">
          {language === 'bn' ? 'ফ্যাক্টরি ব্যাংক ও ক্যাশ হিসাবের বর্তমান ব্যালেন্স' : 'Factory Accounts & Liquid Balances'}
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          {language === 'bn' ? 'ক্যাশ ইন হ্যান্ড, ব্যাংক ও মোবাইল ব্যাংকিং ফান্ডের সারসংক্ষেপ' : 'Real-time balances across cash in hand, commercial bank accounts and MFS gateways'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map(acc => (
            <div key={acc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{acc.accountType}</span>
                <Landmark className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="font-bold text-slate-900 text-sm mt-1">{acc.accountName}</div>
              {acc.accountNumber && (
                <div className="text-[11px] font-mono text-slate-500">{acc.accountNumber}</div>
              )}
              <div className="text-base font-bold text-teal-700 mt-2">
                {formatCurrency(acc.currentBalance, language)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions Audit Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Header & Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {language === 'bn' ? 'আর্থিক লেনদেন ও ট্রানজাকশন লেজার' : 'Financial Transactions Audit Ledger'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'bn' ? `মোট ${tableTransactions.length} টি লেনদেন পাওয়া গেছে` : `Showing ${tableTransactions.length} transactions`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-financial-transactions"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'bn' ? 'বিবরণ বা রেফারেন্স খুঁজুন...' : 'Search description or ref...'}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <select
              id="filter-trans-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="all">{language === 'bn' ? 'সকল লেনদেন' : 'All Types'}</option>
              <option value="credit">{language === 'bn' ? 'জমা (Credit)' : 'Credit / Inflow'}</option>
              <option value="debit">{language === 'bn' ? 'খরচ (Debit)' : 'Debit / Outflow'}</option>
              <option value="transfer">{language === 'bn' ? 'ট্রান্সফার (Transfer)' : 'Account Transfer'}</option>
            </select>

            <select
              id="filter-trans-account"
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="all">{language === 'bn' ? 'সকল অ্যাকাউন্ট' : 'All Accounts'}</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.accountName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">{language === 'bn' ? 'তারিখ' : 'Date'}</th>
                <th className="py-3 px-4">{language === 'bn' ? 'হিসাব খাত / বিবরণ' : 'Description'}</th>
                <th className="py-3 px-4">{language === 'bn' ? 'ক্যাটাগরি' : 'Category'}</th>
                <th className="py-3 px-4">{language === 'bn' ? 'অ্যাকাউন্ট' : 'Account'}</th>
                <th className="py-3 px-4 text-center">{language === 'bn' ? 'ধরন' : 'Type'}</th>
                <th className="py-3 px-4 text-right">{language === 'bn' ? 'পরিমাণ (BDT)' : 'Amount (BDT)'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableTransactions.length > 0 ? (
                tableTransactions.map(tr => {
                  const account = accounts.find(a => a.id === tr.accountId);
                  const isCredit = tr.type === 'credit';
                  return (
                    <tr key={tr.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-600 font-mono">{tr.date}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {tr.description}
                        {tr.referenceId && (
                          <span className="block text-[11px] font-mono text-slate-400 mt-0.5">Ref: {tr.referenceId}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                          {tr.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {account?.accountName || 'Primary Account'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isCredit ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                            Credit
                          </span>
                        ) : tr.type === 'transfer' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200">
                            Transfer
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[11px] font-semibold border border-rose-200">
                            Debit
                          </span>
                        )}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold font-mono ${isCredit ? 'text-emerald-700' : 'text-slate-900'}`}>
                        {isCredit ? '+' : '-'}{formatCurrency(tr.amount, language)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <Landmark className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <span>{language === 'bn' ? 'কোনো লেনদেন রেকর্ড পাওয়া যায়নি' : 'No transactions found'}</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
