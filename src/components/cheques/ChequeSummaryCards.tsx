import React from 'react';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { Clock, CheckCircle2, XCircle, ArrowDownLeft, ArrowUpRight, Layers } from 'lucide-react';
import { motion } from 'motion/react';

export const ChequeSummaryCards: React.FC = () => {
  const { cheques, language, t } = useERP();

  const totalValue = cheques.reduce((sum, c) => sum + (c.amount || 0), 0);
  
  // Received cheques (Client cheques)
  const receivedCheques = cheques.filter(c => c.direction === 'received' || c.partyType === 'Client');
  const receivedValue = receivedCheques.reduce((sum, c) => sum + (c.amount || 0), 0);

  // Issued / Endorsed cheques (Supplier cheques)
  const issuedCheques = cheques.filter(c => c.direction === 'issued' || c.partyType === 'Supplier');
  const issuedValue = issuedCheques.reduce((sum, c) => sum + (c.amount || 0), 0);

  // Pending
  const pendingCheques = cheques.filter(c => c.status === 'Pending');
  const pendingValue = pendingCheques.reduce((sum, c) => sum + (c.amount || 0), 0);

  // Clear / Cleared
  const clearedCheques = cheques.filter(c => c.status === 'Clear' || c.status === 'Cleared');
  const clearedValue = clearedCheques.reduce((sum, c) => sum + (c.amount || 0), 0);

  // Cancel / Cancelled
  const cancelledCheques = cheques.filter(c => c.status === 'Cancel' || c.status === 'Cancelled' || c.status === 'Bounced');
  const cancelledValue = cancelledCheques.reduce((sum, c) => sum + (c.amount || 0), 0);

  const cards = [
    {
      id: 'received-cheques',
      title: language === 'bn' ? 'মোট চেক গ্রহণ (ক্লায়েন্ট)' : 'Received Cheques (Clients)',
      subtitle: language === 'bn' ? 'গ্রাহকদের থেকে প্রাপ্ত চেক' : 'Client Inward Cheques',
      value: receivedValue,
      count: receivedCheques.length,
      icon: ArrowDownLeft,
      badgeColor: 'border-[#0B9FA5]/20 bg-[#DDF4F3] text-[#0B9FA5]',
      amountColor: 'text-[#0B9FA5]'
    },
    {
      id: 'issued-cheques',
      title: language === 'bn' ? 'মোট চেক প্রদান (সাপ্লায়ার)' : 'Issued Cheques (Suppliers)',
      subtitle: language === 'bn' ? 'মহাজনকে প্রদত্ত / অ্যান্ডোর্সড' : 'Endorsed to Suppliers',
      value: issuedValue,
      count: issuedCheques.length,
      icon: ArrowUpRight,
      badgeColor: 'border-[#6357E8]/20 bg-[#EEEBFF] text-[#6357E8]',
      amountColor: 'text-[#6357E8]'
    },
    {
      id: 'pending-clearance',
      title: language === 'bn' ? 'অপেক্ষমাণ চেক (Pending)' : 'Pending Cheques',
      subtitle: language === 'bn' ? 'ক্লিয়ারেন্সের অপেক্ষায়' : 'Awaiting Bank Clearance',
      value: pendingValue,
      count: pendingCheques.length,
      icon: Clock,
      badgeColor: 'border-[#F3B562]/20 bg-[#FFF3DF] text-[#C47D1C]',
      amountColor: 'text-[#C47D1C]'
    },
    {
      id: 'cleared-cheques',
      title: language === 'bn' ? 'ক্লিয়ারড চেক (Clear)' : 'Cleared Cheques',
      subtitle: language === 'bn' ? 'টাকা উত্তোলন সম্পন্ন' : 'Encashed & Reconciled',
      value: clearedValue,
      count: clearedCheques.length,
      icon: CheckCircle2,
      badgeColor: 'border-[#38C99A]/20 bg-[#E5F8F1] text-[#229A73]',
      amountColor: 'text-[#229A73]'
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
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#688285] truncate" title={card.title}>
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
              <div className="flex items-center justify-between mt-2 text-[11px] font-bold text-[#8EA3A5]">
                <span>{formatNumber(card.count, language)} {language === 'bn' ? 'টি চেক' : 'cheques'}</span>
                <span className="text-[10px] font-normal text-[#688285]">{card.subtitle}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
