import React, { useState, useEffect } from 'react';
import { Supplier } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency } from '../../utils/translation';
import { X, Building2, User, Phone, MapPin, FlaskConical, CheckCircle2, Shield, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SupplierModalProps {
  supplier?: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  supplier,
  isOpen,
  onClose
}) => {
  const { addSupplier, updateSupplier, language, t } = useERP();

  const isEditing = !!supplier;

  const [companyName, setCompanyName] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Chemicals');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  useEffect(() => {
    if (supplier) {
      setCompanyName(supplier.company || supplier.companyName || '');
      setName(supplier.name || '');
      setCategory(supplier.category || 'Chemicals');
      setPhone(supplier.phone || '');
      setAddress(supplier.address || '');
      setStatus(supplier.status || 'active');
    } else {
      setCompanyName('');
      setName('');
      setCategory('Chemicals');
      setPhone('');
      setAddress('');
      setStatus('active');
    }
  }, [supplier, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    if (isEditing && supplier) {
      updateSupplier(supplier.id, {
        company: companyName.trim(),
        companyName: companyName.trim(),
        name: name.trim() || companyName.trim(),
        category: category as any,
        phone: phone.trim() || '+880 1700-000000',
        address: address.trim() || 'Dhaka Industrial Area',
        status
      });
    } else {
      addSupplier({
        company: companyName.trim(),
        companyName: companyName.trim(),
        name: name.trim() || companyName.trim(),
        category: category as any,
        phone: phone.trim() || '+880 1700-000000',
        address: address.trim() || 'Dhaka Industrial Area',
        totalPurchases: 0,
        totalPaid: 0,
        balance: 0,
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
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#17383B]">
                  {isEditing ? t('editSupplierBtn') : t('addSupplierBtn')}
                </h3>
                <p className="text-xs text-[#688285]">
                  {isEditing ? 'Update vendor & supplier profile' : 'Register new chemical, dye or spares supplier'}
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
            {/* GROUP 1: SUPPLIER INFORMATION */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-[#E6F0F1]">
                <Shield className="w-3.5 h-3.5 text-[#0B9FA5]" />
                <span className="text-[10px] font-extrabold text-[#688285] uppercase tracking-wider">
                  {t('supplierInfoGroup')}
                </span>
              </div>

              {/* Company / Supplier Name */}
              <div>
                <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                  {t('companyNameLabel')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Colour Chem Bangladesh Ltd."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs sm:text-sm text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/20 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Contact Person */}
                <div>
                  <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                    {t('contactNameLabel')}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Md. Shahidul Islam"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                    {t('suppliedCategoryCol')} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Tag className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs font-bold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none cursor-pointer"
                    >
                      <option value="Chemicals">{t('categoryChemicals')}</option>
                      <option value="Dyes">{t('categoryDyes')}</option>
                      <option value="Machinery">{t('categoryMachinery')}</option>
                      <option value="Packaging">{t('categoryPackaging')}</option>
                      <option value="General">{t('categoryGeneral')}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                      placeholder="+880 1819-000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs font-mono text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none transition-all"
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
                    placeholder="e.g. Tejgaon Industrial Area, Dhaka"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* GROUP 2: FINANCIAL INFORMATION (System calculated & preserved) */}
            {isEditing && supplier && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 pb-1 border-b border-[#E6F0F1]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#38C99A]" />
                  <span className="text-[10px] font-extrabold text-[#688285] uppercase tracking-wider">
                    {t('financialInfoGroup')} (Auto-calculated from Purchases & Payments)
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-[#F9FBFC] border border-[#E6F0F1] text-center">
                  <div>
                    <span className="text-[10px] text-[#8EA3A5] font-bold uppercase block">Total Purchases</span>
                    <strong className="text-xs text-[#17383B]">{formatCurrency(supplier.totalPurchases, language)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8EA3A5] font-bold uppercase block">Total Paid</span>
                    <strong className="text-xs text-[#229A73]">{formatCurrency(supplier.totalPaid, language)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8EA3A5] font-bold uppercase block">Payable Balance</span>
                    <strong className={`text-xs ${supplier.balance > 0 ? 'text-[#C83F57]' : 'text-[#229A73]'}`}>
                      {formatCurrency(supplier.balance, language)}
                    </strong>
                  </div>
                </div>
              </div>
            )}

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
                {isEditing ? t('saveChanges') : 'Register Supplier'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
