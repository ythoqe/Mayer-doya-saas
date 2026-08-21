import React from 'react';
import { Cheque, Account } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency } from '../../utils/translation';
import { FileText, X, CheckCircle2, AlertOctagon, XCircle, Clock, Landmark, Calendar, User, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface ChequeDetailsModalProps {
  cheque: Cheque | null;
  onClose: () => void;
  onUpdateStatus: (status: Cheque['status']) => void;
}

export const ChequeDetailsModal: React.FC<ChequeDetailsModalProps> = ({
  cheque,
  onClose,
  onUpdateStatus
}) => {
  const { accounts, language, t } = useERP();

  if (!cheque) return null;

  const linkedAccount = accounts.find(a => a.id === cheque.accountId);

  const getStatusBadge = (status: Cheque['status']) => {
    switch (status) {
      case 'Pending':
        return {
          icon: Clock,
          text: language === 'bn' ? 'অপেক্ষমাণ (Pending)' : 'Pending Clearance',
          class: 'bg-[#FFF3DF] text-[#C47D1C] border-[#F3B562]/30'
        };
      case 'Cleared':
        return {
          icon: CheckCircle2,
          text: language === 'bn' ? 'ক্লিয়ারড (Cleared)' : 'Cleared & Credited',
          class: 'bg-[#E5F8F1] text-[#229A73] border-[#38C99A]/30'
        };
      case 'Bounced':
        return {
          icon: AlertOctagon,
          text: language === 'bn' ? 'বাউন্সড (Bounced)' : 'Dishonored / Bounced',
          class: 'bg-[#FDECEF] text-[#C93B55] border-[#EA7185]/30'
        };
      case 'Cancelled':
      default:
        return {
          icon: XCircle,
          text: language === 'bn' ? 'বাতিলকৃত (Cancelled)' : 'Cancelled',
          class: 'bg-[#F1FAFA] text-[#8EA3A5] border-[#D9EAEB]'
        };
    }
  };

  const statusBadge = getStatusBadge(cheque.status);
  const StatusIcon = statusBadge.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17383B]/40 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#D9EAEB] overflow-hidden my-6"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#F1FAFA] to-[#E5F8F1] border-b border-[#D9EAEB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B9FA5] to-[#16B8B0] text-white flex items-center justify-center shadow-xs shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-[#17383B]">
                  Cheque #{cheque.chequeNumber}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${statusBadge.class}`}>
                  {statusBadge.text}
                </span>
              </div>
              <p className="text-xs text-[#688285]">
                {cheque.bankName} • {cheque.partyName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/80 text-[#8EA3A5] hover:text-[#17383B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Main Amount Card */}
          <div className="p-4 rounded-xl bg-[#F8FAFB] border border-[#E6F0F1] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8EA3A5] block">
                {language === 'bn' ? 'চেকের নির্ধারিত পরিমাণ' : 'Cheque Settlement Amount'}
              </span>
              <span className="text-2xl font-black text-[#0B9FA5] tracking-tight">
                {formatCurrency(cheque.amount, language)}
              </span>
            </div>
            <div className="text-right text-xs">
              <span className="text-[10px] text-[#8EA3A5] uppercase font-bold block">{language === 'bn' ? 'পার্টির শ্রেণি' : 'Party Type'}</span>
              <span className="font-extrabold text-[#17383B] px-2.5 py-0.5 bg-white rounded-lg border border-[#D9EAEB] inline-block mt-0.5">
                {cheque.partyType}
              </span>
            </div>
          </div>

          {/* Workflow Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#688285]">
              {language === 'bn' ? 'ক্লিয়ারেন্স প্রসেসিং ট্র্যাকিং' : 'Cheque Clearing Workflow'}
            </h4>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D9EAEB]">
              {/* Step 1 */}
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-[#0B9FA5] text-white flex items-center justify-center text-[9px] font-bold">
                  ✓
                </div>
                <div className="text-xs">
                  <span className="font-extrabold text-[#17383B] block">{language === 'bn' ? 'চেক ইস্যু / গ্রহণ সম্পন্ন' : 'Cheque Received & Registered'}</span>
                  <span className="text-[#8EA3A5] text-[11px]">{cheque.issueDate} • {cheque.bankName}</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${cheque.status !== 'Pending' ? 'bg-[#0B9FA5] text-white' : 'bg-[#F3B562] text-white animate-pulse'}`}>
                  {cheque.status !== 'Pending' ? '✓' : '•'}
                </div>
                <div className="text-xs">
                  <span className="font-extrabold text-[#17383B] block">{language === 'bn' ? 'ব্যাংক ক্লিয়ারিং হাউজে প্রক্রিয়াধীন' : 'Submitted for Bank Clearing'}</span>
                  <span className="text-[#8EA3A5] text-[11px]">
                    {cheque.clearingDate ? `${language === 'bn' ? 'প্রত্যাশিত ক্লিয়ারিং:' : 'Target Date:'} ${cheque.clearingDate}` : 'Processing'}
                  </span>
                </div>
              </div>

              {/* Step 3 Final */}
              <div className="relative">
                <div className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  cheque.status === 'Cleared' ? 'bg-[#38C99A] text-white' :
                  cheque.status === 'Bounced' ? 'bg-[#EA7185] text-white' :
                  cheque.status === 'Cancelled' ? 'bg-[#8EA3A5] text-white' : 'bg-[#D9EAEB] text-[#8EA3A5]'
                }`}>
                  {cheque.status === 'Cleared' ? '✓' : cheque.status === 'Bounced' ? '!' : '3'}
                </div>
                <div className="text-xs">
                  <span className="font-extrabold text-[#17383B] block">
                    {cheque.status === 'Cleared' ? (language === 'bn' ? 'ব্যাংক একাউন্টে জমা সম্পন্ন' : 'Settled & Deposited into Bank') :
                     cheque.status === 'Bounced' ? (language === 'bn' ? 'চেক বাউন্স / প্রত্যাখ্যাত' : 'Cheque Bounced / Dishonored') :
                     cheque.status === 'Cancelled' ? (language === 'bn' ? 'চেক বাতিল করা হয়েছে' : 'Cheque Record Cancelled') :
                     (language === 'bn' ? 'চূড়ান্ত ক্লিয়ারেন্স অপেক্ষমাণ' : 'Awaiting Final Bank Clearance')}
                  </span>
                  {linkedAccount && (
                    <span className="text-[#0B9FA5] font-semibold text-[11px] block mt-0.5">
                      {language === 'bn' ? 'সংশ্লিষ্ট একাউন্ট:' : 'Target Account:'} {linkedAccount.accountName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Remarks */}
          {cheque.notes && (
            <div className="p-3 bg-[#F1FAFA] rounded-xl border border-[#D9EAEB] text-xs">
              <span className="font-bold text-[#17383B] block mb-0.5">{language === 'bn' ? 'নোট / বিবরণ:' : 'Notes / Remarks:'}</span>
              <p className="text-[#688285]">{cheque.notes}</p>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-[#F1FAFA] border-t border-[#D9EAEB] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#D9EAEB] hover:bg-white text-xs font-bold text-[#688285] transition-colors"
          >
            {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>

          {cheque.status === 'Pending' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onUpdateStatus('Bounced')}
                className="px-3 py-2 rounded-xl bg-[#FDECEF] hover:bg-[#EA7185] text-[#C93B55] hover:text-white text-xs font-bold transition-colors"
              >
                {t('markAsBouncedBtn')}
              </button>
              <button
                type="button"
                onClick={() => onUpdateStatus('Cleared')}
                className="px-4 py-2 rounded-xl bg-[#229A73] hover:bg-[#1C8260] text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('markAsClearedBtn')}</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
