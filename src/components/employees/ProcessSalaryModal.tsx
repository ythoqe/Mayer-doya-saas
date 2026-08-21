import React, { useState } from 'react';
import { PayrollRecord } from './types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency } from '../../utils/translation';
import { X, DollarSign, CreditCard, Landmark, Calendar, FileText, CheckCircle2, Check, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProcessSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  payrollRecord: PayrollRecord | null;
  onConfirmPayment: (recordId: string, paymentData: {
    accountId: string;
    accountName: string;
    amount: number;
    paymentDate: string;
    reference: string;
    notes?: string;
  }) => void;
}

export const ProcessSalaryModal: React.FC<ProcessSalaryModalProps> = ({
  isOpen,
  onClose,
  payrollRecord,
  onConfirmPayment
}) => {
  const { t, language, accounts } = useERP();

  const [accountId, setAccountId] = useState(accounts[0]?.id || 'acc-1');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState(`SAL-${payrollRecord?.month || '2026-08'}-${Math.floor(100 + Math.random() * 900)}`);
  const [notes, setNotes] = useState('');

  if (!isOpen || !payrollRecord) return null;

  const selectedAccount = accounts.find(a => a.id === accountId);
  const netAmount = payrollRecord.netSalary;
  const isInsufficient = selectedAccount && selectedAccount.currentBalance < netAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    onConfirmPayment(payrollRecord.id, {
      accountId,
      accountName: selectedAccount.accountName,
      amount: netAmount,
      paymentDate,
      reference,
      notes: notes || `Salary disbursement for ${payrollRecord.employeeName} (${payrollRecord.month})`
    });

    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-[#17383B]/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white rounded-[24px] shadow-[0_24px_60px_rgba(23,56,59,0.22)] border border-[#D9EAEB] overflow-hidden my-6"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#E6F0F1] flex items-center justify-between bg-gradient-to-r from-[#F1FAFA] to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#17383B]">
                  {t('paySalaryBtn')}
                </h3>
                <p className="text-xs text-[#688285]">
                  {payrollRecord.employeeName} • {payrollRecord.month}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-black/5 text-[#8EA3A5] hover:text-[#17383B] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Salary Breakdown Summary */}
          <div className="p-6 bg-[#F8FCFC] border-b border-[#E6F0F1] space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#688285]">{t('basicSalaryCol')}</span>
              <span className="font-bold text-[#17383B]">{formatCurrency(payrollRecord.basicSalary, language)}</span>
            </div>

            {payrollRecord.advanceDeduction > 0 && (
              <div className="flex justify-between items-center text-xs text-red-500">
                <span>{t('advanceCol')}</span>
                <span className="font-bold">-{formatCurrency(payrollRecord.advanceDeduction, language)}</span>
              </div>
            )}

            {payrollRecord.bonus > 0 && (
              <div className="flex justify-between items-center text-xs text-[#1E9B71]">
                <span>Overtime / Incentive</span>
                <span className="font-bold">+{formatCurrency(payrollRecord.bonus, language)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-[#D9EAEB] flex justify-between items-center">
              <span className="text-xs font-extrabold text-[#17383B] uppercase tracking-wider">{t('netSalaryCol')}</span>
              <span className="text-base font-black text-[#0B9FA5]">{formatCurrency(netAmount, language)}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Account Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-[#0B9FA5]" />
                <span>{language === 'bn' ? 'প্রদানের ব্যাংক / অ্যাকাউন্ট' : 'Disbursement Account'}</span>
                <span className="text-red-500">*</span>
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9EAEB] bg-white text-[#17383B] focus:outline-none focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountName} (Balance: {formatCurrency(acc.currentBalance, language)})
                  </option>
                ))}
              </select>
              {isInsufficient && (
                <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'সতর্কতা: অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই।' : 'Warning: Account balance is less than salary amount.'}</span>
                </p>
              )}
            </div>

            {/* Payment Date & Reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#0B9FA5]" />
                  <span>{language === 'bn' ? 'পরিশোধের তারিখ' : 'Payment Date'}</span>
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9EAEB] bg-white text-[#17383B] focus:outline-none focus:border-[#0B9FA5]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#0B9FA5]" />
                  <span>{language === 'bn' ? 'ভাউচার / রেফারেন্স' : 'Reference / Voucher'}</span>
                </label>
                <input
                  type="text"
                  required
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. BEFTN-AUG-01"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9EAEB] bg-white text-[#17383B] focus:outline-none focus:border-[#0B9FA5]"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17383B]">
                {language === 'bn' ? 'মন্তব্য (ঐচ্ছিক)' : 'Payment Notes (Optional)'}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={language === 'bn' ? 'ব্যাংক ট্রান্সফার স্লিপ বা ক্যাশ মেমো নোট...' : 'Bank transfer note or voucher remarks...'}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9EAEB] bg-white text-[#17383B] focus:outline-none focus:border-[#0B9FA5]"
              />
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[#E6F0F1] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#688285] hover:text-[#17383B] hover:bg-black/5 rounded-xl transition-colors"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#08868C] hover:to-[#0B9FA5] text-white text-xs font-bold shadow-[0_4px_16px_rgba(11,159,165,0.28)] transition-all hover:-translate-y-0.5 active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>{language === 'bn' ? 'বেতন অনুমোদন ও পরিশোধ' : 'Confirm Disbursement'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
