import React, { useState, useEffect } from 'react';
import { BankLoan, LoanType, LoanStatus } from '../../types';
import { useERP } from '../../context/ERPContext';
import { X, Building2, Calendar, DollarSign, Percent, Clock, FileText, Shield, User } from 'lucide-react';
import { formatCurrency } from '../../utils/translation';

interface AddLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLoan?: BankLoan | null;
}

export const AddLoanModal: React.FC<AddLoanModalProps> = ({
  isOpen,
  onClose,
  initialLoan
}) => {
  const { accounts, addBankLoan, updateBankLoan, language, t } = useERP();

  const [loanTitle, setLoanTitle] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loanType, setLoanType] = useState<LoanType>('term_loan');
  const [disbursementDate, setDisbursementDate] = useState(new Date().toISOString().split('T')[0]);
  const [sanctionAmount, setSanctionAmount] = useState<number | ''>('');
  const [interestRateAnnual, setInterestRateAnnual] = useState<number | ''>(9);
  const [tenureMonths, setTenureMonths] = useState<number | ''>(36);
  const [monthlyInstallment, setMonthlyInstallment] = useState<number | ''>('');
  const [disbursedToAccountId, setDisbursedToAccountId] = useState('');
  const [status, setStatus] = useState<LoanStatus>('active');
  const [nextDueDate, setNextDueDate] = useState('');
  const [collateralDetails, setCollateralDetails] = useState('');
  const [guarantorName, setGuarantorName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-calculate standard EMI
  const calculateEMI = (P: number, rAnnual: number, nMonths: number) => {
    if (!P || P <= 0 || !nMonths || nMonths <= 0) return 0;
    if (!rAnnual || rAnnual <= 0) return Math.round(P / nMonths);
    const r = (rAnnual / 12) / 100;
    const emi = (P * r * Math.pow(1 + r, nMonths)) / (Math.pow(1 + r, nMonths) - 1);
    return Math.round(emi);
  };

  useEffect(() => {
    if (sanctionAmount && tenureMonths && !initialLoan) {
      const calculated = calculateEMI(
        Number(sanctionAmount),
        Number(interestRateAnnual) || 0,
        Number(tenureMonths)
      );
      if (calculated > 0) {
        setMonthlyInstallment(calculated);
      }
    }
  }, [sanctionAmount, interestRateAnnual, tenureMonths, initialLoan]);

  useEffect(() => {
    if (initialLoan) {
      setLoanTitle(initialLoan.loanTitle || '');
      setBankName(initialLoan.bankName || '');
      setBranchName(initialLoan.branchName || '');
      setAccountNumber(initialLoan.accountNumber || '');
      setLoanType(initialLoan.loanType || 'term_loan');
      setDisbursementDate(initialLoan.disbursementDate || new Date().toISOString().split('T')[0]);
      setSanctionAmount(initialLoan.sanctionAmount || '');
      setInterestRateAnnual(initialLoan.interestRateAnnual || 9);
      setTenureMonths(initialLoan.tenureMonths || 36);
      setMonthlyInstallment(initialLoan.monthlyInstallment || '');
      setDisbursedToAccountId(initialLoan.disbursedToAccountId || '');
      setStatus(initialLoan.status || 'active');
      setNextDueDate(initialLoan.nextDueDate || '');
      setCollateralDetails(initialLoan.collateralDetails || '');
      setGuarantorName(initialLoan.guarantorName || '');
      setNotes(initialLoan.notes || '');
    } else {
      setLoanTitle('');
      setBankName('');
      setBranchName('');
      setAccountNumber('');
      setLoanType('term_loan');
      setDisbursementDate(new Date().toISOString().split('T')[0]);
      setSanctionAmount('');
      setInterestRateAnnual(9);
      setTenureMonths(36);
      setMonthlyInstallment('');
      setDisbursedToAccountId(accounts[0]?.id || '');
      setStatus('active');
      
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      setNextDueDate(d.toISOString().split('T')[0]);
      
      setCollateralDetails('');
      setGuarantorName('');
      setNotes('');
    }
    setErrorMessage('');
  }, [initialLoan, isOpen, accounts]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loanTitle.trim()) {
      setErrorMessage(language === 'bn' ? 'অনুগ্রহ করে ঋণের শিরোনাম লিখুন' : 'Please provide a loan title');
      return;
    }
    if (!bankName.trim()) {
      setErrorMessage(language === 'bn' ? 'ব্যাংকের নাম আবশ্যক' : 'Bank name is required');
      return;
    }
    const sanctionNum = Number(sanctionAmount);
    if (!sanctionNum || sanctionNum <= 0) {
      setErrorMessage(language === 'bn' ? 'সঠিক ঋণের পরিমাণ দিন' : 'Please provide a valid sanction amount');
      return;
    }

    const selectedAccount = accounts.find(a => a.id === disbursedToAccountId);

    setIsSubmitting(true);
    try {
      if (initialLoan) {
        await updateBankLoan(initialLoan.id, {
          loanTitle: loanTitle.trim(),
          bankName: bankName.trim(),
          branchName: branchName.trim(),
          accountNumber: accountNumber.trim(),
          loanType,
          disbursementDate,
          sanctionAmount: sanctionNum,
          interestRateAnnual: Number(interestRateAnnual) || 0,
          tenureMonths: Number(tenureMonths) || 1,
          monthlyInstallment: Number(monthlyInstallment) || 0,
          disbursedToAccountId: disbursedToAccountId || '',
          disbursedToAccountName: selectedAccount?.accountName || '',
          status,
          nextDueDate: nextDueDate || disbursementDate,
          collateralDetails: collateralDetails.trim(),
          guarantorName: guarantorName.trim(),
          notes: notes.trim()
        });
      } else {
        await addBankLoan({
          loanTitle: loanTitle.trim(),
          bankName: bankName.trim(),
          branchName: branchName.trim(),
          accountNumber: accountNumber.trim(),
          loanType,
          disbursementDate,
          sanctionAmount: sanctionNum,
          interestRateAnnual: Number(interestRateAnnual) || 0,
          tenureMonths: Number(tenureMonths) || 1,
          monthlyInstallment: Number(monthlyInstallment) || 0,
          disbursedToAccountId: disbursedToAccountId || '',
          disbursedToAccountName: selectedAccount?.accountName || '',
          status: 'active',
          nextDueDate: nextDueDate || disbursementDate,
          collateralDetails: collateralDetails.trim(),
          guarantorName: guarantorName.trim(),
          notes: notes.trim()
        });
      }
      onClose();
    } catch (err: any) {
      console.error('Error saving bank loan:', err);
      setErrorMessage(err?.message || 'Failed to save bank loan. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-[#D9EAEB] overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#17383B] to-[#214D51] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#16B8B0]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {initialLoan 
                  ? (language === 'bn' ? 'ঋণের তথ্য হালনাগাদ করুন' : 'Edit Bank Loan')
                  : (language === 'bn' ? 'নতুন ব্যাংক ঋণ অনুমোদন ও গ্রহণ' : 'Sanction New Bank Loan')
                }
              </h2>
              <p className="text-xs text-white/70">
                {language === 'bn' 
                  ? 'কারখানার জন্য ব্যাংক ঋণ, সিসি সুবিধা বা লিজ সংক্রান্ত তথ্য সংরক্ষণ করুন'
                  : 'Record long-term financing, credit facilities and EMI schedule'
                }
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

          {/* Section 1: Basic Loan Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#17383B] mb-1">
                {language === 'bn' ? 'ঋণের নাম / শিরোনাম *' : 'Loan Title / Facility Name *'}
              </label>
              <input
                type="text"
                required
                placeholder={language === 'bn' ? 'যেমন: প্রাইম ব্যাংক টার্ম লোন #১' : 'e.g., Prime Bank Term Loan #1'}
                value={loanTitle}
                onChange={e => setLoanTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F8FCFC] text-xs font-semibold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] outline-hidden transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17383B] mb-1">
                {language === 'bn' ? 'ঋণের ধরন' : 'Loan Type'}
              </label>
              <select
                value={loanType}
                onChange={e => setLoanType(e.target.value as LoanType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F8FCFC] text-xs font-semibold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] outline-hidden transition-colors cursor-pointer"
              >
                <option value="term_loan">{language === 'bn' ? 'টার্ম লোন / মেয়াদী ঋণ' : 'Term Loan'}</option>
                <option value="cc_loan">{language === 'bn' ? 'সিসি লোন / ক্যাশ ক্রেডিট' : 'CC Loan / Cash Credit'}</option>
                <option value="machinery_loan">{language === 'bn' ? 'মেশিনারিজ লিজ / লোন' : 'Machinery Lease / Loan'}</option>
                <option value="sme_loan">{language === 'bn' ? 'এসএমই লোন' : 'SME Loan'}</option>
                <option value="short_term">{language === 'bn' ? 'স্বল্পমেয়াদী চলতি মূলধন' : 'Short Term / Working Capital'}</option>
                <option value="mortgage">{language === 'bn' ? 'মর্টগেজ ঋণ' : 'Mortgage Loan'}</option>
                <option value="other">{language === 'bn' ? 'অন্যান্য' : 'Other'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17383B] mb-1">
                {language === 'bn' ? 'ব্যাংকের নাম *' : 'Bank Name *'}
              </label>
              <input
                type="text"
                required
                placeholder={language === 'bn' ? 'যেমন: ইসলামী ব্যাংক, ব্র্যাক ব্যাংক' : 'e.g., Islami Bank, BRAC Bank'}
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F8FCFC] text-xs font-semibold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] outline-hidden transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17383B] mb-1">
                {language === 'bn' ? 'শাখার নাম' : 'Branch Name'}
              </label>
              <input
                type="text"
                placeholder={language === 'bn' ? 'যেমন: কোনাবাড়ী শাখা, গাজীপুর' : 'e.g., Gazipur Branch'}
                value={branchName}
                onChange={e => setBranchName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F8FCFC] text-xs font-semibold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] outline-hidden transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17383B] mb-1">
                {language === 'bn' ? 'ঋণ অ্যাকাউন্ট নম্বর' : 'Loan Account / Reference No'}
              </label>
              <input
                type="text"
                placeholder="LA-2024-XXXX"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F8FCFC] text-xs font-mono font-semibold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] outline-hidden transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17383B] mb-1">
                {language === 'bn' ? 'বিতরণ / অনুমোদনের তারিখ' : 'Disbursement Date'}
              </label>
              <input
                type="date"
                required
                value={disbursementDate}
                onChange={e => setDisbursementDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F8FCFC] text-xs font-semibold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] outline-hidden transition-colors"
              />
            </div>
          </div>

          {/* Section 2: Financial Terms */}
          <div className="p-4 rounded-xl bg-[#F4FBFB] border border-[#D9EAEB] space-y-3.5">
            <h4 className="text-xs font-black text-[#0B9FA5] uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'আর্থিক শর্ত ও কিস্তির হিসাব' : 'Financial Terms & EMI Details'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#17383B] mb-1">
                  {language === 'bn' ? 'অনুমোদিত ঋণের পরিমাণ (৳) *' : 'Sanction Amount (৳) *'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="0.00"
                  value={sanctionAmount}
                  onChange={e => setSanctionAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] outline-hidden transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17383B] mb-1">
                  {language === 'bn' ? 'বার্ষিক সুদের হার (%)' : 'Annual Interest Rate (%)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="9.00"
                    value={interestRateAnnual}
                    onChange={e => setInterestRateAnnual(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] outline-hidden transition-colors pr-8"
                  />
                  <Percent className="w-3.5 h-3.5 text-[#8EA3A5] absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17383B] mb-1">
                  {language === 'bn' ? 'মেয়াদ (মাস)' : 'Tenure (Months)'}
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="36"
                  value={tenureMonths}
                  onChange={e => setTenureMonths(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] outline-hidden transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#17383B]">
                    {language === 'bn' ? 'মাসিক কিস্তির পরিমাণ / EMI (৳)' : 'Monthly Installment / EMI (৳)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const auto = calculateEMI(Number(sanctionAmount), Number(interestRateAnnual), Number(tenureMonths));
                      setMonthlyInstallment(auto);
                    }}
                    className="text-[10px] text-[#0B9FA5] hover:underline font-bold"
                  >
                    {language === 'bn' ? 'স্বয়ংক্রিয় গণনা' : 'Auto Calculate'}
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={monthlyInstallment}
                  onChange={e => setMonthlyInstallment(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#0B9FA5]/40 bg-white text-xs font-black text-[#0B9FA5] focus:border-[#0B9FA5] outline-hidden transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17383B] mb-1">
                  {language === 'bn' ? 'পরবর্তী কিস্তির সম্ভাব্য তারিখ' : 'Next Installment Due Date'}
                </label>
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={e => setNextDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-semibold text-[#17383B] focus:border-[#0B9FA5] outline-hidden transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17383B] mb-1">
                {language === 'bn' ? 'ঋণের অর্থ জমার অ্যাকাউন্ট' : 'Disbursed To Factory Account'}
              </label>
              <select
                value={disbursedToAccountId}
                onChange={e => setDisbursedToAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-semibold text-[#17383B] focus:border-[#0B9FA5] outline-hidden transition-colors cursor-pointer"
              >
                <option value="">{language === 'bn' ? '-- অ্যাকাউন্ট নির্বাচন করুন --' : '-- Select Factory Account --'}</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountName} ({acc.bankName || acc.accountType}) - ৳{(acc.currentBalance || 0).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 3: Collateral & Guarantor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#17383B] mb-1">
                {language === 'bn' ? 'জামানত / মর্টগেজ বিবরণ' : 'Collateral / Security Details'}
              </label>
              <input
                type="text"
                placeholder={language === 'bn' ? 'যেমন: কারখানা জমি ও ওয়াশিং মেশিনারি' : 'e.g., Factory Land & Washing Plants'}
                value={collateralDetails}
                onChange={e => setCollateralDetails(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F8FCFC] text-xs font-semibold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] outline-hidden transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17383B] mb-1">
                {language === 'bn' ? 'জামিনদার / গ্যারান্টারের নাম' : 'Guarantor Name & Contact'}
              </label>
              <input
                type="text"
                placeholder={language === 'bn' ? 'যেমন: মো: রফিকুল ইসলাম (পরিচালক)' : 'e.g., Md. Rafiqul Islam (Director)'}
                value={guarantorName}
                onChange={e => setGuarantorName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F8FCFC] text-xs font-semibold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] outline-hidden transition-colors"
              />
            </div>
          </div>

          {initialLoan && (
            <div>
              <label className="block text-xs font-bold text-[#17383B] mb-1">
                {language === 'bn' ? 'ঋণের অবস্থা' : 'Loan Status'}
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as LoanStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F8FCFC] text-xs font-semibold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] outline-hidden transition-colors"
              >
                <option value="active">{language === 'bn' ? 'সক্রিয় (Active)' : 'Active'}</option>
                <option value="closed">{language === 'bn' ? 'পরিশোধিত ও সমাপ্ত (Closed)' : 'Closed'}</option>
                <option value="overdue">{language === 'bn' ? 'কিস্তি বকেয়া (Overdue)' : 'Overdue'}</option>
                <option value="defaulted">{language === 'bn' ? 'খেলাপি (Defaulted)' : 'Defaulted'}</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#17383B] mb-1">
              {language === 'bn' ? 'মন্তব্য / নোট' : 'Notes / Remarks'}
            </label>
            <textarea
              rows={2}
              placeholder={language === 'bn' ? 'কোনো বিশেষ শর্ত বা ব্যাংকের নির্দেশনা...' : 'Special clauses or instructions...'}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F8FCFC] text-xs font-semibold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] outline-hidden transition-colors resize-none"
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
              <Building2 className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                  : (initialLoan ? (language === 'bn' ? 'হালনাগাদ করুন' : 'Update Loan') : (language === 'bn' ? 'অনুমোদন নিশ্চিত করুন' : 'Sanction Loan'))
                }
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
