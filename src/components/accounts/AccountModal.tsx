import React, { useState } from 'react';
import { Account } from '../../types';
import { useERP } from '../../context/ERPContext';
import { Landmark, X, CheckCircle2, DollarSign, Building } from 'lucide-react';
import { motion } from 'motion/react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose }) => {
  const { addAccount, language, t } = useERP();

  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<Account['accountType']>('Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [branch, setBranch] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number | ''>('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) return;

    addAccount({
      accountName: accountName.trim(),
      accountType,
      accountNumber: accountNumber.trim() || undefined,
      bankName: bankName.trim() || undefined,
      branch: branch.trim() || undefined,
      currentBalance: Number(openingBalance) || 0,
      status
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
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#17383B]">
                {t('addAccountBtn')}
              </h3>
              <p className="text-xs text-[#688285]">
                {language === 'bn' ? 'ফ্যাক্টরি ব্যাংক, ক্যাশ বা এমএফএস হিসাব যুক্ত করুন' : 'Register a new cash vault, corporate bank, or digital wallet'}
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

        {/* Form Body */}
        <div className="p-6">
          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#E5F8F1] text-[#229A73] flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-black text-lg text-[#17383B]">
                {language === 'bn' ? 'একাউন্ট সফলভাবে যুক্ত হয়েছে।' : 'Account Created Successfully.'}
              </h4>
              <p className="text-xs text-[#688285]">
                {accountName} ({accountType})
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Account Name */}
              <div>
                <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                  {language === 'bn' ? 'একাউন্টের নাম' : 'Account Name'} *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dutch-Bangla Bank Factory A/C"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                  required
                />
              </div>

              {/* Account Type & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'একাউন্টের ধরন' : 'Account Type'} *
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as Account['accountType'])}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                  >
                    <option value="Cash">{language === 'bn' ? 'নগদ ক্যাশ (Cash)' : 'Cash in Hand'}</option>
                    <option value="Bank">{language === 'bn' ? 'ব্যাংক একাউন্ট (Bank)' : 'Bank Account'}</option>
                    <option value="MFS">{language === 'bn' ? 'মোবাইল ব্যাংকিং (MFS)' : 'Mobile Financial Service (MFS)'}</option>
                    <option value="Petty Cash">{language === 'bn' ? 'পেটি ক্যাশ (Petty Cash)' : 'Petty Cash'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'একাউন্টের অবস্থা' : 'Status'}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                  >
                    <option value="active">{language === 'bn' ? 'সচল (Active)' : 'Active'}</option>
                    <option value="inactive">{language === 'bn' ? 'নিষ্ক্রিয় (Inactive)' : 'Inactive'}</option>
                  </select>
                </div>
              </div>

              {/* Account Number & Opening Balance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'হিসাব / একাউন্ট নম্বর' : 'Account Number'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 104.120.0048291"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-mono font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'প্রারম্ভিক ব্যালেন্স (৳)' : 'Opening Balance (BDT)'} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-black text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                  />
                </div>
              </div>

              {/* Bank Name & Branch if Bank */}
              {(accountType === 'Bank' || accountType === 'MFS') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                      {language === 'bn' ? 'ব্যাংক / প্রোভাইডারের নাম' : 'Bank / Provider Name'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dutch-Bangla Bank / bKash"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                      {language === 'bn' ? 'শাখা / ব্রাঞ্চ' : 'Branch / Agent Point'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Gazipur Corporate Branch"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                    />
                  </div>
                </div>
              )}

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
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white font-extrabold text-xs shadow-md transition-all"
                >
                  {t('addAccountBtn')}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
