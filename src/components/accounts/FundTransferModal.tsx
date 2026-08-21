import React, { useState, useEffect } from 'react';
import { Account } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency } from '../../utils/translation';
import { ArrowRightLeft, CheckCircle2, AlertCircle, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FundTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFromAccount?: Account | null;
}

export const FundTransferModal: React.FC<FundTransferModalProps> = ({
  isOpen,
  onClose,
  initialFromAccount
}) => {
  const { accounts, transferFunds, language, t } = useERP();

  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const source = initialFromAccount || accounts[0];
      const sourceId = source?.id || '';
      setFromAccountId(sourceId);
      
      // Select another destination account
      const dest = accounts.find(a => a.id !== sourceId);
      setToAccountId(dest?.id || '');
      setAmount('');
      setReference(`TRF-${Date.now().toString().slice(-6)}`);
      setNotes('');
      setIsConfirming(false);
      setErrorMsg('');
      setIsSuccess(false);
    }
  }, [isOpen, initialFromAccount, accounts]);

  if (!isOpen) return null;

  const sourceAccount = accounts.find(a => a.id === fromAccountId);
  const destAccount = accounts.find(a => a.id === toAccountId);

  const handleNextToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fromAccountId || !toAccountId) {
      setErrorMsg(language === 'bn' ? 'দয়া করে দুটি একাউন্টই নির্বাচন করুন।' : 'Please select both source and destination accounts.');
      return;
    }

    if (fromAccountId === toAccountId) {
      setErrorMsg(language === 'bn' ? 'উৎস এবং গন্তব্য একাউন্ট একই হতে পারবে না।' : 'Source and destination accounts cannot be identical.');
      return;
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg(language === 'bn' ? 'সঠিক টাকার পরিমাণ প্রদান করুন।' : 'Please enter a valid transfer amount.');
      return;
    }

    if (sourceAccount && numericAmount > sourceAccount.currentBalance) {
      setErrorMsg(language === 'bn' ? `উৎস একাউন্টে পর্যাপ্ত ব্যালেন্স নেই (বর্তমান: ${formatCurrency(sourceAccount.currentBalance, language)})` : `Insufficient balance in source account (Available: ${formatCurrency(sourceAccount.currentBalance, language)})`);
      return;
    }

    setIsConfirming(true);
  };

  const handleExecuteTransfer = () => {
    const numericAmount = Number(amount);
    const fullNotes = [
      reference ? `Ref: ${reference}` : '',
      notes ? notes.trim() : ''
    ].filter(Boolean).join(' • ') || (language === 'bn' ? `তহবিল স্থানান্তর: ${sourceAccount?.accountName} থেকে ${destAccount?.accountName}` : `Fund Transfer: ${sourceAccount?.accountName} to ${destAccount?.accountName}`);

    const ok = transferFunds(fromAccountId, toAccountId, numericAmount, fullNotes);
    if (ok) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1400);
    } else {
      setErrorMsg(language === 'bn' ? 'স্থানান্তর ব্যর্থ হয়েছে। ব্যালেন্স যাচাই করুন।' : 'Transfer failed. Check account balances.');
      setIsConfirming(false);
    }
  };

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
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#17383B]">
                {t('executeTransferTitle')}
              </h3>
              <p className="text-xs text-[#688285]">
                {language === 'bn' ? 'ফ্যাক্টরি ব্যাংক ও ক্যাশের মধ্যে নিরাপদ স্থানান্তর' : 'Move funds between factory bank & cash accounts'}
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
        <div className="p-6">
          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#E5F8F1] text-[#229A73] flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-black text-lg text-[#17383B]">
                {t('transferSuccessMsg')}
              </h4>
              <p className="text-xs text-[#688285]">
                {formatCurrency(Number(amount), language)} {language === 'bn' ? 'স্থানান্তর সম্পন্ন হয়েছে।' : 'has been moved successfully.'}
              </p>
            </div>
          ) : isConfirming ? (
            /* Step 2: Confirmation Summary */
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-[#F7F6FF] border border-[#8178F2]/20 space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#8178F2] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t('confirmTransferTitle')}</span>
                </div>
                <p className="text-xs text-[#688285]">
                  {t('confirmTransferDesc')}
                </p>

                {/* Transfer Visual Badge */}
                <div className="p-3 bg-white rounded-xl border border-[#D9EAEB] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-extrabold uppercase text-[#8EA3A5] block">{t('fromAccountLabel')}</span>
                    <span className="font-extrabold text-xs text-[#17383B] truncate block">{sourceAccount?.accountName}</span>
                    <span className="text-[11px] font-bold text-[#0B9FA5]">{formatCurrency(sourceAccount?.currentBalance || 0, language)}</span>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0 sm:text-right">
                    <span className="text-[10px] font-extrabold uppercase text-[#8EA3A5] block">{t('toAccountLabel')}</span>
                    <span className="font-extrabold text-xs text-[#17383B] truncate block">{destAccount?.accountName}</span>
                    <span className="text-[11px] font-bold text-[#8178F2]">{formatCurrency(destAccount?.currentBalance || 0, language)}</span>
                  </div>
                </div>

                {/* Amount & Date Summary */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#8178F2]/10 text-xs">
                  <div>
                    <span className="text-[10px] text-[#8EA3A5] uppercase font-bold block">{t('transferAmountLabel')}</span>
                    <span className="font-black text-base text-[#17383B]">{formatCurrency(Number(amount), language)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8EA3A5] uppercase font-bold block">{t('transferDateLabel')}</span>
                    <span className="font-extrabold text-xs text-[#17383B]">{transferDate}</span>
                  </div>
                </div>

                {notes && (
                  <div className="text-[11px] text-[#688285] bg-white p-2 rounded-lg border border-[#D9EAEB]">
                    <strong>{language === 'bn' ? 'নোট:' : 'Notes:'}</strong> {notes}
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-[#FDECEF] border border-[#EA7185]/30 text-[#C93B55] text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirming(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#D9EAEB] hover:bg-[#F1FAFA] text-xs font-bold text-[#688285] transition-colors"
                >
                  {language === 'bn' ? 'ফিরে যান' : 'Back / Edit'}
                </button>
                <button
                  type="button"
                  onClick={handleExecuteTransfer}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white font-extrabold text-xs shadow-md transition-all"
                >
                  {t('executeTransferBtn')}
                </button>
              </div>
            </div>
          ) : (
            /* Step 1: Input Form */
            <form onSubmit={handleNextToConfirm} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-[#FDECEF] border border-[#EA7185]/30 text-[#C93B55] text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Source Account */}
                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {t('fromAccountLabel')} *
                  </label>
                  <select
                    value={fromAccountId}
                    onChange={(e) => setFromAccountId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                    required
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountName} ({acc.accountType} - {formatCurrency(acc.currentBalance, language)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Destination Account */}
                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {t('toAccountLabel')} *
                  </label>
                  <select
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                    required
                  >
                    {accounts.filter(a => a.id !== fromAccountId).map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountName} ({acc.accountType} - {formatCurrency(acc.currentBalance, language)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {t('transferAmountLabel')} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 50000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-black text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                    required
                  />
                  {sourceAccount && (
                    <span className="text-[10px] text-[#8EA3A5] font-semibold block mt-1">
                      {language === 'bn' ? 'সর্বোচ্চ উপলব্ধ:' : 'Max available:'} <strong>{formatCurrency(sourceAccount.currentBalance, language)}</strong>
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {t('transferDateLabel')} *
                  </label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Reference & Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {t('transferReferenceLabel')}
                  </label>
                  <input
                    type="text"
                    placeholder="TRF-00123"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {t('transferRemarksLabel')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Weekly boiler diesel expense petty cash replenishment"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-semibold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6F0F1]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-[#D9EAEB] hover:bg-[#F1FAFA] text-xs font-bold text-[#688285] transition-colors"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>{language === 'bn' ? 'পরবর্তী (যাচাই)' : 'Next (Verify)'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
