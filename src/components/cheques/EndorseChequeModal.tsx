import React, { useState } from 'react';
import { Cheque, Supplier } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency } from '../../utils/translation';
import { ArrowUpRight, X, CheckCircle2, Building2, Landmark, AlertCircle, FileText } from 'lucide-react';
import { motion } from 'motion/react';

interface EndorseChequeModalProps {
  cheque: Cheque | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EndorseChequeModal: React.FC<EndorseChequeModalProps> = ({
  cheque,
  isOpen,
  onClose
}) => {
  const { suppliers, endorseChequeToSupplier, language } = useERP();

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [customSupplierName, setCustomSupplierName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  React.useEffect(() => {
    if (suppliers.length > 0) {
      setSelectedSupplierId(suppliers[0].id);
    }
  }, [suppliers]);

  if (!isOpen || !cheque) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let supplierName = '';
    let supplierId = selectedSupplierId;

    if (selectedSupplierId === 'other') {
      supplierName = customSupplierName.trim() || 'General Supplier';
      supplierId = `sup-${Date.now()}`;
    } else {
      const sup = suppliers.find(s => s.id === selectedSupplierId);
      supplierName = sup ? sup.name : 'General Supplier';
    }

    await endorseChequeToSupplier(cheque.id, supplierId, supplierName, notes);
    setIsSubmitting(false);
    setIsSuccess(true);

    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17383B]/40 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#D9EAEB] overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#EEEBFF] to-[#E5F8F1] border-b border-[#D9EAEB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6357E8] to-[#4838D1] text-white flex items-center justify-center shadow-xs shrink-0">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#17383B]">
                {language === 'bn' ? 'চেক প্রদান / সাপ্লায়ারকে হস্তান্তর (Endorsement)' : 'Endorse Cheque to Supplier'}
              </h3>
              <p className="text-xs text-[#688285]">
                {language === 'bn' ? 'গ্রাহকের চেকটি কেমিক্যাল/সুতা মহাজনকে পেমেন্ট হিসেবে হস্তান্তর করুন' : 'Assign received client cheque to a supplier'}
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

        {/* Body */}
        <div className="p-6">
          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#E5F8F1] text-[#229A73] flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-black text-lg text-[#17383B]">
                {language === 'bn' ? 'চেক সফলভাবে মহাজনকে হস্তান্তর করা হয়েছে!' : 'Cheque Successfully Endorsed to Supplier!'}
              </h4>
              <p className="text-xs text-[#688285]">
                {language === 'bn' 
                  ? 'মহাজন চেক ক্যাশ বা ক্লিয়ার করলে গ্রাহকের চেকটিও স্বয়ংক্রিয়ভাবে ক্লিয়ার হবে।' 
                  : 'When the supplier clears this cheque, the original client cheque will clear automatically.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleConfirm} className="space-y-4">
              {/* Cheque Quick Snapshot Card */}
              <div className="p-4 rounded-xl bg-[#F8FAFB] border border-[#D9EAEB] space-y-2">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E6F0F1]">
                  <span className="text-[#688285] font-semibold">{language === 'bn' ? 'চেক নম্বর:' : 'Cheque No:'}</span>
                  <span className="font-mono font-black text-[#17383B]">#{cheque.chequeNumber}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E6F0F1]">
                  <span className="text-[#688285] font-semibold">{language === 'bn' ? 'মূল গ্রাহক / ক্লায়েন্ট:' : 'From Client:'}</span>
                  <span className="font-bold text-[#17383B]">{cheque.partyName}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E6F0F1]">
                  <span className="text-[#688285] font-semibold">{language === 'bn' ? 'ড্রয়ার ব্যাংক:' : 'Drawer Bank:'}</span>
                  <span className="font-medium text-[#17383B]">{cheque.bankName}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[#688285] font-semibold">{language === 'bn' ? 'চেকের পরিমাণ:' : 'Amount:'}</span>
                  <span className="font-black text-base text-[#0B9FA5]">{formatCurrency(cheque.amount, language)}</span>
                </div>
              </div>

              {/* Supplier Selection */}
              <div>
                <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                  {language === 'bn' ? 'প্রাপক মহাজন / সাপ্লায়ার নির্বাচন করুন' : 'Select Recipient Supplier'} *
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-bold text-[#17383B] focus:border-[#6357E8] focus:outline-none"
                  required
                >
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} ({sup.category}) - বকেয়া: {formatCurrency(sup.balance, language)}
                    </option>
                  ))}
                  <option value="other">{language === 'bn' ? '+ নতুন / অন্যান্য মহাজনের নাম লিখুন' : '+ Other / Custom Supplier'}</option>
                </select>
              </div>

              {selectedSupplierId === 'other' && (
                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'মহাজনের নাম' : 'Supplier Name'} *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Dye-Chem Ltd"
                    value={customSupplierName}
                    onChange={(e) => setCustomSupplierName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs text-[#17383B] focus:border-[#6357E8] focus:outline-none"
                    required
                  />
                </div>
              )}

              {/* Remarks / Notes */}
              <div>
                <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                  {language === 'bn' ? 'হস্তান্তর বিবরণ / ভাউচার নোট' : 'Endorsement Remarks / Notes'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'bn' ? 'যেমন: কেমিক্যাল বিল বাবদ চেক হস্তান্তর' : 'e.g. Handed over against Chemical Lot #402'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs text-[#17383B] focus:border-[#6357E8] focus:outline-none"
                />
              </div>

              {/* Automatic Workflow Notice */}
              <div className="p-3.5 rounded-xl bg-[#FFF9ED] border border-[#FDE6B8] flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                <div className="text-[11px] text-[#92400E] leading-relaxed">
                  <p className="font-bold mb-0.5">{language === 'bn' ? 'স্বয়ংক্রিয় সমন্বয় নিয়মাবলী:' : 'Automated Workflow Rules:'}</p>
                  <p>{language === 'bn' 
                    ? '১. এই চেকটি মহাজনের নামে প্রদান করা হবে (স্ট্যাটাস: Pending)।' 
                    : '1. This cheque is marked as issued to the supplier (Status: Pending).'}</p>
                  <p>{language === 'bn' 
                    ? '২. মহাজন ব্যাংক থেকে টাকা উত্তোলন (Clear) করলে মূল ক্লায়েন্টের চেকটিও ক্লিয়ার হবে এবং উভয়ের লেজার আপডেট হবে।' 
                    : '2. When the supplier clears it, the original client cheque clears automatically and balances adjust.'}</p>
                  <p>{language === 'bn' 
                    ? '৩. চেকটি বাতিল (Cancel) হলে উভয় পক্ষের চেকের স্ট্যাটাস বাতিল হিসেবে নথিভুক্ত হবে।' 
                    : '3. If rejected/cancelled, both records update to Cancel status.'}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9EAEB]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-[#D9EAEB] text-xs font-extrabold text-[#688285] hover:bg-[#F1FAFA]"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6357E8] to-[#4838D1] hover:from-[#5144D3] hover:to-[#3C2BBF] text-white text-xs font-black shadow-xs hover:shadow-md transition-all flex items-center gap-1.5"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  {isSubmitting ? (language === 'bn' ? 'প্রক্রিয়াধীন...' : 'Processing...') : (language === 'bn' ? 'সাপ্লায়ারকে চেক প্রদান নিশ্চিত করুন' : 'Confirm Cheque Endorsement')}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
