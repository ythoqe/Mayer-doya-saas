import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Boxes, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Users
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  CartesianGrid 
} from 'recharts';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { DateRange } from './types';
import { isDateInRange } from './dateUtils';

interface OverviewReportProps {
  dateRange: DateRange;
}

const COLORS = ['#0d9488', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981', '#64748b'];

export const OverviewReport: React.FC<OverviewReportProps> = ({ dateRange }) => {
  const { orders, expenses, clients, suppliers, inventory, accounts, transactions, language, t } = useERP();

  // Filtered dataset
  const filteredOrders = useMemo(() => {
    return orders.filter(o => isDateInRange(o.receivedDate || o.createdAt, dateRange));
  }, [orders, dateRange]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => isDateInRange(e.date || e.createdAt, dateRange));
  }, [expenses, dateRange]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tr => isDateInRange(tr.date || tr.createdAt, dateRange));
  }, [transactions, dateRange]);

  // Aggregate Metrics
  const totalOrderBilling = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [filteredOrders]);

  const totalAdvanceReceived = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.advanceAmount || 0), 0);
  }, [filteredOrders]);

  const totalOrderDues = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.dueAmount || 0), 0);
  }, [filteredOrders]);

  const totalGarmentsPcs = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.quantityPcs || 0), 0);
  }, [filteredOrders]);

  const totalOperatingExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [filteredExpenses]);

  const totalClientReceivables = useMemo(() => {
    return clients.reduce((sum, c) => sum + (c.balance || 0), 0);
  }, [clients]);

  const totalSupplierPayables = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (s.balance || 0), 0);
  }, [suppliers]);

  const totalChemicalValuation = useMemo(() => {
    return inventory.reduce((sum, item) => sum + (item.currentStockKg * item.unitPrice), 0);
  }, [inventory]);

  const lowStockCount = useMemo(() => {
    return inventory.filter(item => item.currentStockKg <= item.minAlertLevel).length;
  }, [inventory]);

  const activeBatchesCount = useMemo(() => {
    return orders.filter(o => ['washing', 'dyeing', 'hydro', 'drying', 'finishing'].includes(o.status)).length;
  }, [orders]);

  const completedOrdersCount = useMemo(() => {
    return filteredOrders.filter(o => ['qc_passed', 'ready_for_delivery', 'delivered'].includes(o.status)).length;
  }, [filteredOrders]);

  const netEstimatedProfit = totalOrderBilling - totalOperatingExpenses;

  // Chart 1: Daily/Category Cash Flow & Financial Comparison
  const financialBarData = useMemo(() => {
    // Group expenses by category
    const expenseByCategory: Record<string, number> = {};
    filteredExpenses.forEach(exp => {
      expenseByCategory[exp.category] = (expenseByCategory[exp.category] || 0) + exp.amount;
    });

    return [
      { name: language === 'bn' ? 'অর্ডার বুকিং' : 'Order Billed', amount: totalOrderBilling, fill: '#0d9488' },
      { name: language === 'bn' ? 'অগ্রিম গ্রহণ' : 'Advance Recv', amount: totalAdvanceReceived, fill: '#14b8a6' },
      { name: language === 'bn' ? 'ফ্যাক্টরি খরচ' : 'Factory Expenses', amount: totalOperatingExpenses, fill: '#f43f5e' },
      { name: language === 'bn' ? 'ক্লায়েন্ট বাকি' : 'Client Receivables', amount: totalClientReceivables, fill: '#f59e0b' },
      { name: language === 'bn' ? 'মহাজন দেনা' : 'Vendor Payables', amount: totalSupplierPayables, fill: '#6366f1' },
    ];
  }, [filteredExpenses, totalOrderBilling, totalAdvanceReceived, totalOperatingExpenses, totalClientReceivables, totalSupplierPayables, language]);

  // Chart 2: Order Status Distribution
  const orderStatusPieData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredOrders.forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });

    return Object.entries(counts).map(([status, count]) => {
      let label = status.replace(/_/g, ' ');
      if (status === 'washing') label = language === 'bn' ? 'ওয়াশিং' : 'Washing';
      else if (status === 'dyeing') label = language === 'bn' ? 'ডাইং' : 'Dyeing';
      else if (status === 'qc_passed') label = language === 'bn' ? 'কিউসি পাস' : 'QC Passed';
      else if (status === 'ready_for_delivery') label = language === 'bn' ? 'ডেলিভারির জন্য প্রস্তুত' : 'Ready Delivery';
      else if (status === 'delivered') label = language === 'bn' ? 'ডেলিভার্ড' : 'Delivered';
      else if (status === 'hydro') label = language === 'bn' ? 'হাইড্রো' : 'Hydro';
      else if (status === 'drying') label = language === 'bn' ? 'ড্রাইং' : 'Drying';
      else if (status === 'finishing') label = language === 'bn' ? 'ফিনিশিং' : 'Finishing';

      return { name: label, value: count };
    });
  }, [filteredOrders, language]);

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billed Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-teal-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'bn' ? 'অর্ডার মোট বিলিং' : 'Total Order Billing'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {formatCurrency(totalOrderBilling, language)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'অগ্রিম আদায়:' : 'Advance Paid:'}</span>
            <span className="font-semibold text-teal-600">{formatCurrency(totalAdvanceReceived, language)}</span>
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'bn' ? 'পরিচালন ব্যয়' : 'Operating Expenses'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {formatCurrency(totalOperatingExpenses, language)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'মোট ভাউচার:' : 'Total Vouchers:'}</span>
            <span className="font-semibold text-slate-700">{formatNumber(filteredExpenses.length, language)}</span>
          </div>
        </div>

        {/* Net Margin */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'bn' ? 'আনুমানিক মার্জিন' : 'Estimated Margin'}
            </span>
            <div className={`w-8 h-8 rounded-xl ${netEstimatedProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} flex items-center justify-center`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-bold mt-2 ${netEstimatedProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatCurrency(netEstimatedProfit, language)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'মার্জিন রেশিও:' : 'Gross Ratio:'}</span>
            <span className="font-semibold text-slate-700">
              {totalOrderBilling > 0 ? `${((netEstimatedProfit / totalOrderBilling) * 100).toFixed(1)}%` : '0%'}
            </span>
          </div>
        </div>

        {/* Total Garments Pcs */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'bn' ? 'প্রক্রিয়াধীন মোট পোশাক' : 'Total Garments Output'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {formatNumber(totalGarmentsPcs, language)} <span className="text-sm font-normal text-slate-500">{language === 'bn' ? 'পিস' : 'Pcs'}</span>
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'সচল ব্যাচ:' : 'Active Batches:'}</span>
            <span className="font-semibold text-blue-600">{formatNumber(activeBatchesCount, language)}</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receivables */}
        <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-800">
              {language === 'bn' ? 'ক্লায়েন্টের মোট বাকি' : 'Total Client Receivables'}
            </span>
            <p className="text-lg font-bold text-amber-900 mt-0.5">
              {formatCurrency(totalClientReceivables, language)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
        </div>

        {/* Payables */}
        <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-200/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-purple-800">
              {language === 'bn' ? 'মহাজনের মোট দেনা' : 'Vendor Payables Due'}
            </span>
            <p className="text-lg font-bold text-purple-900 mt-0.5">
              {formatCurrency(totalSupplierPayables, language)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Chemical Inventory Valuation */}
        <div className="bg-teal-50/50 rounded-2xl p-4 border border-teal-200/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-teal-800">
              {language === 'bn' ? 'কেমিক্যাল স্টক মূল্যায়ন' : 'Chemical Stock Valuation'}
            </span>
            <p className="text-lg font-bold text-teal-900 mt-0.5">
              {formatCurrency(totalChemicalValuation, language)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
            <Boxes className="w-4 h-4" />
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-200/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-800">
              {language === 'bn' ? 'স্টক অ্যালার্ট আইটেম' : 'Low Stock Warning'}
            </span>
            <p className="text-lg font-bold text-rose-900 mt-0.5">
              {formatNumber(lowStockCount, language)} {language === 'bn' ? 'টি আইটেম' : 'Items'}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Financial Flow Bar Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {t('revenueVsExpense')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'bn' ? 'বিলিং, খরচ ও দেনা-পাওনার সামগ্রিক চিত্র' : 'Comparative overview of billed revenue, expenses and balances'}
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialBarData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `৳${val > 1000 ? `${(val/1000).toFixed(0)}k` : val}`} />
                <Tooltip 
                  formatter={(val: any) => [formatCurrency(Number(val), language), '']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {financialBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Order Status Distribution (1 Col) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800">
              {t('orderStatusDistribution')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'bn' ? 'ফ্লোর ও ডেলিভারি স্ট্যাটাস' : 'Floor stage & completion status'}
            </p>
          </div>

          {orderStatusPieData.length > 0 ? (
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {orderStatusPieData.map((entry, index) => (
                      <Cell key={`status-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any, name: any) => [`${val} ${language === 'bn' ? 'টি জব' : 'Orders'}`, name]}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0' }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <Boxes className="w-8 h-8 mb-2 opacity-40" />
              <span>{language === 'bn' ? 'কোনো অর্ডার ডেটা নেই' : 'No order data available'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Operational Highlights Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                {t('operationalSummary')}
              </h4>
              <p className="text-xs text-slate-400">
                {language === 'bn' ? 'উৎপাদন ও বিলিং পারফরম্যান্স ইনসাইটস' : 'Factory throughput & production analytics summary'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              {language === 'bn' ? 'লাইভ ফ্লোর সিঙ্ক' : 'Live Floor Sync'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/40">
            <span className="text-xs text-slate-400 block">
              {language === 'bn' ? 'মোট বুকিং সংখ্যা' : 'Total Booked Jobs'}
            </span>
            <span className="text-xl font-bold text-teal-400 mt-1 block">
              {formatNumber(filteredOrders.length, language)}
            </span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/40">
            <span className="text-xs text-slate-400 block">
              {language === 'bn' ? 'সম্পন্ন / কিউসি পাস' : 'Completed / QC Pass'}
            </span>
            <span className="text-xl font-bold text-emerald-400 mt-1 block">
              {formatNumber(completedOrdersCount, language)}
            </span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/40">
            <span className="text-xs text-slate-400 block">
              {language === 'bn' ? 'গড় অর্ডার মূল্য' : 'Avg Order Value'}
            </span>
            <span className="text-xl font-bold text-white mt-1 block">
              {filteredOrders.length > 0 ? formatCurrency(Math.round(totalOrderBilling / filteredOrders.length), language) : '৳ 0'}
            </span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/40">
            <span className="text-xs text-slate-400 block">
              {language === 'bn' ? 'সক্রিয় ক্লায়েন্ট' : 'Active Mills / Clients'}
            </span>
            <span className="text-xl font-bold text-indigo-400 mt-1 block">
              {formatNumber(clients.filter(c => c.status === 'active').length, language)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
