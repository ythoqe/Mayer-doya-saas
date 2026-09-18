import React, { useState, useEffect } from 'react';
import { Account, Language } from '../../types';
import { formatCurrency } from '../../utils/translation';
import { X, HandCoins, Landmark, FileText, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProfitPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  distributionId: string;
  investorId: string;
  investorName: string;
  period: string;
  amount: number;
  accounts: Account[];
  onPayout: (distributionId: string, investorId: string, accountId: string, reference?: string, notes?: string) => Promise<void>;
  language: Language;
  t: (key: string) => string;
}

export const ProfitPayoutModal: React.FC<ProfitPayoutModalProps> = ({
  isOpen,
  onClose,
  distributionId,
  investorId,
  investorName,
  period,
  amount,
  accounts,
  onPayout,
  language,
  t
}) => {
  const [accountId, setAccountId] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (accounts.length > 0) {
      setAccountId(accounts[0].id);
    }
    setReference('');
    setNotes('');
    setError('');
  }, [isOpen, accounts]);

  const selectedAccount = accounts.find(a => a.id === accountId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      setError(language === 'bn' ? 'টাকা প্রদানের অ্যাকাউন্ট নির্বাচন করুন' : 'Select payment account');
      return;
    }
    if (selectedAccount && amount > (selectedAccount.currentBalance || 0)) {
      setError(language === 'bn' 
        ? `নির্বাচিত অ্যাকাউন্ট (${selectedAccount.accountName})-এ পর্যাপ্ত ব্যালেন্স নেই (বর্তমান: ${formatCurrency(selectedAccount.currentBalance || 0, language)})` 
        : `Insufficient funds in ${selectedAccount.accountName}`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onPayout(distributionId, investorId, accountId, reference.trim() || undefined, notes.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Payout failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-white rounded-3xl shadow-2xl border border-[#D9EAEB] w-full max-w-md overflow-hidden my-8"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-[#229A73] to-[#17383B] text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-white/20 text-white">
                <HandCoins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
                  {t('payProfit')}
                </h3>
                <p className="text-xs text-white/80">
                  {period}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {error && (
              <div className="p-3 bg-[#FDF4F5] border border-[#F8D2D9] rounded-xl flex items-center gap-2 text-xs text-[#EA7185]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Investor & Amount Card */}
            <div className="bg-[#F1FAFA] p-4 rounded-2xl border border-[#D9EAEB] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#688285] font-medium">{t('investor')}:</span>
                <span className="text-[#17383B] font-extrabold">{investorName}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#688285] font-medium">{t('periodName')}:</span>
                <span className="text-[#17383B] font-semibold">{period}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2 border-t border-[#D9EAEB]">
                <span className="text-[#17383B] font-bold">{t('allocatedProfit')}:</span>
                <span className="text-base font-black text-[#229A73]">{formatCurrency(amount, language)}</span>
              </div>
            </div>

            {/* Paying Account */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-[#0B9FA5]" />
                {t('payingAccount')} *
              </label>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-[#F1FAFA] border border-[#D9EAEB] rounded-xl text-sm text-[#17383B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#229A73]"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountName} ({formatCurrency(acc.currentBalance || 0, language)})
                  </option>
                ))}
              </select>
            </div>

            {/* Reference */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#688285]" />
                {t('paymentReference')}
              </label>
              <input
                type="text"
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder={language === 'bn' ? 'চেক নং / ট্রানজেকশন আইডি / ভাউচার' : 'Cheque # / Txn ID / Voucher'}
                className="w-full px-3.5 py-2 bg-[#F1FAFA] border border-[#D9EAEB] rounded-xl text-sm text-[#17383B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#229A73]"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-[#D9EAEB] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-[#D9EAEB] text-xs font-bold text-[#688285] hover:bg-[#F1FAFA] transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-[#229A73] hover:bg-[#1C8260] text-white text-xs font-bold shadow-md shadow-[#229A73]/20 transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <span className="inline-block animate-spin">⏳</span>
                ) : (
                  <span>{t('payNow')}</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
