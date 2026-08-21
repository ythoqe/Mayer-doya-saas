import React from 'react';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { Clock, CheckCircle2, AlertOctagon, XCircle, FileSpreadsheet } from 'lucide-react';
import { motion } from 'motion/react';

export const ChequeSummaryCards: React.FC = () => {
  const { cheques, language, t } = useERP();

  const totalValue = cheques.reduce((sum, c) => sum + (c.amount || 0), 0);
  const pendingCheques = cheques.filter(c => c.status === 'Pending');
  const pendingValue = pendingCheques.reduce((sum, c) => sum + (c.amount || 0), 0);

  const clearedCheques = cheques.filter(c => c.status === 'Cleared');
  const clearedValue = clearedCheques.reduce((sum, c) => sum + (c.amount || 0), 0);

  const bouncedCheques = cheques.filter(c => c.status === 'Bounced');
  const bouncedValue = bouncedCheques.reduce((sum, c) => sum + (c.amount || 0), 0);

  const cancelledCheques = cheques.filter(c => c.status === 'Cancelled');
  const cancelledValue = cancelledCheques.reduce((sum, c) => sum + (c.amount || 0), 0);

  const cards = [
    {
      id: 'total-cheques',
      title: t('totalChequesValue'),
      value: totalValue,
      count: cheques.length,
      icon: FileSpreadsheet,
      badgeColor: 'border-[#0B9FA5]/20 bg-[#DDF4F3] text-[#0B9FA5]',
      amountColor: 'text-[#0B9FA5]'
    },
    {
      id: 'pending-clearance',
      title: t('pendingChequesLabel'),
      value: pendingValue,
      count: pendingCheques.length,
      icon: Clock,
      badgeColor: 'border-[#F3B562]/20 bg-[#FFF3DF] text-[#C47D1C]',
      amountColor: 'text-[#C47D1C]'
    },
    {
      id: 'cleared-cheques',
      title: t('clearedChequesLabel'),
      value: clearedValue,
      count: clearedCheques.length,
      icon: CheckCircle2,
      badgeColor: 'border-[#38C99A]/20 bg-[#E5F8F1] text-[#229A73]',
      amountColor: 'text-[#229A73]'
    },
    {
      id: 'bounced-cheques',
      title: t('bouncedChequesLabel'),
      value: bouncedValue,
      count: bouncedCheques.length,
      icon: AlertOctagon,
      badgeColor: 'border-[#EA7185]/20 bg-[#FDECEF] text-[#C93B55]',
      amountColor: 'text-[#C93B55]'
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
            className="p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-[#D9EAEB] shadow-2xs hover:shadow-xs transition-all relative overflow-hidden group"
          >
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#688285]">
                {card.title}
              </span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${card.badgeColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex flex-col">
              <span className={`text-xl sm:text-2xl font-black ${card.amountColor} tracking-tight leading-none`}>
                {formatCurrency(card.value, language)}
              </span>
              <span className="text-[11px] font-bold text-[#8EA3A5] mt-1.5">
                {formatNumber(card.count, language)} {language === 'bn' ? 'টি চেক নথি' : 'cheque records'}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
