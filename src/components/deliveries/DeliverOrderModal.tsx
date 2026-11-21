import React, { useEffect, useState } from 'react';
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import {
  AlertCircle,
  Calendar,
  FileText,
  PackageCheck,
  Ruler,
  X,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import type { Client, Order, WithId } from '../../types/database';
import type { ThermalInvoiceData } from './ThermalInvoiceModal';

export interface DeliveryTransactionResult {
  invoiceNo: string;
  challanNo: string;
  total: number;
  invoiceData: ThermalInvoiceData;
}

interface DeliverOrderModalProps {
  order: WithId<Order> | null;
  tenantId: string;
  createdBy: string;
  onClose: () => void;
  onSuccess: (result: DeliveryTransactionResult) => void;
  onError: (message: string) => void;
}

const getTodayDateString = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const DeliverOrderModal: React.FC<DeliverOrderModalProps> = ({
  order,
  tenantId,
  createdBy,
  onClose,
  onSuccess,
  onError,
}) => {
  const [deliveryDate, setDeliveryDate] = useState<string>(getTodayDateString());
  const [processedGaz, setProcessedGaz] = useState<string>('');
  const [finalGaz, setFinalGaz] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!order) return;
    setDeliveryDate(getTodayDateString());
    setProcessedGaz(String(order.greyGaz ?? 0));
    setFinalGaz(String(order.greyGaz ?? 0));
    setRemarks('');
    setFormError(null);
  }, [order]);

  if (!order) return null;

  const greyGazNum = Number(order.greyGaz) || 0;
  const ratePerGazNum = Number(order.ratePerGaz) || 0;
  const processedGazNum = Number(processedGaz);
  const finalGazNum = Number(finalGaz);

  const wastageGaz = Number.isFinite(finalGazNum)
    ? Number((greyGazNum - finalGazNum).toFixed(2))
    : 0;
  const previewTotal =
    Number.isFinite(finalGazNum) && finalGazNum > 0
      ? Number((finalGazNum * ratePerGazNum).toFixed(2))
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deliveryDate.trim()) {
      setFormError('Delivery date is required / ডেলিভারি তারিখ আবশ্যক।');
      return;
    }
    if (!Number.isFinite(processedGazNum) || processedGazNum < 0) {
      setFormError('Processed Gaz must be a valid non-negative number.');
      return;
    }
    if (!Number.isFinite(finalGazNum) || finalGazNum <= 0) {
      setFormError('Final Gaz must be greater than 0 / ফাইনাল গজ ০ এর বেশি হতে হবে।');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const tid = tenantId;
    const orderId = order.id;
    const cleanRemarks = remarks.trim().slice(0, 1000);
    const year = new Date().getFullYear();

    try {
      const result = await runTransaction(db, async (txn) => {
        // 1. READS (all reads MUST execute before any writes)
        const orderRef = doc(db, `tenants/${tid}/orders/${orderId}`);
        const orderSnap = await txn.get(orderRef);
        if (!orderSnap.exists()) {
          throw new Error('Order not found / অর্ডার পাওয়া যায়নি।');
        }
        const liveOrder = orderSnap.data() as Order;

        if (liveOrder.status === 'Delivered' || liveOrder.status === 'delivered') {
          throw new Error('This order has already been delivered / এই অর্ডারটি ইতিমধ্যে ডেলিভারি হয়ে গেছে।');
        }

        const clientRef = doc(db, `tenants/${tid}/clients/${liveOrder.clientId}`);
        const clientSnap = await txn.get(clientRef);
        if (!clientSnap.exists()) {
          throw new Error('Client record not found / ক্লায়েন্ট পাওয়া যায়নি।');
        }
        const client = clientSnap.data() as Client;
        const previousDue = Number(client.currentDue) || 0;

        const counterRef = doc(db, `tenants/${tid}/counters/deliveries`);
        const counterSnap = await txn.get(counterRef);
        const challanSeq = (Number(counterSnap.data()?.value) || 0) + 1;

        const invCounterRef = doc(db, `tenants/${tid}/counters/invoices`);
        const invCounterSnap = await txn.get(invCounterRef);
        const invoiceSeq = (Number(invCounterSnap.data()?.value) || 0) + 1;

        // 2. COMPUTE
        const liveGreyGaz = Number(liveOrder.greyGaz) || 0;
        const liveRatePerGaz = Number(liveOrder.ratePerGaz) || 0;
        const computedWastage = Number((liveGreyGaz - finalGazNum).toFixed(2));
        const subtotal = Number((finalGazNum * liveRatePerGaz).toFixed(2));
        const discount = 0;
        const total = subtotal - discount;
        const currentDue = Number((previousDue + total).toFixed(2));
        const newClientDue = currentDue;

        const challanNo = `CH-${year}-${String(challanSeq).padStart(4, '0')}`;
        const invoiceNo = `INV-${year}-${String(invoiceSeq).padStart(4, '0')}`;

        // 3. WRITES (atomic batch inside single transaction)
        const deliveryRef = doc(collection(db, `tenants/${tid}/deliveries`));
        const invoiceRef = doc(collection(db, `tenants/${tid}/invoices`));
        const ledgerRef = doc(collection(db, `tenants/${tid}/clientLedger`));

        txn.set(deliveryRef, {
          challanNo,
          orderId,
          clientId: liveOrder.clientId,
          clientName: liveOrder.clientName,
          deliveryDate,
          processedGaz: processedGazNum,
          finalGaz: finalGazNum,
          wastageGaz: computedWastage,
          ratePerGaz: liveRatePerGaz,
          invoiceId: invoiceRef.id,
          remarks: cleanRemarks,
          createdAt: serverTimestamp(),
        });

        txn.set(invoiceRef, {
          invoiceNo,
          orderId,
          deliveryId: deliveryRef.id,
          clientId: liveOrder.clientId,
          clientName: liveOrder.clientName,
          invoiceDate: deliveryDate,
          subtotal,
          discount,
          previousDue,
          total,
          paid: 0,
          currentDue: total,
          status: 'Unpaid',
          createdAt: serverTimestamp(),
        });

        txn.set(ledgerRef, {
          clientId: liveOrder.clientId,
          entryDate: deliveryDate,
          entryType: 'invoice',
          referenceId: invoiceRef.id,
          referenceType: 'invoice',
          debit: total,
          credit: 0,
          balance: currentDue,
          remarks: `Invoice ${invoiceNo}`,
          createdBy: (createdBy || 'system').slice(0, 128),
          createdAt: serverTimestamp(),
        });

        txn.update(clientRef, {
          currentDue: newClientDue,
          updatedAt: serverTimestamp(),
        });

        txn.update(orderRef, {
          status: 'Delivered',
          updatedAt: serverTimestamp(),
        });

        txn.set(counterRef, { value: challanSeq });
        txn.set(invCounterRef, { value: invoiceSeq });

        return {
          invoiceNo,
          challanNo,
          total,
          invoiceData: {
            invoiceNo,
            challanNo,
            orderNo: liveOrder.orderNo,
            clientName: liveOrder.clientName,
            deliveryDate,
            greyGaz: liveGreyGaz,
            processedGaz: processedGazNum,
            finalGaz: finalGazNum,
            wastageGaz: computedWastage,
            ratePerGaz: liveRatePerGaz,
            subtotal,
            discount,
            previousDue,
            total,
            currentDue,
            status: 'Unpaid',
            remarks: cleanRemarks,
          },
        } satisfies DeliveryTransactionResult;
      });

      onSuccess(result);
    } catch (error) {
      const path = `tenants/${tid}/deliveries`;
      try {
        handleFirestoreError(error, OperationType.WRITE, path);
      } catch {
        const message =
          error instanceof Error
            ? error.message
            : 'Delivery transaction failed / ডেলিভারি ও ইনভয়েস তৈরি করতে ব্যর্থ হয়েছে।';
        setFormError(message);
        onError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17383B]/45 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deliver-order-modal-title"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl border border-[#D9EAEB] shadow-floating overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E6F0F1] bg-[#F1FAFA]/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="deliver-order-modal-title"
                className="text-base sm:text-lg font-extrabold text-[#17383B]"
              >
                Deliver Order &amp; Auto Invoice / ডেলিভারি ও ইনভয়েস
              </h2>
              <p className="text-[11px] font-semibold text-[#688285]">
                {order.orderNo} • {order.clientName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
            className="p-1.5 rounded-lg hover:bg-black/5 text-[#688285] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {formError && (
            <div className="p-3 rounded-xl bg-[#FDECEF] border border-[#EA7185]/35 text-xs font-semibold text-[#C94A60] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#EA7185]" />
              <span>{formError}</span>
            </div>
          )}

          {/* Order Reference Summary */}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#688285]">
                Grey Gaz / গ্রে গজ
              </span>
              <span className="text-sm font-extrabold text-[#17383B] tabular-nums">
                {greyGazNum.toLocaleString('en-BD')}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#688285]">
                Rate / দর
              </span>
              <span className="text-sm font-extrabold text-[#17383B] tabular-nums">
                ৳{ratePerGazNum.toLocaleString('en-BD')}/gaz
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#688285]">
                Invoice Total / বিল
              </span>
              <span className="text-sm font-extrabold text-[#0B9FA5] tabular-nums">
                ৳{previewTotal.toLocaleString('en-BD')}
              </span>
            </div>
          </div>

          {/* Delivery Date */}
          <div>
            <label
              htmlFor="delivery-date"
              className="block text-xs font-bold text-[#17383B] mb-1"
            >
              Delivery Date / ডেলিভারি তারিখ <span className="text-[#EA7185]">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="delivery-date"
                type="date"
                required
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
              />
            </div>
          </div>

          {/* Processed Gaz & Final Gaz */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="processed-gaz"
                className="block text-xs font-bold text-[#17383B] mb-1"
              >
                Processed Gaz / প্রসেসড গজ
              </label>
              <div className="relative">
                <Ruler className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="processed-gaz"
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={processedGaz}
                  onChange={(e) => setProcessedGaz(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] tabular-nums focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="final-gaz"
                className="block text-xs font-bold text-[#17383B] mb-1"
              >
                Final Gaz / ফাইনাল গজ <span className="text-[#EA7185]">*</span>
              </label>
              <div className="relative">
                <Ruler className="w-4 h-4 text-[#0B9FA5] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="final-gaz"
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={finalGaz}
                  onChange={(e) => setFinalGaz(e.target.value)}
                  placeholder="Actual delivered gaz"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#0B9FA5]/60 bg-white text-sm font-bold text-[#17383B] tabular-nums focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/20"
                />
              </div>
            </div>
          </div>

          {/* Wastage Gaz (auto-calculated, read-only) */}
          <div>
            <label
              htmlFor="wastage-gaz"
              className="block text-xs font-bold text-[#17383B] mb-1"
            >
              Wastage Gaz / ওয়েস্টেজ গজ (Auto: Grey Gaz - Final Gaz)
            </label>
            <input
              id="wastage-gaz"
              type="text"
              readOnly
              value={`${wastageGaz} Gaz`}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold tabular-nums cursor-not-allowed ${
                wastageGaz > 0
                  ? 'border-[#F3B562]/50 bg-[#FFF3DF]/60 text-[#A86214]'
                  : wastageGaz < 0
                    ? 'border-[#38C99A]/40 bg-[#E5F8F1]/60 text-[#1D7F5F]'
                    : 'border-[#D9EAEB] bg-[#F1FAFA] text-[#688285]'
              }`}
            />
          </div>

          {/* Remarks */}
          <div>
            <label
              htmlFor="delivery-remarks"
              className="block text-xs font-bold text-[#17383B] mb-1"
            >
              Remarks / মন্তব্য
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-3 pointer-events-none" />
              <textarea
                id="delivery-remarks"
                rows={2}
                maxLength={1000}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Challan notes, vehicle / receiver details..."
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15 resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#E6F0F1]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-[#D9EAEB] bg-white hover:bg-[#F1FAFA] text-xs sm:text-sm font-bold text-[#688285] cursor-pointer"
            >
              Cancel / বাতিল
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-[0_6px_18px_rgba(11,159,165,0.28)] flex items-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Transaction...</span>
                </>
              ) : (
                <>
                  <PackageCheck className="w-4 h-4" />
                  <span>Confirm Delivery &amp; Generate Invoice</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
