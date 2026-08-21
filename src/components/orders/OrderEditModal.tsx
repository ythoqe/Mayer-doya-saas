import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types';
import { useERP } from '../../context/ERPContext';
import { 
  X, 
  Save, 
  Layers, 
  DollarSign, 
  AlertCircle, 
  Droplets,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';

export const FABRIC_QUALITIES = [
  { id: 'মার্কিন', labelEn: 'Markin (মার্কিন)', labelBn: 'মার্কিন' },
  { id: 'লংক্লথ', labelEn: 'Longcloth (লংক্লথ)', labelBn: 'লংক্লথ' },
  { id: 'ভয়েল', labelEn: 'Voile (ভয়েল)', labelBn: 'ভয়েল' },
  { id: 'পপলিন', labelEn: 'Poplin (পপলিন)', labelBn: 'পপলিন' },
  { id: 'ইউনিটিকা', labelEn: 'Unitika (ইউনিটিকা)', labelBn: 'ইউনিটিকা' },
  { id: 'আস্তর', labelEn: 'Astor / Lining (আস্তর)', labelBn: 'আস্তর' },
];

interface OrderEditModalProps {
  order: Order;
  onClose: () => void;
}

export const OrderEditModal: React.FC<OrderEditModalProps> = ({
  order,
  onClose
}) => {
  const { clients, updateOrder, language, t } = useERP();

  const [formData, setFormData] = useState({
    clientId: order.clientId,
    clientName: order.clientName,
    fabricQuality: order.fabricQuality || order.washType || 'মার্কিন',
    colorShade: order.colorShade || '',
    greyYards: order.greyYards || order.quantityPcs || 1000,
    finishingYards: order.finishingYards || 0,
    unitRate: order.unitRate || 40,
    advanceAmount: order.advanceAmount || 0,
    deliveryDate: order.deliveryDate || new Date().toISOString().split('T')[0],
    priority: order.priority || 'normal',
    status: order.status || 'pending',
    batchNumber: order.batchNumber || '',
    machineNo: order.machineNo || '',
    remarks: order.remarks || ''
  });

  const [error, setError] = useState<string | null>(null);

  // Dynamic calculations:
  // ওয়াশিং করার পরে ফিনিশিং যত গজ বের হয় তার ওপর বিল হবে।
  const billableYards = Number(formData.finishingYards) > 0 
    ? Number(formData.finishingYards) 
    : Number(formData.greyYards) || 0;
  
  const totalAmount = Math.round(billableYards * (Number(formData.unitRate) || 0));
  const dueAmount = Math.max(0, totalAmount - (Number(formData.advanceAmount) || 0));

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedClient = clients.find(c => c.id === e.target.value);
    setFormData({
      ...formData,
      clientId: e.target.value,
      clientName: selectedClient ? selectedClient.companyName : formData.clientName
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.greyYards <= 0) {
      setError(language === 'bn' ? 'গেরে গজ ০ এর বেশি হতে হবে।' : 'Grey yards must be greater than 0.');
      return;
    }

    const updates: Partial<Order> = {
      clientId: formData.clientId,
      clientName: formData.clientName,
      fabricQuality: formData.fabricQuality,
      washType: formData.fabricQuality, // compatibility
      colorShade: formData.colorShade,
      greyYards: Number(formData.greyYards),
      finishingYards: Number(formData.finishingYards) || 0,
      quantityPcs: Number(formData.finishingYards) > 0 ? Number(formData.finishingYards) : Number(formData.greyYards),
      quantityYards: Number(formData.finishingYards) > 0 ? Number(formData.finishingYards) : Number(formData.greyYards),
      unitRate: Number(formData.unitRate),
      totalAmount,
      advanceAmount: Number(formData.advanceAmount),
      dueAmount,
      status: formData.status as OrderStatus,
      deliveryDate: formData.deliveryDate,
      priority: formData.priority,
      batchNumber: formData.batchNumber,
      machineNo: formData.machineNo,
      remarks: formData.remarks
    };

    updateOrder(order.id, updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#17383B]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl bg-white rounded-[26px] border border-[#D9EAEB] shadow-[0_25px_70px_rgba(23,56,59,0.18)] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#E6F0F1] flex items-center justify-between bg-[#F1FAFA]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0B9FA5] text-white flex items-center justify-center font-bold shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#17383B] text-base">
                {t('editOrder')} ({order.orderNumber})
              </h3>
              <p className="text-xs text-[#688285]">
                {language === 'bn' 
                  ? 'কাপড়ের কোয়ালিটি, গেরে ও ফিনিশিং গজ এবং বিলিং আপডেট করুন' 
                  : 'Update fabric quality, grey & finishing gaze, and billing'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white text-[#8EA3A5] hover:text-[#17383B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Edit Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Client & Order Status (3 Core Statuses) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#17383B]">{t('clientCompany')}</label>
              <select
                value={formData.clientId}
                onChange={handleClientChange}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#17383B]">{language === 'bn' ? 'অর্ডার স্ট্যাটাস (৩টি ধাপ)' : 'Order Status (3 Stages)'}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as OrderStatus })}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#0B9FA5] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
              >
                <option value="pending">⏳ {language === 'bn' ? 'পেন্ডিং (Pending)' : 'Pending'}</option>
                <option value="washing">💧 {language === 'bn' ? 'ওয়াশিং (Washing)' : 'Washing'}</option>
                <option value="delivered">✅ {language === 'bn' ? 'ডেলিভার (Delivered)' : 'Delivered'}</option>
              </select>
            </div>
          </div>

          {/* Row 2: Fabric Quality (Wash recipe dropdown) & Color/Shade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#17383B]">
                {language === 'bn' ? 'কাপড়ের কোয়ালিটি' : 'Fabric Quality'}
              </label>
              <select
                value={formData.fabricQuality}
                onChange={(e) => setFormData({ ...formData, fabricQuality: e.target.value })}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
              >
                {FABRIC_QUALITIES.map(fq => (
                  <option key={fq.id} value={fq.id}>
                    {language === 'bn' ? fq.labelBn : fq.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#17383B]">{t('colorShadeLabel')}</label>
              <input
                type="text"
                placeholder={language === 'bn' ? 'যেমন: সাদা, কালার, নেভি ব্লু' : 'e.g. White, Color, Navy Blue'}
                value={formData.colorShade}
                onChange={(e) => setFormData({ ...formData, colorShade: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
              />
            </div>
          </div>

          {/* Row 3: Grey Yards & Finishing Yards Calculation Block */}
          <div className="p-4 rounded-2xl bg-[#F1FAFA]/70 border border-[#D9EAEB] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-[#0B9FA5]" />
                {language === 'bn' ? 'গজ পরিমাপ ও বিল হিসাব' : 'Gaze (Yards) & Bill Calculation'}
              </span>
              <span className="text-[10px] text-[#0B9FA5] bg-[#DDF4F3] px-2 py-0.5 rounded-full font-bold">
                {language === 'bn' ? 'ফিনিশিং গজের ওপর বিল' : 'Billed on Finishing Gaze'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#17383B]">
                  {language === 'bn' ? '১. গেরে গজ' : '1. Grey Gaze (Yds)'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.greyYards}
                  onChange={(e) => setFormData({ ...formData, greyYards: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg bg-white border border-[#D9EAEB] text-[#17383B] focus:outline-none focus:border-[#0B9FA5]"
                  required
                />
                <span className="text-[9px] text-[#8EA3A5] block">
                  {language === 'bn' ? 'ওয়াশের পূর্বে প্রাপ্ত' : 'Received for washing'}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#0B9FA5]">
                  {language === 'bn' ? '২. ফিনিশিং গজ' : '2. Finishing Gaze (Yds)'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.finishingYards}
                  onChange={(e) => setFormData({ ...formData, finishingYards: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 text-xs font-black rounded-lg bg-white border-2 border-[#0B9FA5]/60 text-[#0B9FA5] focus:outline-none focus:border-[#0B9FA5]"
                />
                <span className="text-[9px] text-[#0B9FA5] block font-medium">
                  {language === 'bn' ? 'ওয়াশ শেষের আউটপুট' : 'Post-wash actual output'}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#17383B]">
                  {language === 'bn' ? 'দর (৳/গজ)' : 'Rate (৳/Yd)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.unitRate}
                  onChange={(e) => setFormData({ ...formData, unitRate: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg bg-white border border-[#D9EAEB] text-[#17383B] focus:outline-none focus:border-[#0B9FA5]"
                  required
                />
                <span className="text-[9px] text-[#8EA3A5] block">
                  {language === 'bn' ? 'প্রতি গজ ওয়াশ রেট' : 'Per yard wash charge'}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#229A73]">
                  {language === 'bn' ? 'অগ্রিম জমা (৳)' : 'Advance (৳)'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.advanceAmount}
                  onChange={(e) => setFormData({ ...formData, advanceAmount: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg bg-white border border-[#D9EAEB] text-[#229A73] focus:outline-none focus:border-[#229A73]"
                />
                <span className="text-[9px] text-[#8EA3A5] block">
                  {language === 'bn' ? 'জমা নেওয়া টাকা' : 'Paid in advance'}
                </span>
              </div>
            </div>

            {/* Calculated Summary Pill */}
            <div className="p-3 bg-white rounded-xl border border-[#D9EAEB] flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-[#688285]">
                <Info className="w-3.5 h-3.5 text-[#0B9FA5]" />
                <span>
                  {language === 'bn' 
                    ? `বিলযোগ্য গজ: ${billableYards.toLocaleString()} গজ ${formData.finishingYards > 0 ? '(ফিনিশিং গজ অনুযায়ী)' : '(গেরে গজ অনুযায়ী)'}` 
                    : `Billable: ${billableYards.toLocaleString()} Yds ${formData.finishingYards > 0 ? '(via Finishing Gaze)' : '(via Grey Gaze)'}`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#17383B] font-bold">
                  {language === 'bn' ? 'মোট বিল:' : 'Total:'} <strong>৳{totalAmount.toLocaleString()}</strong>
                </span>
                <span className="text-[#0B9FA5] font-black">
                  {language === 'bn' ? 'মোট বকেয়া:' : 'Net Due:'} <strong>৳{dueAmount.toLocaleString()}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Row 4: Delivery Date & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#17383B]">{t('deliveryDateLabel')}</label>
              <input
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#17383B]">{t('orderPriority')}</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'normal' | 'urgent' | 'high' })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
              >
                <option value="normal">{t('normal')}</option>
                <option value="high">{t('high')}</option>
                <option value="urgent">{t('urgent')}</option>
              </select>
            </div>
          </div>

          {/* Row 5: Batch & Machine No */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#17383B]">{t('batchNumberLabel')}</label>
              <input
                type="text"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                placeholder="e.g. BATCH-01"
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#17383B]">{t('machineNoLabel')}</label>
              <input
                type="text"
                value={formData.machineNo}
                onChange={(e) => setFormData({ ...formData, machineNo: e.target.value })}
                placeholder="e.g. WASH-M01"
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
              />
            </div>
          </div>

          {/* Row 6: Remarks */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#17383B]">{t('remarksLabel')}</label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder={language === 'bn' ? 'ফ্যাক্টরি ও ওয়াশ সম্পর্কিত বিশেষ মন্তব্য...' : 'Special factory instructions, delivery notes...'}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-[#E6F0F1] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#17383B] text-xs font-bold transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#0B9FA5] hover:bg-[#078A90] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{t('saveChanges')}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
