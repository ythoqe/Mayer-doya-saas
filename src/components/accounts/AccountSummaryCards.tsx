import React from 'react';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { Landmark, Wallet, Smartphone, Coins, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

export const AccountSummaryCards: React.FC = () => {
  const { accounts, language, t } = useERP();

  const totalBalance = accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  const cashBalance = accounts.filter(a => a.accountType === 'Cash').reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  const bankBalance = accounts.filter(a => a.accountType === 'Bank').reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  const mfsBalance = accounts.filter(a => a.accountType === 'MFS').reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  const pettyCashBalance = accounts.filter(a => a.accountType === 'Petty Cash').reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  const cards = [
    {
      id: 'total-balance',
      title: t('totalBalanceLabel'),
      value: totalBalance,
      subtitle: `${formatNumber(accounts.length, language)} ${language === 'bn' ? 'সচল হিসাব' : 'Active Accounts'}`,
      icon: TrendingUp,
      accent: 'teal',
      bgGrad: 'from-[#0B9FA5]/10 via-[#0B9FA5]/5 to-transparent',
      borderColor: 'border-[#0B9FA5]/20',
      textColor: 'text-[#0B9FA5]',
      iconBg: 'bg-[#DDF4F3] text-[#0B9FA5]'
    },
    {
      id: 'cash-balance',
      title: t('cashBalanceLabel'),
      value: cashBalance,
      subtitle: language === 'bn' ? 'কারখানা ভল্ট ও পেটি' : 'Factory Safe & Vault',
      icon: Wallet,
      accent: 'emerald',
      bgGrad: 'from-[#38C99A]/10 via-[#38C99A]/5 to-transparent',
      borderColor: 'border-[#38C99A]/20',
      textColor: 'text-[#229A73]',
      iconBg: 'bg-[#E5F8F1] text-[#229A73]'
    },
    {
      id: 'bank-balance',
      title: t('bankBalanceLabel'),
      value: bankBalance,
      subtitle: language === 'bn' ? 'করপোরেট ব্যাংক স্থিতি' : 'Corporate Bank Reserves',
      icon: Landmark,
      accent: 'lavender',
      bgGrad: 'from-[#8178F2]/10 via-[#8178F2]/5 to-transparent',
      borderColor: 'border-[#8178F2]/20',
      textColor: 'text-[#8178F2]',
      iconBg: 'bg-[#EEEBFF] text-[#8178F2]'
    },
    {
      id: 'mfs-balance',
      title: t('mfsBalanceLabel'),
      value: mfsBalance + pettyCashBalance,
      subtitle: language === 'bn' ? 'বিকাশ, নগদ ও পেটি ক্যাশ' : 'bKash, Nagad & Petty Cash',
      icon: Smartphone,
      accent: 'amber',
      bgGrad: 'from-[#F3B562]/10 via-[#F3B562]/5 to-transparent',
      borderColor: 'border-[#F3B562]/20',
      textColor: 'text-[#C47D1C]',
      iconBg: 'bg-[#FFF3DF] text-[#C47D1C]'
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
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br ${card.bgGrad} opacity-60 group-hover:scale-110 transition-transform pointer-events-none`} />

            <div className="flex items-center justify-between gap-3 mb-3">
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
