import React, { useState } from 'react';
import { Cheque, Account, ChequeStatus } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency } from '../../utils/translation';
import { 
  FileText, 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Landmark, 
  Calendar, 
  User, 
  ArrowRight, 
  ArrowDownLeft,
  ArrowUpRight,
  Edit2, 
  Trash2,
  ShieldCheck,
  Building2,
  Layers
} from 'lucide-react';
import { motion } from 'motion/react';

interface ChequeDetailsModalProps {
  cheque: Cheque | null;
  onClose: () => void;
  onUpdateStatus: (status: ChequeStatus) => void;
  onEndorse?: (cheque: Cheque) => void;
  onEdit?: (cheque: Cheque) => void;
  onDelete?: (id: string) => void;
}

export const ChequeDetailsModal: React.FC<ChequeDetailsModalProps> = ({
  cheque,
  onClose,
  onUpdateStatus,
  onEndorse,
  onEdit,
  onDelete
}) => {
  const { cheques, accounts, deleteCheque, language, t } = useERP();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!cheque) return null;

  const isNormalizedClear = cheque.status === 'Clear' || cheque.status === 'Cleared';
  const isNormalizedCancel = cheque.status === 'Cancel' || cheque.status === 'Cancelled' || cheque.status === 'Bounced';
  const isPending = !isNormalizedClear && !isNormalizedCancel;

  const linkedAccount = accounts.find(a => a.id === cheque.accountId);
  const isEndorsed = cheque.isEndorsed || cheque.sourceChequeId || cheque.endorsedToChequeId;
  const linkedChequeId = cheque.sourceChequeId || cheque.endorsedToChequeId;
  const linkedCheque = linkedChequeId ? cheques.find(c => c.id === linkedChequeId) : null;

  const getStatusBadge = () => {
    if (isNormalizedClear) {
      return {
        icon: CheckCircle2,
        text: language === 'bn' ? '✓ Clear (ক্লিয়ারড)' : 'Clear',
        class: 'bg-[#E5F8F1] text-[#229A73] border-[#38C99A]/30'
      };
    } else if (isNormalizedCancel) {
      return {
        icon: XCircle,
        text: language === 'bn' ? '✕ Cancel (বাতিল)' : 'Cancel',
        class: 'bg-[#FDECEF] text-[#C93B55] border-[#EA7185]/30'
      };
    } else {
      return {
        icon: Clock,
        text: language === 'bn' ? '⏳ Pending (অপেক্ষমাণ)' : 'Pending',
        class: 'bg-[#FFF3DF] text-[#C47D1C] border-[#F3B562]/30'
      };
    }
  };

  const statusBadge = getStatusBadge();
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
            <div className={`w-10 h-10 rounded-xl ${cheque.direction === 'received' ? 'bg-gradient-to-br from-[#0B9FA5] to-[#16B8B0]' : 'bg-gradient-to-br from-[#6357E8] to-[#4838D1]'} text-white flex items-center justify-center shadow-xs shrink-0`}>
              {cheque.direction === 'received' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-[#17383B]">
                  Cheque #{cheque.chequeNumber}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${statusBadge.class}`}>
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
        <div className="p-6 space-y-5">
          {/* Amount Showcase Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F1FAFA] via-[#E5F8F1]/40 to-white border border-[#D9EAEB] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#688285]">
                {language === 'bn' ? 'চেকের নির্ধারিত মূল্য' : 'Cheque Face Value'}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[#0B9FA5] tracking-tight mt-0.5">
                {formatCurrency(cheque.amount, language)}
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-white border border-[#D9EAEB] text-[#17383B]">
                {cheque.direction === 'received' 
                  ? (language === 'bn' ? '📥 প্রাপ্ত চেক (Client)' : 'Inward Cheque') 
                  : (language === 'bn' ? '📤 প্রদত্ত চেক (Supplier)' : 'Outward Cheque')}
              </span>
            </div>
          </div>

          {/* Endorsement Chain Banner if linked */}
          {isEndorsed && (
            <div className="p-3.5 rounded-xl bg-[#EEEBFF] border border-[#D1CAFF] space-y-1.5 text-xs text-[#382BB8]">
              <div className="font-black flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#6357E8]" />
                {language === 'bn' ? 'সাপ্লায়ার অ্যান্ডোর্সমেন্ট ট্র্যাকিং:' : 'Endorsement Chain:'}
              </div>
              <div className="text-[11px] text-[#4838D1] leading-relaxed">
                {cheque.direction === 'received' ? (
                  <span>
                    {language === 'bn' 
                      ? `এই চেকটি মহাজন "${cheque.endorsedToSupplierName || 'Supplier'}" কে প্রদান করা হয়েছে। মহাজন কর্তৃক টাকা উত্তোলন (Clear) হলে ক্লায়েন্টের চেকটিও স্বয়ংক্রিয়ভাবে ক্লিয়ার হবে।` 
                      : `This cheque was endorsed to supplier "${cheque.endorsedToSupplierName || 'Supplier'}".`}
                  </span>
                ) : (
                  <span>
                    {language === 'bn' 
                      ? `এই চেকটি মূল ক্লায়েন্ট "${cheque.clientName || 'Client'}" এর নিকট থেকে প্রাপ্ত চেক ফরোয়ার্ড করা হয়েছে।` 
                      : `Forwarded from client "${cheque.clientName || 'Client'}".`}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Key Specifications Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#F8FAFB] border border-[#E6F0F1] space-y-1">
              <span className="text-[#8EA3A5] font-semibold flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {language === 'bn' ? 'পার্টি / প্রতিষ্ঠান:' : 'Party Name:'}
              </span>
              <p className="font-extrabold text-[#17383B] truncate">
                {cheque.partyName} ({cheque.partyType === 'Client' ? (language === 'bn' ? 'গ্রাহক' : 'Client') : (language === 'bn' ? 'মহাজন' : 'Supplier')})
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFB] border border-[#E6F0F1] space-y-1">
              <span className="text-[#8EA3A5] font-semibold flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5" />
                {language === 'bn' ? 'ড্রয়ার ব্যাংক:' : 'Drawer Bank:'}
              </span>
              <p className="font-extrabold text-[#17383B] truncate">
                {cheque.bankName}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFB] border border-[#E6F0F1] space-y-1">
              <span className="text-[#8EA3A5] font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {language === 'bn' ? 'ইস্যু তারিখ:' : 'Issue Date:'}
              </span>
              <p className="font-bold text-[#17383B]">
                {cheque.issueDate}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFB] border border-[#E6F0F1] space-y-1">
              <span className="text-[#8EA3A5] font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {language === 'bn' ? 'ক্লিয়ারিং তারিখ:' : 'Clearing Date:'}
              </span>
              <p className="font-bold text-[#17383B]">
                {cheque.clearingDate || cheque.issueDate}
              </p>
            </div>
          </div>

          {/* Notes & Account */}
          {(cheque.notes || linkedAccount || cheque.cancelReason) && (
            <div className="p-3.5 rounded-xl bg-[#F8FAFB] border border-[#E6F0F1] space-y-2 text-xs">
              {linkedAccount && (
                <div className="flex justify-between items-center pb-2 border-b border-[#E6F0F1]">
                  <span className="text-[#8EA3A5] font-semibold">{language === 'bn' ? 'নির্দিষ্ট ব্যাংক একাউন্ট:' : 'Bank Account:'}</span>
                  <span className="font-bold text-[#17383B]">{linkedAccount.accountName}</span>
                </div>
              )}
              {cheque.notes && (
                <div className="text-[#688285] leading-relaxed">
                  <strong className="text-[#17383B]">{language === 'bn' ? 'নোট: ' : 'Notes: '}</strong>
                  {cheque.notes}
                </div>
              )}
              {cheque.cancelReason && (
                <div className="text-[#C93B55] leading-relaxed">
                  <strong>{language === 'bn' ? 'বাতিলের কারণ: ' : 'Cancel Reason: '}</strong>
                  {cheque.cancelReason}
                </div>
              )}
            </div>
          )}

          {/* Status Action Buttons (Clear, Cancel, Pending, Endorse) */}
          <div className="space-y-2 pt-2 border-t border-[#D9EAEB]">
            <span className="text-[11px] font-extrabold text-[#688285] uppercase tracking-wider block">
              {language === 'bn' ? 'স্ট্যাটাস ও অপারেশন পরিবর্তন' : 'Change Cheque Status'}
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              {isPending && (
                <>
                  {/* If received client cheque, allow endorsing to supplier */}
                  {(cheque.direction === 'received' || cheque.partyType === 'Client') && !cheque.isEndorsed && onEndorse && (
                    <button
                      type="button"
                      onClick={() => onEndorse(cheque)}
                      className="px-3.5 py-2 rounded-xl bg-[#EEEBFF] hover:bg-[#D1CAFF] text-[#4838D1] text-xs font-black transition-colors flex items-center gap-1.5"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      {language === 'bn' ? 'সাপ্লায়ারকে দিন (Endorse)' : 'Endorse to Supplier'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onUpdateStatus('Clear')}
                    className="px-3.5 py-2 rounded-xl bg-[#E5F8F1] hover:bg-[#D1F2E6] text-[#229A73] text-xs font-black transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {language === 'bn' ? '✓ Clear (টাকা উত্তোলন / ক্লিয়ার)' : 'Clear Cheque'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateStatus('Cancel')}
                    className="px-3.5 py-2 rounded-xl bg-[#FDECEF] hover:bg-[#FCD8DF] text-[#C93B55] text-xs font-black transition-colors flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    {language === 'bn' ? '✕ Cancel (বাতিল)' : 'Cancel Cheque'}
                  </button>
                </>
              )}

              {!isPending && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus('Pending')}
                  className="px-3.5 py-2 rounded-xl bg-[#FFF3DF] hover:bg-[#FFE6C2] text-[#C47D1C] text-xs font-black transition-colors flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {language === 'bn' ? 'পুনরায় Pending করুন' : 'Reset to Pending'}
                </button>
              )}
            </div>
          </div>

          {/* Footer Actions (Edit, Delete, Close) */}
          <div className="flex items-center justify-between pt-3 border-t border-[#D9EAEB]">
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(cheque)}
                  className="px-3 py-1.5 rounded-lg border border-[#D9EAEB] hover:bg-[#F1FAFA] text-[#17383B] text-xs font-bold flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#0B9FA5]" />
                  {language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(cheque.id);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {language === 'bn' ? 'মুছুন' : 'Delete'}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#17383B] hover:bg-[#102729] text-white text-xs font-bold transition-colors"
            >
              {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
