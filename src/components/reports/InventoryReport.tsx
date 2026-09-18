import React, { useMemo, useState } from 'react';
import { 
  Boxes, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Layers, 
  MapPin, 
  RefreshCw 
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
import { CHEMICAL_CATEGORIES, getCategoryLabel, matchesChemicalCategory } from '../../utils/chemicalCategories';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { DateRange } from './types';

interface InventoryReportProps {
  dateRange: DateRange;
}

const CAT_COLORS = ['#0d9488', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b', '#06b6d4'];

export const InventoryReport: React.FC<InventoryReportProps> = ({ dateRange }) => {
  const { inventory, language, t } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'safe'>('all');

  // Filtered Inventory
  const filteredInventory = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return inventory.filter(item => {
      const matchesSearch = 
        (item.name || '').toLowerCase().includes(term) ||
        (item.category || '').toLowerCase().includes(term) ||
        (item.supplierName || '').toLowerCase().includes(term) ||
        (item.location || '').toLowerCase().includes(term);
      
      const matchesCategory = categoryFilter === 'all' || matchesChemicalCategory(item.category, categoryFilter);

      let matchesStock = true;
      if (stockStatusFilter === 'low') {
        matchesStock = (Number(item.currentStockKg) || 0) <= (Number(item.minAlertLevel) || 0);
      } else if (stockStatusFilter === 'safe') {
        matchesStock = (Number(item.currentStockKg) || 0) > (Number(item.minAlertLevel) || 0);
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [inventory, searchTerm, categoryFilter, stockStatusFilter]);

  // Aggregate Metrics
  const totalValuation = useMemo(() => {
    return inventory.reduce((sum, item) => sum + (item.currentStockKg * item.unitPrice), 0);
  }, [inventory]);

  const totalQuantityKg = useMemo(() => {
    return inventory.reduce((sum, item) => sum + item.currentStockKg, 0);
  }, [inventory]);

  const lowStockItems = useMemo(() => {
    return inventory.filter(item => item.currentStockKg <= item.minAlertLevel);
  }, [inventory]);

  // Chart: Category Valuation
  const categoryValuationData = useMemo(() => {
    const map: Record<string, number> = {};
    inventory.forEach(item => {
      const catLabel = getCategoryLabel(item.category, language);
      const val = item.currentStockKg * item.unitPrice;
      map[catLabel] = (map[catLabel] || 0) + val;
    });

    return Object.entries(map).map(([cat, val]) => ({
      name: cat,
      value: val
    }));
  }, [inventory, language]);

  // Chart: Top Valued Chemicals
  const topValuedItemsData = useMemo(() => {
    return [...inventory]
      .map(item => ({
        name: item.name.length > 15 ? item.name.slice(0, 14) + '..' : item.name,
        fullName: item.name,
        valuation: item.currentStockKg * item.unitPrice,
        stock: item.currentStockKg
      }))
      .sort((a, b) => b.valuation - a.valuation)
      .slice(0, 5);
  }, [inventory]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Chemical Valuation */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'স্টক মোট আর্থিক মূল্যায়ন' : 'Total Stock Valuation'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {formatCurrency(totalValuation, language)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'মোট কেমিক্যাল আইটেম:' : 'Total Items:'}</span>
            <span className="font-semibold text-slate-700">{inventory.length}</span>
          </div>
        </div>

        {/* Total Stock Volume */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'মোট মজুদ পরিমাণ' : 'Total Stock Volume'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-2">
            {formatNumber(totalQuantityKg, language)} <span className="text-xs font-normal text-slate-500">kg/lit</span>
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'গড় ইউনিট দর:' : 'Avg Unit Price:'}</span>
            <span className="font-semibold text-slate-700">
              {inventory.length > 0 ? formatCurrency(Math.round(totalValuation / (totalQuantityKg || 1)), language) : '৳ 0'}
            </span>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'স্বল্প স্টক সতর্কতা' : 'Low Stock Warning'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-2">
            {formatNumber(lowStockItems.length, language)} <span className="text-xs font-normal text-slate-500">{language === 'bn' ? 'টি আইটেম' : 'Items'}</span>
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'জরুরি রিস্টক প্রয়োজন' : 'Reorder Needed'}</span>
            <span className="font-semibold text-rose-600">{lowStockItems.length > 0 ? 'Action Required' : 'Optimal'}</span>
          </div>
        </div>

        {/* Safe Stock Healthy Items */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'নিরাপদ স্টক স্বাস্থ্য' : 'Safe Stock Items'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            {formatNumber(inventory.length - lowStockItems.length, language)} <span className="text-xs font-normal text-slate-500">{language === 'bn' ? 'টি আইটেম' : 'Items'}</span>
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'স্টক বাফার হার:' : 'Buffer Ratio:'}</span>
            <span className="font-semibold text-emerald-600">
              {inventory.length > 0 ? `${(((inventory.length - lowStockItems.length) / inventory.length) * 100).toFixed(0)}%` : '100%'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Valuation by Category */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            {t('chemicalValuationCategory')}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            {language === 'bn' ? 'এনজাইম, ডাইস, এসিড ও সফটনারের আর্থিক মূল্য বণ্টন' : 'Stock valuation distributed across chemical classifications'}
          </p>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryValuationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryValuationData.map((entry, index) => (
                    <Cell key={`cat-cell-${index}`} fill={CAT_COLORS[index % CAT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any) => [formatCurrency(Number(val), language), 'Valuation']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0' }}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Top Valued Chemicals */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            {language === 'bn' ? 'সর্বোচ্চ মূল্যের কেমিক্যাল তালিকা' : 'Top 5 Highest Valued Inventory Items'}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            {language === 'bn' ? 'স্টকে থাকা সবচেয়ে মূল্যবান কেমিক্যাল ও ডাইসের হিসাব' : 'Chemical items commanding the highest capital allocation'}
          </p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topValuedItemsData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `৳${v > 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <Tooltip 
                  formatter={(val: any) => [formatCurrency(Number(val), language), 'Total Valuation']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0' }}
                />
                <Bar dataKey="valuation" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chemical Inventory Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {language === 'bn' ? 'কেমিক্যাল ও ডাইস স্টক রেজিস্টার' : 'Chemicals & Dyes Stock Register'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'bn' ? `মোট ${filteredInventory.length} টি কেমিক্যাল স্টক পাওয়া গেছে` : `Showing ${filteredInventory.length} inventory items`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-inventory-report"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'bn' ? 'কেমিক্যাল, ক্যাটাগরি, রেক খুঁজুন...' : 'Search chemical, rack, supplier...'}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <select
              id="filter-inv-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium"
            >
              <option value="all">{language === 'bn' ? 'সকল ক্যাটাগরি' : 'All Categories'}</option>
              {CHEMICAL_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>
                  {language === 'bn' ? c.bn : c.en}
                </option>
              ))}
            </select>

            <select
              id="filter-inv-status"
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value as any)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="all">{language === 'bn' ? 'সকল স্টক অবস্থা' : 'All Stock Status'}</option>
              <option value="low">{language === 'bn' ? 'স্বল্প স্টক সতর্কতা (Low)' : 'Low Stock Only'}</option>
              <option value="safe">{language === 'bn' ? 'পর্যাপ্ত স্টক (Safe)' : 'Safe Stock'}</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">{language === 'bn' ? 'কেমিক্যাল নাম ও বিবরণ' : 'Chemical Name'}</th>
                <th className="py-3 px-4">{language === 'bn' ? 'ক্যাটাগরি' : 'Category'}</th>
                <th className="py-3 px-4">{language === 'bn' ? 'সরবরাহকারী' : 'Supplier / Vendor'}</th>
                <th className="py-3 px-4 text-right">{language === 'bn' ? 'বর্তমান স্টক' : 'Current Stock'}</th>
                <th className="py-3 px-4 text-right">{language === 'bn' ? 'ইউনিট দর' : 'Unit Rate'}</th>
                <th className="py-3 px-4 text-right">{language === 'bn' ? 'মোট মূল্যায়ন' : 'Total Valuation'}</th>
                <th className="py-3 px-4 text-center">{language === 'bn' ? 'স্টক স্ট্যাটাস' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.length > 0 ? (
                filteredInventory.map(item => {
                  const isLow = item.currentStockKg <= item.minAlertLevel;
                  const itemVal = item.currentStockKg * item.unitPrice;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" /> {item.location || 'Main Store'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 font-bold text-[11px] border border-teal-100">
                          {getCategoryLabel(item.category, language)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {item.supplierName || 'General Vendor'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatNumber(item.currentStockKg, language)} <span className="text-[11px] font-normal text-slate-500">{item.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">
                        ৳{item.unitPrice}/{item.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-teal-700">
                        {formatCurrency(itemVal, language)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            {language === 'bn' ? 'স্বল্প স্টক' : 'Low Stock'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            {language === 'bn' ? 'পর্যাপ্ত' : 'Safe'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <Boxes className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <span>{language === 'bn' ? 'কোনো কেমিক্যাল পাওয়া যায়নি' : 'No inventory items found'}</span>
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
