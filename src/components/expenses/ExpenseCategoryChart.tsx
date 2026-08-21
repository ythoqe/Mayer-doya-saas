import React, { useMemo } from 'react';
import { Expense } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency } from '../../utils/translation';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend 
} from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

interface ExpenseCategoryChartProps {
  expenses: Expense[];
}

const CATEGORY_COLORS = [
  '#0B9FA5', // Teal
  '#8178F2', // Lavender
  '#F3B562', // Amber
  '#EA7185', // Coral
  '#38C99A', // Emerald
  '#4A90E2', // Blue
  '#A05EAD', // Purple
  '#F28482'  // Soft Rose
];

export const ExpenseCategoryChart: React.FC<ExpenseCategoryChartProps> = ({ expenses }) => {
  const { language, t } = useERP();

  const data = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];

    const categoryMap: Record<string, number> = {};
    let total = 0;

    expenses.forEach(e => {
      const cat = e.category || 'General';
      categoryMap[cat] = (categoryMap[cat] || 0) + (e.amount || 0);
      total += (e.amount || 0);
    });

    return Object.entries(categoryMap)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  if (data.length === 0) return null;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-[#17383B] text-white p-3 rounded-xl shadow-xl border border-white/10 text-xs space-y-1 min-w-[150px]">
          <div className="font-extrabold text-[#DDF4F3]">{item.name}</div>
          <div className="text-white font-bold">{formatCurrency(item.value, language)}</div>
          <div className="text-[#38C99A] text-[11px] font-semibold">{item.percentage}% of total</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 rounded-2xl bg-white/95 backdrop-blur-sm border border-[#D9EAEB] shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-sm text-[#17383B] flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-[#0B9FA5]" />
            <span>{t('expenseCategoryDistribution')}</span>
          </h3>
          <p className="text-[11px] text-[#688285]">
            {language === 'bn' ? 'ফ্যাক্টরি খরচের খাতভিত্তিক বিভাজন ও শতকরা হার' : 'Expense distribution by operational cost head'}
          </p>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} 
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
              formatter={(value, entry: any) => `${value} (${entry.payload.percentage}%)`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
