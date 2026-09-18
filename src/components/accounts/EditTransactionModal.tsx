import React, { useState, useEffect } from 'react';
import { Transaction } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency } from '../../utils/translation';
import { Edit3, CheckCircle2, AlertCircle, X, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction
}) => {
  const { accounts, updateTransaction, language, t } = useERP();

  const [amount, setAmount] = useState<number | ''>('');
  const [accountId, setAccountId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [referenceId, setReferenceId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount);
      setAccountId(transaction.accountId);
      setDate(transaction.date);
      setCategory(transaction.category);
      setDescription(transaction.description);
      setReferenceId(transaction.referenceId || '');
      setErrorMsg('');
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(amount) <= 0) {
      setErrorMsg(language === 'bn' ? 'সঠিক টাকার পরিমাণ দিন।' : 'Please enter a valid amount.');
      return;
    }

    await updateTransaction(transaction.id, {
      amount: Number(amount),
      accountId,
      date,
      category,
      description,
      referenceId: referenceId.trim() || undefined
    });

    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#D9EAEB] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 bg-gradient-to-r from-[#F1FAFA] to-white border-b border-[#E6F0F1]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#DDF4F3] text-[#0B9FA5]">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#17383B]">
                  {language === 'bn' ? 'লেনদেন সম্পাদনা করুন' : 'Edit Transaction'}
                </h3>
                <p className="text-[11px] text-[#688285] font-medium">
                  {transaction.type === 'credit' ? (language === 'bn' ? 'টাকা জমা (Credit)' : 'Money In (Credit)') : (language === 'bn' ? 'টাকা খরচ (Debit)' : 'Money Out (Debit)')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#8EA3A5] hover:text-[#17383B] hover:bg-[#F1FAFA] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-[#FDECEF] border border-[#F6A5B5] text-[#EA7185] text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-[#17383B] mb-1.5">
                {language === 'bn' ? 'টাকার পরিমাণ (৳)' : 'Amount (৳)'}
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={amount}
                onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FBFA] border border-[#D9EAEB] text-sm font-black text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-[#17383B] mb-1.5">
                {language === 'bn' ? 'একাউন্ট' : 'Account'}
              </label>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FBFA] border border-[#D9EAEB] text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountName} ({formatCurrency(acc.currentBalance, language)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-[#17383B] mb-1.5">
                  {language === 'bn' ? 'তারিখ' : 'Date'}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FBFA] border border-[#D9EAEB] text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[#17383B] mb-1.5">
                  {language === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FBFA] border border-[#D9EAEB] text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-[#17383B] mb-1.5">
                {language === 'bn' ? 'বিবরণ' : 'Description'}
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8FBFA] border border-[#D9EAEB] text-xs font-medium text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-[#17383B] mb-1.5">
                {language === 'bn' ? 'রেফারেন্স / ভাউচার নং' : 'Reference / Voucher No.'}
              </label>
              <input
                type="text"
                value={referenceId}
                onChange={e => setReferenceId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FBFA] border border-[#D9EAEB] text-xs font-medium text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white border border-[#D9EAEB] text-xs font-bold text-[#688285] hover:bg-[#F1FAFA]"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#0B9FA5] hover:bg-[#078A90] text-white text-xs font-black shadow-md hover:shadow-lg transition-all"
              >
                {language === 'bn' ? 'আপডেট সংরক্ষণ করুন' : 'Save Changes'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
