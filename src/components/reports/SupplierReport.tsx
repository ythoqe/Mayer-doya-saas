import React, { useMemo, useState } from 'react';
import { 
  Truck, 
  Search, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Boxes 
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
  PieChart, 
  Pie, 
  Legend 
} from 'recharts';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { DateRange } from './types';

interface SupplierReportProps {
  dateRange: DateRange;
}

const CATEGORY_COLORS = ['#0d9488', '#0284c7', '#6366f1', '#8b5cf6', '#d946ef', '#f59e0b'];

export const SupplierReport: React.FC<SupplierReportProps> = ({ dateRange }) => {
  const { suppliers, language, t } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'due' | 'cleared'>('all');

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return suppliers.filter(s => {
      const companyName = s.company || s.companyName || '';
      const matchesSearch = 
        (s.name || '').toLowerCase().includes(term) ||
        companyName.toLowerCase().includes(term) ||
        (s.phone || '').toLowerCase().includes(term) ||
        (s.category || '').toLowerCase().includes(term);
      
      const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;

      let matchesBalance = true;
      if (balanceFilter === 'due') {
        matchesBalance = (s.balance || 0) > 0;
      } else if (balanceFilter === 'cleared') {
        matchesBalance = (s.balance || 0) <= 0;
      }

      return matchesSearch && matchesCategory && matchesBalance;
    });
  }, [suppliers, searchTerm, categoryFilter, balanceFilter]);

  // Aggregate Metrics
  const totalPurchasesAll = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (s.totalPurchases || 0), 0);
  }, [suppliers]);

  const totalPaidAll = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
  }, [suppliers]);

  const totalPayables = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (s.balance || 0), 0);
  }, [suppliers]);

  const settleRatio = totalPurchasesAll > 0 ? Math.min(100, Math.round(((totalPaidAll / totalPurchasesAll) * 100) * 10) / 10) : 0;

  // Chart: Category Wise Purchases Breakdown
  const categoryChartData = useMemo(() => {
    const map: Record<string, number> = {};
    suppliers.forEach(s => {
      map[s.category] = (map[s.category] || 0) + (s.totalPurchases || 0);
    });

    return Object.entries(map).map(([cat, amount]) => ({
      name: cat,
      value: amount
    }));
  }, [suppliers]);

  // Chart: Top Vendors by Purchases
  const topVendorsData = useMemo(() => {
    return [...suppliers]
      .sort((a, b) => b.totalPurchases - a.totalPurchases)
      .slice(0, 5)
      .map(s => {
        const cName = s.company || s.companyName || s.name;
        return {
          name: cName.length > 15 ? cName.slice(0, 14) + '..' : cName,
          fullName: cName,
          purchases: s.totalPurchases,
          due: s.balance
        };
      });
  }, [suppliers]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Suppliers */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'মোট সরবরাহকারী / মহাজন' : 'Total Suppliers & Vendors'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {formatNumber(suppliers.length, language)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'সক্রিয় অ্যাকাউন্ট:' : 'Active Vendors:'}</span>
            <span className="font-semibold text-teal-600">
              {suppliers.filter(s => s.status === 'active').length}
            </span>
          </div>
        </div>

        {/* Total Purchases */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'মোট কেনাকাটা / ক্রয়' : 'Total Purchases'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {formatCurrency(totalPurchasesAll, language)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'গড় কেনাকাটা:' : 'Avg per Vendor:'}</span>
            <span className="font-semibold text-slate-700">
              {suppliers.length > 0 ? formatCurrency(Math.round(totalPurchasesAll / suppliers.length), language) : '৳ 0'}
            </span>
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'মহাজনকে মোট পরিশোধ' : 'Total Payments Settled'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            {formatCurrency(totalPaidAll, language)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'পরিশোধ অনুপাত:' : 'Settlement Rate:'}</span>
            <span className="font-semibold text-emerald-600">{settleRatio.toFixed(1)}%</span>
          </div>
        </div>

        {/* Outstanding Payables */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'মহাজনের মোট দেনা' : 'Vendor Payables Due'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-700 mt-2">
            {formatCurrency(totalPayables, language)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'বকেয়া রয়েছে:' : 'Vendors with Due:'}</span>
            <span className="font-semibold text-purple-700">
              {suppliers.filter(s => s.balance > 0).length} {language === 'bn' ? 'টি মহাজন' : 'Vendors'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Purchases by Category */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            {t('supplierPurchasesCategory')}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            {language === 'bn' ? 'কেমিক্যাল, ডাইস ও মেশিনারিজ সরবরাহ বণ্টন' : 'Purchases breakdown by raw material categories'}
          </p>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cat-cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any) => [formatCurrency(Number(val), language), 'Purchases']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0' }}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Top Vendors by Purchase Volume */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            {language === 'bn' ? 'শীর্ষ সরবরাহকারী ক্রয় ও দেনা' : 'Top Vendors by Purchases & Payables'}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            {language === 'bn' ? 'সর্বোচ্চ ক্রয়ের মহাজনদের মোট ক্রয় ও প্রদেয় বকেয়া' : 'Largest vendor accounts by purchase value and remaining liability'}
          </p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topVendorsData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `৳${v > 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <Tooltip 
                  formatter={(val: any, name: any) => [formatCurrency(Number(val), language), name === 'purchases' ? 'Total Purchases' : 'Payables Due']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0' }}
                />
                <Bar dataKey="purchases" name={language === 'bn' ? 'মোট ক্রয়' : 'Purchases'} fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="due" name={language === 'bn' ? 'প্রদেয় দেনা' : 'Payable Due'} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Supplier Payables Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {language === 'bn' ? 'মহাজন খতিয়ান ও প্রদেয় দেনা রেজিস্টার' : 'Suppliers Ledger & Payables Register'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'bn' ? `মোট ${filteredSuppliers.length} টি মহাজন তালিকাভুক্ত` : `Showing ${filteredSuppliers.length} suppliers`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-supplier-report"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'bn' ? 'মহাজন বা কোম্পানি খুঁজুন...' : 'Search company or vendor...'}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <select
              id="filter-supplier-cat"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="all">{language === 'bn' ? 'সকল ক্যাটাগরি' : 'All Categories'}</option>
              <option value="Chemicals">Chemicals</option>
              <option value="Dyes">Dyes</option>
              <option value="Machinery">Machinery</option>
              <option value="Packaging">Packaging</option>
              <option value="General">General</option>
            </select>

            <select
              id="filter-supplier-balance"
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value as any)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="all">{language === 'bn' ? 'সকল ব্যালেন্স' : 'All Balances'}</option>
              <option value="due">{language === 'bn' ? 'দেনা রয়েছে (Payable)' : 'Has Payable Due'}</option>
              <option value="cleared">{language === 'bn' ? 'পরিশোধিত (Cleared)' : 'Zero / Cleared'}</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">{language === 'bn' ? 'সরবরাহকারী ও প্রতিষ্ঠান' : 'Vendor & Company'}</th>
                <th className="py-3 px-4">{language === 'bn' ? 'ক্যাটাগরি' : 'Category'}</th>
                <th className="py-3 px-4">{language === 'bn' ? 'যোগাযোগ' : 'Contact'}</th>
                <th className="py-3 px-4 text-right">{language === 'bn' ? 'মোট ক্রয়' : 'Total Purchases'}</th>
                <th className="py-3 px-4 text-right">{language === 'bn' ? 'পরিশোধিত' : 'Total Paid'}</th>
                <th className="py-3 px-4 text-right">{language === 'bn' ? 'প্রদেয় দেনা' : 'Payable Balance'}</th>
                <th className="py-3 px-4 text-center">{language === 'bn' ? 'পরিশোধ হার' : 'Settlement %'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map(s => {
                  const cName = s.company || s.companyName || s.name;
                  const paidPct = s.totalPurchases > 0 ? Math.min(100, (s.totalPaid / s.totalPurchases) * 100) : 100;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{cName}</div>
                        <div className="text-[11px] text-slate-500">{s.name !== cName ? s.name : s.address}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {s.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[11px] text-slate-600 flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" /> {s.phone}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(s.totalPurchases, language)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                        {formatCurrency(s.totalPaid, language)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-purple-700">
                        {s.balance > 0 ? (
                          formatCurrency(s.balance, language)
                        ) : (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-semibold">Cleared</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-24 mx-auto">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1 font-semibold">
                            <span>{paidPct.toFixed(0)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${paidPct >= 90 ? 'bg-emerald-500' : paidPct >= 50 ? 'bg-teal-500' : 'bg-purple-500'}`}
                              style={{ width: `${paidPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <Truck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <span>{language === 'bn' ? 'কোনো সরবরাহকারী পাওয়া যায়নি' : 'No suppliers found'}</span>
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
