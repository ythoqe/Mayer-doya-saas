import React, { useMemo, useState } from 'react';
import { 
  Users, 
  Search, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Building2 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { DateRange } from './types';

interface ClientReportProps {
  dateRange: DateRange;
}

const BAR_COLORS = ['#0d9488', '#0284c7', '#6366f1', '#8b5cf6', '#d946ef'];

export const ClientReport: React.FC<ClientReportProps> = ({ dateRange }) => {
  const { clients, orders, language, t } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'due' | 'cleared'>('all');

  // Client order counts map
  const clientOrdersCount = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => {
      map[o.clientId] = (map[o.clientId] || 0) + 1;
    });
    return map;
  }, [orders]);

  // Filtered clients list
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesBalance = true;
      if (balanceFilter === 'due') {
        matchesBalance = c.balance > 0;
      } else if (balanceFilter === 'cleared') {
        matchesBalance = c.balance === 0;
      }

      return matchesSearch && matchesBalance;
    });
  }, [clients, searchTerm, balanceFilter]);

  // Aggregate Metrics
  const totalBilledAll = useMemo(() => {
    return clients.reduce((sum, c) => sum + (c.totalBilled || 0), 0);
  }, [clients]);

  const totalPaidAll = useMemo(() => {
    return clients.reduce((sum, c) => sum + (c.totalPaid || 0), 0);
  }, [clients]);

  const totalReceivables = useMemo(() => {
    return clients.reduce((sum, c) => sum + (c.balance || 0), 0);
  }, [clients]);

  const collectionRatio = totalBilledAll > 0 ? (totalPaidAll / totalBilledAll) * 100 : 0;

  // Chart: Top Clients by Billing
  const topClientsChartData = useMemo(() => {
    return [...clients]
      .sort((a, b) => b.totalBilled - a.totalBilled)
      .slice(0, 5)
      .map(c => ({
        name: c.companyName.length > 16 ? c.companyName.slice(0, 14) + '..' : c.companyName,
        fullName: c.companyName,
        billed: c.totalBilled,
        paid: c.totalPaid,
        due: c.balance
      }));
  }, [clients]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clients */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'নিবন্ধিত ক্লায়েন্ট' : 'Total Clients / Mills'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {formatNumber(clients.length, language)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'সক্রিয় অ্যাকাউন্ট:' : 'Active Accounts:'}</span>
            <span className="font-semibold text-teal-600">
              {clients.filter(c => c.status === 'active').length}
            </span>
          </div>
        </div>

        {/* Total Billed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'মোট বিল্ড রেভিনিউ' : 'Total Billed Amount'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {formatCurrency(totalBilledAll, language)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'ক্লায়েন্ট প্রতি গড় বিল:' : 'Avg per Client:'}</span>
            <span className="font-semibold text-slate-700">
              {clients.length > 0 ? formatCurrency(Math.round(totalBilledAll / clients.length), language) : '৳ 0'}
            </span>
          </div>
        </div>

        {/* Total Paid / Collected */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'মোট সংগৃহীত পেমেন্ট' : 'Total Payments Received'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            {formatCurrency(totalPaidAll, language)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'আদায় অনুপাত:' : 'Recovery Rate:'}</span>
            <span className="font-semibold text-emerald-600">{collectionRatio.toFixed(1)}%</span>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'মোট বকেয়া পাওনা' : 'Total Receivables Due'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">
            {formatCurrency(totalReceivables, language)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'বকেয়া রয়েছে:' : 'Clients with Due:'}</span>
            <span className="font-semibold text-amber-700">
              {clients.filter(c => c.balance > 0).length} {language === 'bn' ? 'টি ক্লায়েন্ট' : 'Clients'}
            </span>
          </div>
        </div>
      </div>

      {/* Chart: Top Clients Billing */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-1">
          {t('topClientsBilled')}
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          {language === 'bn' ? 'শীর্ষ ক্লায়েন্টদের মোট বিলিং ও বকেয়া বিশ্লেষণ' : 'Top clients ranked by cumulative billing and outstanding balance'}
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topClientsChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `৳${v > 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
              <Tooltip 
                formatter={(val: any, name: any) => [formatCurrency(Number(val), language), name === 'billed' ? 'Total Billed' : 'Balance Due']}
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0' }}
              />
              <Bar dataKey="billed" name={language === 'bn' ? 'মোট বিল্ড' : 'Billed'} fill="#0d9488" radius={[4, 4, 0, 0]} />
              <Bar dataKey="due" name={language === 'bn' ? 'বকেয়া বাকি' : 'Due Balance'} fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Clients Receivables Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {language === 'bn' ? 'ক্লায়েন্ট খতিয়ান ও বকেয়া পাওনা রেজিস্টার' : 'Clients Ledger & Receivables Register'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'bn' ? `মোট ${filteredClients.length} টি ক্লায়েন্ট তালিকাভুক্ত` : `Showing ${filteredClients.length} clients`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-client-report"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'bn' ? 'কোম্পানি বা ক্লায়েন্ট খুঁজুন...' : 'Search company or name...'}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <select
              id="filter-client-balance"
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value as any)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="all">{language === 'bn' ? 'সকল ব্যালেন্স' : 'All Balances'}</option>
              <option value="due">{language === 'bn' ? 'বকেয়া রয়েছে (Due)' : 'Has Receivables Due'}</option>
              <option value="cleared">{language === 'bn' ? 'পরিশোধিত (Cleared)' : 'Zero / Cleared'}</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">{language === 'bn' ? 'কোম্পানি ও ফ্যাক্টরি' : 'Company & Mill'}</th>
                <th className="py-3 px-4">{language === 'bn' ? 'যোগাযোগ ব্যক্তি' : 'Contact Person'}</th>
                <th className="py-3 px-4 text-center">{language === 'bn' ? 'অর্ডার' : 'Orders'}</th>
                <th className="py-3 px-4 text-right">{language === 'bn' ? 'মোট বিল্ড' : 'Total Billed'}</th>
                <th className="py-3 px-4 text-right">{language === 'bn' ? 'পরিশোধিত' : 'Total Paid'}</th>
                <th className="py-3 px-4 text-right">{language === 'bn' ? 'বকেয়া পাওনা' : 'Balance Due'}</th>
                <th className="py-3 px-4 text-center">{language === 'bn' ? 'আদায় হার' : 'Recovery %'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length > 0 ? (
                filteredClients.map(c => {
                  const paidPct = c.totalBilled > 0 ? Math.min(100, (c.totalPaid / c.totalBilled) * 100) : 100;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{c.companyName}</div>
                        <div className="text-[11px] text-slate-500">{c.address}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{c.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {c.phone}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {clientOrdersCount[c.id] || 0}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(c.totalBilled, language)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                        {formatCurrency(c.totalPaid, language)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-700">
                        {c.balance > 0 ? (
                          formatCurrency(c.balance, language)
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
                              className={`h-full rounded-full ${paidPct >= 90 ? 'bg-emerald-500' : paidPct >= 50 ? 'bg-teal-500' : 'bg-amber-500'}`}
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
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <span>{language === 'bn' ? 'কোনো ক্লায়েন্ট পাওয়া যায়নি' : 'No clients found'}</span>
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
