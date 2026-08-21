import React, { useState } from 'react';
import { Order, Language } from '../../types';
import { useERP } from '../../context/ERPContext';
import { 
  X, 
  Save, 
  Calendar, 
  Layers, 
  DollarSign, 
  AlertCircle, 
  Check,
  Droplets,
  Package
} from 'lucide-react';
import { motion } from 'motion/react';

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
    styleNo: order.styleNo,
    garmentType: order.garmentType,
    washType: order.washType,
    colorShade: order.colorShade,
    quantityPcs: order.quantityPcs,
    unitRate: order.unitRate,
    advanceAmount: order.advanceAmount,
    deliveryDate: order.deliveryDate,
    priority: order.priority,
    batchNumber: order.batchNumber || '',
    machineNo: order.machineNo || '',
    remarks: order.remarks || ''
  });

  const [error, setError] = useState<string | null>(null);

  // Dynamic calculations
  const totalAmount = (Number(formData.quantityPcs) || 0) * (Number(formData.unitRate) || 0);
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

    if (!formData.styleNo.trim()) {
      setError('Please provide a style number.');
      return;
    }

    if (formData.quantityPcs <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }

    const updates: Partial<Order> = {
      clientId: formData.clientId,
      clientName: formData.clientName,
      styleNo: formData.styleNo,
      garmentType: formData.garmentType,
      washType: formData.washType,
      colorShade: formData.colorShade,
      quantityPcs: Number(formData.quantityPcs),
      unitRate: Number(formData.unitRate),
      totalAmount,
      advanceAmount: Number(formData.advanceAmount),
      dueAmount,
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
            <div className="w-8 h-8 rounded-xl bg-[#FFF3DF] text-[#C47D1C] flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#17383B] text-base">
                {t('editOrder')} ({order.orderNumber})
              </h3>
              <p className="text-xs text-[#688285]">
                Update garment details, wash recipe, batch allocation, and pricing
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

          {/* Row 1: Client & Priority */}
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

          {/* Row 2: Style No & Garment Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#17383B]">{t('styleNoLabel')}</label>
              <input
                type="text"
                value={formData.styleNo}
                onChange={(e) => setFormData({ ...formData, styleNo: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#17383B]">{t('garmentTypeLabel')}</label>
              <input
                type="text"
                value={formData.garmentType}
                onChange={(e) => setFormData({ ...formData, garmentType: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
              />
            </div>
          </div>

          {/* Row 3: Wash Type & Color Shade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#17383B]">{t('washTypeLabel')}</label>
              <input
                type="text"
                value={formData.washType}
                onChange={(e) => setFormData({ ...formData, washType: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#17383B]">{t('colorShadeLabel')}</label>
              <input
                type="text"
                value={formData.colorShade}
                onChange={(e) => setFormData({ ...formData, colorShade: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
              />
            </div>
          </div>

          {/* Row 4: Quantity, Rate, Advance & Due Calculation */}
          <div className="p-4 rounded-2xl bg-[#F9FBFC] border border-[#E6F0F1] space-y-3">
            <span className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#0B9FA5]" />
              {t('financials')}
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-[#688285]">{t('quantityPcs')}</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantityPcs}
                  onChange={(e) => setFormData({ ...formData, quantityPcs: Math.max(1, Number(e.target.value)) })}
                  className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg bg-white border border-[#D9EAEB] text-[#17383B]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[#688285]">{t('unitRateLabel')} (৳)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.unitRate}
                  onChange={(e) => setFormData({ ...formData, unitRate: Math.max(0, Number(e.target.value)) })}
                  className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg bg-white border border-[#D9EAEB] text-[#17383B]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[#688285]">{t('advanceAmountLabel')} (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.advanceAmount}
                  onChange={(e) => setFormData({ ...formData, advanceAmount: Math.max(0, Number(e.target.value)) })}
                  className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg bg-white border border-[#D9EAEB] text-[#229A73]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[#0B9FA5] font-bold">{t('dueAmountLabel')} (৳)</label>
                <div className="px-2.5 py-1.5 text-xs font-black rounded-lg bg-[#DDF4F3] text-[#0B9FA5]">
                  ৳{dueAmount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Row 5: Schedule & Machine Floor Allocation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

          {/* Row 6: Recipe & Remarks */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#17383B]">{t('remarksLabel')}</label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Chemical recipe adjustments, heat limits, softener timing..."
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
