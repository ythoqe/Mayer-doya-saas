import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  CreditCard, 
  Receipt, 
  User, 
  Calendar, 
  DollarSign, 
  Building, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { ClientBill } from '../../types';

interface PayBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedClientId?: string;
  preselectedBillId?: string;
  onPaymentSuccess?: (bill: ClientBill) => void;
}

export const PayBillModal: React.FC<PayBillModalProps> = ({
  isOpen,
  onClose,
  preselectedClientId,
  preselectedBillId,
  onPaymentSuccess
}) => {
  const { 
    clients, 
    clientBills, 
    accounts, 
    recordBillPayment, 
    language 
  } = useERP();

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedBillId, setSelectedBillId] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentAccountId, setPaymentAccountId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Active accounts only
  const activeAccounts = useMemo(() => {
    return accounts.filter(a => a.status === 'active');
  }, [accounts]);

  // Set default account when accounts load
  useEffect(() => {
    if (!paymentAccountId && activeAccounts.length > 0) {
      setPaymentAccountId(activeAccounts[0].id);
    }
  }, [activeAccounts, paymentAccountId]);

  // Initialize or update selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessMessage('');
      setPaymentDate(new Date().toISOString().split('T')[0]);

      if (preselectedClientId) {
        setSelectedClientId(preselectedClientId);
      } else if (preselectedBillId) {
        const foundBill = clientBills.find(b => b.id === preselectedBillId);
        if (foundBill) {
          setSelectedClientId(foundBill.clientId);
        }
      } else if (clients.length > 0 && !selectedClientId) {
        setSelectedClientId(clients[0].id);
      }

      if (preselectedBillId) {
        setSelectedBillId(preselectedBillId);
      }
    }
  }, [isOpen, preselectedClientId, preselectedBillId, clientBills, clients]);

  // Client's unpaid or partially paid bills
  const clientBillsList = useMemo(() => {
    if (!selectedClientId) return [];
    return clientBills.filter(b => b.clientId === selectedClientId);
  }, [clientBills, selectedClientId]);

  // Active bill object
  const activeBill = useMemo(() => {
    return clientBills.find(b => b.id === selectedBillId);
  }, [clientBills, selectedBillId]);

  // If client changes, update selected bill if current bill doesn't belong to client
  useEffect(() => {
    if (selectedClientId && !preselectedBillId) {
      const eligible = clientBills.filter(b => b.clientId === selectedClientId && b.dueAmount > 0);
      if (eligible.length > 0) {
        // If current bill is not in this client's bills, select first eligible
        if (!eligible.some(b => b.id === selectedBillId)) {
          setSelectedBillId(eligible[0].id);
        }
      } else {
        const allClientBills = clientBills.filter(b => b.clientId === selectedClientId);
        if (allClientBills.length > 0 && !allClientBills.some(b => b.id === selectedBillId)) {
          setSelectedBillId(allClientBills[0].id);
        }
      }
    }
  }, [selectedClientId, clientBills, preselectedBillId, selectedBillId]);

  // Auto-fill amount with active bill's due amount
  useEffect(() => {
    if (activeBill) {
      setPaymentAmount(activeBill.dueAmount > 0 ? String(activeBill.dueAmount) : '');
      const refSuggestion = `RCPT-${activeBill.billNumber}-${Math.floor(100 + Math.random() * 900)}`;
      setReference(refSuggestion);
    }
  }, [activeBill]);

  if (!isOpen) return null;

  const currentDue = activeBill ? activeBill.dueAmount : 0;
  const payAmountNum = Number(paymentAmount) || 0;
  const remainingDueAfter = Math.max(0, currentDue - payAmountNum);
  const resultingStatus = remainingDueAfter <= 0 ? 'Paid' : (activeBill && (activeBill.paidAmount + payAmountNum > 0) ? 'Partially Paid' : 'Unpaid');

  const handleQuickAmount = (ratio: number) => {
    if (!activeBill) return;
    const val = Math.round(activeBill.dueAmount * ratio);
    setPaymentAmount(String(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedClientId) {
      setError(language === 'bn' ? 'অনুগ্রহ করে গ্রাহক নির্বাচন করুন।' : 'Please select a client.');
      return;
    }

    if (!selectedBillId || !activeBill) {
      setError(language === 'bn' ? 'অনুগ্রহ করে বিল / চালান নির্বাচন করুন।' : 'Please select a bill to pay.');
      return;
    }

    if (payAmountNum <= 0) {
      setError(language === 'bn' ? 'পেমেন্ট পরিমাণ অবশ্যই ০ এর বেশি হতে হবে।' : 'Payment amount must be greater than zero.');
      return;
    }

    if (!paymentAccountId) {
      setError(language === 'bn' ? 'টাকা জমার অ্যাকাউন্ট (Cash/Bank) নির্বাচন করুন।' : 'Please select a payment deposit account.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await recordBillPayment({
        billId: selectedBillId,
        clientId: selectedClientId,
        paymentDate,
        paymentAmount: payAmountNum,
        paymentAccountId,
        paymentMethod,
        reference: reference.trim(),
        notes: notes.trim()
      });

      if (res.success) {
        setSuccessMessage(res.message || (language === 'bn' ? 'পেমেন্ট সফলভাবে সম্পন্ন হয়েছে!' : 'Payment recorded successfully!'));
        if (onPaymentSuccess && activeBill) {
          onPaymentSuccess({
            ...activeBill,
            paidAmount: activeBill.paidAmount + payAmountNum,
            dueAmount: remainingDueAfter,
            status: resultingStatus
          });
        }
        setTimeout(() => {
          setIsSubmitting(false);
          onClose();
        }, 1200);
      } else {
        setError(res.message || (language === 'bn' ? 'পেমেন্ট গ্রহণে সমস্যা হয়েছে।' : 'Failed to record payment.'));
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during payment processing.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div 
        id="pay-bill-modal" 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-700 to-teal-800 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <CreditCard className="w-6 h-6 text-teal-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {language === 'bn' ? 'রানিং বিল পরিশোধ / পেমেন্ট গ্রহণ' : 'Pay Running Bill / Add Payment'}
              </h3>
              <p className="text-xs text-teal-100/80">
                {language === 'bn' 
                  ? 'গ্রাহকের চালান বিল পরিশোধ ও ব্যাংক/ক্যাশ অ্যাকাউন্টে জমা করুন' 
                  : 'Record client bill payment directly to Cash/Bank accounts and Ledger'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 p-3 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-900">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Grid fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-600" />
                  {language === 'bn' ? 'গ্রাহক (Client)' : 'Client'} *
                </span>
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                disabled={Boolean(preselectedClientId)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:opacity-75"
              >
                <option value="">{language === 'bn' ? '-- গ্রাহক নির্বাচন করুন --' : '-- Select Client --'}</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} ({c.name}) - বকেয়া: ৳{formatNumber(c.balance || 0, language)}
                  </option>
                ))}
              </select>
            </div>

            {/* Bill/Invoice Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-teal-600" />
                  {language === 'bn' ? 'বিল / চালান (Bill/Invoice)' : 'Bill / Invoice'} *
                </span>
              </label>
              <select
                value={selectedBillId}
                onChange={(e) => setSelectedBillId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="">{language === 'bn' ? '-- বিল নির্বাচন করুন --' : '-- Select Bill --'}</option>
                {clientBillsList.map(b => (
                  <option key={b.id} value={b.id}>
                    #{b.billNumber} (জব: {b.orderNumber}) - মোট: ৳{formatNumber(b.totalBill, language)} | বকেয়া: ৳{formatNumber(b.dueAmount, language)} [{b.status}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Bill Preview Card */}
          {activeBill && (
            <div className="p-4 bg-teal-50/60 dark:bg-teal-950/20 rounded-xl border border-teal-200/80 dark:border-teal-900/60">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-teal-200/50 dark:border-teal-900/50 text-xs">
                <div className="font-semibold text-teal-900 dark:text-teal-200">
                  বিল নং: <span className="font-mono text-teal-700 dark:text-teal-300">{activeBill.billNumber}</span>
                  <span className="mx-2 text-teal-300">|</span>
                  অর্ডার: <span className="font-medium text-slate-700 dark:text-slate-300">#{activeBill.orderNumber}</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  চালান তারিখ: {activeBill.deliveryDate}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-teal-100 dark:border-teal-900/40">
                  <div className="text-[11px] text-slate-500">{language === 'bn' ? 'পরিমাণ ও দর' : 'Qty & Rate'}</div>
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                    {formatNumber(activeBill.quantity, language)} গজ @ ৳{formatNumber(activeBill.rate, language)}
                  </div>
                </div>

                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-teal-100 dark:border-teal-900/40">
                  <div className="text-[11px] text-slate-500">{language === 'bn' ? 'মোট বিল' : 'Total Bill'}</div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    ৳{formatNumber(activeBill.totalBill, language)}
                  </div>
                </div>

                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-teal-100 dark:border-teal-900/40">
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400">{language === 'bn' ? 'পরিশোধিত' : 'Paid'}</div>
                  <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                    ৳{formatNumber(activeBill.paidAmount, language)}
                  </div>
                </div>

                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-teal-100 dark:border-teal-900/40">
                  <div className="text-[11px] text-red-600 dark:text-red-400">{language === 'bn' ? 'বর্তমান বকেয়া' : 'Due Amount'}</div>
                  <div className="font-bold text-xs text-red-600 dark:text-red-400">
                    ৳{formatNumber(activeBill.dueAmount, language)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  {language === 'bn' ? 'পরিশোধের তারিখ (Payment Date)' : 'Payment Date'} *
                </span>
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            {/* Payment Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-teal-600" />
                  {language === 'bn' ? 'পরিশোধের পরিমাণ (৳ Amount)' : 'Payment Amount (৳)'} *
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">৳</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 text-sm font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Quick shortcuts */}
              {activeBill && activeBill.dueAmount > 0 && (
                <div className="flex gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickAmount(1)}
                    className="text-[11px] px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 hover:bg-teal-200 transition-colors"
                  >
                    {language === 'bn' ? 'সম্পূর্ণ বকেয়া (Full)' : 'Full Due'} (৳{formatNumber(activeBill.dueAmount, language)})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAmount(0.5)}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                  >
                    ৫০% (50%)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAmount(0.25)}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                  >
                    ২৫% (25%)
                  </button>
                </div>
              )}
            </div>

            {/* Payment Account (Cash/Bank/MFS) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-teal-600" />
                  {language === 'bn' ? 'জমা হওয়ার অ্যাকাউন্ট (Cash/Bank)' : 'Deposit Account'} *
                </span>
              </label>
              <select
                value={paymentAccountId}
                onChange={(e) => setPaymentAccountId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                {activeAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountName} ({acc.bankName || acc.accountType}) - ব্যালেন্স: ৳{formatNumber(acc.currentBalance, language)}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'bn' ? 'পেমেন্ট মাধ্যম (Payment Method)' : 'Payment Method'} *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="Cash">{language === 'bn' ? 'নগদ ক্যাশ (Cash)' : 'Cash'}</option>
                <option value="Bank Transfer">{language === 'bn' ? 'ব্যাংক ট্রান্সফার / EFTN' : 'Bank Transfer'}</option>
                <option value="Cheque">{language === 'bn' ? 'চেক (Cheque)' : 'Cheque'}</option>
                <option value="bKash">bKash (বিকাশ)</option>
                <option value="Nagad">Nagad (নগদ)</option>
                <option value="Rocket">Rocket (রকেট)</option>
                <option value="Other">{language === 'bn' ? 'অন্যান্য' : 'Other'}</option>
              </select>
            </div>

            {/* Reference */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  {language === 'bn' ? 'মানি রিসিট / রেফারেন্স নং' : 'Reference / Receipt No.'}
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g. MR-2026-001, CHQ-5521"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'bn' ? 'মন্তব্য / নোট (Notes)' : 'Notes'}
              </label>
              <input
                type="text"
                placeholder={language === 'bn' ? 'ঐচ্ছিক মন্তব্য লিখুন...' : 'Optional notes...'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Real-time Impact Summary Banner */}
          {activeBill && payAmountNum > 0 && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600" />
                {language === 'bn' ? 'পেমেন্ট পরবর্তী বিল হিসাব পূর্বরূপ:' : 'Post-Payment Impact Summary:'}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-500">{language === 'bn' ? 'বর্তমান বকেয়া:' : 'Current Due:'}</span>{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">৳{formatNumber(currentDue, language)}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block" />
                <div>
                  <span className="text-slate-500">{language === 'bn' ? 'পরিশোধ:' : 'Paying:'}</span>{' '}
                  <span className="font-bold text-emerald-600">৳{formatNumber(payAmountNum, language)}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block" />
                <div>
                  <span className="text-slate-500">{language === 'bn' ? 'অবশিষ্ট বকেয়া:' : 'Remaining Due:'}</span>{' '}
                  <span className="font-bold text-red-600">৳{formatNumber(remainingDueAfter, language)}</span>
                </div>
                <div>
                  <span className="text-slate-500">{language === 'bn' ? 'নতুন স্ট্যাটাস:' : 'New Status:'}</span>{' '}
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    resultingStatus === 'Paid' 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : resultingStatus === 'Partially Paid'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                  }`}>
                    {resultingStatus}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !activeBill || payAmountNum <= 0}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-teal-700/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting 
                  ? (language === 'bn' ? 'জমা হচ্ছে...' : 'Recording...') 
                  : (language === 'bn' ? 'পেমেন্ট জমা নিশ্চিত করুন' : 'Confirm Payment Receipt')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
