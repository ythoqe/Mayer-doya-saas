import React, { useState, useEffect } from 'react';
import { Client, YearlyDue } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { X, Building2, User, Phone, Mail, MapPin, CheckCircle2, Shield, Plus, Trash2, Calendar, DollarSign, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClientModalProps {
  client?: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  client,
  isOpen,
  onClose
}) => {
  const { addClient, updateClient, language, t } = useERP();

  const isEditing = !!client;

  const [companyName, setCompanyName] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  // Opening balance & Yearly historical dues breakdown
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [yearlyDues, setYearlyDues] = useState<YearlyDue[]>([]);
  const [showYearlyBreakdown, setShowYearlyBreakdown] = useState(false);

  useEffect(() => {
    if (client) {
      setCompanyName(client.companyName || '');
      setName(client.name || '');
      setPhone(client.phone || '');
      setEmail(client.email || '');
      setAddress(client.address || '');
      setStatus(client.status || 'active');
      const op = client.openingBalance || 0;
      setOpeningBalance(op);
      const dues = client.previousYearsDues || [];
      setYearlyDues(dues);
      setShowYearlyBreakdown(dues.length > 0);
    } else {
      setCompanyName('');
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setStatus('active');
      setOpeningBalance(0);
      setYearlyDues([]);
      setShowYearlyBreakdown(false);
    }
  }, [client, isOpen]);

  if (!isOpen) return null;

  const handleAddYearRow = () => {
    const currentYear = new Date().getFullYear();
    const nextYear = yearlyDues.length > 0 
      ? Number(yearlyDues[yearlyDues.length - 1].year) - 1 
      : currentYear - 1;
    
    const updated = [...yearlyDues, { year: nextYear, amount: 0, note: '' }];
    setYearlyDues(updated);
    const sum = updated.reduce((s, row) => s + (Number(row.amount) || 0), 0);
    setOpeningBalance(sum);
  };

  const handleRemoveYearRow = (index: number) => {
    const updated = yearlyDues.filter((_, idx) => idx !== index);
    setYearlyDues(updated);
    const sum = updated.reduce((s, row) => s + (Number(row.amount) || 0), 0);
    setOpeningBalance(sum);
  };

  const handleYearChange = (index: number, field: keyof YearlyDue, value: any) => {
    const updated = [...yearlyDues];
    updated[index] = { ...updated[index], [field]: value };
    setYearlyDues(updated);
    if (field === 'amount') {
      const sum = updated.reduce((s, row) => s + (Number(row.amount) || 0), 0);
      setOpeningBalance(sum);
    }
  };

  const handleDirectOpeningBalanceChange = (val: number) => {
    setOpeningBalance(val);
  };

  const totalCalculatedDue = isEditing && client
    ? ((client.totalBilled || 0) + openingBalance) - (client.totalPaid || 0)
    : openingBalance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    // Filter valid yearly dues
    const validYearlyDues = yearlyDues.filter(y => (Number(y.amount) || 0) > 0 || y.note?.trim());

    if (isEditing && client) {
      updateClient(client.id, {
        companyName: companyName.trim(),
        name: name.trim() || companyName.trim(),
        phone: phone.trim() || '+880 1700-000000',
        email: email.trim() || undefined,
        address: address.trim() || 'Dhaka Industrial Area',
        openingBalance: Number(openingBalance) || 0,
        previousYearsDues: validYearlyDues,
        status
      });
    } else {
      addClient({
        companyName: companyName.trim(),
        name: name.trim() || companyName.trim(),
        phone: phone.trim() || '+880 1700-000000',
        email: email.trim() || undefined,
        address: address.trim() || 'Dhaka Industrial Area',
        openingBalance: Number(openingBalance) || 0,
        previousYearsDues: validYearlyDues,
        totalBilled: 0,
        totalPaid: 0,
        balance: Number(openingBalance) || 0,
        status
      });
    }

    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17383B]/40 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-xl bg-white rounded-3xl border border-[#D9EAEB] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-[#F1FAFA] border-b border-[#D9EAEB] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0B9FA5] text-white flex items-center justify-center shadow-[0_2px_10px_rgba(11,159,165,0.25)]">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#17383B]">
                  {isEditing ? t('editClientBtn') : t('addClientBtn')}
                </h3>
                <p className="text-xs text-[#688285]">
                  {isEditing ? 'Update client contact particulars' : 'Register new customer factory account'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white text-[#8EA3A5] hover:text-[#17383B] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(85vh-120px)] overflow-y-auto custom-scrollbar">
            {/* GROUP 1: CLIENT INFORMATION */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-[#E6F0F1]">
                <Shield className="w-3.5 h-3.5 text-[#0B9FA5]" />
                <span className="text-[10px] font-extrabold text-[#688285] uppercase tracking-wider">
                  {t('clientInfoGroup')}
                </span>
              </div>

              {/* Company / Factory Name */}
              <div>
                <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                  {t('companyNameLabel')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Standard Garments Ltd."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs sm:text-sm text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/20 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Contact Person / Merchandiser */}
                <div>
                  <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                    {t('contactNameLabel')}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Tanvir Ahmed (Sr. Merchandiser)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                    {t('phoneLabel')} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="+880 1711-000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs font-mono text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                    {t('emailLabel')}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="merchandising@standardgarments.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                    {t('statusLabel')}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs font-bold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none cursor-pointer"
                  >
                    <option value="active">{t('active')}</option>
                    <option value="inactive">{t('inactive')}</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                  {t('addressLabel')}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-3" />
                  <textarea
                    rows={2}
                    placeholder="e.g. Plot 42, Block B, Tongi Industrial Area, Gazipur"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* GROUP 2: OPENING BALANCE & HISTORICAL YEARLY DUES */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#E6F0F1]">
                <div className="flex items-center gap-2">
                  <History className="w-3.5 h-3.5 text-[#0B9FA5]" />
                  <span className="text-[10px] font-extrabold text-[#688285] uppercase tracking-wider">
                    {language === 'bn' ? 'পূর্বের বকেয়া ও বিগত বছরসমূহের হিসাব' : 'Opening Balance & Past Years Due History'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!showYearlyBreakdown && yearlyDues.length === 0) {
                      handleAddYearRow();
                    }
                    setShowYearlyBreakdown(!showYearlyBreakdown);
                  }}
                  className="text-[11px] font-bold text-[#0B9FA5] hover:text-[#078A90] flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  {showYearlyBreakdown 
                    ? (language === 'bn' ? 'বছরভিত্তিক তালিকা লুকান' : 'Hide Yearly Rows')
                    : (language === 'bn' ? '+ বছরভিত্তিক বকেয়া যোগ করুন' : '+ Add Yearly Due Breakdown')}
                </button>
              </div>

              {/* Total Opening Balance Input */}
              <div className="p-3.5 rounded-2xl bg-[#F9FBFC] border border-[#D9EAEB]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#17383B]">
                      {language === 'bn' ? 'মোট পূর্ববর্তী বকেয়া (Opening Balance Due)' : 'Total Opening Balance Due (৳)'}
                    </label>
                    <p className="text-[11px] text-[#688285]">
                      {language === 'bn' ? 'ক্লায়েন্টের পূর্বের সর্বমোট বকেয়া টাকা' : 'Initial debt balance brought forward'}
                    </p>
                  </div>
                  <div className="relative w-full sm:w-48">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#0B9FA5]">৳</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={openingBalance || ''}
                      onChange={(e) => handleDirectOpeningBalanceChange(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-[#D9EAEB] text-sm font-black text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Yearly Dues Rows (When expanded) */}
                {showYearlyBreakdown && (
                  <div className="mt-3.5 pt-3 border-t border-[#E6F0F1] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-[#17383B]">
                        {language === 'bn' ? 'বিগত বছরের বকেয়া বিভাজন (Year-wise Dues):' : 'Year-wise breakdown:'}
                      </span>
                      <button
                        type="button"
                        onClick={handleAddYearRow}
                        className="px-2 py-1 rounded-lg bg-[#DDF4F3] text-[#0B9FA5] hover:bg-[#c9f0ee] text-[11px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        {language === 'bn' ? 'সাল যোগ' : 'Add Year'}
                      </button>
                    </div>

                    {yearlyDues.length === 0 ? (
                      <p className="text-[11px] text-[#8EA3A5] italic py-2 text-center">
                        {language === 'bn' ? 'কোনো সাল যোগ করা হয়নি। উপরের বাটনে ক্লিক করুন।' : 'No yearly rows added yet.'}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {yearlyDues.map((due, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#E6F0F1]">
                            {/* Year selector / input */}
                            <div className="w-24 shrink-0">
                              <label className="text-[9px] font-bold text-[#8EA3A5] block uppercase">
                                {language === 'bn' ? 'সাল / বছর' : 'Year'}
                              </label>
                              <input
                                type="number"
                                min="2000"
                                max="2035"
                                value={due.year}
                                onChange={(e) => handleYearChange(idx, 'year', e.target.value)}
                                className="w-full px-2 py-1 rounded-lg bg-[#F9FBFC] border border-[#D9EAEB] text-xs font-bold text-[#17383B] focus:outline-none"
                              />
                            </div>

                            {/* Amount input */}
                            <div className="w-32 shrink-0">
                              <label className="text-[9px] font-bold text-[#8EA3A5] block uppercase">
                                {language === 'bn' ? 'বকেয়া টাকা (৳)' : 'Due Amount (৳)'}
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={due.amount || ''}
                                onChange={(e) => handleYearChange(idx, 'amount', Number(e.target.value) || 0)}
                                placeholder="0"
                                className="w-full px-2 py-1 rounded-lg bg-[#F9FBFC] border border-[#D9EAEB] text-xs font-bold text-[#C47D1C] focus:outline-none"
                              />
                            </div>

                            {/* Note input */}
                            <div className="flex-1 min-w-0">
                              <label className="text-[9px] font-bold text-[#8EA3A5] block uppercase">
                                {language === 'bn' ? 'বিবরণ / নোট' : 'Note / Ref'}
                              </label>
                              <input
                                type="text"
                                value={due.note || ''}
                                onChange={(e) => handleYearChange(idx, 'note', e.target.value)}
                                placeholder="যেমন: ২০২৩ সালের ডিসেম্বরের বিল"
                                className="w-full px-2 py-1 rounded-lg bg-[#F9FBFC] border border-[#D9EAEB] text-xs text-[#17383B] focus:outline-none truncate"
                              />
                            </div>

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveYearRow(idx)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors mt-3"
                              title="মুছুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* GROUP 3: TOTAL FINANCIAL SUMMARY */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 pb-1 border-b border-[#E6F0F1]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#38C99A]" />
                <span className="text-[10px] font-extrabold text-[#688285] uppercase tracking-wider">
                  {language === 'bn' ? 'সর্বমোট হিসাব সারসংক্ষেপ' : 'Live Account Ledger Summary'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-[#F1FAFA] border border-[#D9EAEB] text-center">
                <div>
                  <span className="text-[10px] text-[#8EA3A5] font-bold uppercase block">
                    {language === 'bn' ? 'মোট বিল (Billed)' : 'Total Billed'}
                  </span>
                  <strong className="text-xs text-[#17383B]">
                    {formatCurrency((isEditing && client?.totalBilled) ? client.totalBilled : 0, language)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#8EA3A5] font-bold uppercase block">
                    {language === 'bn' ? 'মোট পরিশোধ (Paid)' : 'Total Paid'}
                  </span>
                  <strong className="text-xs text-[#229A73]">
                    {formatCurrency((isEditing && client?.totalPaid) ? client.totalPaid : 0, language)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#8EA3A5] font-bold uppercase block">
                    {language === 'bn' ? 'বর্তমান বকেয়া (Due)' : 'Balance Due'}
                  </span>
                  <strong className={`text-xs font-black ${totalCalculatedDue > 0 ? 'text-[#C47D1C]' : 'text-[#229A73]'}`}>
                    {formatCurrency(totalCalculatedDue, language)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6F0F1]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#D9EAEB] text-xs font-bold text-[#688285] hover:bg-[#F1FAFA] transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white text-xs font-extrabold shadow-md transition-all active:scale-95"
              >
                {isEditing ? t('saveChanges') : (language === 'bn' ? 'ক্লায়েন্ট সংরক্ষণ করুন' : 'Register Client')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
