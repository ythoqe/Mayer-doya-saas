import React, { useState } from 'react';
import { Cheque, ChequeStatus } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency } from '../../utils/translation';
import { CheckCircle2, XCircle, Clock, X, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface ChequeClearConfirmModalProps {
  cheque: Cheque | null;
  targetStatus: ChequeStatus;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
}

export const ChequeClearConfirmModal: React.FC<ChequeClearConfirmModalProps> = ({
  cheque,
  targetStatus,
  isOpen,
  onClose,
  onConfirm
}) => {
  const { cheques, accounts, language } = useERP();
  const [cancelReason, setCancelReason] = useState('');

  if (!isOpen || !cheque) return null;

  const isNormalizedClear = targetStatus === 'Clear' || targetStatus === 'Cleared';
  const isNormalizedCancel = targetStatus === 'Cancel' || targetStatus === 'Cancelled' || targetStatus === 'Bounced';
  const isNormalizedPending = targetStatus === 'Pending';

  // Check if linked
  const isEndorsedTransfer = !!(cheque.sourceChequeId || cheque.isEndorsed || cheque.endorsedToChequeId);
  const linkedChequeId = cheque.sourceChequeId || cheque.endorsedToChequeId;
  const linkedCheque = linkedChequeId ? cheques.find(c => c.id === linkedChequeId) : null;

  const linkedAccount = accounts.find(a => a.id === cheque.accountId) || accounts[0];

  const getModalConfig = () => {
    if (isNormalizedClear) {
      return {
        title: language === 'bn' ? 'চেক ক্লিয়ারেন্স ও টাকা উত্তোলন নিশ্চিত করুন' : 'Confirm Cheque Clearance',
        desc: isEndorsedTransfer
          ? (language === 'bn' 
              ? 'মহাজন চেক থেকে টাকা উত্তোলন সম্পন্ন করেছেন। এটি কনফার্ম করলে মূল ক্লায়েন্টের চেকটিও স্বয়ংক্রিয়ভাবে Clear হবে এবং উভয়ের লেজার ব্যালেন্স সমন্বয় হবে।' 
              : 'The supplier has encashed the cheque. Confirming will also clear the linked client cheque and update both ledger accounts.')
          : (language === 'bn' 
              ? 'চেকটি ক্লিয়ার হিসেবে চিহ্নিত করা হলে সংশ্লিষ্ট ব্যাংক একাউন্টের ব্যালেন্স এবং পার্টির লেজার আপডেট হবে।' 
              : 'Marking this cheque as cleared will deposit funds into the corporate account and reconcile party balance.'),
        icon: CheckCircle2,
        iconBg: 'bg-[#E5F8F1] text-[#229A73]',
        btnClass: 'bg-[#229A73] hover:bg-[#1C8260] text-white',
        confirmText: language === 'bn' ? '✓ ক্লিয়ার (Clear) নিশ্চিত করুন' : 'Confirm Clearance'
      };
    } else if (isNormalizedCancel) {
      return {
        title: language === 'bn' ? 'চেক বাতিল (Cancel) নিশ্চিতকরণ' : 'Confirm Cheque Cancellation',
        desc: isEndorsedTransfer
          ? (language === 'bn'
              ? 'চেকটি বাতিল হিসেবে চিহ্নিত হবে। সংশ্লিষ্ট মূল ক্লায়েন্ট ও সাপ্লায়ার উভয়ের চেকের স্ট্যাটাস Cancel হিসেবে আপডেট হবে।'
              : 'The cheque will be marked as Cancelled. Both linked client and supplier cheque records will update.')
          : (language === 'bn'
              ? 'এই চেকটি বাতিল (Cancel) হিসেবে নথিভুক্ত হবে।'
              : 'This cheque record will be marked as Cancelled.'),
        icon: XCircle,
        iconBg: 'bg-[#FDECEF] text-[#C93B55]',
        btnClass: 'bg-[#C93B55] hover:bg-[#A82B42] text-white',
        confirmText: language === 'bn' ? '✕ বাতিল (Cancel) নিশ্চিত করুন' : 'Confirm Cancellation'
      };
    } else {
      return {
        title: language === 'bn' ? 'চেক স্ট্যাটাস অপেক্ষমাণ (Pending) করুন' : 'Set Cheque to Pending',
        desc: language === 'bn' ? 'চেকের স্ট্যাটাস পুনরায় অপেক্ষমাণ (Pending) হিসেবে আপডেট করা হবে।' : 'Cheque status will be reset to Pending.',
        icon: Clock,
        iconBg: 'bg-[#FFF3DF] text-[#C47D1C]',
        btnClass: 'bg-[#C47D1C] hover:bg-[#9E6213] text-white',
        confirmText: language === 'bn' ? 'Pending নিশ্চিত করুন' : 'Set Pending'
      };
    }
  };

  const config = getModalConfig();
  const IconComponent = config.icon;

  const handleExecute = () => {
    onConfirm(cancelReason.trim() || undefined);
  };

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
              <span className="text-[#8EA3A5] font-semibold">{language === 'bn' ? 'পার্টি / হিসাব:' : 'Party Name:'}</span>
              <span className="font-extrabold text-[#17383B]">{cheque.partyName} ({cheque.partyType === 'Client' ? (language === 'bn' ? 'গ্রাহক' : 'Client') : (language === 'bn' ? 'মহাজন' : 'Supplier')})</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#E6F0F1]">
              <span className="text-[#8EA3A5] font-semibold">{language === 'bn' ? 'ড্রয়ার ব্যাংক:' : 'Drawer Bank:'}</span>
              <span className="font-bold text-[#17383B]">{cheque.bankName}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#E6F0F1]">
              <span className="text-[#8EA3A5] font-semibold">{language === 'bn' ? 'চেকের পরিমাণ:' : 'Cheque Amount:'}</span>
              <span className="font-black text-sm text-[#0B9FA5]">{formatCurrency(cheque.amount, language)}</span>
            </div>

            {isEndorsedTransfer && (
              <div className="p-2.5 rounded-lg bg-[#EEEBFF] border border-[#D1CAFF] text-[11px] text-[#4838D1] space-y-1">
                <div className="font-black flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {language === 'bn' ? 'লিঙ্কড অ্যান্ডোর্সমেন্ট ট্র্যাকিং:' : 'Linked Endorsement Chain:'}
                </div>
                <div>
                  {language === 'bn'
                    ? `মূল ক্লায়েন্ট: ${cheque.clientName || 'Client'} ➜ প্রাপক মহাজন: ${cheque.supplierName || cheque.partyName}`
                    : `Original Client: ${cheque.clientName || 'Client'} ➜ Recipient Supplier: ${cheque.supplierName || cheque.partyName}`}
                </div>
              </div>
            )}
          </div>

          {/* If cancelling: prompt for cancellation reason */}
          {isNormalizedCancel && (
            <div>
              <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                {language === 'bn' ? 'বাতিল বা রিজেকশনের কারণ (ঐচ্ছিক)' : 'Cancellation / Rejection Reason (Optional)'}
              </label>
              <input
                type="text"
                placeholder={language === 'bn' ? 'যেমন: পার্টি চেক বাউন্স করেছে / তহবিল স্বল্পতা' : 'e.g. Signature mismatch or insufficient funds'}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D9EAEB] bg-white text-xs text-[#17383B] focus:border-[#C93B55] focus:outline-none"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6F0F1]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#688285] hover:bg-[#F1FAFA] rounded-xl transition-colors"
            >
              {language === 'bn' ? 'ফিরে যান' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleExecute}
              className={`px-5 py-2.5 text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 ${config.btnClass}`}
            >
              {config.confirmText}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
