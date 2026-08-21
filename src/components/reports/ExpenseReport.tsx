import React, { useMemo, useState } from 'react';
import { 
  Receipt, 
  Search, 
  DollarSign, 
  TrendingDown, 
  Flame, 
  Zap, 
  Wrench, 
  Lock 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { DateRange } from './types';
import { isDateInRange } from './dateUtils';

interface ExpenseReportProps {
  dateRange: DateRange;
}

const EXP_COLORS = ['#f43f5e', '#f59e0b', '#0d9488', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b', '#10b981'];

export const ExpenseReport: React.FC<ExpenseReportProps> = ({ dateRange }) => {
  const { expenses, accounts, currentUser, language, t } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');

  const isAllowed = ['super_admin', 'admin', 'accounts_manager', 'auditor'].includes(currentUser?.role || 'super_admin');

  // Filtered expenses
  const dateFilteredExpenses = useMemo(() => {
    return expenses.filter(e => isDateInRange(e.date || e.createdAt, dateRange));
  }, [expenses, dateRange]);

  const tableExpenses = useMemo(() => {
    return dateFilteredExpenses.filter(e => {
      const matchesSearch = 
        e.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.paidBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCat = categoryFilter === 'all' || e.category === categoryFilter;
      const matchesAcc = accountFilter === 'all' || e.accountId === accountFilter;

      return matchesSearch && matchesCat && matchesAcc;
    });
  }, [dateFilteredExpenses, searchTerm, categoryFilter, accountFilter]);

  // Aggregate Metrics
  const totalExpenseAmount = useMemo(() => {
    return dateFilteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [dateFilteredExpenses]);

  const boilerFuelCost = useMemo(() => {
    return dateFilteredExpenses
      .filter(e => e.category === 'Fuel/Boiler' || e.category === 'Gas')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [dateFilteredExpenses]);

  const electricityCost = useMemo(() => {
    return dateFilteredExpenses
      .filter(e => e.category === 'Electricity')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [dateFilteredExpenses]);

  const maintenanceCost = useMemo(() => {
    return dateFilteredExpenses
      .filter(e => e.category === 'Maintenance')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [dateFilteredExpenses]);

  // Chart Data: Category Breakdown
  const categoryChartData = useMemo(() => {
    const map: Record<string, number> = {};
    dateFilteredExpenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });

    return Object.entries(map).map(([cat, amount]) => ({
      name: cat,
      value: amount
    }));
  }, [dateFilteredExpenses]);

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
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expenses */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'মোট ফ্যাক্টরি খরচ' : 'Total Factory Expenses'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {formatCurrency(totalExpenseAmount, language)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'মোট ভাউচার সংখ্যা:' : 'Total Vouchers:'}</span>
            <span className="font-semibold text-slate-700">{dateFilteredExpenses.length}</span>
          </div>
        </div>

        {/* Boiler & Gas Cost */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'বয়লার ও গ্যাস জ্বালানি' : 'Boiler & Gas Fuel Cost'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">
            {formatCurrency(boilerFuelCost, language)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'খরচের অনুপাত:' : 'Cost Share:'}</span>
            <span className="font-semibold text-amber-600">
              {totalExpenseAmount > 0 ? `${((boilerFuelCost / totalExpenseAmount) * 100).toFixed(1)}%` : '0%'}
            </span>
          </div>
        </div>

        {/* Electricity Utility */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'বিদ্যুৎ বিল ও ইউটিলিটি' : 'Electricity & Utilities'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-2">
            {formatCurrency(electricityCost, language)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'খরচের অনুপাত:' : 'Cost Share:'}</span>
            <span className="font-semibold text-blue-600">
              {totalExpenseAmount > 0 ? `${((electricityCost / totalExpenseAmount) * 100).toFixed(1)}%` : '0%'}
            </span>
          </div>
        </div>

        {/* Maintenance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'মেশিন মেরামত ও রক্ষণাবেক্ষণ' : 'Maintenance & Spares'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-700 mt-2">
            {formatCurrency(maintenanceCost, language)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'খরচের অনুপাত:' : 'Cost Share:'}</span>
            <span className="font-semibold text-purple-600">
              {totalExpenseAmount > 0 ? `${((maintenanceCost / totalExpenseAmount) * 100).toFixed(1)}%` : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Chart */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-1">
          {language === 'bn' ? 'ক্যাটাগরি অনুসারে মোট ব্যয়ের বণ্টন' : 'Operating Expense Distribution by Category'}
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          {language === 'bn' ? 'বিদ্যুৎ, গ্যাস, লেবার, কেমিক্যাল ও রক্ষণাবেক্ষণ খরচের তুলনা' : 'Share of factory expenses across operational cost heads'}
        </p>

        <div className="h-64 w-full flex items-center justify-center">
          {categoryChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`exp-cell-${index}`} fill={EXP_COLORS[index % EXP_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any) => [formatCurrency(Number(val), language), 'Amount']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0' }}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-slate-400 text-xs">
              {language === 'bn' ? 'কোনো খরচের ডেটা নেই' : 'No expense data found'}
            </div>
          )}
        </div>
      </div>

      {/* Expenses Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {language === 'bn' ? 'ফ্যাক্টরি খরচ ভাউচার রেজিস্টার' : 'Factory Expense Vouchers Audit Register'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'bn' ? `মোট ${tableExpenses.length} টি ভাউচার তালিকাভুক্ত` : `Showing ${tableExpenses.length} expense vouchers`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-expense-report"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'bn' ? 'ভাউচার, খাত বা নোট খুঁজুন...' : 'Search voucher #, notes...'}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <select
              id="filter-exp-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="all">{language === 'bn' ? 'সকল খাত' : 'All Categories'}</option>
              <option value="Electricity">Electricity</option>
              <option value="Gas">Gas</option>
              <option value="Fuel/Boiler">Fuel/Boiler</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Chemicals">Chemicals</option>
              <option value="Labor">Labor</option>
              <option value="Factory Rent">Factory Rent</option>
              <option value="Transport">Transport</option>
              <option value="Office">Office</option>
            </select>

            <select
              id="filter-exp-account"
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="all">{language === 'bn' ? 'সকল একাউন্ট' : 'All Accounts'}</option>
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
                <th className="py-3 px-4">{language === 'bn' ? 'ভাউচার #' : 'Voucher #'}</th>
                <th className="py-3 px-4">{language === 'bn' ? 'তারিখ' : 'Date'}</th>
                <th className="py-3 px-4">{language === 'bn' ? 'ব্যয়ের খাত' : 'Category'}</th>
                <th className="py-3 px-4">{language === 'bn' ? 'পরিশোধকারী' : 'Paid By'}</th>
                <th className="py-3 px-4">{language === 'bn' ? 'হিসাব অ্যাকাউন্ট' : 'Account'}</th>
                <th className="py-3 px-4">{language === 'bn' ? 'মন্তব্য / নোট' : 'Notes'}</th>
                <th className="py-3 px-4 text-right">{language === 'bn' ? 'পরিমাণ (BDT)' : 'Amount (BDT)'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableExpenses.length > 0 ? (
                tableExpenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{e.voucherNo}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{e.date}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[11px] font-medium border border-rose-100">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{e.paidBy}</td>
                    <td className="py-3 px-4 text-slate-600">{e.accountName}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{e.notes || '-'}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                      {formatCurrency(e.amount, language)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <span>{language === 'bn' ? 'কোনো খরচ ভাউচার পাওয়া যায়নি' : 'No expense vouchers found'}</span>
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
