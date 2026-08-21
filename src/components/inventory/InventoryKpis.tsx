import React from 'react';
import { useERP } from '../../context/ERPContext';
import { GlassCard } from '../ui/GlassCard';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { 
  Boxes, 
  DollarSign, 
  AlertTriangle, 
  FlaskConical, 
  ShieldCheck, 
  TrendingUp, 
  Droplet,
  Layers,
  AlertCircle
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export const InventoryKpis: React.FC = () => {
  const { inventory, language, t } = useERP();

  // Metrics
  const totalItems = inventory.length;
  const totalStockValue = inventory.reduce((sum, item) => sum + (item.currentStockKg * item.unitPrice), 0);
  
  // Stock health classification
  const lowStockItems = inventory.filter(item => item.currentStockKg <= item.minAlertLevel);
  const criticalItems = inventory.filter(item => item.currentStockKg <= item.minAlertLevel * 0.5);
  const healthyItems = inventory.filter(item => item.currentStockKg > item.minAlertLevel);

  // Chemical & Dye items count
  const chemicalDyeItems = inventory.filter(item => 
    ['Acid', 'Enzyme', 'Dye', 'Softener', 'Bleach', 'Alkali', 'Fixing Agent', 'Detergent'].includes(item.category)
  );

  // Category distribution data for mini-chart
  const categoryMap = inventory.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + (item.currentStockKg * item.unitPrice);
    return acc;
  }, {} as Record<string, number>);

  const categoryChartData = Object.entries(categoryMap)
    .map(([cat, val]) => ({
      category: cat,
      value: val
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const categoryColors = ['#0B9FA5', '#6366F1', '#EC4899', '#10B981', '#F59E0B'];

  return (
    <div className="space-y-4">
      {/* 4 Compact Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Items */}
        <GlassCard padding="sm" className="relative overflow-hidden group border border-[#D9EAEB]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-[#688285] uppercase tracking-wider">
                {t('totalItemsLabel')}
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-[#17383B] mt-1">
                {formatNumber(totalItems, language)}
              </h3>
              <p className="text-[10px] text-[#8EA3A5] mt-0.5">
                Active SKU & chemical lots
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#EAF7F8] border border-[#0B9FA5]/20 flex items-center justify-center text-[#0B9FA5]">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
        </GlassCard>

        {/* Total Valuation */}
        <GlassCard padding="sm" className="relative overflow-hidden group border border-[#D9EAEB]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-[#688285] uppercase tracking-wider">
                {t('totalStockValueLabel')}
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-[#0B9FA5] mt-1">
                {formatCurrency(totalStockValue, language)}
              </h3>
              <p className="text-[10px] text-[#8EA3A5] mt-0.5">
                Total warehouse valuation
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#EAF7F8] border border-[#0B9FA5]/20 flex items-center justify-center text-[#0B9FA5]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </GlassCard>

        {/* Low Stock Alerts */}
        <GlassCard padding="sm" className={`relative overflow-hidden group border ${lowStockItems.length > 0 ? 'border-[#F3B562]/60 bg-[#FFFDF8]' : 'border-[#D9EAEB]'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-[#688285] uppercase tracking-wider">
                {t('lowStockItemsLabel')}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <h3 className={`text-xl sm:text-2xl font-black ${lowStockItems.length > 0 ? 'text-[#C47D1C]' : 'text-[#17383B]'}`}>
                  {formatNumber(lowStockItems.length, language)}
                </h3>
                {criticalItems.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 font-bold rounded-full bg-[#FEECEE] text-[#EA7185] border border-[#EA7185]/30">
                    {criticalItems.length} {t('criticalStock')}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#8EA3A5] mt-0.5">
                {lowStockItems.length > 0 ? 'Restock required soon' : 'All levels safe'}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${lowStockItems.length > 0 ? 'bg-[#FFF3DF] text-[#C47D1C] border border-[#F3B562]/40' : 'bg-[#EAF7F8] text-[#0B9FA5] border border-[#0B9FA5]/20'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </GlassCard>

        {/* Chemical & Dye Items */}
        <GlassCard padding="sm" className="relative overflow-hidden group border border-[#D9EAEB]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-[#688285] uppercase tracking-wider">
                {t('chemicalItemsLabel')}
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-[#17383B] mt-1">
                {formatNumber(chemicalDyeItems.length, language)}
              </h3>
              <p className="text-[10px] text-[#8EA3A5] mt-0.5">
                Washing & dyeing agents
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F0EEFF] border border-[#6366F1]/20 flex items-center justify-center text-[#6366F1]">
              <FlaskConical className="w-5 h-5" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Stock Health & Category Distribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stock Health Card */}
        <GlassCard padding="md" className="lg:col-span-1 border border-[#D9EAEB] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E6F0F1]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0B9FA5]" />
                <h4 className="font-bold text-sm text-[#17383B]">{t('stockHealthTitle')}</h4>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E5F8F1] text-[#229A73]">
                {Math.round((healthyItems.length / (totalItems || 1)) * 100)}% Safe
              </span>
            </div>

            {/* Health Visual Bar */}
            <div className="mt-4">
              <div className="h-2.5 w-full bg-[#EAF2F3] rounded-full overflow-hidden flex">
                <div 
                  className="bg-[#229A73] transition-all duration-500" 
                  style={{ width: `${(healthyItems.length / (totalItems || 1)) * 100}%` }} 
                  title={`Healthy: ${healthyItems.length}`}
                />
                <div 
                  className="bg-[#F3B562] transition-all duration-500" 
                  style={{ width: `${((lowStockItems.length - criticalItems.length) / (totalItems || 1)) * 100}%` }} 
                  title={`Low: ${lowStockItems.length - criticalItems.length}`}
                />
                <div 
                  className="bg-[#EA7185] transition-all duration-500" 
                  style={{ width: `${(criticalItems.length / (totalItems || 1)) * 100}%` }} 
                  title={`Critical: ${criticalItems.length}`}
                />
              </div>
            </div>

            {/* Breakdown Indicators */}
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="p-2.5 rounded-xl bg-[#E5F8F1]/80 border border-[#229A73]/20">
                <div className="flex items-center justify-center gap-1 text-[#229A73] text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#229A73]" />
                  {t('healthyStock')}
                </div>
                <div className="text-base font-black text-[#17383B] mt-1">
                  {formatNumber(healthyItems.length, language)}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FFF3DF]/80 border border-[#F3B562]/30">
                <div className="flex items-center justify-center gap-1 text-[#C47D1C] text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#F3B562]" />
                  {t('lowStock')}
                </div>
                <div className="text-base font-black text-[#17383B] mt-1">
                  {formatNumber(lowStockItems.length - criticalItems.length, language)}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FEECEE]/80 border border-[#EA7185]/30">
                <div className="flex items-center justify-center gap-1 text-[#EA7185] text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#EA7185]" />
                  {t('criticalStock')}
                </div>
                <div className="text-base font-black text-[#17383B] mt-1">
                  {formatNumber(criticalItems.length, language)}
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#8EA3A5] mt-4 pt-3 border-t border-[#E6F0F1]">
            Safety criteria: Real-time threshold evaluation (<span className="font-mono text-[#17383B]">Stock &le; Min Alert</span>).
          </p>
        </GlassCard>

        {/* Top Category Valuations Mini-Chart */}
        <GlassCard padding="md" className="lg:col-span-2 border border-[#D9EAEB] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E6F0F1]">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#0B9FA5]" />
                <h4 className="font-bold text-sm text-[#17383B]">Category Stock Valuation</h4>
              </div>
              <span className="text-[11px] font-bold text-[#688285]">
                Top 5 Categories by Value
              </span>
            </div>

            {categoryChartData.length > 0 ? (
              <div className="mt-3 h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                      type="category" 
                      dataKey="category" 
                      tick={{ fontSize: 11, fill: '#17383B', fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                      width={90}
                    />
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(Number(value) || 0, language), 'Valuation']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #D9EAEB', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {categoryChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-36 flex items-center justify-center text-xs text-[#8EA3A5]">
                No inventory category valuation data
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-[10px] text-[#688285]">
            {categoryChartData.map((entry, idx) => (
              <div key={entry.category} className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: categoryColors[idx % categoryColors.length] }} />
                <span>{entry.category}:</span>
                <span className="font-bold text-[#17383B]">{formatCurrency(entry.value, language)}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
