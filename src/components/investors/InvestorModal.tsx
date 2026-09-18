import React, { useState, useEffect } from 'react';
import { Investor, Language } from '../../types';
import { X, User, Phone, Mail, FileText, Percent, MapPin, Building, Calendar, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InvestorModalProps {
  isOpen: boolean;
  onClose: () => void;
  investor?: Investor | null;
  initialData?: Investor | null;
  onSave: (data: any) => Promise<void>;
  language: Language;
  t: (key: string) => string;
}

export const InvestorModal: React.FC<InvestorModalProps> = ({
  isOpen,
  onClose,
  investor,
  initialData,
  onSave,
  language,
  t
}) => {
  const currentInvestor = investor || initialData || null;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nidOrPassport, setNidOrPassport] = useState('');
  const [address, setAddress] = useState('');
  const [sharePercentage, setSharePercentage] = useState<number | ''>('');
  const [mudarabaProfitSharePercentage, setMudarabaProfitSharePercentage] = useState<number | ''>(30);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [bankDetails, setBankDetails] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentInvestor) {
      setName(currentInvestor.name || '');
      setPhone(currentInvestor.phone || '');
      setEmail(currentInvestor.email || '');
      setNidOrPassport(currentInvestor.nidOrPassport || '');
      setAddress(currentInvestor.address || '');
      setSharePercentage(currentInvestor.sharePercentage ?? '');
      setMudarabaProfitSharePercentage(currentInvestor.mudarabaProfitSharePercentage ?? (currentInvestor.sharePercentage ?? 30));
      setStartDate(currentInvestor.startDate || currentInvestor.investmentStartDate || new Date().toISOString().split('T')[0]);
      setBankDetails(currentInvestor.bankDetails || '');
      setStatus(currentInvestor.status || 'active');
      setNotes(currentInvestor.notes || '');
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setNidOrPassport('');
      setAddress('');
      setSharePercentage('');
      setMudarabaProfitSharePercentage(30);
      setStartDate(new Date().toISOString().split('T')[0]);
      setBankDetails('');
      setStatus('active');
      setNotes('');
    }
    setError('');
  }, [investor, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(language === 'bn' ? 'বিনিয়োগকারীর নাম আবশ্যক' : 'Investor name is required');
      return;
    }
    if (!phone.trim()) {
      setError(language === 'bn' ? 'মোবাইল নম্বর আবশ্যক' : 'Phone number is required');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSave({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        nidOrPassport: nidOrPassport.trim() || undefined,
        address: address.trim() || undefined,
        sharePercentage: sharePercentage === '' ? undefined : Number(sharePercentage),
        mudarabaProfitSharePercentage: mudarabaProfitSharePercentage === '' ? 30 : Number(mudarabaProfitSharePercentage),
        startDate,
        bankDetails: bankDetails.trim() || undefined,
        status,
        notes: notes.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save investor');
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
          className="bg-white rounded-3xl shadow-2xl border border-[#D9EAEB] w-full max-w-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-[#17383B] to-[#1F4B4F] text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#16B8B0]/20 text-[#16B8B0]">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  {investor ? t('editInvestor') : t('addInvestor')}
                </h3>
                <p className="text-xs text-white/70 mt-0.5">
                  {language === 'bn' 
                    ? 'কারখানার বিনিয়োগকারী/শেয়ারহোল্ডারের বিবরণ ও শর্তাবলী' 
                    : 'Factory investor profile and partnership terms'}
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

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-3.5 bg-[#FDF4F5] border border-[#F8D2D9] rounded-2xl flex items-center gap-2.5 text-xs text-[#EA7185]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#0B9FA5]" />
                  {t('investorName')} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={language === 'bn' ? 'যেমন: হাজী মো: করিম উল্লাহ' : 'e.g., Haji Md. Karim Ullah'}
                  required
                  className="w-full px-4 py-2.5 bg-[#F1FAFA] border border-[#D9EAEB] rounded-xl text-sm text-[#17383B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#0B9FA5]" />
                  {t('investorPhone')} *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="01712-XXXXXX"
                  required
                  className="w-full px-4 py-2.5 bg-[#F1FAFA] border border-[#D9EAEB] rounded-xl text-sm text-[#17383B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#688285]" />
                  {t('investorEmail')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="investor@example.com"
                  className="w-full px-4 py-2.5 bg-[#F1FAFA] border border-[#D9EAEB] rounded-xl text-sm text-[#17383B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]"
                />
              </div>

              {/* NID / Passport */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#688285]" />
                  {t('nidOrPassport')}
                </label>
                <input
                  type="text"
                  value={nidOrPassport}
                  onChange={e => setNidOrPassport(e.target.value)}
                  placeholder={language === 'bn' ? 'জাতীয় পরিচয়পত্র / পাসপোর্ট নং' : 'NID / Smart Card / Passport'}
                  className="w-full px-4 py-2.5 bg-[#F1FAFA] border border-[#D9EAEB] rounded-xl text-sm text-[#17383B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]"
                />
              </div>

              {/* Mudaraba Agreed Profit Share % */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-[#229A73]" />
                    {t('mudarabaSharePercentage')}
                  </span>
                  <span className="text-[10px] text-[#229A73] font-bold">
                    {language === 'bn' ? 'ডিফল্ট ৩০%' : 'Default 30%'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={mudarabaProfitSharePercentage}
                    onChange={e => setMudarabaProfitSharePercentage(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="30"
                    required
                    className="w-full px-4 py-2.5 bg-[#F1FAFA] border border-[#D9EAEB] rounded-xl text-sm font-bold text-[#17383B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#229A73]"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#688285]">
                    %
                  </span>
                </div>
                <p className="text-[10px] text-[#688285] leading-tight">
                  {language === 'bn' 
                    ? 'বিনিয়োগকৃত মূলধনের আনুপাতিক মুনাফার কত অংশ বিনিয়োগকারী পাবেন (যেমন: ৩০% বিনিয়োগকারী, ৭০% কারখানা মুদারিব)' 
                    : 'Percentage of proportional profit given to investor (e.g. 30% to investor, 70% retained by factory)'}
                </p>
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#688285]" />
                  {t('startDate')}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F1FAFA] border border-[#D9EAEB] rounded-xl text-sm text-[#17383B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]"
                />
              </div>
            </div>

            {/* Mudaraba Rule Explanatory Banner */}
            <div className="p-3 bg-[#E8F8F2] border border-[#BDEBD7] rounded-xl text-xs text-[#17383B] space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-[#229A73]">
                <span>✓ {language === 'bn' ? 'মুদারাবা মুনাফা বণ্টন নীতিমালা:' : 'Mudaraba Profit Sharing Policy:'}</span>
              </div>
              <p className="text-[11px] text-[#2C6E5A] leading-relaxed">
                {language === 'bn'
                  ? 'বিনিয়োগকারীর চূড়ান্ত মুনাফা হিসাব হবে: (বিনিয়োগকৃত মূলধন ÷ মোট সমন্বিত মূলধন) × কারখানার মোট নিট লাভ × চুক্তিকৃত মুনাফার হার %। কখনোই সরাসরি মোট লাভের উপর এই শতাংশ হিসাব করা হবে না।'
                  : 'Investor final profit = (Investor Capital ÷ Total Capital) × Company Net Profit × Agreed Share %. Total profit is never directly multiplied by this percentage.'}
              </p>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#688285]" />
                {t('investorAddress')}
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder={language === 'bn' ? 'ঠিকানা (বাড়ি নং, রোড নং, এলাকা, শহর)' : 'Address (Street, City)'}
                className="w-full px-4 py-2.5 bg-[#F1FAFA] border border-[#D9EAEB] rounded-xl text-sm text-[#17383B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]"
              />
            </div>

            {/* Bank Details / MFS */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#688285]" />
                {t('bankDetails')}
              </label>
              <input
                type="text"
                value={bankDetails}
                onChange={e => setBankDetails(e.target.value)}
                placeholder={language === 'bn' ? 'ব্যাংকের নাম, অ্যাকাউন্ট নং, শাখা অথবা বিকাশ/নগদ নম্বর' : 'Bank Name, A/C No, Branch or bKash/Nagad No'}
                className="w-full px-4 py-2.5 bg-[#F1FAFA] border border-[#D9EAEB] rounded-xl text-sm text-[#17383B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]"
              />
            </div>

            {/* Status & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B]">
                  {t('investorStatus')}
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#17383B] p-2.5 rounded-xl border border-[#D9EAEB] hover:bg-[#F1FAFA] flex-1">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={status === 'active'}
                      onChange={() => setStatus('active')}
                      className="text-[#0B9FA5] focus:ring-[#0B9FA5]"
                    />
                    <span>{t('investorActive')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#17383B] p-2.5 rounded-xl border border-[#D9EAEB] hover:bg-[#F1FAFA] flex-1">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={status === 'inactive'}
                      onChange={() => setStatus('inactive')}
                      className="text-[#0B9FA5] focus:ring-[#0B9FA5]"
                    />
                    <span>{t('investorInactive')}</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B]">
                  {t('notes')}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={language === 'bn' ? 'অংশীদারিত্ব বা বিশেষ শর্তাবলী...' : 'Partnership notes or terms...'}
                  className="w-full px-4 py-2 bg-[#F1FAFA] border border-[#D9EAEB] rounded-xl text-sm text-[#17383B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]"
                />
              </div>
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
