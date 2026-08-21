import React from 'react';
import { Cheque, Account } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency } from '../../utils/translation';
import { CheckCircle2, AlertOctagon, XCircle, X, ShieldAlert, Landmark, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface ChequeClearConfirmModalProps {
  cheque: Cheque | null;
  targetStatus: Cheque['status'];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ChequeClearConfirmModal: React.FC<ChequeClearConfirmModalProps> = ({
  cheque,
  targetStatus,
  isOpen,
  onClose,
  onConfirm
}) => {
  const { accounts, language, t } = useERP();

  if (!isOpen || !cheque) return null;

  const linkedAccount = accounts.find(a => a.id === cheque.accountId) || accounts[0];

  const getModalConfig = () => {
    switch (targetStatus) {
      case 'Cleared':
        return {
          title: language === 'bn' ? 'চেক ক্লিয়ারেন্স ও ব্যাংক ডিপোজিট নিশ্চিত করুন' : 'Confirm Cheque Clearance & Bank Deposit',
          desc: language === 'bn' ? 'এই চেকটি ক্লিয়ার হিসেবে চিহ্নিত করলে সংশ্লিষ্ট ব্যাংক একাউন্টের ব্যালেন্স আপডেট হবে।' : 'Marking this cheque as cleared will deposit funds into the linked corporate account balance.',
          icon: CheckCircle2,
          iconBg: 'bg-[#E5F8F1] text-[#229A73]',
          btnClass: 'bg-[#229A73] hover:bg-[#1C8260] text-white',
          confirmText: language === 'bn' ? 'ক্লিয়ার করুন ও ব্যালেন্স যোগ করুন' : 'Confirm Clearance & Credit Bank'
        };
      case 'Bounced':
        return {
          title: language === 'bn' ? 'চেক বাউন্স চিহ্নিতকরণ' : 'Mark Cheque as Bounced / Dishonored',
          desc: language === 'bn' ? 'চেকটি বাউন্সড হিসেবে চিহ্নিত হবে এবং কোনো ব্যালেন্স পরিবর্তন হবে না।' : 'The cheque will be recorded as bounced/dishonored. No bank funds will be credited.',
          icon: AlertOctagon,
          iconBg: 'bg-[#FDECEF] text-[#C93B55]',
          btnClass: 'bg-[#C93B55] hover:bg-[#A82B42] text-white',
          confirmText: language === 'bn' ? 'বাউন্সড হিসেবে মার্ক করুন' : 'Confirm Dishonor / Bounce'
        };
      case 'Cancelled':
      default:
        return {
          title: language === 'bn' ? 'চেক বাতিল নিশ্চিতকরণ' : 'Cancel Cheque Record',
          desc: language === 'bn' ? 'এই চেকের স্থিতি বাতিল হবে।' : 'The cheque record will be cancelled.',
          icon: XCircle,
          iconBg: 'bg-[#F1FAFA] text-[#8EA3A5]',
          btnClass: 'bg-[#688285] hover:bg-[#4E6467] text-white',
          confirmText: language === 'bn' ? 'বাতিল নিশ্চিত করুন' : 'Confirm Cancellation'
        };
    }
  };

  const config = getModalConfig();
  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17383B]/40 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#D9EAEB] overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E6F0F1] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center shrink-0 shadow-2xs`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#17383B]">
                {config.title}
              </h3>
              <p className="text-[11px] text-[#688285]">
                Cheque #{cheque.chequeNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#F1FAFA] text-[#8EA3A5] hover:text-[#17383B]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-[#688285] leading-relaxed">
            {config.desc}
          </p>

          <div className="p-4 rounded-xl bg-[#F8FAFB] border border-[#E6F0F1] space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-[#E6F0F1]">
              <span className="text-[#8EA3A5] font-semibold">{language === 'bn' ? 'পার্টি / গ্রাহক:' : 'Party Name:'}</span>
              <span className="font-extrabold text-[#17383B]">{cheque.partyName} ({cheque.partyType})</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#E6F0F1]">
              <span className="text-[#8EA3A5] font-semibold">{language === 'bn' ? 'ড্রয়ার ব্যাংক:' : 'Drawer Bank:'}</span>
              <span className="font-bold text-[#17383B]">{cheque.bankName}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#E6F0F1]">
              <span className="text-[#8EA3A5] font-semibold">{language === 'bn' ? 'চেকের পরিমাণ:' : 'Cheque Amount:'}</span>
              <span className="font-black text-sm text-[#0B9FA5]">{formatCurrency(cheque.amount, language)}</span>
            </div>

            {targetStatus === 'Cleared' && linkedAccount && (
              <div className="flex justify-between items-center py-1 text-[#229A73]">
                <span className="font-semibold flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'জমা ব্যাংক:' : 'Deposit Bank:'}</span>
                </span>
                <span className="font-extrabold">{linkedAccount.accountName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F1FAFA] border-t border-[#D9EAEB] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#D9EAEB] hover:bg-white text-xs font-bold text-[#688285] transition-colors"
          >
            {language === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all ${config.btnClass}`}
          >
            {config.confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
