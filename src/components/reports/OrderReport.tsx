import React, { useMemo, useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { DateRange } from './types';
import { isDateInRange } from './dateUtils';

interface OrderReportProps {
  dateRange: DateRange;
}

const COLORS = ['#0d9488', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981'];

export const OrderReport: React.FC<OrderReportProps> = ({ dateRange }) => {
  const { orders, language, t } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');

  // Date filtered orders
  const dateFilteredOrders = useMemo(() => {
    return orders.filter(o => isDateInRange(o.receivedDate || o.createdAt, dateRange));
  }, [orders, dateRange]);

  // Clients list for dropdown
  const clientNames = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(o => set.add(o.clientName));
    return Array.from(set);
  }, [orders]);

  // Table filtered orders
  const tableOrders = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return dateFilteredOrders.filter(o => {
      const matchesSearch = 
        (o.orderNumber || '').toLowerCase().includes(term) ||
        (o.clientName || '').toLowerCase().includes(term) ||
        (o.styleNo || '').toLowerCase().includes(term) ||
        (o.garmentType || '').toLowerCase().includes(term);
      
      const matchesClient = selectedClient === 'all' || o.clientName === selectedClient;

      let matchesPayment = true;
      if (paymentStatusFilter === 'cleared') {
        matchesPayment = (o.dueAmount || 0) <= 0;
      } else if (paymentStatusFilter === 'due') {
        matchesPayment = (o.dueAmount || 0) > 0;
      }

      return matchesSearch && matchesClient && matchesPayment;
    });
  }, [dateFilteredOrders, searchTerm, selectedClient, paymentStatusFilter]);

  // Aggregate Metrics
  const totalBilled = useMemo(() => {
    return dateFilteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [dateFilteredOrders]);

  const totalAdvance = useMemo(() => {
    return dateFilteredOrders.reduce((sum, o) => sum + (o.advanceAmount || 0), 0);
  }, [dateFilteredOrders]);

  const totalDues = useMemo(() => {
    return dateFilteredOrders.reduce((sum, o) => sum + (o.dueAmount || 0), 0);
  }, [dateFilteredOrders]);

  const totalPieces = useMemo(() => {
    return dateFilteredOrders.reduce((sum, o) => sum + (o.quantityPcs || 0), 0);
  }, [dateFilteredOrders]);

  // Client Wise Order Value Chart
  const clientValueChartData = useMemo(() => {
    const map: Record<string, { billed: number; advance: number; due: number }> = {};
    dateFilteredOrders.forEach(o => {
      if (!map[o.clientName]) {
        map[o.clientName] = { billed: 0, advance: 0, due: 0 };
      }
      map[o.clientName].billed += o.totalAmount || 0;
      map[o.clientName].advance += o.advanceAmount || 0;
      map[o.clientName].due += o.dueAmount || 0;
    });

    return Object.entries(map).map(([client, data]) => ({
      name: client.length > 15 ? client.slice(0, 14) + '..' : client,
      fullName: client,
      billed: data.billed,
      advance: data.advance,
      due: data.due
    })).sort((a, b) => b.billed - a.billed);
  }, [dateFilteredOrders]);

  return (
    <div className="space-y-6">
      {/* Order KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders & Volume */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'মোট বুকিং অর্ডার' : 'Total Booked Orders'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {formatNumber(dateFilteredOrders.length, language)} <span className="text-xs font-normal text-slate-500">{language === 'bn' ? 'টি জব' : 'Orders'}</span>
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'মোট পরিমাণ:' : 'Total Volume:'}</span>
            <span className="font-semibold text-slate-700">{formatNumber(totalPieces, language)} Pcs</span>
          </div>
        </div>

        {/* Total Billed Value */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'মোট অর্ডার বিলিং' : 'Total Order Billing'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {formatCurrency(totalBilled, language)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'গড় অর্ডার মূল্য:' : 'Avg Order Value:'}</span>
            <span className="font-semibold text-slate-700">
              {dateFilteredOrders.length > 0 ? formatCurrency(Math.round(totalBilled / dateFilteredOrders.length), language) : '৳ 0'}
            </span>
          </div>
        </div>

        {/* Advance Received */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'অগ্রিম গ্রহণ' : 'Advance Collected'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            {formatCurrency(totalAdvance, language)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'আদায় অনুপাত:' : 'Collection Ratio:'}</span>
            <span className="font-semibold text-emerald-600">
              {totalBilled > 0 ? `${((totalAdvance / totalBilled) * 100).toFixed(1)}%` : '0%'}
            </span>
          </div>
        </div>

        {/* Total Dues */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'বকেয়া বিল' : 'Order Balance Due'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">
            {formatCurrency(totalDues, language)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'বকেয়া অর্ডার:' : 'Dues Pending:'}</span>
            <span className="font-semibold text-amber-600">
              {dateFilteredOrders.filter(o => o.dueAmount > 0).length} {language === 'bn' ? 'টি' : 'Jobs'}
            </span>
          </div>
        </div>
      </div>

      {/* Chart: Client wise Order Values */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-1">
          {language === 'bn' ? 'ক্লায়েন্ট অনুসারে অর্ডার বিলিং ও আদায়' : 'Order Billing & Dues by Client / Mill'}
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          {language === 'bn' ? 'প্রতিটি ক্লায়েন্টের মোট বিলিং বনাম আদায়কৃত অগ্রিম ও বকেয়া' : 'Billed value vs collected advance and balance due per client'}
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={clientValueChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `৳${v > 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
              <Tooltip 
                formatter={(val: any, name: any) => [formatCurrency(Number(val), language), name === 'billed' ? 'Total Billed' : name === 'advance' ? 'Advance' : 'Due']}
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="billed" name={language === 'bn' ? 'মোট বিলিং' : 'Total Billed'} fill="#0d9488" radius={[4, 4, 0, 0]} />
              <Bar dataKey="advance" name={language === 'bn' ? 'অগ্রিম আদায়' : 'Advance Paid'} fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="due" name={language === 'bn' ? 'বকেয়া' : 'Balance Due'} fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders Commercial Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Header & Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {language === 'bn' ? 'অর্ডার ও বাণিজ্যিক রেজিস্টার' : 'Orders Commercial Billing Register'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'bn' ? `মোট ${tableOrders.length} টি অর্ডার তালিকাভুক্ত` : `Showing ${tableOrders.length} orders`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-orders-report"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'bn' ? 'অর্ডার, ক্লায়েন্ট, স্টাইল খুঁজুন...' : 'Search order, client, style...'}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <select
              id="filter-order-client"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="all">{language === 'bn' ? 'সকল ক্লায়েন্ট' : 'All Clients'}</option>
              {clientNames.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              id="filter-order-payment"
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="all">{language === 'bn' ? 'সকল পেমেন্ট স্ট্যাটাস' : 'All Payment Status'}</option>
              <option value="due">{language === 'bn' ? 'বকেয়া বাকি' : 'Has Balance Due'}</option>
              <option value="cleared">{language === 'bn' ? 'পরিশোধিত (Cleared)' : 'Fully Paid'}</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">{language === 'bn' ? 'অর্ডার #' : 'Order #'}</th>
                <th className="py-3 px-4">{language === 'bn' ? 'ক্লায়েন্ট' : 'Client'}</th>
                <th className="py-3 px-4">{language === 'bn' ? 'গার্মেন্টস / স্টাইল' : 'Garment & Style'}</th>
                <th className="py-3 px-4 text-right">{language === 'bn' ? 'পরিমাণ' : 'Qty (Pcs)'}</th>
                <th className="py-3 px-4 text-right">{language === 'bn' ? 'দর (৳)' : 'Rate (৳)'}</th>
                <th className="py-3 px-4 text-right">{language === 'bn' ? 'মোট বিল (৳)' : 'Total Billed'}</th>
                <th className="py-3 px-4 text-right">{language === 'bn' ? 'অগ্রিম (৳)' : 'Advance'}</th>
                <th className="py-3 px-4 text-right">{language === 'bn' ? 'বকেয়া (৳)' : 'Due Balance'}</th>
                <th className="py-3 px-4">{language === 'bn' ? 'ডেলিভারি' : 'Delivery Due'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableOrders.length > 0 ? (
                tableOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{order.orderNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{order.clientName}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <div><strong className="text-slate-800">{order.styleNo}</strong></div>
                      <span className="text-[11px] text-slate-500">{order.garmentType}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatNumber(order.quantityPcs, language)}</td>
                    <td className="py-3 px-4 text-right text-slate-700">৳{order.unitRate}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatCurrency(order.totalAmount, language)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-600">{formatCurrency(order.advanceAmount, language)}</td>
                    <td className="py-3 px-4 text-right font-bold text-amber-700">
                      {order.dueAmount > 0 ? (
                        formatCurrency(order.dueAmount, language)
                      ) : (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-semibold">Cleared</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{order.deliveryDate}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <span>{language === 'bn' ? 'কোনো অর্ডার রেকর্ড পাওয়া যায়নি' : 'No order records found'}</span>
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
