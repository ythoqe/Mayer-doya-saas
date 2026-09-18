import React, { useState, useMemo, useEffect } from 'react';
import { Client, Order } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { 
  X, 
  CreditCard, 
  DollarSign, 
  Landmark, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  History, 
  PackageCheck, 
  Layers, 
  Sparkles, 
  Printer, 
  ArrowRight,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PrintMoneyReceipt, PaymentReceiptData } from './PrintMoneyReceipt';

interface ClientPaymentModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ClientPaymentModal: React.FC<ClientPaymentModalProps> = ({
  client,
  isOpen,
  onClose
}) => {
  const { 
    clients, 
    orders, 
    accounts, 
    recordClientPayment,
    language, 
    t 
  } = useERP();

  // Payment division mode: 'old_dues' (পুরাতন হিসেবে জমা) or 'current_order' (নতুন/চলতি হিসেবে জমা)
  const [paymentMode, setPaymentMode] = useState<'old_dues' | 'current_order'>('current_order');

  const [selectedClientId, setSelectedClientId] = useState(client?.id || clients[0]?.id || '');
  const [amount, setAmount] = useState<number | string>(25000);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  
  // Specific to Old Dues mode
  const [selectedYear, setSelectedYear] = useState<string>('all');
  
  // Specific to Current Orders mode
  const [orderPaymentType, setOrderPaymentType] = useState<'specific_order' | 'general_current'>('general_current');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  // Success & Receipt states
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastReceiptData, setLastReceiptData] = useState<PaymentReceiptData | null>(null);
  const [showPrintReceipt, setShowPrintReceipt] = useState(false);

  const currentClient = clients.find(c => c.id === selectedClientId) || client || clients[0];
  const selectedAccount = accounts.find(a => a.id === accountId) || accounts[0];

  // Calculate Balances
  const oldDue = useMemo(() => {
    if (!currentClient) return 0;
    const op = Number(currentClient.openingBalance) || 0;
    if (op > 0) return op;
    if (currentClient.previousYearsDues && currentClient.previousYearsDues.length > 0) {
      return currentClient.previousYearsDues.reduce((s, d) => s + (Number(d.amount) || 0), 0);
    }
    return 0;
  }, [currentClient]);

  const totalDue = useMemo(() => {
    return Number(currentClient?.balance) || 0;
  }, [currentClient]);

  const currentDue = useMemo(() => {
    return Math.max(0, totalDue - oldDue);
  }, [totalDue, oldDue]);

  // Client's active or due orders
  const clientOrders = useMemo(() => {
    if (!currentClient) return [];
    return orders.filter(o => o.clientId === currentClient.id);
  }, [orders, currentClient]);

  const clientDueOrders = useMemo(() => {
    return clientOrders.filter(o => (o.dueAmount && o.dueAmount > 0) || o.status !== 'delivered');
  }, [clientOrders]);

  // Sync client when props change or modal opens
  useEffect(() => {
    if (client) {
      setSelectedClientId(client.id);
    }
  }, [client, isOpen]);

  // Auto-generate reference and smart amount default based on mode
  useEffect(() => {
    if (!isOpen) return;

    if (paymentMode === 'old_dues') {
      setReference(`REC-OLD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setNotes(language === 'bn' ? 'বিগত বছরের পুরাতন বকেয়া বাবদ টাকা জমা' : 'Payment received against past years old dues');
      if (oldDue > 0) {
        setAmount(oldDue);
      } else {
        setAmount(10000);
      }
    } else {
      setReference(`REC-CURR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setNotes(language === 'bn' ? 'চলতি জব কার্ড ও অর্ডারের বিল বাবদ জমা' : 'Payment received against current job card orders');
      if (currentDue > 0) {
        setAmount(currentDue);
      } else if (totalDue > 0) {
        setAmount(totalDue);
      } else {
        setAmount(20000);
      }
    }
  }, [paymentMode, selectedClientId, oldDue, currentDue, totalDue, isOpen, language]);

  // When order is selected in specific order mode
  useEffect(() => {
    if (paymentMode === 'current_order' && orderPaymentType === 'specific_order' && selectedOrderId) {
      const ord = clientOrders.find(o => o.id === selectedOrderId);
      if (ord && ord.dueAmount > 0) {
        setAmount(ord.dueAmount);
        setNotes(language === 'bn' 
          ? `জব কার্ড #${ord.orderNumber} (${ord.fabricQuality || ord.washType}) বাবদ জমা` 
          : `Payment for Job Card #${ord.orderNumber}`);
      }
    }
  }, [selectedOrderId, orderPaymentType, paymentMode, clientOrders, language]);

  if (!isOpen) return null;

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClient || Number(amount) <= 0) return;

    const numAmount = Number(amount);
    let selectedOrderObj: Order | null = null;
    if (paymentMode === 'current_order' && orderPaymentType === 'specific_order' && selectedOrderId) {
      selectedOrderObj = clientOrders.find(o => o.id === selectedOrderId) || null;
    }

    const accId = selectedAccount?.id || accounts[0]?.id || 'acc-1';

    // 1. Call atomic recordClientPayment
    await recordClientPayment({
      clientId: currentClient.id,
      amount: numAmount,
      accountId: accId,
      date: date || new Date().toISOString().split('T')[0],
      paymentMode,
      selectedYear: selectedYear !== 'all' ? selectedYear : undefined,
      orderId: selectedOrderObj?.id,
      reference,
      notes
    });

    // 2. Prepare Receipt Data
    const receiptData: PaymentReceiptData = {
      receiptNo: reference,
      date: date || new Date().toISOString().split('T')[0],
      paymentType: paymentMode,
      client: currentClient,
      amount: numAmount,
      accountName: selectedAccount?.accountName || 'Cash Account',
      accountType: selectedAccount?.accountType,
      notes: notes,
      selectedYear: selectedYear !== 'all' ? selectedYear : undefined,
      selectedOrder: selectedOrderObj,
      previousOldDue: oldDue,
      remainingOldDue: paymentMode === 'old_dues' ? Math.max(0, oldDue - numAmount) : oldDue,
      previousCurrentDue: currentDue,
      remainingCurrentDue: paymentMode === 'current_order' ? Math.max(0, currentDue - numAmount) : currentDue,
      totalDueBefore: totalDue,
      totalDueAfter: Math.max(0, totalDue - numAmount)
    };

    setLastReceiptData(receiptData);
    setIsSuccess(true);
  };

  const handleCloseAll = () => {
    setIsSuccess(false);
    setShowPrintReceipt(false);
    setLastReceiptData(null);
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#17383B]/40 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="w-full max-w-xl bg-white rounded-3xl border border-[#D9EAEB] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-[#F1FAFA] border-b border-[#D9EAEB] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0B9FA5] to-[#16B8B0] text-white flex items-center justify-center shadow-md">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#17383B]">
                    {language === 'bn' ? 'টাকা জমা এন্ট্রি (Receive Payment)' : 'Record Client Payment'}
                  </h3>
                  <p className="text-xs text-[#688285]">
                    {language === 'bn' ? 'পুরাতন বকেয়া অথবা চলতি অর্ডারের বিপরীতে টাকা জমা নিন' : 'Collect money against old dues or current orders'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseAll}
                className="p-2 rounded-full hover:bg-white text-[#8EA3A5] hover:text-[#17383B] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isSuccess && lastReceiptData ? (
              <div className="p-8 flex flex-col items-center justify-center text-center space-y-5 overflow-y-auto">
                <div className="w-16 h-16 rounded-3xl bg-[#E5F8F1] text-[#229A73] flex items-center justify-center shadow-inner animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="font-black text-lg text-[#17383B]">
                    {language === 'bn' ? 'টাকা জমা সফলভাবে সম্পন্ন হয়েছে!' : 'Payment Successfully Recorded!'}
                  </h4>
                  <p className="text-xs text-[#688285] mt-1">
                    {lastReceiptData.paymentType === 'old_dues'
                      ? (language === 'bn' ? '📜 পুরাতন হিসেবে জমা হয়েছে' : 'Credited to Old Dues Account')
                      : (language === 'bn' ? '📦 নতুন/চলতি অর্ডারের হিসেবে জমা হয়েছে' : 'Credited to Current Orders Account')}
                  </p>
                </div>

                {/* Receipt Card Preview */}
                <div className="w-full p-4 rounded-2xl bg-[#F9FBFC] border border-[#D9EAEB] text-left space-y-2.5 text-xs">
                  <div className="flex justify-between items-center border-b border-[#E6F0F1] pb-2">
                    <span className="text-[#688285]">রসিদ নং:</span>
                    <strong className="font-mono text-[#0B9FA5]">{lastReceiptData.receiptNo}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#688285]">কাস্টমার:</span>
                    <strong className="text-[#17383B]">{lastReceiptData.client.companyName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#688285]">জমাকৃত টাকা:</span>
                    <strong className="text-base font-black text-[#229A73]">{formatCurrency(lastReceiptData.amount, language)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#688285]">জমাকৃত অ্যাকাউন্ট:</span>
                    <strong className="text-[#17383B]">{lastReceiptData.accountName}</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#E6F0F1] text-[#688285]">
                    <span>অবশিষ্ট মোট বকেয়া:</span>
                    <strong className="text-xs font-bold text-[#C47D1C]">{formatCurrency(lastReceiptData.totalDueAfter, language)}</strong>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 w-full pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPrintReceipt(true)}
                    className="flex-1 py-3 rounded-2xl bg-white border-2 border-[#0B9FA5] text-[#0B9FA5] hover:bg-[#F1FAFA] text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{language === 'bn' ? 'মানি রিসিট প্রিন্ট করুন' : 'Print Money Receipt'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCloseAll}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white text-xs font-black shadow-md transition-all cursor-pointer"
                  >
                    <span>{language === 'bn' ? 'সম্পন্ন / বন্ধ করুন' : 'Done / Close'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRecordPayment} className="p-6 space-y-4 overflow-y-auto">
                {/* 1. Client Selection */}
                <div>
                  <label className="block text-xs font-black text-[#17383B] mb-1.5">
                    {t('clientCompanyCol')} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs font-bold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none cursor-pointer"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} (মোট বকেয়া: {formatCurrency(c.balance || 0, language)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Dual Balance Status Banner */}
                {currentClient && (
                  <div className="p-3.5 rounded-2xl bg-[#F9FBFC] border border-[#E6F0F1] space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-[#688285]">
                      <span className="font-bold uppercase text-[10px]">কাস্টমার বকেয়া বিবরণী</span>
                      <span>যোগাযোগ: <strong className="text-[#17383B]">{currentClient.name}</strong></span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
                        <span className="text-[10px] text-amber-800 font-bold block">📜 পুরাতন বকেয়া</span>
                        <strong className="text-xs sm:text-sm font-black text-amber-900">
                          {formatCurrency(oldDue, language)}
                        </strong>
                      </div>

                      <div className="p-2 rounded-xl bg-teal-50 border border-teal-200">
                        <span className="text-[10px] text-teal-800 font-bold block">📦 চলতি বকেয়া</span>
                        <strong className="text-xs sm:text-sm font-black text-[#0B9FA5]">
                          {formatCurrency(currentDue, language)}
                        </strong>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
                        <span className="text-[10px] text-slate-700 font-bold block">💰 মোট বকেয়া</span>
                        <strong className="text-xs sm:text-sm font-black text-[#17383B]">
                          {formatCurrency(totalDue, language)}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. TWO PAYMENT DIVISIONS TABS (টাকা জমার দুটি প্রধান ভাগ) */}
                <div>
                  <label className="block text-xs font-black text-[#17383B] mb-2">
                    {language === 'bn' ? 'টাকা জমার হিসাব খাত নির্বাচন করুন (Payment Division):' : 'Select Payment Division:'}
                  </label>

                  <div className="grid grid-cols-2 gap-2.5 p-1.5 bg-[#EAF6F7] rounded-2xl border border-[#D9EAEB]">
                    {/* Tab 1: পুরাতন হিসেবে জমা */}
                    <button
                      type="button"
                      onClick={() => setPaymentMode('old_dues')}
                      className={`p-3 rounded-xl transition-all text-left flex flex-col justify-between cursor-pointer ${
                        paymentMode === 'old_dues'
                          ? 'bg-white text-amber-950 shadow-md border-2 border-amber-400'
                          : 'hover:bg-white/60 text-[#688285] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base">📜</span>
                        {paymentMode === 'old_dues' && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs font-black text-[#17383B]">
                        {language === 'bn' ? '১. পুরাতন হিসেবে জমা' : '1. Old Dues Payment'}
                      </p>
                      <p className="text-[10px] text-[#8EA3A5] mt-0.5 leading-tight">
                        {language === 'bn' ? 'বিগত বছরের বকেয়া বা পূর্বের জের আদায়' : 'Past years opening balance dues'}
                      </p>
                      <div className="mt-2 pt-1 border-t border-amber-100 flex items-center justify-between text-[11px] font-bold text-amber-800">
                        <span>বকেয়া:</span>
                        <span>{formatCurrency(oldDue, language)}</span>
                      </div>
                    </button>

                    {/* Tab 2: নতুন/চলতি হিসেবে জমা */}
                    <button
                      type="button"
                      onClick={() => setPaymentMode('current_order')}
                      className={`p-3 rounded-xl transition-all text-left flex flex-col justify-between cursor-pointer ${
                        paymentMode === 'current_order'
                          ? 'bg-white text-teal-950 shadow-md border-2 border-[#0B9FA5]'
                          : 'hover:bg-white/60 text-[#688285] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base">📦</span>
                        {paymentMode === 'current_order' && (
                          <span className="w-2 h-2 rounded-full bg-[#0B9FA5] animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs font-black text-[#17383B]">
                        {language === 'bn' ? '২. নতুন/চলতি হিসেবে জমা' : '2. Current Orders Payment'}
                      </p>
                      <p className="text-[10px] text-[#8EA3A5] mt-0.5 leading-tight">
                        {language === 'bn' ? 'নতুন জব কার্ড ও রানিং ওয়াশ বিল আদায়' : 'Active job cards and running wash bills'}
                      </p>
                      <div className="mt-2 pt-1 border-t border-teal-100 flex items-center justify-between text-[11px] font-bold text-[#0B9FA5]">
                        <span>বকেয়া:</span>
                        <span>{formatCurrency(currentDue, language)}</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 4. Division Specific Content */}
                {paymentMode === 'old_dues' ? (
                  /* OLD DUES SECTION */
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                        <History className="w-4 h-4 text-amber-600" />
                        {language === 'bn' ? 'পুরাতন বকেয়ার বিবরণ ও সাল নির্বাচন' : 'Old Dues Breakdown by Year'}
                      </span>
                      {oldDue > 0 && (
                        <button
                          type="button"
                          onClick={() => setAmount(oldDue)}
                          className="text-[11px] font-extrabold text-amber-900 underline hover:text-amber-700 cursor-pointer"
                        >
                          {language === 'bn' ? 'সব পুরাতন বকেয়া পরিশোধ' : 'Pay Full Old Due'}
                        </button>
                      )}
                    </div>

                    {/* Yearly Breakdown if available */}
                    {currentClient?.previousYearsDues && currentClient.previousYearsDues.length > 0 ? (
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-amber-900">
                          {language === 'bn' ? 'কোন সালের বকেয়া পরিশোধ হচ্ছে?' : 'Select Specific Year:'}
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedYear('all');
                              setAmount(oldDue);
                            }}
                            className={`p-2 rounded-xl text-xs font-bold text-left border cursor-pointer transition-all ${
                              selectedYear === 'all'
                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                            }`}
                          >
                            <span className="block text-[10px] opacity-80">সাধারণ / সর্বমোট</span>
                            <span>{formatCurrency(oldDue, language)}</span>
                          </button>

                          {currentClient.previousYearsDues.map((yd, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setSelectedYear(String(yd.year));
                                setAmount(Number(yd.amount) || 0);
                              }}
                              className={`p-2 rounded-xl text-xs font-bold text-left border cursor-pointer transition-all ${
                                selectedYear === String(yd.year)
                                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                  : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                              }`}
                            >
                              <span className="block text-[10px] opacity-80">{yd.year} সালের বকেয়া</span>
                              <span>{formatCurrency(yd.amount, language)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs text-[#17383B] flex items-center justify-between">
                        <span>মোট পূর্বের বকেয়া জের (Opening Balance):</span>
                        <strong className="text-sm font-black text-amber-900">{formatCurrency(oldDue, language)}</strong>
                      </div>
                    )}
                  </div>
                ) : (
                  /* CURRENT ORDERS SECTION */
                  <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-teal-900 flex items-center gap-1.5">
                        <PackageCheck className="w-4 h-4 text-[#0B9FA5]" />
                        {language === 'bn' ? 'চলতি অর্ডারের হিসাব সমন্বয়' : 'Current Orders & Bills Settlement'}
                      </span>
                      {currentDue > 0 && (
                        <button
                          type="button"
                          onClick={() => setAmount(currentDue)}
                          className="text-[11px] font-extrabold text-[#0B9FA5] underline hover:text-[#078A90] cursor-pointer"
                        >
                          {language === 'bn' ? 'সব চলতি বকেয়া পরিশোধ' : 'Pay Full Current Due'}
                        </button>
                      )}
                    </div>

                    {/* Order sub-modes: Specific Job Card vs General Current */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setOrderPaymentType('general_current')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          orderPaymentType === 'general_current'
                            ? 'bg-[#0B9FA5] text-white shadow-xs'
                            : 'bg-white text-[#688285] border border-teal-200'
                        }`}
                      >
                        {language === 'bn' ? 'সাধারণ চলতি বিলে জমা' : 'General Current Account'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOrderPaymentType('specific_order');
                          if (clientDueOrders.length > 0 && !selectedOrderId) {
                            setSelectedOrderId(clientDueOrders[0].id);
                          }
                        }}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          orderPaymentType === 'specific_order'
                            ? 'bg-[#0B9FA5] text-white shadow-xs'
                            : 'bg-white text-[#688285] border border-teal-200'
                        }`}
                      >
                        {language === 'bn' ? 'নির্দিষ্ট জব কার্ডে জমা' : 'Specific Job Card'}
                      </button>
                    </div>

                    {orderPaymentType === 'specific_order' && (
                      <div className="space-y-1.5 pt-1">
                        <label className="block text-[11px] font-bold text-teal-900">
                          {language === 'bn' ? 'জব কার্ড বা লট নির্বাচন করুন:' : 'Select Job Card:'}
                        </label>
                        {clientDueOrders.length > 0 ? (
                          <select
                            value={selectedOrderId}
                            onChange={(e) => setSelectedOrderId(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-teal-300 text-xs font-bold text-[#17383B] focus:outline-none cursor-pointer"
                          >
                            <option value="">{language === 'bn' ? '-- জব কার্ড বাছাই করুন --' : '-- Select Order --'}</option>
                            {clientDueOrders.map(o => (
                              <option key={o.id} value={o.id}>
                                #{o.orderNumber} • {o.fabricQuality || o.washType} • বকেয়া: {formatCurrency(o.dueAmount || 0, language)} (মোট: {formatCurrency(o.totalAmount, language)})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-xs text-[#8EA3A5] bg-white p-2.5 rounded-xl border border-teal-200">
                            {language === 'bn' ? 'এই কাস্টমারের কোনো বকেয়া জব কার্ড নেই।' : 'No active due orders for this client.'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Amount & Receiving Account */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-black text-[#17383B] mb-1.5">
                      {language === 'bn' ? 'জমাকৃত টাকার পরিমাণ (৳)' : 'Payment Amount (BDT)'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="text-xs font-bold text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2">৳</span>
                      <input
                        type="number"
                        required
                        min="1"
                        step="any"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value === '' ? ('' as any) : parseFloat(e.target.value))}
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-sm font-black text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#17383B] mb-1.5">
                      {language === 'bn' ? 'জমাকৃত অ্যাকাউন্ট / ক্যাশ' : 'Deposit Account'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Landmark className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <select
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs font-bold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none cursor-pointer"
                      >
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.accountName} ({acc.accountType}) - ব্যালেন্স: {formatCurrency(acc.currentBalance, language)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 6. Date & Reference */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-black text-[#17383B] mb-1.5">
                      {t('paymentDate')}
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#17383B] mb-1.5">
                      {language === 'bn' ? 'মানি রসিদ / ভাউচার নং' : 'Receipt / Voucher #'}
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. REC-2026-001"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs font-mono font-bold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 7. Notes */}
                <div>
                  <label className="block text-xs font-black text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'বিবরণ / মন্তব্য' : 'Remarks / Notes'}
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                    placeholder={language === 'bn' ? 'টাকা প্রাপ্তির বিবরণ...' : 'Payment notes or details...'}
                  />
                </div>

                {/* Calculation Snapshot preview */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-[#688285]">
                    {language === 'bn' ? 'এই জমার পর কাস্টমারের অবশিষ্ট মোট বকেয়া হবে:' : 'Client total remaining due after payment:'}
                  </span>
                  <strong className="text-sm font-black text-[#17383B]">
                    {formatCurrency(Math.max(0, totalDue - (Number(amount) || 0)), language)}
                  </strong>
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6F0F1] shrink-0">
                  <button
                    type="button"
                    onClick={handleCloseAll}
                    className="px-4 py-2.5 rounded-xl border border-[#D9EAEB] text-xs font-bold text-[#688285] hover:bg-[#F1FAFA] cursor-pointer"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className={`px-6 py-2.5 rounded-xl text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer ${
                      paymentMode === 'old_dues'
                        ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600'
                        : 'bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5]'
                    }`}
                  >
                    {paymentMode === 'old_dues'
                      ? (language === 'bn' ? '📜 পুরাতন বকেয়া জমা কনফার্ম করুন' : 'Confirm Old Dues Payment')
                      : (language === 'bn' ? '📦 চলতি অর্ডার জমা কনফার্ম করুন' : 'Confirm Current Orders Payment')}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Printable Money Receipt Modal */}
      {showPrintReceipt && lastReceiptData && (
        <PrintMoneyReceipt
          receipt={lastReceiptData}
          language={language}
          onClose={() => setShowPrintReceipt(false)}
        />
      )}
    </>
  );
};
