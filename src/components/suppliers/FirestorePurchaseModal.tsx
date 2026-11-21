import React, { useEffect, useMemo, useState } from 'react';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import {
  AlertCircle,
  Calendar,
  PackagePlus,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';
import {
  getCounterDoc,
  getPurchasesCollection,
  getSupplierDoc,
  getSupplierLedgerCollection,
  getTenantId,
  TENANTS_COLLECTION,
  TENANT_SUBCOLLECTIONS,
} from '../../lib/db';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import type { PurchaseItem, Supplier, WithId } from '../../types/database';

interface FirestorePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: WithId<Supplier>[];
  initialSupplierId?: string | null;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface PurchaseRowDraft {
  id: string;
  name: string;
  qty: string;
  rate: string;
}

const getTodayIso = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

const formatBDT = (amount: number): string => {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `৳ ${safe.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

const createEmptyRow = (): PurchaseRowDraft => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: '',
  qty: '1',
  rate: '',
});

export const FirestorePurchaseModal: React.FC<FirestorePurchaseModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  initialSupplierId,
  onSuccess,
  onError,
}) => {
  const tenantId = getTenantId();
  const purchasesPath = `${TENANTS_COLLECTION}/${tenantId}/${TENANT_SUBCOLLECTIONS.purchases}`;

  const [supplierId, setSupplierId] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(getTodayIso);
  const [rows, setRows] = useState<PurchaseRowDraft[]>([createEmptyRow()]);
  const [remarks, setRemarks] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Reset form only when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const defaultSupplierId =
      initialSupplierId && suppliers.some((s) => s.id === initialSupplierId)
        ? initialSupplierId
        : suppliers[0]?.id || '';
    setSupplierId(defaultSupplierId);
    setPurchaseDate(getTodayIso());
    setRows([createEmptyRow()]);
    setRemarks('');
    setFormError(null);
    setSubmitting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialSupplierId]);

  // If suppliers load after modal opens and none is selected yet, pick the first one
  useEffect(() => {
    if (!isOpen || supplierId || suppliers.length === 0) return;
    const fallback =
      initialSupplierId && suppliers.some((s) => s.id === initialSupplierId)
        ? initialSupplierId
        : suppliers[0].id;
    setSupplierId(fallback);
  }, [isOpen, supplierId, initialSupplierId, suppliers]);

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === supplierId) || null,
    [suppliers, supplierId]
  );

  const computedRows = useMemo(
    () =>
      rows.map((row) => {
        const qtyNum = Number(row.qty);
        const rateNum = Number(row.rate);
        const validQty = Number.isFinite(qtyNum) && qtyNum >= 0 ? qtyNum : 0;
        const validRate = Number.isFinite(rateNum) && rateNum >= 0 ? rateNum : 0;
        const amount = round2(validQty * validRate);
        return { ...row, qtyNum: validQty, rateNum: validRate, amount };
      }),
    [rows]
  );

  const grandTotal = useMemo(
    () => round2(computedRows.reduce((sum, r) => sum + r.amount, 0)),
    [computedRows]
  );

  const previousDue = Number(selectedSupplier?.currentDue) || 0;
  const projectedNewDue = round2(previousDue + grandTotal);

  const handleRowChange = (
    rowId: string,
    field: 'name' | 'qty' | 'rate',
    value: string
  ) => {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    );
  };

  const handleAddRow = () => {
    if (rows.length >= 100) {
      setFormError('Maximum 100 items allowed per purchase / সর্বোচ্চ ১০০টি আইটেম যুক্ত করা যাবে।');
      return;
    }
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const handleRemoveRow = (rowId: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedSupplierId = supplierId.trim();
    if (!trimmedSupplierId) {
      setFormError('Please select a supplier / অনুগ্রহ করে একজন সাপ্লায়ার নির্বাচন করুন।');
      return;
    }

    const trimmedDate = purchaseDate.trim() || getTodayIso();

    if (rows.length === 0 || rows.length > 100) {
      setFormError('Add between 1 and 100 items / কমপক্ষে ১টি এবং সর্বোচ্চ ১০০টি আইটেম দিন।');
      return;
    }

    const parsedItems: PurchaseItem[] = [];
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const itemName = row.name.trim();
      const qtyNum = Number(row.qty);
      const rateNum = Number(row.rate);

      if (!itemName) {
        setFormError(
          `Row ${i + 1}: Item name is required / সারি ${i + 1}: আইটেমের নাম আবশ্যক।`
        );
        return;
      }
      if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
        setFormError(
          `Row ${i + 1}: Quantity must be greater than 0 / সারি ${i + 1}: পরিমাণ ০ এর বেশি হতে হবে।`
        );
        return;
      }
      if (!Number.isFinite(rateNum) || rateNum < 0) {
        setFormError(
          `Row ${i + 1}: Rate must be a valid non-negative number / সারি ${i + 1}: দর সঠিক সংখ্যা হতে হবে।`
        );
        return;
      }

      parsedItems.push({
        name: itemName.slice(0, 160),
        qty: round2(qtyNum),
        rate: round2(rateNum),
        amount: round2(qtyNum * rateNum),
      });
    }

    const totalAmount = round2(parsedItems.reduce((sum, item) => sum + item.amount, 0));
    if (totalAmount <= 0) {
      setFormError(
        'Total purchase amount must be greater than 0 / মোট ক্রয়মূল্য ০ এর বেশি হতে হবে।'
      );
      return;
    }

    const cleanRemarks = remarks.trim().slice(0, 1000);

    setSubmitting(true);

    try {
      const result = await runTransaction(db, async (transaction) => {
        // 1. ALL READS FIRST
        const counterRef = getCounterDoc('purchases', tenantId);
        const supplierRef = getSupplierDoc(trimmedSupplierId, tenantId);

        const [counterSnap, supplierSnap] = await Promise.all([
          transaction.get(counterRef),
          transaction.get(supplierRef),
        ]);

        if (!supplierSnap.exists()) {
          throw new Error(
            'Selected supplier was not found / নির্বাচিত সাপ্লায়ার পাওয়া যায়নি।'
          );
        }

        const liveSupplier = supplierSnap.data();
        const liveSupplierName = (liveSupplier.name || 'Supplier').trim().slice(0, 160);
        const livePreviousDue = Number(liveSupplier.currentDue) || 0;

        // 2. COMPUTE
        const currentSeq = counterSnap.exists()
          ? Math.max(0, Math.floor(Number(counterSnap.data().current) || 0))
          : 0;
        const nextSeq = currentSeq + 1;
        const year = new Date().getFullYear();
        const purchaseNo = `PUR-${year}-${String(nextSeq).padStart(4, '0')}`;
        const newSupplierDue = round2(livePreviousDue + totalAmount);
        const now = serverTimestamp();

        const ledgerRemarks = cleanRemarks
          ? `${purchaseNo} — ${cleanRemarks}`.slice(0, 1000)
          : `Purchase ${purchaseNo} (${parsedItems.length} item${parsedItems.length > 1 ? 's' : ''})`.slice(
              0,
              1000
            );

        // 3. ALL WRITES
        // a. Increment counter 'purchases'
        transaction.set(counterRef, {
          id: 'purchases',
          current: nextSeq,
          updatedAt: now,
        });

        // b. Add purchase doc (denormalize supplierName)
        const newPurchaseRef = doc(getPurchasesCollection(tenantId));
        transaction.set(newPurchaseRef, {
          id: newPurchaseRef.id,
          purchaseNo,
          supplierId: trimmedSupplierId,
          supplierName: liveSupplierName,
          purchaseDate: trimmedDate,
          items: parsedItems,
          total: totalAmount,
          paid: 0,
          due: totalAmount,
          remarks: cleanRemarks,
          createdAt: now,
        });

        // c. Add supplierLedger entry
        const newLedgerRef = doc(getSupplierLedgerCollection(tenantId));
        transaction.set(newLedgerRef, {
          id: newLedgerRef.id,
          supplierId: trimmedSupplierId,
          entryDate: trimmedDate,
          entryType: 'purchase',
          referenceId: newPurchaseRef.id,
          referenceType: 'purchase',
          debit: totalAmount,
          credit: 0,
          balance: newSupplierDue,
          remarks: ledgerRemarks,
          createdAt: now,
        });

        // d. Update supplier.currentDue += total
        transaction.update(supplierRef, {
          currentDue: newSupplierDue,
          updatedAt: now,
        });

        return {
          purchaseNo,
          supplierName: liveSupplierName,
          totalAmount,
          newSupplierDue,
        };
      });

      onSuccess(
        `Purchase ${result.purchaseNo} recorded (${formatBDT(result.totalAmount)}) for ${result.supplierName} / ক্রয় এন্ট্রি সংরক্ষিত হয়েছে।`
      );
      onClose();
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.WRITE, purchasesPath);
      } catch {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to save purchase / ক্রয় এন্ট্রি সংরক্ষণ করতে ব্যর্থ হয়েছে।';
        setFormError(message);
        onError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#17383B]/45 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="purchase-modal-title"
    >
      <div className="w-full max-w-3xl bg-white rounded-3xl border border-[#D9EAEB] shadow-floating overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E6F0F1] flex items-center justify-between bg-[#F1FAFA]/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 id="purchase-modal-title" className="text-base sm:text-lg font-extrabold text-[#17383B]">
                New Purchase Entry / নতুন ক্রয় এন্ট্রি
              </h2>
              <p className="text-[11px] sm:text-xs text-[#688285]">
                Auto-generates PUR-{new Date().getFullYear()}-XXXX, updates supplier ledger & running due
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            aria-label="Close modal"
            className="p-1.5 rounded-lg hover:bg-black/5 text-[#688285] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {formError && (
            <div className="p-3.5 rounded-xl bg-[#FDECEF] border border-[#EA7185]/35 text-xs font-semibold text-[#C94A60] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#EA7185]" />
              <span>{formError}</span>
            </div>
          )}

          {suppliers.length === 0 ? (
            <div className="p-5 rounded-2xl bg-[#FFF3DF]/60 border border-[#F8D7A4] text-center space-y-1">
              <p className="text-sm font-bold text-[#9C5C0E]">
                No suppliers available / কোনো সাপ্লায়ার নেই
              </p>
              <p className="text-xs text-[#B76E15]">
                Please add a supplier first before creating a purchase entry.
              </p>
            </div>
          ) : (
            <>
              {/* Supplier + Purchase Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="purchase-supplier"
                    className="block text-xs font-bold text-[#17383B] mb-1.5"
                  >
                    Supplier / সাপ্লায়ার <span className="text-[#EA7185]">*</span>
                  </label>
                  <select
                    id="purchase-supplier"
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-semibold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                  >
                    <option value="">-- Select Supplier / সাপ্লায়ার নির্বাচন করুন --</option>
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name}
                        {sup.companyName ? ` (${sup.companyName})` : ''} — Due:{' '}
                        {formatBDT(Number(sup.currentDue) || 0)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="purchase-date"
                    className="block text-xs font-bold text-[#17383B] mb-1.5"
                  >
                    Purchase Date / ক্রয়ের তারিখ <span className="text-[#EA7185]">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-[#8EA3A5] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="purchase-date"
                      type="date"
                      required
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-semibold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                    />
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#17383B] flex items-center gap-1.5">
                    <PackagePlus className="w-4 h-4 text-[#0B9FA5]" />
                    <span>Purchase Items / পণ্যের তালিকা ({rows.length})</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    disabled={submitting || rows.length >= 100}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DDF4F3] hover:bg-[#c8ebe9] text-[#0B9FA5] text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item / আইটেম যোগ করুন</span>
                  </button>
                </div>

                <div className="rounded-2xl border border-[#D9EAEB] overflow-hidden bg-[#F8FCFC]">
                  {/* Table Header */}
                  <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-3.5 py-2.5 bg-[#F1FAFA] border-b border-[#E6F0F1] text-[11px] font-bold uppercase tracking-wider text-[#688285]">
                    <div className="col-span-5">Item Name / পণ্যের নাম *</div>
                    <div className="col-span-2 text-right">Qty / পরিমাণ *</div>
                    <div className="col-span-2 text-right">Rate / দর (৳) *</div>
                    <div className="col-span-2 text-right">Amount / মোট (৳)</div>
                    <div className="col-span-1 text-center">Del</div>
                  </div>

                  {/* Item Rows */}
                  <div className="divide-y divide-[#E6F0F1]">
                    {computedRows.map((row, index) => (
                      <div
                        key={row.id}
                        className="p-3 sm:px-3.5 sm:py-2.5 grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-2 items-center bg-white"
                      >
                        <div className="sm:col-span-5">
                          <label className="sm:hidden block text-[11px] font-bold text-[#688285] mb-1">
                            Item #{index + 1} Name / নাম *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={160}
                            value={row.name}
                            onChange={(e) => handleRowChange(row.id, 'name', e.target.value)}
                            placeholder="e.g. Caustic Soda, Reactive Dye..."
                            className="w-full px-3 py-2 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs sm:text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                          />
                        </div>

                        <div className="grid grid-cols-2 sm:contents gap-2">
                          <div className="sm:col-span-2">
                            <label className="sm:hidden block text-[11px] font-bold text-[#688285] mb-1">
                              Qty / পরিমাণ *
                            </label>
                            <input
                              type="number"
                              required
                              min="0.01"
                              step="any"
                              value={row.qty}
                              onChange={(e) => handleRowChange(row.id, 'qty', e.target.value)}
                              placeholder="1"
                              className="w-full px-2.5 py-2 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs sm:text-sm font-semibold text-[#17383B] text-right tabular-nums focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="sm:hidden block text-[11px] font-bold text-[#688285] mb-1">
                              Rate / দর (৳) *
                            </label>
                            <input
                              type="number"
                              required
                              min="0"
                              step="any"
                              value={row.rate}
                              onChange={(e) => handleRowChange(row.id, 'rate', e.target.value)}
                              placeholder="0.00"
                              className="w-full px-2.5 py-2 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs sm:text-sm font-semibold text-[#17383B] text-right tabular-nums focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:contents">
                          <div className="sm:col-span-2 text-right">
                            <span className="sm:hidden text-[11px] font-bold text-[#688285] mr-1.5">
                              Amount:
                            </span>
                            <span className="text-xs sm:text-sm font-extrabold text-[#17383B] tabular-nums">
                              {formatBDT(row.amount)}
                            </span>
                          </div>

                          <div className="sm:col-span-1 flex justify-end sm:justify-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(row.id)}
                              disabled={rows.length <= 1 || submitting}
                              title="Remove row / সারি মুছুন"
                              className="p-1.5 rounded-lg text-[#EA7185] hover:bg-[#FDECEF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label
                  htmlFor="purchase-remarks"
                  className="block text-xs font-bold text-[#17383B] mb-1.5"
                >
                  Remarks / মন্তব্য
                </label>
                <input
                  id="purchase-remarks"
                  type="text"
                  maxLength={1000}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Challan ref, batch info, delivery notes..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                />
              </div>

              {/* Live Totals Summary Card */}
              <div className="rounded-2xl border border-[#0B9FA5]/25 bg-gradient-to-br from-[#F1FAFA] to-[#E6F6F5] p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#688285]">
                    Previous Due / পূর্বের বকেয়া
                  </p>
                  <p className="text-base font-extrabold text-[#17383B] tabular-nums mt-0.5">
                    {formatBDT(previousDue)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#0B9FA5]">
                    Purchase Total / মোট ক্রয়মূল্য
                  </p>
                  <p className="text-lg font-extrabold text-[#0B9FA5] tabular-nums mt-0.5">
                    {formatBDT(grandTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#C94A60]">
                    New Supplier Due / নতুন বকেয়া
                  </p>
                  <p className="text-base font-extrabold text-[#C94A60] tabular-nums mt-0.5">
                    {formatBDT(projectedNewDue)}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#E6F0F1]">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-[#D9EAEB] bg-white hover:bg-[#F1FAFA] text-xs sm:text-sm font-bold text-[#688285] transition-colors cursor-pointer"
            >
              Cancel / বাতিল
            </button>
            <button
              type="submit"
              disabled={submitting || suppliers.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-[0_6px_18px_rgba(11,159,165,0.25)] transition-all flex items-center gap-2 cursor-pointer"
            >
              {submitting && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>Save Purchase / ক্রয় সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FirestorePurchaseModal;
