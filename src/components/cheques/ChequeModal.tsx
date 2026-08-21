import React, { useState } from 'react';
import { Cheque, Account } from '../../types';
import { useERP } from '../../context/ERPContext';
import { FileText, X, CheckCircle2, DollarSign, Calendar, Building, Landmark } from 'lucide-react';
import { motion } from 'motion/react';

interface ChequeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChequeModal: React.FC<ChequeModalProps> = ({ isOpen, onClose }) => {
  const { addCheque, accounts, language, t } = useERP();

  const [chequeNumber, setChequeNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [partyName, setPartyName] = useState('');
  const [partyType, setPartyType] = useState<Cheque['partyType']>('Client');
  const [amount, setAmount] = useState<number | ''>('');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [clearingDate, setClearingDate] = useState<string>('');
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
  const [notes, setNotes] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chequeNumber.trim() || !partyName.trim() || !amount) return;

    addCheque({
      chequeNumber: chequeNumber.trim(),
      bankName: bankName.trim() || 'General Bank',
      partyName: partyName.trim(),
      partyType,
      amount: Number(amount),
      issueDate,
      clearingDate: clearingDate || issueDate,
      status: 'Pending',
      accountId: accountId || undefined,
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
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#17383B]">
                {t('addChequeBtn')}
              </h3>
              <p className="text-xs text-[#688285]">
                {language === 'bn' ? 'গ্রাহক বা মহাজনের নতুন চেক ব্যাংকিং সিস্টেমে এন্ট্রি করুন' : 'Register issued or received party cheque for bank clearing'}
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
                {language === 'bn' ? 'চেক সফলভাবে এন্ট্রি করা হয়েছে।' : 'Cheque Registered Successfully.'}
              </h4>
              <p className="text-xs text-[#688285]">
                Cheque #{chequeNumber} • {partyName}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Cheque No & Bank */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'চেক নম্বর' : 'Cheque Number'} *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CQ-984210"
                    value={chequeNumber}
                    onChange={(e) => setChequeNumber(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-mono font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'ড্রয়ার ব্যাংক' : 'Drawer Bank'} *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sonali Bank / Dutch Bangla"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Party Name & Party Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'পার্টি / গ্রাহকের নাম' : 'Party / Client Name'} *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Apparels Ltd"
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'পার্টির ধরন' : 'Party Type'}
                  </label>
                  <select
                    value={partyType}
                    onChange={(e) => setPartyType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                  >
                    <option value="Client">{language === 'bn' ? 'গ্রাহক (Client)' : 'Client (Payment In)'}</option>
                    <option value="Supplier">{language === 'bn' ? 'মহাজন / সাপ্লায়ার (Supplier)' : 'Supplier (Payment Out)'}</option>
                    <option value="Other">{language === 'bn' ? 'অন্যান্য (Other)' : 'Other'}</option>
                  </select>
                </div>
              </div>

              {/* Amount & Issue Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'চেকের পরিমাণ (৳)' : 'Cheque Amount (BDT)'} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 150000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-black text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'চেকের তারিখ' : 'Issue Date'} *
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Expected Clearing Date & Linked Deposit Account */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'প্রত্যাশিত ক্লিয়ারিং তারিখ' : 'Expected Clearing Date'}
                  </label>
                  <input
                    type="date"
                    value={clearingDate}
                    onChange={(e) => setClearingDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'জমা বা খরচের ব্যাংক একাউন্ট' : 'Deposit / Settlement Account'}
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountName} ({acc.accountType})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Remarks / Notes */}
              <div>
                <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                  {language === 'bn' ? 'নোট / বিবরণ' : 'Remarks / Reference'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Received for Lot #492 payment"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-medium text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
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
                  {t('addChequeBtn')}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
