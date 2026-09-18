import React, { useState, useEffect } from 'react';
import { BankLoan } from '../../types';
import { useERP } from '../../context/ERPContext';
import { X, DollarSign, Calendar, Landmark, Receipt, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../utils/translation';

interface LoanInstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLoan?: BankLoan | null;
}

export const LoanInstallmentModal: React.FC<LoanInstallmentModalProps> = ({
  isOpen,
  onClose,
  selectedLoan
}) => {
  const { bankLoans, accounts, addLoanInstallment, loanInstallments, language, t } = useERP();

  const [loanId, setLoanId] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [principalAmount, setPrincipalAmount] = useState<number | ''>('');
  const [interestAmount, setInterestAmount] = useState<number | ''>('');
  const [lateFeeOrCharges, setLateFeeOrCharges] = useState<number | ''>('');
  const [fromAccountId, setFromAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cheque' | 'Auto-Debit' | 'Cash'>('Bank Transfer');
  const [chequeNumber, setChequeNumber] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const currentLoan = bankLoans.find(l => l.id === loanId) || selectedLoan || null;

  // Auto set fields when loan is chosen
  useEffect(() => {
    if (selectedLoan) {
      setLoanId(selectedLoan.id);
    } else if (bankLoans.length > 0 && !loanId) {
      setLoanId(bankLoans[0].id);
    }
  }, [selectedLoan, bankLoans]);

  useEffect(() => {
    if (currentLoan) {
      const emi = currentLoan.monthlyInstallment || 0;
      setTotalAmount(emi > 0 ? emi : '');

      // Estimate interest for one month: Outstanding * (rate / 12 / 100)
      const monthlyRate = (currentLoan.interestRateAnnual || 0) / 12 / 100;
      const estimatedInterest = Math.round(currentLoan.currentOutstanding * monthlyRate);
      const estimatedPrincipal = Math.max(0, emi - estimatedInterest);

      setInterestAmount(estimatedInterest > 0 ? estimatedInterest : 0);
      setPrincipalAmount(estimatedPrincipal > 0 ? estimatedPrincipal : emi);

      if (currentLoan.disbursedToAccountId && !fromAccountId) {
        setFromAccountId(currentLoan.disbursedToAccountId);
      }
    }
    setErrorMessage('');
  }, [loanId, currentLoan]);

  if (!isOpen) return null;

  const handleTotalChange = (val: number | '') => {
    setTotalAmount(val);
    if (typeof val === 'number' && val > 0 && currentLoan) {
      const monthlyRate = (currentLoan.interestRateAnnual || 0) / 12 / 100;
      const estimatedInterest = Math.min(val, Math.round(currentLoan.currentOutstanding * monthlyRate));
      const principal = Math.max(0, val - estimatedInterest);
      setInterestAmount(estimatedInterest);
      setPrincipalAmount(principal);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentLoan) {
      setErrorMessage(language === 'bn' ? 'অনুগ্রহ করে ঋণ নির্বাচন করুন' : 'Please select a bank loan');
      return;
    }

    const total = Number(totalAmount);
    if (!total || total <= 0) {
      setErrorMessage(language === 'bn' ? 'সঠিক পরিশোধিত পরিমাণ লিখুন' : 'Please enter a valid installment amount');
      return;
    }

    const prin = Number(principalAmount) || 0;
    const intr = Number(interestAmount) || 0;
    const fee = Number(lateFeeOrCharges) || 0;

    if (prin + intr + fee !== total && Math.abs((prin + intr + fee) - total) > 1) {
      setErrorMessage(
        language === 'bn'
          ? 'আসল + সুদ + চার্জের যোগফল মোট কিস্তির সমান হতে হবে'
          : 'Principal + Interest + Fee must equal Total Amount'
      );
      return;
    }

    const chosenAccount = accounts.find(a => a.id === fromAccountId);

    // Existing installment count for this loan
    const existingCount = loanInstallments.filter(inst => inst.loanId === currentLoan.id).length;
    const installmentNumber = existingCount + 1;

    setIsSubmitting(true);
    try {
      await addLoanInstallment({
        loanId: currentLoan.id,
        loanTitle: currentLoan.loanTitle,
        bankName: currentLoan.bankName,
        paymentDate,
        installmentNumber,
        totalAmount: total,
        principalAmount: prin,
        interestAmount: intr,
        lateFeeOrCharges: fee,
        fromAccountId: fromAccountId || '',
        fromAccountName: chosenAccount?.accountName || 'Cash / Factory Vault',
        paymentMethod,
        chequeNumber: chequeNumber.trim() || undefined,
        reference: reference.trim() || `EMI-${installmentNumber}`,
        notes: notes.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      console.error('Error recording installment:', err);
      setErrorMessage(err?.message || 'Failed to record installment payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-[#D9EAEB] overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#0B9FA5] to-[#128186] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {language === 'bn' ? 'ঋণের কিস্তি / ইএমআই পরিশোধ' : 'Record Loan Installment (EMI)'}
              </h2>
              <p className="text-xs text-white/80">
                {currentLoan ? `${currentLoan.bankName} - ${currentLoan.loanTitle}` : 'Select loan and record repayment'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Loan Selector if multiple or none selected */}
          <div>
            <label className="block text-xs font-bold text-[#17383B] mb-1">
              {language === 'bn' ? 'ব্যাংক ঋণ নির্বাচন করুন *' : 'Select Bank Loan *'}
            </label>
            <select
              required
              value={loanId}
              onChange={e => setLoanId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F8FCFC] text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] outline-hidden cursor-pointer"
            >
              <option value="">{language === 'bn' ? '-- ঋণ নির্বাচন করুন --' : '-- Select Loan --'}</option>
              {bankLoans.map(loan => (
                <option key={loan.id} value={loan.id}>
                  {loan.bankName} - {loan.loanTitle} (বকেয়া: ৳{(loan.currentOutstanding || 0).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {currentLoan && (
            <div className="p-3.5 rounded-xl bg-[#F0F9F9] border border-[#D9EAEB] flex items-center justify-between text-xs">
              <div>
                <p className="text-[11px] text-[#688285] font-semibold">{language === 'bn' ? 'অনুমোদিত ঋণ' : 'Sanctioned'}:</p>
                <p className="font-bold text-[#17383B]">{formatCurrency(currentLoan.sanctionAmount, language)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-[#688285] font-semibold">{language === 'bn' ? 'বর্তমান অবশিষ্ট বকেয়া' : 'Current Outstanding'}:</p>
                <p className="font-black text-rose-600">{formatCurrency(currentLoan.currentOutstanding, language)}</p>
              </div>
            </div>
          )}

          {/* Payment Date & Total Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#17383B] mb-1">
                {language === 'bn' ? 'পরিশোধের তারিখ *' : 'Payment Date *'}
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F8FCFC] text-xs font-semibold text-[#17383B] focus:border-[#0B9FA5] outline-hidden transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17383B] mb-1">
                {language === 'bn' ? 'মোট পরিশোধের পরিমাণ (৳) *' : 'Total Installment Amount (৳) *'}
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                placeholder="0.00"
                value={totalAmount}
                onChange={e => handleTotalChange(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#0B9FA5] bg-white text-xs font-black text-[#0B9FA5] focus:ring-1 focus:ring-[#0B9FA5] outline-hidden transition-colors"
              />
            </div>
          </div>

          {/* Principal & Interest Breakdown */}
          <div className="p-3.5 rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] space-y-2.5">
            <p className="text-[11px] font-black text-[#17383B] uppercase tracking-wider">
              {language === 'bn' ? 'আসল ও সুদের বিভাজন (Split Breakdown)' : 'Principal & Interest Breakdown'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#688285] mb-1">
                  {language === 'bn' ? 'মূল আসল কর্তন (৳)' : 'Principal (৳)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={principalAmount}
                  onChange={e => setPrincipalAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-lg border border-[#D9EAEB] bg-white text-xs font-bold text-[#17383B] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#688285] mb-1">
                  {language === 'bn' ? 'সুদ কর্তন (৳)' : 'Interest (৳)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={interestAmount}
                  onChange={e => setInterestAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-lg border border-[#D9EAEB] bg-white text-xs font-bold text-[#17383B] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#688285] mb-1">
                  {language === 'bn' ? 'বিলম্ব ফি / অন্যান্য চার্জ (৳)' : 'Late Fee / Charges (৳)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={lateFeeOrCharges}
                  onChange={e => setLateFeeOrCharges(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-lg border border-[#D9EAEB] bg-white text-xs font-bold text-[#17383B] outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Account & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#17383B] mb-1">
                {language === 'bn' ? 'যে অ্যাকাউন্ট থেকে পরিশোধিত *' : 'Paid From Account *'}
              </label>
              <select
                value={fromAccountId}
                onChange={e => setFromAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F8FCFC] text-xs font-semibold text-[#17383B] focus:border-[#0B9FA5] outline-hidden cursor-pointer"
              >
                <option value="">{language === 'bn' ? '-- অ্যাকাউন্ট নির্বাচন করুন --' : '-- Select Account --'}</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountName} ({acc.bankName || acc.accountType}) - ৳{(acc.currentBalance || 0).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17383B] mb-1">
                {language === 'bn' ? 'পরিশোধের মাধ্যম' : 'Payment Method'}
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F8FCFC] text-xs font-semibold text-[#17383B] focus:border-[#0B9FA5] outline-hidden cursor-pointer"
              >
                <option value="Bank Transfer">Bank Transfer / EFT / BEFTN</option>
                <option value="Auto-Debit">Auto-Debit / Standing Instruction</option>
                <option value="Cheque">Bank Cheque</option>
                <option value="Cash">Cash Deposit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17383B] mb-1">
                {language === 'bn' ? 'চেক নম্বর (যদি থাকে)' : 'Cheque Number (Optional)'}
              </label>
              <input
                type="text"
                placeholder="e.g. CQ-987654"
                value={chequeNumber}
                onChange={e => setChequeNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F8FCFC] text-xs font-semibold text-[#17383B] focus:border-[#0B9FA5] outline-hidden transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17383B] mb-1">
                {language === 'bn' ? 'ভাউচার / রেফারেন্স নং' : 'Reference / Voucher No'}
              </label>
              <input
                type="text"
                placeholder="e.g. REF-2025-01"
                value={reference}
                onChange={e => setReference(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F8FCFC] text-xs font-semibold text-[#17383B] focus:border-[#0B9FA5] outline-hidden transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#17383B] mb-1">
              {language === 'bn' ? 'নোট বা বিবরণ' : 'Notes / Remarks'}
            </label>
            <input
              type="text"
              placeholder={language === 'bn' ? 'কিস্তি সংক্রান্ত কোনো বিশেষ তথ্য...' : 'Optional notes...'}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F8FCFC] text-xs font-semibold text-[#17383B] focus:border-[#0B9FA5] outline-hidden transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#D9EAEB] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#688285] hover:text-[#17383B] hover:bg-[#EAF2F3] transition-colors"
            >
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#0B9FA5] hover:bg-[#078A90] text-white text-xs font-black shadow-md shadow-[#0B9FA5]/25 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? (language === 'bn' ? 'প্রক্রিয়াকরণ হচ্ছে...' : 'Processing...')
                  : (language === 'bn' ? 'কিস্তি জমা নিশ্চিত করুন' : 'Confirm EMI Payment')
                }
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
