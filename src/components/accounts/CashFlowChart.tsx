import React, { useMemo } from 'react';
import { Transaction } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency } from '../../utils/translation';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { TrendingUp, ArrowDownLeft, ArrowUpRight, BarChart2 } from 'lucide-react';

interface CashFlowChartProps {
  transactions: Transaction[];
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({ transactions }) => {
  const { language, t } = useERP();

  // Aggregate inflow vs outflow grouped by date (or latest dates)
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const dateMap: Record<string, { date: string; inflow: number; outflow: number; net: number }> = {};

    // Sort chronologically
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

    sorted.forEach(tx => {
      const dateKey = tx.date || 'Recent';
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { date: dateKey, inflow: 0, outflow: 0, net: 0 };
      }

      if (tx.type === 'credit') {
        dateMap[dateKey].inflow += tx.amount;
      } else if (tx.type === 'debit') {
        dateMap[dateKey].outflow += tx.amount;
      }
      dateMap[dateKey].net = dateMap[dateKey].inflow - dateMap[dateKey].outflow;
    });

    return Object.values(dateMap).slice(-7); // Last 7 active transaction days
  }, [transactions]);

  const totalInflow = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalOutflow = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
  const netCashFlow = totalInflow - totalOutflow;

  if (chartData.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-[#D9EAEB] shadow-2xs space-y-2">
        <div className="w-10 h-10 rounded-xl bg-[#F1FAFA] text-[#8EA3A5] flex items-center justify-center mx-auto">
          <BarChart2 className="w-5 h-5" />
        </div>
        <h4 className="font-extrabold text-xs text-[#17383B]">{t('cashFlowTitle')}</h4>
        <p className="text-[11px] text-[#688285]">
          {language === 'bn' ? 'ক্যাশ ফ্লো চার্ট প্রদর্শনের জন্য পর্যাপ্ত লেনদেন ইতিহাস নেই।' : 'Insufficient transaction history to generate cash flow visualizer.'}
        </p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const inflow = payload.find((p: any) => p.dataKey === 'inflow')?.value || 0;
      const outflow = payload.find((p: any) => p.dataKey === 'outflow')?.value || 0;
      const net = inflow - outflow;

      return (
        <div className="bg-[#17383B] text-white p-3 rounded-xl shadow-xl border border-white/10 text-xs space-y-1.5 min-w-[170px]">
          <div className="font-extrabold text-[#DDF4F3] border-b border-white/10 pb-1">{label}</div>
          <div className="flex justify-between items-center text-[#38C99A]">
            <span>{t('totalInflow')}:</span>
            <span className="font-bold">{formatCurrency(inflow, language)}</span>
          </div>
          <div className="flex justify-between items-center text-[#EA7185]">
            <span>{t('totalOutflow')}:</span>
            <span className="font-bold">{formatCurrency(outflow, language)}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-white/10 font-black">
            <span>{t('netCashFlow')}:</span>
            <span className={net >= 0 ? 'text-[#38C99A]' : 'text-[#EA7185]'}>
              {formatCurrency(net, language)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 rounded-2xl bg-white/95 backdrop-blur-sm border border-[#D9EAEB] shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-sm text-[#17383B] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#0B9FA5]" />
            <span>{t('cashFlowTitle')}</span>
          </h3>
          <p className="text-[11px] text-[#688285]">
            {language === 'bn' ? 'দৈনিক নগদ প্রবাহ ও খরচের বাস্তবভিত্তিক গ্রাফ' : 'Real-time inflow vs outflow distribution'}
          </p>
        </div>

        {/* Mini KPI badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="px-2.5 py-1 rounded-xl bg-[#E5F8F1] border border-[#38C99A]/20 text-[#229A73] font-extrabold flex items-center gap-1.5">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>{formatCurrency(totalInflow, language)}</span>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-[#FDECEF] border border-[#EA7185]/20 text-[#C93B55] font-extrabold flex items-center gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{formatCurrency(totalOutflow, language)}</span>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] font-extrabold">
            <span>Net: </span>
            <span className={netCashFlow >= 0 ? 'text-[#229A73]' : 'text-[#C93B55]'}>
              {formatCurrency(netCashFlow, language)}
            </span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6F0F1" />
            <XAxis dataKey="date" tick={{ fill: '#8EA3A5', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8EA3A5', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              formatter={(value) => (value === 'inflow' ? (language === 'bn' ? 'জমা (Inflow)' : 'Inflow') : (language === 'bn' ? 'খরচ (Outflow)' : 'Outflow'))}
            />
            <Bar dataKey="inflow" fill="#0B9FA5" radius={[6, 6, 0, 0]} maxBarSize={32} />
            <Bar dataKey="outflow" fill="#EA7185" radius={[6, 6, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
