import React from 'react';
import { OrderStatus, Language } from '../../types';
import { translations } from '../../utils/translation';

interface StatusBadgeProps {
  status: OrderStatus | string;
  language?: Language;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  language = 'en',
  size = 'md',
  className = ''
}) => {
  const getStatusConfig = (st: string) => {
    switch (st.toLowerCase()) {
      case 'washing':
      case 'dyeing':
      case 'hydro':
      case 'batch_assigned':
        return {
          bg: 'bg-[#DDF4F3] text-[#0B9FA5] border-[#16B8B0]/30',
          dot: 'bg-[#0B9FA5]'
        };
      case 'qc_passed':
      case 'ready_for_delivery':
      case 'delivered':
      case 'cleared':
      case 'active':
        return {
          bg: 'bg-[#E5F8F1] text-[#229A73] border-[#38C99A]/30',
          dot: 'bg-[#38C99A]'
        };
      case 'pending':
      case 'lot_received':
      case 'drying':
      case 'finishing':
        return {
          bg: 'bg-[#FFF3DF] text-[#C47D1C] border-[#F3B562]/30',
          dot: 'bg-[#F3B562]'
        };
      case 'cancelled':
      case 'bounced':
      case 'inactive':
        return {
          bg: 'bg-[#FDECEF] text-[#C83F57] border-[#EA7185]/30',
          dot: 'bg-[#EA7185]'
        };
      case 'urgent':
      case 'high':
        return {
          bg: 'bg-[#EEEBFF] text-[#6357E8] border-[#8178F2]/30',
          dot: 'bg-[#8178F2]'
        };
      default:
        return {
          bg: 'bg-[#EAF6F7] text-[#688285] border-[#D9EAEB]',
          dot: 'bg-[#8EA3A5]'
        };
    }
  };

  const config = getStatusConfig(status);
  const label = translations[language]?.[status] || translations['en']?.[status] || status.replace(/_/g, ' ');

  const sizeClasses = size === 'sm' 
    ? 'px-2.5 py-0.5 text-xs' 
    : 'px-3 py-1 text-xs sm:text-sm font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${sizeClasses} capitalize whitespace-nowrap select-none ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {label}
    </span>
  );
};
