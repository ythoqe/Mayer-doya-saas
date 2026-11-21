import React, { useEffect } from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';

export interface ThermalInvoiceData {
  invoiceNo: string;
  challanNo: string;
  orderNo?: string;
  clientName: string;
  deliveryDate: string;
  greyGaz?: number;
  processedGaz: number;
  finalGaz: number;
  wastageGaz: number;
  ratePerGaz: number;
  subtotal: number;
  discount: number;
  previousDue: number;
  total: number;
  currentDue: number;
  status: string;
  remarks?: string;
}

interface ThermalInvoiceModalProps {
  invoice: ThermalInvoiceData | null;
  onClose: () => void;
}

const formatNum = (val: number): string =>
  (Number.isFinite(val) ? val : 0).toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

export const ThermalInvoiceModal: React.FC<ThermalInvoiceModalProps> = ({
  invoice,
  onClose,
}) => {
  useEffect(() => {
    const cleanup = () => {
      document.body.classList.remove('printing-thermal-4x3');
    };
    window.addEventListener('afterprint', cleanup);
    return () => {
      window.removeEventListener('afterprint', cleanup);
      cleanup();
    };
  }, []);

  if (!invoice) return null;

  const handlePrint = () => {
    document.body.classList.add('printing-thermal-4x3');
    setTimeout(() => {
      window.print();
    }, 50);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17383B]/45 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="thermal-invoice-modal-title"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl border border-[#D9EAEB] shadow-floating overflow-hidden">
        {/* Modal Header (no-print) */}
        <div className="no-print px-6 py-4 border-b border-[#E6F0F1] bg-[#F1FAFA]/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E5F8F1] text-[#229A73] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="thermal-invoice-modal-title"
                className="text-base font-extrabold text-[#17383B]"
              >
                Print Invoice (4×3 in) / ইনভয়েস প্রিন্ট
              </h2>
              <p className="text-[11px] font-medium text-[#688285]">
                {invoice.invoiceNo} • {invoice.challanNo}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close print modal"
            className="p-1.5 rounded-lg hover:bg-black/5 text-[#688285] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal 4x3 Inch Receipt Preview */}
        <div className="p-6 bg-[#EAF6F7]/50 flex justify-center overflow-x-auto">
          <div
            id="thermal-invoice-4x3"
            className="thermal-invoice-4x3 bg-white text-black border border-dashed border-neutral-400 shadow-sm p-3 font-mono text-[11px] leading-tight shrink-0"
          >
            {/* Factory Header */}
            <div className="text-center border-b border-dashed border-black pb-1.5 mb-1.5">
              <div className="text-[13px] font-extrabold tracking-wide uppercase">
                MAYER DOYA WASHING &amp; DYEING
              </div>
              <div className="text-[10px]">DELIVERY CHALLAN &amp; INVOICE</div>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] border-b border-dashed border-black pb-1.5 mb-1.5">
              <div>
                <span className="font-bold">Inv:</span> {invoice.invoiceNo}
              </div>
              <div className="text-right">
                <span className="font-bold">Date:</span> {invoice.deliveryDate}
              </div>
              <div>
                <span className="font-bold">Ch:</span> {invoice.challanNo}
              </div>
              <div className="text-right">
                <span className="font-bold">Status:</span> {invoice.status}
              </div>
              <div className="col-span-2 truncate">
                <span className="font-bold">Client:</span> {invoice.clientName}
              </div>
              {invoice.orderNo && (
                <div className="col-span-2">
                  <span className="font-bold">Order:</span> {invoice.orderNo}
                </div>
              )}
            </div>

            {/* Measurement & Rate Breakdown */}
            <table className="w-full text-[10px] border-b border-dashed border-black pb-1 mb-1.5">
              <thead>
                <tr className="border-b border-black/40">
                  <th className="text-left py-0.5">Item</th>
                  <th className="text-right py-0.5">Qty (Gaz)</th>
                  <th className="text-right py-0.5">Rate</th>
                  <th className="text-right py-0.5">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1">Final Delivered</td>
                  <td className="text-right py-1 tabular-nums">
                    {formatNum(invoice.finalGaz)}
                  </td>
                  <td className="text-right py-1 tabular-nums">
                    ৳{formatNum(invoice.ratePerGaz)}
                  </td>
                  <td className="text-right py-1 font-bold tabular-nums">
                    ৳{formatNum(invoice.subtotal)}
                  </td>
                </tr>
                <tr className="text-[9px] text-neutral-700">
                  <td colSpan={4} className="pb-1">
                    Processed: {formatNum(invoice.processedGaz)} Gaz | Wastage:{' '}
                    {formatNum(invoice.wastageGaz)} Gaz
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Totals */}
            <div className="space-y-0.5 text-[10px] tabular-nums">
              <div className="flex justify-between">
                <span>Invoice Subtotal:</span>
                <span>৳{formatNum(invoice.subtotal)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-৳{formatNum(invoice.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-[11px]">
                <span>Invoice Total:</span>
                <span>৳{formatNum(invoice.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Previous Due:</span>
                <span>৳{formatNum(invoice.previousDue)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-[11px] border-t border-black pt-1 mt-1">
                <span>Total Running Due:</span>
                <span>৳{formatNum(invoice.currentDue)}</span>
              </div>
            </div>

            {invoice.remarks && (
              <div className="mt-1.5 pt-1 border-t border-dashed border-black/50 text-[9px] truncate">
                <span className="font-bold">Note:</span> {invoice.remarks}
              </div>
            )}

            <div className="mt-2 pt-1 flex justify-between text-[9px]">
              <span>Receiver Sign</span>
              <span>Authorized Sign</span>
            </div>
          </div>
        </div>

        {/* Footer Actions (no-print) */}
        <div className="no-print px-6 py-4 border-t border-[#E6F0F1] flex items-center justify-end gap-2.5 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#D9EAEB] bg-white hover:bg-[#F1FAFA] text-xs sm:text-sm font-bold text-[#688285] cursor-pointer"
          >
            Close / বন্ধ করুন
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white text-xs sm:text-sm font-bold shadow-[0_6px_18px_rgba(11,159,165,0.25)] flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Thermal 4×3" / প্রিন্ট</span>
          </button>
        </div>
      </div>
    </div>
  );
};
