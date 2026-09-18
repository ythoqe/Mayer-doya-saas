import React from 'react';
import { Account } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency } from '../../utils/translation';
import { Landmark, Wallet, Smartphone, Coins, ArrowRightLeft, FileText, CheckCircle2, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AccountCardProps {
  account: Account;
  onSelect: (account: Account) => void;
  onTransfer: (account: Account) => void;
  onEdit?: (account: Account) => void;
  onDelete?: (id: string) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({ account, onSelect, onTransfer, onEdit, onDelete }) => {
  const { deleteAccount, language } = useERP();

  const getTypeStyle = () => {
    switch (account.accountType) {
      case 'Cash':
        return {
          icon: Wallet,
          border: 'border-[#0B9FA5]/25 hover:border-[#0B9FA5]/50',
          badge: 'bg-[#DDF4F3] text-[#0B9FA5] border-[#0B9FA5]/20',
          gradient: 'from-[#0B9FA5]/5 to-transparent',
          iconBg: 'bg-[#DDF4F3] text-[#0B9FA5]',
          accentText: 'text-[#0B9FA5]'
        };
      case 'Bank':
        return {
          icon: Landmark,
          border: 'border-[#8178F2]/25 hover:border-[#8178F2]/50',
          badge: 'bg-[#EEEBFF] text-[#8178F2] border-[#8178F2]/20',
          gradient: 'from-[#8178F2]/5 to-transparent',
          iconBg: 'bg-[#EEEBFF] text-[#8178F2]',
          accentText: 'text-[#8178F2]'
        };
      case 'MFS':
        return {
          icon: Smartphone,
          border: 'border-[#38C99A]/25 hover:border-[#38C99A]/50',
          badge: 'bg-[#E5F8F1] text-[#229A73] border-[#38C99A]/20',
          gradient: 'from-[#38C99A]/5 to-transparent',
          iconBg: 'bg-[#E5F8F1] text-[#229A73]',
          accentText: 'text-[#229A73]'
        };
      case 'Petty Cash':
      default:
        return {
          icon: Coins,
          border: 'border-[#F3B562]/25 hover:border-[#F3B562]/50',
          badge: 'bg-[#FFF3DF] text-[#C47D1C] border-[#F3B562]/20',
          gradient: 'from-[#F3B562]/5 to-transparent',
          iconBg: 'bg-[#FFF3DF] text-[#C47D1C]',
          accentText: 'text-[#C47D1C]'
        };
    }
  };

  const style = getTypeStyle();
  const IconComponent = style.icon;

  // Mask account number for security: e.g. ****-****-1234
  const formatAccNo = (accNo?: string) => {
    if (!accNo) return '';
    if (accNo.length <= 4) return accNo;
    const lastFour = accNo.slice(-4);
    return `•••• •••• ${lastFour}`;
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className={`p-5 rounded-2xl bg-white/95 backdrop-blur-sm border ${style.border} shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group`}
    >
      {/* Subtle top corner gradient tint */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${style.gradient} rounded-bl-full pointer-events-none opacity-80`} />

      <div>
        {/* Header with Type & Status */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl ${style.iconBg} flex items-center justify-center shrink-0 shadow-2xs`}>
              <IconComponent className="w-4 h-4" />
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${style.badge}`}>
              {account.accountType}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${account.status === 'active' ? 'bg-[#E5F8F1] text-[#229A73]' : 'bg-[#F1FAFA] text-[#8EA3A5]'}`}>
              {account.status === 'active' ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )}
              <span>{account.status === 'active' ? (language === 'bn' ? 'সচল' : 'Active') : (language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive')}</span>
            </span>

            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(account);
                }}
                className="p-1 rounded-lg text-[#8EA3A5] hover:text-[#F3B562] hover:bg-[#FFF3DF] transition-colors"
                title="Edit Account"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onDelete) {
                  onDelete(account.id);
                } else {
                  deleteAccount(account.id);
                }
              }}
              className="p-1 rounded-lg text-[#8EA3A5] hover:text-[#EA7185] hover:bg-[#FDECEF] transition-colors"
              title="Delete Account"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Account Title & Bank Info */}
        <h3 className="font-extrabold text-base text-[#17383B] tracking-tight group-hover:text-[#0B9FA5] transition-colors">
          {account.accountName}
        </h3>

        {(account.bankName || account.branch) && (
          <p className="text-xs font-semibold text-[#688285] mt-0.5 truncate">
            {account.bankName} {account.branch ? `• ${account.branch}` : ''}
          </p>
        )}

        {account.accountNumber && (
          <div className="mt-2.5 font-mono text-[11px] font-bold text-[#8EA3A5] bg-[#F1FAFA] px-2.5 py-1 rounded-lg inline-block">
            {formatAccNo(account.accountNumber)}
          </div>
        )}
      </div>

      {/* Balance & Action Buttons */}
      <div className="mt-5 pt-4 border-t border-[#E6F0F1]">
        <div className="flex items-baseline justify-between gap-2 mb-3.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8EA3A5]">
            {language === 'bn' ? 'বর্তমান ব্যালেন্স' : 'Available Balance'}
          </span>
          <span className={`text-lg sm:text-xl font-black ${style.accentText} tracking-tight`}>
            {formatCurrency(account.currentBalance, language)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onSelect(account)}
            className="w-full px-3 py-2 rounded-xl bg-[#F1FAFA] hover:bg-[#DDF4F3] text-[#17383B] hover:text-[#0B9FA5] text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'স্টেটমেন্ট' : 'Statement'}</span>
          </button>

          <button
            type="button"
            onClick={() => onTransfer(account)}
            className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white text-xs font-bold shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'ট্রান্সফার' : 'Transfer'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
