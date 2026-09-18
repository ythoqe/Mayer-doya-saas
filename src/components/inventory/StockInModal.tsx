import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { InventoryItem } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { 
  X, 
  ArrowDownLeft, 
  Building2, 
  DollarSign, 
  Calendar, 
  FileText, 
  MapPin, 
  CheckCircle2, 
  PackagePlus,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface StockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem?: InventoryItem | null;
  initialSupplierId?: string;
}

export const StockInModal: React.FC<StockInModalProps> = ({
  isOpen,
  onClose,
  selectedItem,
  initialSupplierId
}) => {
  const { inventory, suppliers, accounts, recordChemicalPurchase, updateInventoryStock, addNotification, language, t } = useERP();

  const [itemId, setItemId] = useState<string>(selectedItem?.id || inventory[0]?.id || '');
  const [supplierId, setSupplierId] = useState<string>(
    initialSupplierId || selectedItem?.supplierId || suppliers[0]?.id || ''
  );
  const [quantity, setQuantity] = useState<number>(50);
  const [unitRate, setUnitRate] = useState<number>(selectedItem?.unitPrice || 100);
  const [receiveDate, setReceiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [referenceNo, setReferenceNo] = useState<string>(`INV-CH-${Math.floor(1000 + Math.random() * 9000)}`);
  const [location, setLocation] = useState<string>(selectedItem?.location || 'Chemical Store');
  const [paymentStatus, setPaymentStatus] = useState<'Due' | 'Paid' | 'Partial'>('Due');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || 'acc-1');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Keep state synced when selectedItem or initialSupplierId changes
  useEffect(() => {
    if (initialSupplierId) {
      setSupplierId(initialSupplierId);
      const matchedItem = inventory.find(i => i.supplierId === initialSupplierId);
      if (matchedItem) {
        setItemId(matchedItem.id);
        setUnitRate(matchedItem.unitPrice || 100);
        setLocation(matchedItem.location || 'Chemical Store');
      } else if (selectedItem) {
        setItemId(selectedItem.id);
        setUnitRate(selectedItem.unitPrice || 100);
        setLocation(selectedItem.location || 'Chemical Store');
      }
    } else if (selectedItem) {
      setItemId(selectedItem.id);
      setSupplierId(selectedItem.supplierId || suppliers[0]?.id || '');
      setUnitRate(selectedItem.unitPrice || 100);
      setLocation(selectedItem.location || 'Chemical Store');
    } else if (inventory.length > 0) {
      setItemId(inventory[0].id);
      setSupplierId(inventory[0].supplierId || suppliers[0]?.id || '');
      setUnitRate(inventory[0].unitPrice || 100);
      setLocation(inventory[0].location || 'Chemical Store');
    }
  }, [selectedItem, initialSupplierId, inventory, suppliers]);

  if (!isOpen) return null;

  const currentItem = inventory.find(i => i.id === itemId) || selectedItem || inventory[0];
  const selectedSupplierObj = suppliers.find(s => s.id === supplierId) || suppliers[0];

  // Derived financial calculation
  const totalCost = (Number(quantity) || 0) * (Number(unitRate) || 0);
  const effectivePaid = paymentStatus === 'Paid' ? totalCost : (paymentStatus === 'Partial' ? Math.min(totalCost, Math.max(0, Number(paidAmount) || 0)) : 0);
  const effectiveDue = Math.max(0, totalCost - effectivePaid);
  const newStockTotal = (currentItem?.currentStockKg || 0) + (Number(quantity) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem || Number(quantity) <= 0) return;
    setErrorMsg(null);

    const targetSupId = supplierId || currentItem.supplierId || suppliers[0]?.id;
    if (!targetSupId) {
      setErrorMsg(language === 'bn' ? 'দয়া করে একজন সাপ্লায়ার নির্বাচন করুন।' : 'Please select a supplier.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Full Chemical Purchase -> Supplier Card workflow
      const res = await recordChemicalPurchase({
        supplierId: targetSupId,
        itemId: currentItem.id,
        quantity: Number(quantity),
        unitPrice: Number(unitRate),
        purchaseDate: receiveDate,
        invoiceRef: referenceNo,
        paymentStatus,
        paidAmount: effectivePaid,
        paymentAccountId: effectivePaid > 0 ? accountId : '',
        location: location || 'Chemical Store',
        notes: notes.trim() || ''
      });

      if (!res.success) {
        setErrorMsg(res.message || 'ক্রয় সম্পন্ন করতে ব্যর্থ হয়েছে');
        setIsSubmitting(false);
        return;
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'একটি ত্রুটি ঘটেছে');
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
        <div className="p-5 bg-[#EAF7F8] border-b border-[#D9EAEB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-[#0B9FA5] flex items-center justify-center shadow-xs border border-[#0B9FA5]/20">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#17383B]">
                {t('stockInTitle')}
              </h3>
              <p className="text-xs text-[#688285]">
                {t('stockInSubtitle')}
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
              onChange={(e) => {
                const id = e.target.value;
                setItemId(id);
                const found = inventory.find(i => i.id === id);
                if (found) {
                  setUnitRate(found.unitPrice);
                  setLocation(found.location || 'Chemical Store');
                  if (found.supplierId) setSupplierId(found.supplierId);
                }
              }}
              className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] font-semibold focus:border-[#0B9FA5] focus:outline-none"
              required
            >
              {inventory.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.category}) — Current: {item.currentStockKg} {item.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier & Location Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#688285]">
                Supplier / Vendor
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
              >
                <option value="">{t('supplierNotAssigned')}</option>
                {suppliers.map(sup => (
                  <option key={sup.id} value={sup.id}>
                    {sup.company || sup.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#688285]">
                Storage Zone / Rack
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#8EA3A5] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Drum Zone C, Rack A-02"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Quantity & Unit Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17383B]">
                Received Quantity ({currentItem?.unit || 'kg'}) <span className="text-[#EA7185]">*</span>
              </label>
              <input
                type="number"
                min="0.1"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full py-2.5 px-3.5 text-xs font-bold rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17383B]">
                Unit Purchase Rate (৳/{currentItem?.unit || 'kg'})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={unitRate}
                onChange={(e) => setUnitRate(Number(e.target.value))}
                className="w-full py-2.5 px-3.5 text-xs font-bold rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
              />
            </div>
          </div>

          {/* Date & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#688285]">
                Receive Date
              </label>
              <input
                type="date"
                value={receiveDate}
                onChange={(e) => setReceiveDate(e.target.value)}
                className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#688285]">
                Challan / Invoice Reference
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. CHLN-8831"
                className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
              />
            </div>
          </div>

          {/* Payment Status & Account Setup (Supplier Purchase Flow) */}
          {supplierId && (
            <div className="p-3.5 rounded-2xl bg-[#F8FCFC] border border-[#D9EAEB] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-[#0B9FA5]" />
                  <span>পেমেন্ট অবস্থা / Payment Status</span>
                </label>
                <div className="flex items-center gap-1.5">
                  {(['Due', 'Partial', 'Paid'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setPaymentStatus(status);
                        if (status === 'Paid') setPaidAmount(totalCost);
                        else if (status === 'Due') setPaidAmount(0);
                        else if (paidAmount === 0 || paidAmount >= totalCost) setPaidAmount(Math.round(totalCost / 2));
                      }}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                        paymentStatus === status
                          ? status === 'Paid'
                            ? 'bg-[#EBF7EE] text-[#2E7D32] border-[#2E7D32]/30'
                            : status === 'Due'
                            ? 'bg-[#FDF2F4] text-[#EA7185] border-[#EA7185]/30'
                            : 'bg-[#FFF9EB] text-[#D97706] border-[#D97706]/30'
                          : 'bg-white text-[#688285] border-[#D9EAEB] hover:bg-slate-50'
                      }`}
                    >
                      {status === 'Paid' ? 'Paid (পরিশোধ)' : status === 'Due' ? 'Due (বকেয়া)' : 'Partial (আংশিক)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Details when Paid or Partial */}
              {paymentStatus !== 'Due' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E6F0F1]">
                  {paymentStatus === 'Partial' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#17383B]">
                        পরিশোধিত টাকা / Paid Amount (৳) <span className="text-[#EA7185]">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={totalCost}
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(Number(e.target.value))}
                        className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-white border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                        required
                      />
                    </div>
                  )}

                  <div className={`space-y-1 ${paymentStatus === 'Paid' ? 'sm:col-span-2' : ''}`}>
                    <label className="text-xs font-bold text-[#17383B]">
                      পেমেন্ট অ্যাকাউন্ট / Payment Account <span className="text-[#EA7185]">*</span>
                    </label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-white border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                      required
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountName} ({acc.accountType}) — ব্যালেন্স: ৳{(acc.currentBalance || 0).toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#688285]">
              Lot / Quality Inspection Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Batch purity certified, barrel seals intact"
              className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#FDF2F4] border border-[#EA7185]/30 text-[#EA7185] text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Clean Stock In & Financial Summary Panel */}
          <div className="p-4 rounded-2xl bg-[#F1FAFA] border border-[#D9EAEB] space-y-3">
            <h4 className="text-xs font-extrabold text-[#17383B] flex items-center justify-between">
              <span>Stock In & Purchase Summary</span>
              <span className="text-[10px] font-bold text-[#0B9FA5] px-2 py-0.5 rounded-md bg-white border border-[#D9EAEB]">
                Financial Preview
              </span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-[#8EA3A5] block">Current Stock</span>
                <span className="font-bold text-[#688285]">
                  {formatNumber(currentItem?.currentStockKg || 0, language)} {currentItem?.unit}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#8EA3A5] block">Incoming Stock</span>
                <span className="font-bold text-[#0B9FA5]">
                  +{formatNumber(quantity || 0, language)} {currentItem?.unit}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#8EA3A5] block">Projected Total</span>
                <span className="font-extrabold text-[#17383B]">
                  {formatNumber(newStockTotal, language)} {currentItem?.unit}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#8EA3A5] block">Total Purchase Cost</span>
                <span className="font-black text-[#0B9FA5]">
                  {formatCurrency(totalCost, language)}
                </span>
              </div>
            </div>

            {supplierId && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#D9EAEB] text-xs">
                <div>
                  <span className="text-[10px] text-[#8EA3A5] block">Supplier Total Billed</span>
                  <span className="font-bold text-[#17383B]">
                    +{formatCurrency(totalCost, language)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8EA3A5] block">Immediate Payment</span>
                  <span className="font-bold text-[#2E7D32]">
                    {effectivePaid > 0 ? `-${formatCurrency(effectivePaid, language)}` : '৳0'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8EA3A5] block">Supplier Due Added</span>
                  <span className={`font-black ${effectiveDue > 0 ? 'text-[#EA7185]' : 'text-[#2E7D32]'}`}>
                    {formatCurrency(effectiveDue, language)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
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
              disabled={isSubmitting || quantity <= 0}
              className="py-2.5 px-5 rounded-xl bg-[#0B9FA5] hover:bg-[#088287] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Stock In</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
