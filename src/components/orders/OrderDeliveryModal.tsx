import React, { useState, useEffect } from 'react';
import { Order, Account } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { 
  Truck, 
  CheckCircle2, 
  X, 
  Ruler, 
  Receipt, 
  Calculator, 
  Coins, 
  Printer, 
  Layers, 
  AlertCircle, 
  TrendingDown, 
  TrendingUp,
  CreditCard,
  Building2,
  Calendar,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrderDeliveryModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelivery: (data: {
    finishingYards: number;
    unitRate: number;
    deliveryNotes?: string;
    paymentAmount?: number;
    paymentAccountId?: string;
    printChallanAfter?: boolean;
  }) => void;
}

export const OrderDeliveryModal: React.FC<OrderDeliveryModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmDelivery
}) => {
  const { accounts, language, t } = useERP();

  const [finishingYards, setFinishingYards] = useState<number | string>(0);
  const [unitRate, setUnitRate] = useState<number | string>(0);
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [collectPayment, setCollectPayment] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<number | string>(0);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (order) {
      const initialFinishing = order.finishingYards && order.finishingYards > 0 
        ? order.finishingYards 
        : (order.greyYards || order.quantityPcs || 0);
      const initialRate = order.unitRate !== undefined ? order.unitRate : 0;
      setFinishingYards(initialFinishing);
      setUnitRate(initialRate);
      setDeliveryNotes(order.remarks ? `ডেলিভারি নোট: ${order.remarks}` : '');

      const initialTotal = Math.round(Number(initialFinishing) * Number(initialRate) * 100) / 100;
      const initialDue = Math.max(0, initialTotal - (order.advanceAmount || 0));
      setPaymentAmount(initialDue);
      setCollectPayment(false);

      if (accounts.length > 0) {
        setSelectedAccountId(accounts[0].id);
      }
    }
  }, [order, accounts]);

  if (!isOpen || !order) return null;

  const greyYards = order.greyYards || order.quantityPcs || 0;
  const numFinishingYards = Number(finishingYards) || 0;
  const yardDiff = numFinishingYards - greyYards;
  const diffPercent = greyYards > 0 ? ((yardDiff / greyYards) * 100).toFixed(1) : '0';

  const parsedUnitRate = parseFloat(String(unitRate)) || 0;
  const finalTotalAmount = Math.max(0, Math.round(numFinishingYards * parsedUnitRate * 100) / 100);
  const advancePaid = order.advanceAmount || 0;
  const netDue = Math.max(0, finalTotalAmount - advancePaid);

  const handleSubmit = (printChallan: boolean = false) => {
    if (numFinishingYards <= 0) {
      alert(language === 'bn' ? 'দয়া করে সঠিক ফিনিশিং গজ প্রদান করুন।' : 'Please enter a valid finishing yardage.');
      return;
    }

    setIsSubmitting(true);
    onConfirmDelivery({
      finishingYards: numFinishingYards,
      unitRate: parsedUnitRate,
      deliveryNotes: deliveryNotes.trim(),
      paymentAmount: collectPayment ? (parseFloat(String(paymentAmount)) || 0) : 0,
      paymentAccountId: collectPayment ? selectedAccountId : undefined,
      printChallanAfter: printChallan
    });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2D30]/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#D9EAEB] overflow-hidden my-6 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#EAF7F8] via-[#F1FAFA] to-[#E5F8F1] border-b border-[#D9EAEB] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0B9FA5] to-[#16B8B0] text-white flex items-center justify-center shadow-md shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-lg text-[#17383B]">
                  {language === 'bn' ? 'ডেলিভারি ও ফিনিশিং গজ এন্ট্রি' : 'Order Delivery & Final Yards Entry'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#0B9FA5]/15 text-[#0B9FA5] border border-[#0B9FA5]/30">
                  {order.orderNumber}
                </span>
              </div>
              <p className="text-xs text-[#688285] font-medium mt-0.5">
                {order.clientName} • {order.fabricQuality || order.garmentType || 'কাপড় ওয়াশ'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/80 text-[#8EA3A5] hover:text-[#17383B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Important Rule Notice */}
          <div className="p-3.5 bg-[#FFF8E7] border border-[#F3B562]/40 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#C47D1C] shrink-0 mt-0.5" />
            <p className="text-xs text-[#8A560B] leading-relaxed">
              {language === 'bn' 
                ? 'ওয়াশিং করার পরে কাপড়ে সংকোচন বা কম-বেশি হয় বিধায় ডেলিভারির সময় ফিনিশিংয়ের যেই গজ বের হয়েছে তা এন্ট্রি করা আবশ্যক। চূড়ান্ত বিল ও ক্লায়েন্ট লেজার এই ফিনিশিং গজের ওপর হিসাব করা হবে।'
                : 'Fabric yardage varies after washing. Please record the final actual Finishing Yards. The final invoice and client ledger balance will be calculated strictly based on Finishing Yards.'}
            </p>
          </div>

          {/* Quick Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-[#F8FCFC] rounded-2xl border border-[#E6F0F1] text-xs">
            <div>
              <span className="text-[10px] uppercase font-extrabold text-[#8EA3A5] block">
                {language === 'bn' ? 'কাপড়ের কোয়ালিটি' : 'Fabric Quality'}
              </span>
              <span className="font-bold text-[#17383B] mt-0.5 block truncate">
                {order.fabricQuality || 'মার্কিন / সাধারণ'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-extrabold text-[#8EA3A5] block">
                {language === 'bn' ? 'ওয়াশ ও শেড' : 'Wash & Shade'}
              </span>
              <span className="font-bold text-[#0B9FA5] mt-0.5 block truncate">
                {order.washType || order.colorShade || 'Standard Wash'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-extrabold text-[#8EA3A5] block">
                {language === 'bn' ? 'গৃহীত গেরে গজ' : 'Received Grey Yards'}
              </span>
              <span className="font-extrabold text-[#17383B] mt-0.5 block">
                {formatNumber(greyYards, language)} {language === 'bn' ? 'গজ' : 'Yds'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-extrabold text-[#8EA3A5] block">
                {language === 'bn' ? 'পূর্বে জমা অগ্রিম' : 'Advance Paid'}
              </span>
              <span className="font-extrabold text-[#229A73] mt-0.5 block">
                {formatCurrency(advancePaid, language)}
              </span>
            </div>
          </div>

          {/* Core Calculation Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Finishing Yards Input */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F1FAFA] to-white border-2 border-[#0B9FA5]/30 space-y-2">
              <label className="flex items-center justify-between text-xs font-black text-[#17383B]">
                <span className="flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-[#0B9FA5]" />
                  {language === 'bn' ? 'ফিনিশিং গজ (ডেলিভারি গজ) *' : 'Finishing Yards (Actual) *'}
                </span>
                <span className="text-[10px] font-bold text-[#0B9FA5] bg-white px-2 py-0.5 rounded-full border border-[#0B9FA5]/30">
                  {language === 'bn' ? 'বিলের ভিত্তি' : 'Billing Basis'}
                </span>
              </label>

              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={finishingYards === '' ? '' : finishingYards}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFinishingYards(val);
                    const parsedNum = parseFloat(val) || 0;
                    const parsedRate = parseFloat(String(unitRate)) || 0;
                    const newTot = Math.round(parsedNum * parsedRate * 100) / 100;
                    setPaymentAmount(Math.max(0, newTot - advancePaid));
                  }}
                  placeholder="0.00"
                  className="w-full pl-4 pr-16 py-3 text-lg font-black text-[#17383B] bg-white rounded-xl border border-[#D9EAEB] focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/20 focus:outline-none transition-all"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs text-[#8EA3A5]">
                  {language === 'bn' ? 'গজ' : 'Yds'}
                </span>
              </div>

              {/* Shrinkage / Expansion Live Pill */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#688285]">
                  {language === 'bn' ? 'গেরের তুলনায় তারতম্য:' : 'Variation from Grey:'}
                </span>
                <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-lg ${
                  yardDiff < 0 
                    ? 'bg-[#FFF0E6] text-[#E06D28]' 
                    : yardDiff > 0 
                    ? 'bg-[#E5F8F1] text-[#229A73]' 
                    : 'bg-[#F1FAFA] text-[#8EA3A5]'
                }`}>
                  {yardDiff < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : yardDiff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : null}
                  <span>
                    {yardDiff < 0 ? `${yardDiff.toFixed(2)}` : yardDiff > 0 ? `+${yardDiff.toFixed(2)}` : '0.00'} {language === 'bn' ? 'গজ' : 'yds'} ({diffPercent}%)
                  </span>
                </span>
              </div>
            </div>

            {/* Rate Per Yard Input */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F1FAFA] to-white border border-[#D9EAEB] space-y-2">
              <label className="flex items-center justify-between text-xs font-black text-[#17383B]">
                <span className="flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-[#6366F1]" />
                  {language === 'bn' ? 'প্রতি গজের দর (৳/গজ)' : 'Rate Per Yard (BDT)'}
                </span>
              </label>

              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={unitRate === '' ? '' : unitRate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setUnitRate(val);
                    const parsedNum = parseFloat(String(finishingYards)) || 0;
                    const parsedRate = parseFloat(val) || 0;
                    const newTot = Math.round(parsedNum * parsedRate * 100) / 100;
                    setPaymentAmount(Math.max(0, newTot - advancePaid));
                  }}
                  placeholder="e.g. 5.75"
                  className="w-full pl-4 pr-16 py-3 text-lg font-black text-[#17383B] bg-white rounded-xl border border-[#D9EAEB] focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/20 focus:outline-none transition-all"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs text-[#8EA3A5]">
                  ৳ / {language === 'bn' ? 'গজ' : 'yd'}
                </span>
              </div>

              <p className="text-[11px] text-[#688285] pt-1">
                {language === 'bn' ? 'চূড়ান্ত দর পরিবর্তন করতে চাইলে পরিবর্তন করতে পারেন' : 'Adjust unit rate if negotiated differently'}
              </p>
            </div>
          </div>

          {/* Dedicated Shrinkage / Process Loss (%) Calculation Card */}
          {numFinishingYards > 0 && (
            <div className={`p-4 rounded-2xl border transition-all ${
              yardDiff < 0
                ? 'bg-gradient-to-r from-[#FFF9F2] to-[#FFF3DF] border-[#F3B562]/60 shadow-2xs'
                : yardDiff > 0
                ? 'bg-[#E5F8F1]/60 border-[#38C99A]/40'
                : 'bg-[#F1FAFA] border-[#D9EAEB]'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {yardDiff < 0 ? (
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-[#C47D1C] flex items-center justify-center font-bold">
                      <TrendingDown className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#229A73] flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-black text-[#17383B]">
                      {yardDiff < 0 
                        ? (language === 'bn' ? 'ওয়াশিংয়ের পর কাপড় কম হওয়ার হিসাব (ঘাটতি / লস):' : 'Fabric Shrinkage & Process Loss Calculation:')
                        : yardDiff > 0 
                        ? (language === 'bn' ? 'ওয়াশিংয়ের পর কাপড় বৃদ্ধি হওয়ার হিসাব:' : 'Fabric Expansion Analysis:')
                        : (language === 'bn' ? 'ফিনিশিং আউটপুট রিপোর্ট:' : 'Finishing Output Report:')
                      }
                    </h4>
                    <p className="text-[10px] text-[#688285]">
                      {yardDiff < 0 
                        ? (language === 'bn' ? 'গেরে গজ থেকে ফিনিশিংয়ে যতটুকু কাপড় সংকোচন বা লস হয়েছে' : 'Percentage of shrinkage/shortage after wash processing')
                        : (language === 'bn' ? 'গেরে গজের তুলনায় ফিনিশিং আউটপুট সমান বা বৃদ্ধি পেয়েছে' : 'Output equal to or higher than received grey')}
                    </p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-black tracking-tight ${
                  yardDiff < 0 
                    ? 'bg-[#C47D1C] text-white shadow-xs' 
                    : yardDiff > 0 
                    ? 'bg-[#229A73] text-white shadow-xs' 
                    : 'bg-[#0B9FA5] text-white'
                }`}>
                  {yardDiff < 0 
                    ? `${formatNumber(Math.abs(Number(diffPercent)).toFixed(2), language)}% ${language === 'bn' ? 'কম হয়েছে' : 'Loss'}` 
                    : yardDiff > 0 
                    ? `+${formatNumber(diffPercent, language)}% ${language === 'bn' ? 'বেশি' : 'Gain'}`
                    : (language === 'bn' ? '১০০% সঠিক' : '100% Exact')}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-2.5 border-t border-black/5 text-xs">
                <div className="p-2 bg-white/80 rounded-xl border border-black/5">
                  <span className="text-[10px] text-[#8EA3A5] font-bold block">
                    {language === 'bn' ? '১. গেরে গজ (ইনপুট)' : '1. Grey Yards (In)'}
                  </span>
                  <strong className="text-xs font-extrabold text-[#17383B] block mt-0.5">
                    {formatNumber(greyYards, language)} {language === 'bn' ? 'গজ' : 'Yds'}
                  </strong>
                </div>

                <div className="p-2 bg-white/80 rounded-xl border border-black/5">
                  <span className="text-[10px] text-[#0B9FA5] font-bold block">
                    {language === 'bn' ? '২. ফিনিশিং গজ (আউটপুট)' : '2. Finishing Yards (Out)'}
                  </span>
                  <strong className="text-xs font-black text-[#0B9FA5] block mt-0.5">
                    {formatNumber(numFinishingYards, language)} {language === 'bn' ? 'গজ' : 'Yds'}
                  </strong>
                </div>

                <div className={`p-2 rounded-xl border ${
                  yardDiff < 0 
                    ? 'bg-amber-100/60 border-amber-200 text-amber-900' 
                    : 'bg-emerald-100/60 border-emerald-200 text-emerald-900'
                }`}>
                  <span className="text-[10px] font-bold block opacity-80">
                    {language === 'bn' ? (yardDiff < 0 ? '৩. মোট ঘাটতি / কম:' : '৩. মোট বৃদ্ধি:') : '3. Variance:'}
                  </span>
                  <strong className="text-xs font-black block mt-0.5">
                    {formatNumber(Math.abs(yardDiff).toFixed(2), language)} {language === 'bn' ? 'গজ' : 'Yds'}{' '}
                    <span className="text-[11px] font-bold">
                      ({formatNumber(Math.abs(Number(diffPercent)).toFixed(2), language)}%)
                    </span>
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Financial Calculation Summary Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#17383B] to-[#0F2D30] text-white space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs text-white/70 font-semibold flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-[#2FD1C5]" />
                {language === 'bn' ? 'চূড়ান্ত মোট বিল (ফিনিশিং গজ × দর)' : 'Final Total Bill (Finishing Yds × Rate)'}
              </span>
              <span className="text-base font-black text-[#2FD1C5]">
                {formatNumber(finishingYards, language)} × ৳{unitRate} = {formatCurrency(finalTotalAmount, language)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs pt-1">
              <div>
                <span className="text-white/60 block text-[11px]">
                  {language === 'bn' ? 'পূর্বে গৃহীত অগ্রিম:' : 'Previously Paid Advance:'}
                </span>
                <span className="font-bold text-white text-sm">
                  {formatCurrency(advancePaid, language)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-white/60 block text-[11px]">
                  {language === 'bn' ? 'চূড়ান্ত অবশিষ্ট বকেয়া:' : 'Net Remaining Due:'}
                </span>
                <span className="text-lg font-black text-[#F3B562]">
                  {formatCurrency(netDue, language)}
                </span>
              </div>
            </div>
          </div>

          {/* Optional Delivery Payment Collection */}
          <div className="p-4 rounded-2xl bg-[#F8FCFC] border border-[#D9EAEB] space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={collectPayment}
                  onChange={(e) => setCollectPayment(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0B9FA5] focus:ring-[#0B9FA5] border-gray-300"
                />
                <span className="text-xs font-black text-[#17383B]">
                  {language === 'bn' ? 'ডেলিভারির সময় নগদ বা ব্যাংক পেমেন্ট গ্রহণ করুন' : 'Collect Payment on Delivery'}
                </span>
              </label>
              <span className="text-[11px] font-bold text-[#0B9FA5]">
                {language === 'bn' ? 'ঐচ্ছিক' : 'Optional'}
              </span>
            </div>

            {collectPayment && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E6F0F1]"
              >
                <div>
                  <label className="block text-[11px] font-bold text-[#688285] mb-1">
                    {language === 'bn' ? 'জমা টাকার পরিমাণ (৳)' : 'Payment Collected (BDT)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={netDue * 2}
                    value={paymentAmount === 0 ? '' : paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-white border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#688285] mb-1">
                    {language === 'bn' ? 'জমা নেয়ার একাউন্ট' : 'Deposit Account'}
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-white border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountName} ({acc.accountType} - {formatCurrency(acc.currentBalance, language)})
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}
          </div>

          {/* Delivery Remarks & Gate Pass */}
          <div>
            <label className="block text-xs font-bold text-[#688285] mb-1">
              {language === 'bn' ? 'ডেলিভারি নোট / চালান মন্তব্য / গেট পাস' : 'Delivery Remarks / Gate Pass / Receiver Note'}
            </label>
            <input
              type="text"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder={language === 'bn' ? 'যেমন: গেট পাস নং-৪৫২১, রিসিভার: মোঃ রফিক' : 'e.g. Gate pass #4521, Received by Rafiq'}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#F8FCFC] border-t border-[#D9EAEB] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-[#D9EAEB] bg-white hover:bg-[#F1FAFA] text-xs font-bold text-[#688285] transition-colors text-center"
          >
            {language === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white hover:bg-[#EAF7F8] border border-[#0B9FA5]/40 text-[#0B9FA5] text-xs font-extrabold shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'bn' ? 'ডেলিভারি ও চালান প্রিন্ট' : 'Deliver & Print Challan'}</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{language === 'bn' ? 'ডেলিভারি সম্পন্ন করুন' : 'Confirm Delivery'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
