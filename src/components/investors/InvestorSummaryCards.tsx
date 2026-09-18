import React from 'react';
import { Investor, Investment, InvestorWithdrawal, ProfitDistribution, Language } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { Users, UserCheck, TrendingUp, HandCoins, Clock, ArrowDownRight, Wallet, PieChart } from 'lucide-react';
import { motion } from 'motion/react';

interface InvestorSummaryCardsProps {
  investors: Investor[];
  investments?: Investment[];
  withdrawals?: InvestorWithdrawal[];
  profitDistributions?: ProfitDistribution[];
  language: Language;
  t: (key: string) => string;
}

export const InvestorSummaryCards: React.FC<InvestorSummaryCardsProps> = ({
  investors,
  language,
  t
}) => {
  const totalInvestors = investors.length;
  const activeInvestors = investors.filter(i => i.status === 'active').length;
  const totalInvested = investors.reduce((sum, i) => sum + (i.totalInvested || 0), 0);
  const totalWithdrawn = investors.reduce((sum, i) => sum + (i.totalWithdrawn || 0), 0);
  const totalProfitDistributed = investors.reduce((sum, i) => sum + (i.totalProfitReceived || 0), 0);
  const totalPendingProfit = investors.reduce((sum, i) => sum + (i.pendingProfit || 0), 0);
  const netActiveCapital = totalInvested - totalWithdrawn;
  const currentTotalPosition = netActiveCapital + totalPendingProfit;

  const cards = [
    {
      id: 'total-investors',
      title: t('totalInvestors'),
      value: formatNumber(totalInvestors, language),
      subtitle: `${formatNumber(activeInvestors, language)} ${language === 'bn' ? 'জন সক্রিয় অংশীদার' : 'Active Partners'}`,
      icon: Users,
      bgGradient: 'from-[#17383B] to-[#1F4B4F]',
      textColor: 'text-white',
      accentColor: 'text-[#16B8B0]',
      iconBg: 'bg-[#16B8B0]/20 text-[#16B8B0]'
    },
    {
      id: 'total-investment',
      title: t('totalInvestment'),
      value: formatCurrency(totalInvested, language),
      subtitle: `${language === 'bn' ? 'নিট আসল মূলধন:' : 'Net Principal:'} ${formatCurrency(netActiveCapital, language)}`,
      icon: TrendingUp,
      bgGradient: 'from-white to-[#F1FAFA]',
      textColor: 'text-[#17383B]',
      accentColor: 'text-[#0B9FA5]',
      iconBg: 'bg-[#0B9FA5]/10 text-[#0B9FA5]',
      borderColor: 'border-[#D9EAEB]'
    },
    {
      id: 'profit-distributed',
      title: t('profitDistributed'),
      value: formatCurrency(totalProfitDistributed, language),
      subtitle: language === 'bn' ? 'নগদ/ব্যাংকে পরিশোধিত লভ্যাংশ' : 'Total Profit Paid to Date',
      icon: HandCoins,
      bgGradient: 'from-white to-[#F1FAFA]',
      textColor: 'text-[#17383B]',
      accentColor: 'text-[#229A73]',
      iconBg: 'bg-[#229A73]/10 text-[#229A73]',
      borderColor: 'border-[#D9EAEB]'
    },
    {
      id: 'pending-profit',
      title: t('pendingProfit'),
      value: formatCurrency(totalPendingProfit, language),
      subtitle: language === 'bn' ? 'বণ্টনকৃত অবণ্টিত/বকেয়া মুনাফা' : 'Allocated Unpaid Profit',
      icon: Clock,
      bgGradient: 'from-white to-[#FFF9F2]',
      textColor: 'text-[#17383B]',
      accentColor: 'text-[#F3B562]',
      iconBg: 'bg-[#F3B562]/15 text-[#D98A1B]',
      borderColor: 'border-[#FFE3B8]'
    },
    {
      id: 'total-withdrawals',
      title: t('totalWithdrawals'),
      value: formatCurrency(totalWithdrawn, language),
      subtitle: language === 'bn' ? 'বিনিয়োগকারীদের আসল ফেরত' : 'Principal Repaid / Withdrawn',
      icon: ArrowDownRight,
      bgGradient: 'from-white to-[#FDF4F5]',
      textColor: 'text-[#17383B]',
      accentColor: 'text-[#EA7185]',
      iconBg: 'bg-[#EA7185]/10 text-[#EA7185]',
      borderColor: 'border-[#F8D2D9]'
    },
    {
      id: 'current-position',
      title: t('currentPosition'),
      value: formatCurrency(currentTotalPosition, language),
      subtitle: language === 'bn' ? 'আসল + বকেয়া লভ্যাংশ মোট দায়' : 'Net Principal + Pending Profit',
      icon: Wallet,
      bgGradient: 'from-[#0B9FA5] to-[#17383B]',
      textColor: 'text-white',
      accentColor: 'text-white',
      iconBg: 'bg-white/20 text-white'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4 sm:gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const isDark = card.bgGradient.includes('#17383B') || card.bgGradient.includes('#0B9FA5');

        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.25 }}
            className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 shadow-xs border ${
              card.borderColor || 'border-transparent'
            } bg-gradient-to-br ${card.bgGradient} flex flex-col justify-between`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className={`text-xs font-bold ${isDark ? 'text-white/80' : 'text-[#688285]'}`}>
                {card.title}
              </span>
              <div className={`p-2 rounded-xl shrink-0 ${card.iconBg}`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            <div>
              <div className={`text-lg sm:text-xl xl:text-2xl font-black tracking-tight ${card.textColor}`}>
                {card.value}
              </div>
              <div className={`text-[11px] font-medium mt-1 truncate ${isDark ? 'text-white/70' : 'text-[#8EA3A5]'}`}>
                {card.subtitle}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
