import React from 'react';
import { Client, Order, Language } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { Printer, X, CheckCircle, Receipt, Building2, Phone, Calendar, Landmark, CreditCard, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export interface PaymentReceiptData {
  receiptNo: string;
  date: string;
  paymentType: 'old_dues' | 'current_order';
  client: Client;
  amount: number;
  accountName: string;
  accountType?: string;
  notes?: string;
  selectedYear?: string;
  selectedOrder?: Order | null;
  previousOldDue: number;
  remainingOldDue: number;
  previousCurrentDue: number;
  remainingCurrentDue: number;
  totalDueBefore: number;
  totalDueAfter: number;
}

interface PrintMoneyReceiptProps {
  receipt: PaymentReceiptData;
  language: Language;
  onClose: () => void;
}

export const PrintMoneyReceipt: React.FC<PrintMoneyReceiptProps> = ({
  receipt,
  language,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center p-2 sm:p-6 print:p-0 print:bg-white print:static">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#D9EAEB] my-auto print:border-none print:shadow-none print:rounded-none"
      >
        {/* Screen Header Controls (Hidden during print) */}
        <div className="px-6 py-4 bg-[#17383B] text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0B9FA5] text-white flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">
                {language === 'bn' ? 'টাকা প্রাপ্তির মানি রিসিট (Money Receipt)' : 'Official Payment Receipt'}
              </h3>
              <p className="text-xs text-[#8EA3A5]">{receipt.receiptNo} • {receipt.client.companyName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#0B9FA5] hover:bg-[#078A90] text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'bn' ? 'প্রিন্ট রসিদ' : 'Print Receipt'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Money Receipt Document */}
        <div className="p-8 text-[#17383B] bg-white space-y-6 print:p-6" id="printable-money-receipt">
          {/* Top Plant Header */}
          <div className="text-center border-b-2 border-[#17383B] pb-4">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#17383B]">
              মেসার্স মায়ের দোয়া ওয়াশিং অ্যান্ড ডায়িং প্ল্যান্ট
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-[#0B9FA5] tracking-wide mt-0.5">
              M/S. MAYER DOYA WASHING & DYEING PLANT
            </p>
            <p className="text-[11px] text-[#688285] mt-1">
              গোবিন্দপুর, তারাবো পৌরসভা, রূপগঞ্জ, নারায়ণগঞ্জ | মোবাইল: ০১৭১১-XXXXXX, ০১৮১৯-XXXXXX
            </p>
            <div className="inline-block mt-2.5 px-4 py-1 rounded-full bg-[#17383B] text-white text-xs font-black tracking-wider uppercase">
              {language === 'bn' ? 'টাকা প্রাপ্তির মানি রিসিট / ভাউচার' : 'OFFICIAL MONEY RECEIPT / VOUCHER'}
            </div>
          </div>

          {/* Receipt Info & Type Badge */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-[#F1FAFA] p-4 rounded-2xl border border-[#D9EAEB]">
            <div>
              <p className="text-[#688285] text-[10px] font-bold uppercase">রসিদ / ভাউচার নং</p>
              <strong className="text-sm font-black text-[#17383B] font-mono">{receipt.receiptNo}</strong>
              <p className="text-[#688285] text-[10px] font-bold uppercase mt-2">তারিখ ও সময়</p>
              <strong className="text-xs text-[#17383B]">{receipt.date}</strong>
            </div>

            <div className="text-right">
              <p className="text-[#688285] text-[10px] font-bold uppercase">জমার হিসাব খাত (Payment Division)</p>
              <span className={`inline-block mt-1 px-3 py-1 rounded-lg text-xs font-black ${
                receipt.paymentType === 'old_dues'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}>
                {receipt.paymentType === 'old_dues' 
                  ? (language === 'bn' ? '📜 পুরাতন হিসেবে টাকা জমা (Old Dues)' : '📜 Old / Previous Dues Collection')
                  : (language === 'bn' ? '📦 নতুন/চলতি হিসেব জমা (Current Orders)' : '📦 Current Job Card / Bill Collection')}
              </span>
              <p className="text-[#688285] text-[10px] font-bold uppercase mt-2">জমাকৃত অ্যাকাউন্ট</p>
              <strong className="text-xs text-[#17383B]">{receipt.accountName}</strong>
            </div>
          </div>

          {/* Client Details */}
          <div className="p-4 rounded-2xl border border-[#E6F0F1] space-y-2 text-xs">
            <div className="flex justify-between items-center border-b border-[#E6F0F1] pb-2">
              <span className="text-[#688285] font-bold uppercase text-[10px]">গ্রাহক / প্রতিষ্ঠান:</span>
              <strong className="text-sm font-black text-[#17383B]">{receipt.client.companyName}</strong>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-[#688285]">প্রতিনিধি / মালিক:</span> <strong className="text-[#17383B]">{receipt.client.name}</strong>
              </div>
              <div className="text-right">
                <span className="text-[#688285]">মোবাইল:</span> <strong className="text-[#17383B]">{receipt.client.phone}</strong>
              </div>
            </div>
          </div>

          {/* Payment Division Specific Details */}
          {receipt.paymentType === 'old_dues' ? (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-2.5">
              <h4 className="font-extrabold text-amber-900 flex items-center gap-1.5 text-xs">
                <span>📜</span>
                <span>পুরাতন বকেয়া সমন্বয় বিবরণী (Old Dues Settlement)</span>
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-amber-200">
                  <span className="text-[10px] text-[#688285] block">পূর্বের পুরাতন বকেয়া</span>
                  <strong className="text-xs sm:text-sm text-slate-800">{formatCurrency(receipt.previousOldDue, language)}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-100/60 border border-amber-300">
                  <span className="text-[10px] text-amber-800 font-bold block">বর্তমান প্রাপ্তি / জমা</span>
                  <strong className="text-xs sm:text-sm text-amber-900 font-black">(-) {formatCurrency(receipt.amount, language)}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-amber-200">
                  <span className="text-[10px] text-[#688285] block">অবশিষ্ট পুরাতন বকেয়া</span>
                  <strong className="text-xs sm:text-sm text-[#C47D1C] font-black">{formatCurrency(receipt.remainingOldDue, language)}</strong>
                </div>
              </div>
              {receipt.selectedYear && (
                <p className="text-[11px] text-amber-800 font-medium pt-1">
                  * নির্দিষ্ট সাল: <strong>{receipt.selectedYear}</strong> সালের বকেয়া বাবদ পরিশোধিত।
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-2.5">
              <h4 className="font-extrabold text-emerald-900 flex items-center gap-1.5 text-xs">
                <span>📦</span>
                <span>চলতি জব কার্ড / অর্ডারের হিসাব সমন্বয় (Current Orders Settlement)</span>
              </h4>
              {receipt.selectedOrder ? (
                <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#688285]">জব কার্ড নং:</span>
                    <strong className="font-mono text-[#0B9FA5]">{receipt.selectedOrder.orderNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#688285]">কাপড়ের কোয়ালিটি ও ওয়াশ:</span>
                    <strong>{receipt.selectedOrder.fabricQuality} - {receipt.selectedOrder.washType}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#688285]">মোট বিল:</span>
                    <strong>{formatCurrency(receipt.selectedOrder.totalAmount, language)}</strong>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold border-t border-emerald-100 pt-1">
                    <span>এই অর্ডারে বর্তমান জমা:</span>
                    <span>{formatCurrency(receipt.amount, language)}</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
                    <span className="text-[10px] text-[#688285] block">পূর্বের চলতি বকেয়া</span>
                    <strong className="text-xs sm:text-sm text-slate-800">{formatCurrency(receipt.previousCurrentDue, language)}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-100/60 border border-emerald-300">
                    <span className="text-[10px] text-emerald-800 font-bold block">বর্তমান প্রাপ্তি / জমা</span>
                    <strong className="text-xs sm:text-sm text-emerald-900 font-black">(-) {formatCurrency(receipt.amount, language)}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
                    <span className="text-[10px] text-[#688285] block">অবশিষ্ট চলতি বকেয়া</span>
                    <strong className="text-xs sm:text-sm text-[#0B9FA5] font-black">{formatCurrency(receipt.remainingCurrentDue, language)}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Grand Received Amount Highlight */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] text-white flex items-center justify-between shadow-md">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-teal-100 font-bold block">
                মোট জমাকৃত টাকার পরিমাণ (Total Received)
              </span>
              <p className="text-xs text-teal-50 mt-0.5">
                {receipt.notes || 'টাকা বুঝে পাওয়া গেল'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl sm:text-2xl font-black tracking-tight">
                {formatCurrency(receipt.amount, language)}
              </span>
            </div>
          </div>

          {/* Overall Client Balance Summary */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
            <span className="text-[#688285] font-medium">কাস্টমারের সর্বমোট অবশিষ্ট বকেয়া (Grand Total Due Remaining):</span>
            <strong className="text-sm font-black text-[#17383B]">
              {formatCurrency(receipt.totalDueAfter, language)}
            </strong>
          </div>

          {/* Signature & Seal Footer */}
          <div className="pt-10 flex justify-between items-end text-xs text-[#17383B] border-t border-slate-200">
            <div className="text-center w-40">
              <div className="border-t border-dashed border-slate-400 pt-1.5 font-bold">
                গ্রাহকের স্বাক্ষর
              </div>
              <span className="text-[10px] text-[#8EA3A5]">Customer Signature</span>
            </div>

            <div className="text-center w-48">
              <div className="border-t border-dashed border-slate-400 pt-1.5 font-black text-[#0B9FA5]">
                মেসার্স মায়ের দোয়া ওয়াশিং
              </div>
              <span className="text-[10px] text-[#8EA3A5]">কর্তৃপক্ষের স্বাক্ষর ও সিল</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
