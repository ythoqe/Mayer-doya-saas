import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { InventoryItem } from '../../types';
import { formatNumber } from '../../utils/translation';
import { 
  X, 
  ArrowUpRight, 
  AlertTriangle, 
  CheckCircle2, 
  PackageMinus, 
  Layers, 
  Calendar, 
  User, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface StockOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem?: InventoryItem | null;
}

export const StockOutModal: React.FC<StockOutModalProps> = ({
  isOpen,
  onClose,
  selectedItem
}) => {
  const { inventory, orders, updateInventoryStock, addNotification, language, t } = useERP();

  const [itemId, setItemId] = useState<string>(selectedItem?.id || inventory[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(20);
  const [reason, setReason] = useState<string>('Dyeing Batch Processing');
  const [batchReference, setBatchReference] = useState<string>('');
  const [issueDate, setReceiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [issuedTo, setIssuedTo] = useState<string>('Floor Dyeing Master');
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state with selectedItem
  useEffect(() => {
    if (selectedItem) {
      setItemId(selectedItem.id);
    } else if (inventory.length > 0) {
      setItemId(inventory[0].id);
    }
  }, [selectedItem, inventory]);

  if (!isOpen) return null;

  const currentItem = inventory.find(i => i.id === itemId) || selectedItem || inventory[0];
  const availableStock = currentItem?.currentStockKg || 0;
  const isExceeding = Number(quantity) > availableStock;
  const remainingStock = availableStock - (Number(quantity) || 0);
  const willBeBelowMin = remainingStock <= (currentItem?.minAlertLevel || 0);

  // Active batches for quick reference
  const activeBatches = orders
    .filter(o => ['washing', 'dyeing', 'hydro', 'drying', 'batch_assigned'].includes(o.status))
    .slice(0, 8);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem || Number(quantity) <= 0 || isExceeding) return;

    setIsSubmitting(true);
    try {
      const newStock = Math.max(0, availableStock - Number(quantity));
      updateInventoryStock(currentItem.id, newStock);

      // Trigger low stock notification if it falls below min alert
      if (newStock <= currentItem.minAlertLevel) {
        addNotification({
          title: 'Low Chemical Stock Warning',
          message: `${currentItem.name} is now at ${newStock} ${currentItem.unit} (below minimum ${currentItem.minAlertLevel} ${currentItem.unit}).`,
          type: 'inventory',
          read: false,
          linkTab: 'inventory'
        });
      }

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#0F2D30]/50 backdrop-blur-xs"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#D9EAEB] overflow-hidden z-10 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 bg-[#FFF0E6] border-b border-[#F5D5C2] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-[#E06D28] flex items-center justify-center shadow-xs border border-[#E06D28]/20">
              <PackageMinus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#17383B]">
                {t('stockOutTitle')}
              </h3>
              <p className="text-xs text-[#688285]">
                {t('stockOutSubtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#8EA3A5] hover:text-[#17383B] hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Select Item */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#17383B]">
              Select Chemical / Material Item <span className="text-[#EA7185]">*</span>
            </label>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] font-semibold focus:border-[#0B9FA5] focus:outline-none"
              required
            >
              {inventory.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} — Available: {item.currentStockKg} {item.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock Banner */}
          <div className="p-3.5 rounded-2xl bg-[#F8FCFC] border border-[#E6F0F1] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#8EA3A5] uppercase tracking-wider block">
                Available In Store
              </span>
              <span className="text-base font-black text-[#17383B]">
                {formatNumber(availableStock, language)} {currentItem?.unit}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-[#8EA3A5] uppercase tracking-wider block">
                Safety Threshold
              </span>
              <span className="text-xs font-bold text-[#688285]">
                {formatNumber(currentItem?.minAlertLevel || 0, language)} {currentItem?.unit}
              </span>
            </div>
          </div>

          {/* Quantity to Issue */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#17383B]">
                Issue Quantity ({currentItem?.unit || 'kg'}) <span className="text-[#EA7185]">*</span>
              </label>
              {isExceeding && (
                <span className="text-[11px] font-bold text-[#EA7185] flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Exceeds available stock!
                </span>
              )}
            </div>
            <input
              type="number"
              min="0.1"
              max={availableStock}
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className={`w-full py-2.5 px-3.5 text-xs font-bold rounded-xl bg-[#F8FCFC] border text-[#17383B] focus:outline-none ${
                isExceeding ? 'border-[#EA7185] focus:border-[#EA7185] bg-[#FEECEE]/30' : 'border-[#D9EAEB] focus:border-[#0B9FA5]'
              }`}
              required
            />
          </div>

          {/* Reason & Batch Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#688285]">
                Consumption Reason / Process
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
              >
                <option value="Dyeing Batch Processing">Dyeing Batch Processing</option>
                <option value="Washing Machine Load">Washing Machine Load</option>
                <option value="Finishing & Softening">Finishing & Softening</option>
                <option value="Bleach / Shade Stripping">Bleach / Shade Stripping</option>
                <option value="Lab & Shade Trial">Lab & Shade Trial</option>
                <option value="Machine Flush & Maintenance">Machine Flush & Maintenance</option>
                <option value="Wastage / Spillage">Wastage / Spillage</option>
                <option value="Other">Other Floor Usage</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#688285]">
                Linked Batch / Job Card
              </label>
              <input
                type="text"
                list="activeBatchList"
                value={batchReference}
                onChange={(e) => setBatchReference(e.target.value)}
                placeholder="e.g. BATCH-W-04 (Apex)"
                className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
              />
              <datalist id="activeBatchList">
                {activeBatches.map(b => (
                  <option key={b.id} value={`${b.batchNumber || b.orderNumber} - ${b.clientName}`} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Date & Issued To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#688285]">
                Issue Date
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setReceiveDate(e.target.value)}
                className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#688285]">
                Authorized / Issued To
              </label>
              <input
                type="text"
                value={issuedTo}
                onChange={(e) => setIssuedTo(e.target.value)}
                placeholder="e.g. Head Dyeing Master"
                className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
              />
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#688285]">
              Machine No & Recipe Remarks
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Machine DYE-M01, reactive shade 2.5% liquor ratio"
              className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
            />
          </div>

          {/* Stock Out Summary Panel */}
          <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[#F3B562]/40 space-y-2.5">
            <h4 className="text-xs font-extrabold text-[#17383B] flex items-center justify-between">
              <span>Stock Out Impact</span>
              {willBeBelowMin && (
                <span className="text-[10px] font-bold text-[#C47D1C] px-2 py-0.5 rounded-md bg-[#FFF3DF] border border-[#F3B562]/30 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Will trigger low stock alert
                </span>
              )}
            </h4>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-[#8EA3A5] block">Available</span>
                <span className="font-bold text-[#17383B]">
                  {formatNumber(availableStock, language)} {currentItem?.unit}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#8EA3A5] block">Deducting</span>
                <span className="font-bold text-[#E06D28]">
                  -{formatNumber(quantity || 0, language)} {currentItem?.unit}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#8EA3A5] block">Remaining Balance</span>
                <span className={`font-black ${isExceeding ? 'text-[#EA7185]' : willBeBelowMin ? 'text-[#C47D1C]' : 'text-[#229A73]'}`}>
                  {formatNumber(remainingStock > 0 ? remainingStock : 0, language)} {currentItem?.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6F0F1]">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-[#688285] hover:bg-[#F1FAFA] transition-colors"
            >
              {t('cancel')}
            </button>

            <button
              type="submit"
              disabled={isSubmitting || quantity <= 0 || isExceeding}
              className="py-2.5 px-5 rounded-xl bg-[#E06D28] hover:bg-[#C95918] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Stock Out</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
