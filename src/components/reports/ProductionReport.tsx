import React, { useMemo, useState } from 'react';
import { 
  Factory, 
  Search, 
  Filter, 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Cpu, 
  Sparkles,
  ArrowUpDown
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
import { formatNumber, formatCurrency } from '../../utils/translation';
import { DateRange } from './types';
import { isDateInRange } from './dateUtils';
import { OrderStatus } from '../../types';

interface ProductionReportProps {
  dateRange: DateRange;
}

const WASH_COLORS = ['#0d9488', '#0284c7', '#6366f1', '#8b5cf6', '#d946ef', '#f59e0b'];

export const ProductionReport: React.FC<ProductionReportProps> = ({ dateRange }) => {
  const { orders, language, t } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Filtered orders by date
  const dateFilteredOrders = useMemo(() => {
    return orders.filter(o => isDateInRange(o.receivedDate || o.createdAt, dateRange));
  }, [orders, dateRange]);

  // Full table filtered orders
  const tableOrders = useMemo(() => {
    return dateFilteredOrders.filter(o => {
      const matchesSearch = 
        o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.styleNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.washType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.machineNo && o.machineNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (o.batchNumber && o.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStage = selectedStage === 'all' || o.status === selectedStage;
      const matchesPriority = selectedPriority === 'all' || o.priority === selectedPriority;

      return matchesSearch && matchesStage && matchesPriority;
    });
  }, [dateFilteredOrders, searchTerm, selectedStage, selectedPriority]);

  // KPIs
  const totalVolumePcs = useMemo(() => {
    return dateFilteredOrders.reduce((sum, o) => sum + (o.quantityPcs || 0), 0);
  }, [dateFilteredOrders]);

  const inFloorPcs = useMemo(() => {
    return dateFilteredOrders
      .filter(o => ['lot_received', 'batch_assigned', 'washing', 'dyeing', 'hydro', 'drying', 'finishing'].includes(o.status))
      .reduce((sum, o) => sum + (o.quantityPcs || 0), 0);
  }, [dateFilteredOrders]);

  const qcPassedPcs = useMemo(() => {
    return dateFilteredOrders
      .filter(o => ['qc_passed', 'ready_for_delivery'].includes(o.status))
      .reduce((sum, o) => sum + (o.quantityPcs || 0), 0);
  }, [dateFilteredOrders]);

  const deliveredPcs = useMemo(() => {
    return dateFilteredOrders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + (o.quantityPcs || 0), 0);
  }, [dateFilteredOrders]);

  const activeMachines = useMemo(() => {
    const machines = new Set<string>();
    dateFilteredOrders.forEach(o => {
      if (o.machineNo && ['washing', 'dyeing', 'hydro', 'drying', 'finishing'].includes(o.status)) {
        machines.add(o.machineNo);
      }
    });
    return machines.size;
  }, [dateFilteredOrders]);

  // Wash Type Output Chart
  const washTypeChartData = useMemo(() => {
    const map: Record<string, number> = {};
    dateFilteredOrders.forEach(o => {
      const type = o.washType || 'Standard Wash';
      map[type] = (map[type] || 0) + (o.quantityPcs || 0);
    });

    return Object.entries(map)
      .map(([name, pcs]) => ({ name: name.length > 20 ? name.slice(0, 18) + '..' : name, fullName: name, pcs }))
      .sort((a, b) => b.pcs - a.pcs)
      .slice(0, 6);
  }, [dateFilteredOrders]);

  // Stage Breakdown Chart
  const stageVolumeData = useMemo(() => {
    const stageMap: Record<string, number> = {
      washing: 0,
      dyeing: 0,
      hydro: 0,
      drying: 0,
      finishing: 0,
      qc_passed: 0,
      ready_for_delivery: 0,
      delivered: 0,
    };

    dateFilteredOrders.forEach(o => {
      if (stageMap[o.status] !== undefined) {
        stageMap[o.status] += o.quantityPcs || 0;
      }
    });

    const labels: Record<string, string> = {
      washing: language === 'bn' ? 'ওয়াশিং' : 'Washing',
      dyeing: language === 'bn' ? 'ডাইং' : 'Dyeing',
      hydro: language === 'bn' ? 'হাইড্রো' : 'Hydro',
      drying: language === 'bn' ? 'ড্রাইং' : 'Drying',
      finishing: language === 'bn' ? 'ফিনিশিং' : 'Finishing',
      qc_passed: language === 'bn' ? 'কিউসি পাস' : 'QC Pass',
      ready_for_delivery: language === 'bn' ? 'ডেলিভারি প্রস্তুত' : 'Ready',
      delivered: language === 'bn' ? 'ডেলিভার্ড' : 'Delivered',
    };

    return Object.entries(stageMap).map(([stage, pcs]) => ({
      stage: labels[stage] || stage,
      pcs,
    }));
  }, [dateFilteredOrders, language]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'washing':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">{language === 'bn' ? 'ওয়াশিং' : 'Washing'}</span>;
      case 'dyeing':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">{language === 'bn' ? 'ডাইং' : 'Dyeing'}</span>;
      case 'hydro':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-200">{language === 'bn' ? 'হাইড্রো' : 'Hydro'}</span>;
      case 'drying':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">{language === 'bn' ? 'ড্রাইং' : 'Drying'}</span>;
      case 'finishing':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-pink-50 text-pink-700 border border-pink-200">{language === 'bn' ? 'ফিনিশিং' : 'Finishing'}</span>;
      case 'qc_passed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">{language === 'bn' ? 'কিউসি পাস' : 'QC Passed'}</span>;
      case 'ready_for_delivery':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">{language === 'bn' ? 'প্রস্তুত' : 'Ready'}</span>;
      case 'delivered':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">{language === 'bn' ? 'ডেলিভার্ড' : 'Delivered'}</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Production KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Booked */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">{language === 'bn' ? 'মোট বুকিং' : 'Total Booked'}</span>
            <Layers className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-xl font-bold text-slate-800 mt-2">
            {formatNumber(totalVolumePcs, language)} <span className="text-xs font-normal text-slate-500">{language === 'bn' ? 'পিস' : 'Pcs'}</span>
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            {dateFilteredOrders.length} {language === 'bn' ? 'টি জব কার্ড' : 'Jobs'}
          </span>
        </div>

        {/* In Processing */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">{language === 'bn' ? 'চলমান প্রসেসিং' : 'In Floor Washing'}</span>
            <Factory className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-blue-700 mt-2">
            {formatNumber(inFloorPcs, language)} <span className="text-xs font-normal text-slate-500">{language === 'bn' ? 'পিস' : 'Pcs'}</span>
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            {language === 'bn' ? 'মেশিনে লোডকৃত' : 'Active on floor'}
          </span>
        </div>

        {/* QC Passed */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">{language === 'bn' ? 'কিউসি পাস ও রেডি' : 'QC & Ready'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-emerald-700 mt-2">
            {formatNumber(qcPassedPcs, language)} <span className="text-xs font-normal text-slate-500">{language === 'bn' ? 'পিস' : 'Pcs'}</span>
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            {language === 'bn' ? 'ডেলিভারির অপেক্ষায়' : 'Awaiting delivery'}
          </span>
        </div>

        {/* Delivered */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">{language === 'bn' ? 'ডেলিভার্ড সম্পন্ন' : 'Delivered'}</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl font-bold text-purple-700 mt-2">
            {formatNumber(deliveredPcs, language)} <span className="text-xs font-normal text-slate-500">{language === 'bn' ? 'পিস' : 'Pcs'}</span>
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            {language === 'bn' ? 'চালান ডেলিভারি শেষ' : 'Completed lots'}
          </span>
        </div>

        {/* Active Machines */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">{language === 'bn' ? 'সচল মেশিন' : 'Active Machines'}</span>
            <Cpu className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-bold text-amber-700 mt-2">
            {formatNumber(activeMachines, language)} <span className="text-xs font-normal text-slate-500">{language === 'bn' ? 'টি' : 'Units'}</span>
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            {language === 'bn' ? 'ওয়াশ ও ডাইং মেশিন' : 'In active rotation'}
          </span>
        </div>
      </div>

      {/* Production Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Volume by Wash Recipe */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            {language === 'bn' ? 'ওয়াশ ও প্রসেস রেসিপি অনুসারে আউটপুট' : 'Garment Volume by Wash Type / Recipe'}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            {language === 'bn' ? 'শীর্ষ ওয়াশ টাইপ অনুযায়ী পোশাকের সংখ্যা (পিস)' : 'Top wash categories by total pieces processed'}
          </p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={washTypeChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#334155' }} width={100} />
                <Tooltip 
                  formatter={(val: any, name: any, item: any) => [`${formatNumber(Number(val), language)} Pcs`, item.payload.fullName]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0' }}
                />
                <Bar dataKey="pcs" radius={[0, 6, 6, 0]}>
                  {washTypeChartData.map((entry, index) => (
                    <Cell key={`wash-cell-${index}`} fill={WASH_COLORS[index % WASH_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Volume by Stage */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            {language === 'bn' ? 'ফ্যাক্টরি স্টেজ অনুযায়ী পোশাক বণ্টন' : 'Production Floor Stage Volume'}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            {language === 'bn' ? 'বিভিন্ন ধাপে আটকে থাকা বা সম্পন্ন পোশাকের হিসাব' : 'Distribution of garment pieces across factory processing stages'}
          </p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageVolumeData} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(val: any) => [`${formatNumber(Number(val), language)} Pcs`, 'Volume']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0' }}
                />
                <Bar dataKey="pcs" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Production Job Cards Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {language === 'bn' ? 'প্রোডাকশন রেজিস্টার ও জব কার্ড বিস্তারিত' : 'Production Job Cards Register'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'bn' ? `মোট ${tableOrders.length} টি জব কার্ড পাওয়া গেছে` : `Showing ${tableOrders.length} production orders`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-production-report"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'bn' ? 'অর্ডার, ক্লায়েন্ট, স্টাইল, মেশিন খুঁজুন...' : 'Search order #, client, style, machine...'}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            {/* Stage Filter */}
            <select
              id="filter-production-stage"
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="all">{language === 'bn' ? 'সকল স্টেজ' : 'All Stages'}</option>
              <option value="washing">Washing</option>
              <option value="dyeing">Dyeing</option>
              <option value="hydro">Hydro</option>
              <option value="drying">Drying</option>
              <option value="finishing">Finishing</option>
              <option value="qc_passed">QC Passed</option>
              <option value="ready_for_delivery">Ready</option>
              <option value="delivered">Delivered</option>
            </select>

            {/* Priority Filter */}
            <select
              id="filter-production-priority"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="all">{language === 'bn' ? 'সকল প্রায়োরিটি' : 'All Priorities'}</option>
              <option value="urgent">{language === 'bn' ? 'জরুরি (Urgent)' : 'Urgent'}</option>
              <option value="high">{language === 'bn' ? 'উচ্চ (High)' : 'High'}</option>
              <option value="normal">{language === 'bn' ? 'সাধারণ (Normal)' : 'Normal'}</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">{language === 'bn' ? 'জব কার্ড #' : 'Job Card #'}</th>
                <th className="py-3 px-4">{language === 'bn' ? 'ক্লায়েন্ট ও মিল' : 'Client & Mill'}</th>
                <th className="py-3 px-4">{language === 'bn' ? 'স্টাইল ও গার্মেন্টস' : 'Style & Garment'}</th>
                <th className="py-3 px-4">{language === 'bn' ? 'ওয়াশ ও রেসিপি' : 'Wash Recipe'}</th>
                <th className="py-3 px-4 text-right">{language === 'bn' ? 'পরিমাণ (Pcs)' : 'Quantity (Pcs)'}</th>
                <th className="py-3 px-4">{language === 'bn' ? 'মেশিন / ব্যাচ' : 'Machine / Batch'}</th>
                <th className="py-3 px-4">{language === 'bn' ? 'বর্তমান পর্যায়' : 'Floor Stage'}</th>
                <th className="py-3 px-4">{language === 'bn' ? 'ডেলিভারি ডেডলাইন' : 'Delivery Due'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableOrders.length > 0 ? (
                tableOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {order.orderNumber}
                      {order.priority === 'urgent' && (
                        <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-rose-500" title="Urgent" />
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {order.clientName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div><strong className="text-slate-800">{order.styleNo}</strong></div>
                      <span className="text-[11px] text-slate-500">{order.garmentType}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {order.washType}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatNumber(order.quantityPcs, language)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                        {order.machineNo || 'N/A'} • {order.batchNumber || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {order.deliveryDate}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <Factory className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <span>{language === 'bn' ? 'কোনো প্রোডাকশন রেকর্ড পাওয়া যায়নি' : 'No production records found'}</span>
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
