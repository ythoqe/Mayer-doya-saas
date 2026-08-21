import React from 'react';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { Calendar, DollarSign, Flame, Layers, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';

export const ExpenseSummaryCards: React.FC = () => {
  const { expenses, language, t } = useERP();

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.slice(0, 7);

  const todayExpenses = expenses.filter(e => e.date === todayStr).reduce((s, e) => s + (e.amount || 0), 0);
  const thisMonthExpenses = expenses.filter(e => e.date.startsWith(currentMonthStr)).reduce((s, e) => s + (e.amount || 0), 0);

  const factoryOpsCategories = ['Fuel', 'Gas', 'Electricity', 'Chemical', 'Maintenance', 'Boiler Diesel', 'Machine Spares'];
  const factoryOpsExpenses = expenses.filter(e => factoryOpsCategories.some(cat => e.category.toLowerCase().includes(cat.toLowerCase()))).reduce((s, e) => s + (e.amount || 0), 0);

  const otherExpenses = expenses.filter(e => !factoryOpsCategories.some(cat => e.category.toLowerCase().includes(cat.toLowerCase()))).reduce((s, e) => s + (e.amount || 0), 0);

  const cards = [
    {
      id: 'today-expenses',
      title: t('todayExpensesLabel'),
      value: todayExpenses,
      subtitle: language === 'bn' ? 'আজকের মোট ভাউচার খরচ' : 'Daily Factory Vouchers',
      icon: Calendar,
      borderColor: 'border-[#0B9FA5]/20',
      textColor: 'text-[#0B9FA5]',
      iconBg: 'bg-[#DDF4F3] text-[#0B9FA5]'
    },
    {
      id: 'this-month',
      title: t('thisMonthExpensesLabel'),
      value: thisMonthExpenses,
      subtitle: language === 'bn' ? 'চলতি ক্যালেন্ডার মাস' : 'Current Billing Month',
      icon: TrendingDown,
      borderColor: 'border-[#8178F2]/20',
      textColor: 'text-[#8178F2]',
      iconBg: 'bg-[#EEEBFF] text-[#8178F2]'
    },
    {
      id: 'factory-ops',
      title: t('factoryOpsExpensesLabel'),
      value: factoryOpsExpenses,
      subtitle: language === 'bn' ? 'গ্যাস, বিদ্যুৎ, জ্বালানি ও কেমিক্যাল' : 'Gas, Power, Fuel & Chemicals',
      icon: Flame,
      borderColor: 'border-[#F3B562]/20',
      textColor: 'text-[#C47D1C]',
      iconBg: 'bg-[#FFF3DF] text-[#C47D1C]'
    },
    {
      id: 'other-admin',
      title: t('otherExpensesLabel'),
      value: otherExpenses,
      subtitle: language === 'bn' ? 'অফিস, পরিবহন ও সাধারণ খরচ' : 'Office, Transport & Admin',
      icon: Layers,
      borderColor: 'border-[#38C99A]/20',
      textColor: 'text-[#229A73]',
      iconBg: 'bg-[#E5F8F1] text-[#229A73]'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.04 }}
            className={`p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-md border ${card.borderColor} shadow-2xs hover:shadow-xs transition-all relative overflow-hidden group`}
          >
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#688285]">
                {card.title}
              </span>
              <div className={`w-8 h-8 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0 shadow-2xs`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex flex-col">
              <span className={`text-xl sm:text-2xl font-black ${card.textColor} tracking-tight leading-none`}>
                {formatCurrency(card.value, language)}
              </span>
              <span className="text-[11px] font-medium text-[#8EA3A5] mt-1.5 truncate">
                {card.subtitle}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
