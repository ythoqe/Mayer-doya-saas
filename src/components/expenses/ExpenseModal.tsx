import React, { useState } from 'react';
import { Expense, Account } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency } from '../../utils/translation';
import { Receipt, X, CheckCircle2, DollarSign, Calendar, Landmark, User, FileText, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_EXPENSE_CATEGORIES: Expense['category'][] = [
  'Electricity',
  'Gas',
  'Factory Rent',
  'Chemicals',
  'Maintenance',
  'Fuel/Boiler',
  'Labor',
  'Food',
  'Transport',
  'Office',
  'Misc'
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose }) => {
  const { addExpense, accounts, language, t } = useERP();

  const [voucherNo, setVoucherNo] = useState(`VCH-${Date.now().toString().slice(-6)}`);
  const [category, setCategory] = useState<Expense['category']>('Electricity');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
  const [paidBy, setPaidBy] = useState('Accounts Desk');
  const [notes, setNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const selectedAccount = accounts.find(a => a.id === accountId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg(language === 'bn' ? 'সঠিক টাকার পরিমাণ প্রদান করুন।' : 'Please provide a valid amount.');
      return;
    }

    if (!accountId) {
      setErrorMsg(language === 'bn' ? 'অনুগ্রহ করে একাউন্ট নির্বাচন করুন।' : 'Please select an account.');
      return;
    }

    if (selectedAccount && numericAmount > selectedAccount.currentBalance) {
      setErrorMsg(
        language === 'bn'
          ? `নির্বাচিত একাউন্টে পর্যাপ্ত ব্যালেন্স নেই (বর্তমান: ${formatCurrency(selectedAccount.currentBalance, language)})`
          : `Insufficient funds in selected account (Balance: ${formatCurrency(selectedAccount.currentBalance, language)})`
      );
      return;
    }

    addExpense({
      voucherNo: voucherNo.trim(),
      category,
      amount: numericAmount,
      date,
      accountId,
      accountName: selectedAccount ? selectedAccount.accountName : 'Cash in Hand',
      paidBy: paidBy.trim() || 'Accounts Officer',
      notes: notes.trim() || undefined
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
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
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#17383B]">
                {t('addExpenseBtn')}
              </h3>
              <p className="text-xs text-[#688285]">
                {language === 'bn' ? 'ফ্যাক্টরি খরচ বা ডেবিট ভাউচার এন্ট্রি করুন' : 'Log factory operating cost & create debit voucher'}
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
                {t('expenseRecordedSuccess')}
              </h4>
              <p className="text-xs text-[#688285]">
                {voucherNo} • {formatCurrency(Number(amount), language)} ({category})
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-[#FDECEF] border border-[#EA7185]/30 text-[#C93B55] text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Voucher # & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'ভাউচার নম্বর' : 'Voucher Number'} *
                  </label>
                  <input
                    type="text"
                    value={voucherNo}
                    onChange={(e) => setVoucherNo(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-mono font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'খরচের তারিখ' : 'Voucher Date'} *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Category & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'খরচের খাত / ক্যাটাগরি' : 'Expense Category'} *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Expense['category'])}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                  >
                    {COMMON_EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'টাকার পরিমাণ (৳)' : 'Amount (BDT)'} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 12500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-black text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Payment Account & Paid By */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'পরিশোধের একাউন্ট' : 'Payment Account'} *
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                    required
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountName} ({formatCurrency(acc.currentBalance, language)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'পরিশোধকারী কর্মকর্তা' : 'Paid By / Disbursed By'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Accounts Officer / Supervisor"
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                  />
                </div>
              </div>

              {/* Description / Remarks */}
              <div>
                <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                  {language === 'bn' ? 'খরচের বিবরণ / রসিদ নোট' : 'Description / Remarks / Memo #'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Diesel for Boiler unit 2, Memo #84910"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-semibold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                />
              </div>

              {/* Actions */}
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
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white font-extrabold text-xs shadow-md transition-all"
                >
                  {t('addExpenseBtn')}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
