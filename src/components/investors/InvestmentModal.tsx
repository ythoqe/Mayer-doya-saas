import React, { useState, useEffect } from 'react';
import { Investor, Account, Investment, Language } from '../../types';
import { formatCurrency } from '../../utils/translation';
import { X, TrendingUp, Calendar, Landmark, Tag, FileText, AlertCircle, Info, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  investors: Investor[];
  accounts: Account[];
  initialInvestorId?: string;
  onSave: (data: any) => Promise<void>;
  language: Language;
  t: (key: string) => string;
}

export const InvestmentModal: React.FC<InvestmentModalProps> = ({
  isOpen,
  onClose,
  investors,
  accounts,
  initialInvestorId,
  onSave,
  language,
  t
}) => {
  const [investorId, setInvestorId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [investmentType, setInvestmentType] = useState<Investment['investmentType']>('additional');
  const [accountId, setAccountId] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialInvestorId) {
      setInvestorId(initialInvestorId);
    } else if (investors.length > 0) {
      setInvestorId(investors[0].id);
    }
    if (accounts.length > 0) {
      setAccountId(accounts[0].id);
    }
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setInvestmentType('additional');
    setReference('');
    setNotes('');
    setError('');
  }, [isOpen, initialInvestorId, investors, accounts]);

  const selectedInvestor = investors.find(i => i.id === investorId);
  const selectedAccount = accounts.find(a => a.id === accountId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investorId) {
      setError(language === 'bn' ? 'বিনিয়োগকারী নির্বাচন করুন' : 'Please select an investor');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError(language === 'bn' ? 'সঠিক মূলধন পরিমাণ লিখুন' : 'Please enter a valid investment amount');
      return;
    }
    if (!accountId) {
      setError(language === 'bn' ? 'জমা হওয়ার কারখানা অ্যাকাউন্ট নির্বাচন করুন' : 'Please select factory deposit account');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSave({
        investorId,
        investorName: selectedInvestor?.name || 'Investor',
        amount: Number(amount),
        date,
        investmentType,
        accountId,
        accountName: selectedAccount?.accountName || 'Cash Account',
        reference: reference.trim() || '',
        notes: notes.trim() || ''
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record investment');
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
          className="bg-white rounded-3xl shadow-2xl border border-[#D9EAEB] w-full max-w-xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-[#0B9FA5] to-[#17383B] text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-white/20 text-white">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  {t('addInvestment')}
                </h3>
                <p className="text-xs text-white/80 mt-0.5">
                  {language === 'bn' ? 'কারখানায় বিনিয়োগকারীর নতুন/অতিরিক্ত মূলধন সংযোজন' : 'Record new/additional capital injection'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-3.5 bg-[#FDF4F5] border border-[#F8D2D9] rounded-2xl flex items-center gap-2.5 text-xs text-[#EA7185]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Accounting rule banner */}
            <div className="p-3.5 bg-[#F1FAFA] border border-[#D9EAEB] rounded-2xl flex items-start gap-2.5 text-xs text-[#17383B]">
              <Info className="w-4 h-4 text-[#0B9FA5] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#0B9FA5]">
                  {language === 'bn' ? 'হিসাবরক্ষণ নিয়ম:' : 'Accounting Notice:'}
                </span>{' '}
                {language === 'bn' 
                  ? 'এই টাকাটি ফ্যাক্টরির সাধারণ বিক্রয় আয় (Revenue) হিসেবে গণ্য হবে না; এটি মূলধন ক্রেডিট হিসেবে সংশ্লিষ্ট ব্যাংক/ক্যাশ অ্যাকাউন্টে জমা হবে।'
                  : 'This amount will be credited directly to the selected factory account as Investor Capital, not operating revenue.'}
              </div>
            </div>

            {/* Investor Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17383B]">
                {t('selectInvestor')} *
              </label>
              <select
                value={investorId}
                onChange={e => setInvestorId(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-[#F1FAFA] border border-[#D9EAEB] rounded-xl text-sm font-semibold text-[#17383B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]"
              >
                {investors.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.name} ({inv.phone}) {inv.sharePercentage ? `- ${inv.sharePercentage}%` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B]">
                  {t('investmentAmount')} (৳) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#688285]">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={amount}
                    onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="50,000"
                    required
                    className="w-full pl-8 pr-4 py-2.5 bg-[#F1FAFA] border border-[#D9EAEB] rounded-xl text-sm font-bold text-[#17383B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#688285]" />
                  {t('investmentDate')} *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-[#F1FAFA] border border-[#D9EAEB] rounded-xl text-sm text-[#17383B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]"
                />
              </div>
            </div>

            {/* Investment Type & Receiving Account */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#0B9FA5]" />
                  {t('investmentType')}
                </label>
                <select
                  value={investmentType}
                  onChange={e => setInvestmentType(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-[#F1FAFA] border border-[#D9EAEB] rounded-xl text-sm text-[#17383B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]"
                >
                  <option value="initial">{t('typeInitial')}</option>
                  <option value="additional">{t('typeAdditional')}</option>
                  <option value="share_capital">{t('typeShareCapital')}</option>
                  <option value="machinery">{t('typeMachinery')}</option>
                  <option value="working_capital">{t('typeWorkingCapital')}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-[#0B9FA5]" />
                  {t('receivingAccount')} *
                </label>
                <select
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-[#F1FAFA] border border-[#D9EAEB] rounded-xl text-sm text-[#17383B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountName} ({formatCurrency(acc.currentBalance || 0, language)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reference & Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#688285]" />
                {t('paymentReference')}
              </label>
              <input
                type="text"
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder={language === 'bn' ? 'চেক নং / মানি রিসিট / ব্যাংক ট্রান্সফার আইডি' : 'Cheque # / Money Receipt # / Txn ID'}
                className="w-full px-4 py-2.5 bg-[#F1FAFA] border border-[#D9EAEB] rounded-xl text-sm text-[#17383B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17383B]">
                {t('notes')}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={language === 'bn' ? 'বিনিয়োগ সংক্রান্ত অতিরিক্ত মন্তব্য...' : 'Additional notes...'}
                className="w-full px-4 py-2 bg-[#F1FAFA] border border-[#D9EAEB] rounded-xl text-sm text-[#17383B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-[#D9EAEB] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-[#D9EAEB] text-xs font-bold text-[#688285] hover:bg-[#F1FAFA] transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#0B9FA5] hover:bg-[#09878C] text-white text-xs font-bold shadow-md shadow-[#0B9FA5]/20 transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <span className="inline-block animate-spin">⏳</span>
                ) : (
                  <span>{t('save')}</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
