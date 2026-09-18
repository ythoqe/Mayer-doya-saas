import React, { useState, useMemo } from 'react';
import { Client, Order, ClientBill } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { 
  Building2, 
  User, 
  Phone, 
  MapPin, 
  Mail, 
  CreditCard, 
  Printer, 
  Edit, 
  X, 
  Package, 
  Calendar, 
  FileText, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  DollarSign,
  Receipt,
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PayBillModal } from './PayBillModal';
import { PrintBillInvoiceModal } from './PrintBillInvoiceModal';

interface ClientDetailsModalProps {
  client: Client | null;
  orders: Order[];
  isOpen: boolean;
  onClose: () => void;
  onEditClient: (client: Client) => void;
  onRecordPayment: (client: Client) => void;
  onPrintStatement: (client: Client) => void;
}

export const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({
  client,
  orders,
  isOpen,
  onClose,
  onEditClient,
  onRecordPayment,
  onPrintStatement
}) => {
  const { language, t, cheques, transactions, clientBills } = useERP();
  const [activeTab, setActiveTab] = useState<'running_bills' | 'orders' | 'ledger' | 'payments'>('running_bills');
  const [billFilter, setBillFilter] = useState<'all' | 'recent' | 'unpaid' | 'paid'>('all');
  const [billSearchQuery, setBillSearchQuery] = useState<string>('');
  
  // Pay Bill modal state
  const [isPayBillModalOpen, setIsPayBillModalOpen] = useState<boolean>(false);
  const [billIdToPay, setBillIdToPay] = useState<string | undefined>(undefined);
  
  // Print Bill Invoice modal state
  const [printingBill, setPrintingBill] = useState<ClientBill | null>(null);

  if (!isOpen || !client) return null;

  const clientOrders = orders.filter(o => o.clientId === client.id);
  const clientBillsList = clientBills.filter(b => b.clientId === client.id);

  // Financial summary for Running Bills
  const totalRunningBill = clientBillsList.reduce((sum, b) => sum + (b.totalBill || 0), 0);
  const totalBillPaid = clientBillsList.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
  const totalBillDue = clientBillsList.reduce((sum, b) => sum + (b.dueAmount || 0), 0);
  const unpaidBillsCount = clientBillsList.filter(b => b.dueAmount > 0).length;
  const paidBillsCount = clientBillsList.filter(b => b.status === 'Paid' || b.dueAmount <= 0).length;

  // Filtered bills
  const displayedBills = useMemo(() => {
    let list = [...clientBillsList];

    // Status filter
    if (billFilter === 'unpaid') {
      list = list.filter(b => b.dueAmount > 0);
    } else if (billFilter === 'paid') {
      list = list.filter(b => b.status === 'Paid' || b.dueAmount <= 0);
    } else if (billFilter === 'recent') {
      // Sort by delivery date descending and take top 5
      list.sort((a, b) => new Date(b.deliveryDate || b.createdAt).getTime() - new Date(a.deliveryDate || a.createdAt).getTime());
      list = list.slice(0, 5);
    }

    // Search query
    if (billSearchQuery.trim()) {
      const q = billSearchQuery.toLowerCase().trim();
      list = list.filter(b => 
        (b.billNumber || '').toLowerCase().includes(q) ||
        (b.orderNumber || '').toLowerCase().includes(q) ||
        (b.orderDescription || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [clientBillsList, billFilter, billSearchQuery]);

  const clientCheques = cheques.filter(c => 
    (c.partyName || '').toLowerCase() === (client.companyName || '').toLowerCase() || 
    (c.partyName || '').toLowerCase() === (client.name || '').toLowerCase()
  );

  const clientTransactions = transactions.filter(tx => 
    tx.type === 'credit' && (
      (client.companyName && (tx.description || '').toLowerCase().includes(client.companyName.toLowerCase())) ||
      (client.name && (tx.description || '').toLowerCase().includes(client.name.toLowerCase())) ||
      (tx.category || '').toLowerCase().includes('client payment') ||
      (tx.category || '').toLowerCase().includes('bill payment') ||
      (tx.category || '').toLowerCase().includes('delivery settlement')
    )
  );

  // Generate ledger rows starting from opening balance
  const initialOpening = client.openingBalance || (client.previousYearsDues?.reduce((s, d) => s + (Number(d.amount) || 0), 0) || 0);
  let runningBal = initialOpening;

  const ledgerRows = [];
  if (initialOpening > 0) {
    const dueBreakdownText = client.previousYearsDues?.length 
      ? ` (${client.previousYearsDues.map(d => `${d.year}: ৳${formatNumber(d.amount, language)}`).join(', ')})`
      : '';
    ledgerRows.push({
      date: client.createdAt || '2023-01-01',
      reference: 'OPEN-BAL',
      description: language === 'bn' 
        ? `পূর্বের বকেয়া জের / বিগত বছরের বকেয়া${dueBreakdownText}` 
        : `Opening Balance / Past Years Due Brought Forward${dueBreakdownText}`,
      debit: initialOpening,
      credit: 0,
      balance: initialOpening
    });
  }

  type RawEntry = {
    date: string;
    reference: string;
    description: string;
    debit: number;
    credit: number;
  };

  const rawEntries: RawEntry[] = [];

  clientOrders.forEach((order) => {
    const isDelivered = order.status === 'delivered';
    const debit = order.totalAmount || (order.greyYards * order.unitRate) || 0;
    const advanceCredit = order.advanceAmount || 0;
    
    rawEntries.push({
      date: order.deliveryDate || order.receivedDate || new Date().toISOString().split('T')[0],
      reference: order.orderNumber,
      description: `${order.fabricQuality || order.garmentType || 'Fabrics'} - ${order.washType || 'Wash'} (${order.finishingYards || order.quantityPcs || 0} ${order.finishingYards ? 'yds' : 'pcs'})${isDelivered ? ' [Delivered / কাজ সম্পন্ন]' : ''}`,
      debit,
      credit: advanceCredit
    });
  });

  // Include payment transactions that are client running bill receipts
  clientTransactions.forEach((tx) => {
    const isOrderAdvance = clientOrders.some(o => tx.referenceId === o.id || (tx.description && tx.description.includes(o.orderNumber)));
    if (!isOrderAdvance) {
      rawEntries.push({
        date: tx.date,
        reference: tx.referenceId || 'RCPT',
        description: tx.description || 'Running Bill / Due Settlement Payment',
        debit: 0,
        credit: tx.amount
      });
    }
  });

  rawEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  rawEntries.forEach((item) => {
    runningBal += item.debit - item.credit;
    ledgerRows.push({
      ...item,
      balance: runningBal
    });
  });

  const getInitials = (name: string, company: string) => {
    const text = company || name || 'MD';
    return text.substring(0, 2).toUpperCase();
  };

  const handleOpenPayBill = (billId?: string) => {
    setBillIdToPay(billId);
    setIsPayBillModalOpen(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#17383B]/40 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 12 }}
          className="w-full max-w-5xl bg-white rounded-3xl border border-[#D9EAEB] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header Profile */}
          <div className="p-6 bg-gradient-to-r from-[#F1FAFA] to-[#E5F8F1] border-b border-[#D9EAEB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0B9FA5] to-[#16B8B0] text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                {getInitials(client.name, client.companyName)}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-[#17383B]">
                    {client.companyName}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                    client.status === 'active'
                      ? 'bg-[#E5F8F1] text-[#229A73] border border-[#38C99A]/30'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {t(client.status)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#688285] mt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#0B9FA5]" />
                    <strong>{client.name}</strong>
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-[#0B9FA5]" />
                    {client.phone}
                  </span>
                  {client.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#0B9FA5]" />
                      {client.address}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => handleOpenPayBill()}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? '+ রানিং বিল জমা / পেমেন্ট' : '+ Pay Running Bill'}</span>
              </button>

              <button
                type="button"
                onClick={() => onPrintStatement(client)}
                className="p-2 rounded-xl bg-white border border-[#D9EAEB] text-[#17383B] hover:bg-[#F1FAFA] transition-colors"
                title={t('printStatementBtn')}
              >
                <Printer className="w-4 h-4 text-[#0B9FA5]" />
              </button>

              <button
                type="button"
                onClick={() => onEditClient(client)}
                className="p-2 rounded-xl bg-white border border-[#D9EAEB] text-[#17383B] hover:bg-[#F1FAFA] transition-colors"
                title={t('edit')}
              >
                <Edit className="w-4 h-4 text-[#688285]" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-black/5 text-[#8EA3A5] hover:text-[#17383B] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 3 High-Contrast Financial Cards */}
          <div className="p-6 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-white">
            <div className="p-4 rounded-2xl bg-[#F9FBFC] border border-[#E6F0F1] space-y-1">
              <span className="text-[10px] font-bold text-[#8EA3A5] uppercase tracking-wider block">
                {language === 'bn' ? 'মোট চালিত / বিল অ্যামাউন্ট' : 'Total Lifetime Billed'}
              </span>
              <div className="text-xl font-black text-[#17383B]">
                {formatCurrency(client.totalBilled, language)}
              </div>
              <p className="text-[11px] text-[#688285]">
                {formatNumber(clientBillsList.length, language)} {language === 'bn' ? 'টি ডেলিভারি চালান বিল' : 'Delivery Invoices'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#E5F8F1]/40 border border-[#38C99A]/20 space-y-1">
              <span className="text-[10px] font-bold text-[#229A73] uppercase tracking-wider block">
                {language === 'bn' ? 'মোট পরিশোধিত টাকা' : 'Total Payments Received'}
              </span>
              <div className="text-xl font-black text-[#229A73]">
                {formatCurrency(client.totalPaid, language)}
              </div>
              <p className="text-[11px] text-[#229A73]/80">
                {language === 'bn' ? 'অগ্রিম ও ব্যাংক/নগদ জমা' : 'Advances & Account Receipts'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-1">
              <span className="text-[10px] font-bold text-[#C47D1C] uppercase tracking-wider block">
                {language === 'bn' ? 'বর্তমান মোট বকেয়া' : 'Outstanding Receivable'}
              </span>
              <div className="text-xl font-black text-[#C47D1C]">
                {formatCurrency(client.balance, language)}
              </div>
              <p className="text-[11px] text-[#C47D1C]/80">
                {client.balance > 0 
                  ? (language === 'bn' ? `${formatNumber(unpaidBillsCount, language)} টি বিলে বকেয়া রয়েছে` : `${unpaidBillsCount} bills pending payment`)
                  : (language === 'bn' ? 'সকল হিসাব পরিশোধিত' : 'Account fully settled')}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 border-b border-[#E6F0F1] flex items-center gap-6 bg-white overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('running_bills')}
              className={`py-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'running_bills'
                  ? 'border-teal-600 text-teal-700 font-black'
                  : 'border-transparent text-[#688285] hover:text-[#17383B]'
              }`}
            >
              <Receipt className="w-4 h-4 text-teal-600" />
              <span>{language === 'bn' ? 'রানিং বিল (Running Bill)' : 'Running Bill'}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                unpaidBillsCount > 0 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {clientBillsList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`py-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'border-[#0B9FA5] text-[#0B9FA5]'
                  : 'border-transparent text-[#688285] hover:text-[#17383B]'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{t('orderHistoryTab')} ({clientOrders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ledger')}
              className={`py-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'ledger'
                  ? 'border-[#0B9FA5] text-[#0B9FA5]'
                  : 'border-transparent text-[#688285] hover:text-[#17383B]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{t('clientLedgerTab')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`py-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'payments'
                  ? 'border-[#0B9FA5] text-[#0B9FA5]'
                  : 'border-transparent text-[#688285] hover:text-[#17383B]'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>{t('paymentHistoryTab')} ({clientTransactions.length})</span>
            </button>
          </div>

          {/* Tab Content Workspace */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-white">
            
            {/* TAB 0: RUNNING BILL WORKFLOW */}
            {activeTab === 'running_bills' && (
              <div className="space-y-4">
                {/* Running Bill Metric Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-teal-50/50 border border-teal-200/60">
                    <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                      {language === 'bn' ? 'মোট রানিং বিল' : 'Total Running Bill'}
                    </span>
                    <div className="text-lg font-black text-teal-900 mt-0.5">
                      {formatCurrency(totalRunningBill, language)}
                    </div>
                    <span className="text-[10px] text-teal-700/80">
                      {formatNumber(clientBillsList.length, language)} {language === 'bn' ? 'টি সম্পন্ন চালান' : 'completed deliveries'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/60">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      {language === 'bn' ? 'মোট পরিশোধিত বিল' : 'Total Paid'}
                    </span>
                    <div className="text-lg font-black text-emerald-700 mt-0.5">
                      {formatCurrency(totalBillPaid, language)}
                    </div>
                    <span className="text-[10px] text-emerald-700/80">
                      {formatNumber(paidBillsCount, language)} {language === 'bn' ? 'টি সম্পূর্ণ পরিশোধ' : 'fully paid bills'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200/60">
                    <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                      {language === 'bn' ? 'মোট বকেয়া বিল' : 'Total Due'}
                    </span>
                    <div className="text-lg font-black text-rose-700 mt-0.5">
                      {formatCurrency(totalBillDue, language)}
                    </div>
                    <span className="text-[10px] text-rose-700/80">
                      {formatNumber(unpaidBillsCount, language)} {language === 'bn' ? 'টি বিল অপরিশোধিত' : 'unpaid / pending'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        {language === 'bn' ? 'বিল পরিশোধ কার্য' : 'Bill Action'}
                      </span>
                      <div className="text-xs text-slate-600 mt-1 font-medium">
                        {language === 'bn' ? 'সরাসরি রানিং বিল জমা করুন' : 'Record direct bill payment'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenPayBill()}
                      className="mt-2 w-full py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'বিল পরিশোধ করুন' : 'Pay Bill'}</span>
                    </button>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setBillFilter('all')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        billFilter === 'all'
                          ? 'bg-white text-teal-800 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {language === 'bn' ? 'সবগুলো বিল' : 'All Bills'} ({clientBillsList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillFilter('recent')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        billFilter === 'recent'
                          ? 'bg-white text-teal-800 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {language === 'bn' ? 'সাম্প্রতিক বিল' : 'Recent Bills'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillFilter('unpaid')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                        billFilter === 'unpaid'
                          ? 'bg-white text-rose-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>{language === 'bn' ? 'বকেয়া বিল' : 'Unpaid Bills'}</span>
                      {unpaidBillsCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillFilter('paid')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        billFilter === 'paid'
                          ? 'bg-white text-emerald-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {language === 'bn' ? 'পরিশোধিত বিল' : 'Paid Bills'}
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder={language === 'bn' ? 'বিল নং বা জব নং দিয়ে খুঁজুন...' : 'Search by bill or job no...'}
                      value={billSearchQuery}
                      onChange={(e) => setBillSearchQuery(e.target.value)}
                      className="w-full sm:w-64 pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Bills Table */}
                {displayedBills.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-sm text-slate-800">
                      {language === 'bn' ? 'কোনো রানিং বিল পাওয়া যায়নি' : 'No running bills found'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {language === 'bn' 
                        ? 'অর্ডার ডেলিভারি সম্পূর্ণ (Delivered) হলে স্বয়ংক্রিয়ভাবে বিল তৈরি হবে।' 
                        : 'Bills are automatically created when an order delivery is marked complete.'}
                    </p>
                  </div>
                ) : (
                  <div className="border border-[#D9EAEB] rounded-2xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[#F1FAFA] border-b border-[#D9EAEB] text-[#17383B] font-bold text-[10px] uppercase">
                            <th className="py-3 px-3">Invoice / Bill No.</th>
                            <th className="py-3 px-3">Order / Job No.</th>
                            <th className="py-3 px-3">Delivery Date</th>
                            <th className="py-3 px-4">Order Description</th>
                            <th className="py-3 px-3 text-right">Quantity</th>
                            <th className="py-3 px-3 text-right">Rate</th>
                            <th className="py-3 px-3 text-right">Total Bill</th>
                            <th className="py-3 px-3 text-right">Paid Amount</th>
                            <th className="py-3 px-3 text-right">Due Amount</th>
                            <th className="py-3 px-3 text-center">Status</th>
                            <th className="py-3 px-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E6F0F1]">
                          {displayedBills.map(bill => (
                            <tr key={bill.id} className="hover:bg-[#F9FBFC] transition-colors">
                              <td className="py-2.5 px-3 font-mono font-bold text-teal-700">
                                {bill.billNumber}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                                #{bill.orderNumber}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                                {bill.deliveryDate}
                              </td>
                              <td className="py-2.5 px-4 font-medium text-slate-800">
                                <div>{bill.orderDescription}</div>
                                {bill.notes && <div className="text-[10px] text-slate-500 italic mt-0.5">{bill.notes}</div>}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-700">
                                {formatNumber(bill.quantity, language)} yds
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                                ৳{formatNumber(bill.rate, language)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                                {formatCurrency(bill.totalBill, language)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-medium text-emerald-600">
                                {formatCurrency(bill.paidAmount, language)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                                {formatCurrency(bill.dueAmount, language)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  bill.status === 'Paid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : bill.status === 'Partially Paid'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {bill.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {bill.dueAmount > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenPayBill(bill.id)}
                                      className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold shadow-2xs transition-colors flex items-center gap-1"
                                      title={language === 'bn' ? 'বিল পরিশোধ করুন' : 'Pay Bill'}
                                    >
                                      <CreditCard className="w-3 h-3" />
                                      <span>{language === 'bn' ? 'জমা' : 'Pay'}</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setPrintingBill(bill)}
                                    className="p-1 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-slate-100 transition-colors"
                                    title={language === 'bn' ? 'চালান ও বিল প্রিন্ট' : 'Print Invoice'}
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 1: ORDER HISTORY */}
            {activeTab === 'orders' && (
              <div className="space-y-3">
                {clientOrders.length === 0 ? (
                  <div className="py-12 text-center text-[#8EA3A5]">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-sm text-[#17383B]">No orders booked for this client yet</p>
                    <p className="text-xs text-[#688285]">Create a new job card from Orders & Production.</p>
                  </div>
                ) : (
                  <div className="border border-[#D9EAEB] rounded-2xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-[#F1FAFA] border-b border-[#D9EAEB] text-[#17383B] font-bold text-[10px] uppercase">
                          <th className="py-2.5 px-3">Job Card #</th>
                          <th className="py-2.5 px-3">Garment / Process</th>
                          <th className="py-2.5 px-3 text-center">Quantity</th>
                          <th className="py-2.5 px-3">Received / Due</th>
                          <th className="py-2.5 px-3 text-right">Total Bill</th>
                          <th className="py-2.5 px-3 text-right">Adv. Paid</th>
                          <th className="py-2.5 px-3 text-right">Due</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6F0F1]">
                        {clientOrders.map(order => (
                          <tr key={order.id} className="hover:bg-[#F9FBFC]">
                            <td className="py-2.5 px-3 font-mono font-bold text-[#0B9FA5]">
                              {order.orderNumber}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-[#17383B]">{order.styleNo || order.fabricQuality}</div>
                              <div className="text-[11px] text-[#688285]">{order.washType}</div>
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold">
                              {formatNumber(order.finishingYards || order.quantityPcs, language)} {order.finishingYards ? 'yds' : 'pcs'}
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-[#688285]">
                              <div>Rec: {order.receivedDate}</div>
                              <div className="text-[#17383B] font-bold">Due: {order.deliveryDate}</div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-[#17383B]">
                              {formatCurrency(order.totalAmount, language)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-[#229A73]">
                              {formatCurrency(order.advanceAmount, language)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-[#C47D1C]">
                              {formatCurrency(order.dueAmount, language)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F1FAFA] text-[#0B9FA5] border border-[#D9EAEB]">
                                {t(order.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CLIENT LEDGER */}
            {activeTab === 'ledger' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-[#17383B] uppercase tracking-wider">
                    {language === 'bn' ? 'চলতি লেজার খতিয়ান জের' : 'Running Ledger Balance'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => onPrintStatement(client)}
                    className="text-xs font-bold text-[#0B9FA5] hover:underline flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Ledger Statement</span>
                  </button>
                </div>

                <div className="border border-[#D9EAEB] rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#F1FAFA] border-b border-[#D9EAEB] text-[#17383B] font-bold text-[10px] uppercase">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Reference</th>
                        <th className="py-2.5 px-4">Description</th>
                        <th className="py-2.5 px-3 text-right">{t('debitCol')}</th>
                        <th className="py-2.5 px-3 text-right">{t('creditCol')}</th>
                        <th className="py-2.5 px-3 text-right">{t('runningBalanceCol')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6F0F1]">
                      {ledgerRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-[#8EA3A5]">
                            No ledger entries found.
                          </td>
                        </tr>
                      ) : (
                        ledgerRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-[#F9FBFC]">
                            <td className="py-2.5 px-3 text-[#688285] font-mono text-[11px]">{row.date}</td>
                            <td className="py-2.5 px-3 font-bold text-[#0B9FA5] font-mono">{row.reference}</td>
                            <td className="py-2.5 px-4 text-[#17383B]">{row.description}</td>
                            <td className="py-2.5 px-3 text-right font-medium text-[#17383B]">{formatCurrency(row.debit, language)}</td>
                            <td className="py-2.5 px-3 text-right font-medium text-[#229A73]">{formatCurrency(row.credit, language)}</td>
                            <td className="py-2.5 px-3 text-right font-extrabold text-[#17383B]">{formatCurrency(row.balance, language)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: PAYMENTS & CHEQUES */}
            {activeTab === 'payments' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-[#17383B] uppercase tracking-wider">
                    {language === 'bn' ? 'টাকা প্রাপ্তির রশিদ ও চেক খতিয়ান' : 'Payment Receipts & Cheques Received'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleOpenPayBill()}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold flex items-center gap-1 shadow-2xs"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>+ Receive Payment</span>
                  </button>
                </div>

                {/* Cash/Bank Payment History */}
                {clientTransactions.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-bold text-[#17383B] flex items-center justify-between">
                      <span>টাকা জমার লেনদেন সমূহ (Recorded Payment Receipts)</span>
                      <span className="text-[10px] text-[#688285]">মোট {clientTransactions.length} টি প্রাপ্তি</span>
                    </h5>
                    <div className="space-y-2">
                      {clientTransactions.map(tx => {
                        const isOldDue = (tx.category || '').toLowerCase().includes('old dues') || (tx.description || '').includes('পুরাতন');
                        const isBillPay = (tx.category || '').toLowerCase().includes('bill payment') || (tx.description || '').includes('বিল');
                        return (
                          <div key={tx.id} className="p-3 rounded-xl bg-[#F9FBFC] border border-[#E6F0F1] flex items-center justify-between text-xs">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                  isBillPay
                                    ? 'bg-teal-100 text-teal-900 border border-teal-300'
                                    : isOldDue 
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                }`}>
                                  {isBillPay ? '🧾 রানিং বিল জমা' : isOldDue ? '📜 পুরাতন হিসেবে জমা' : '📦 চলতি অর্ডারে জমা'}
                                </span>
                                <span className="font-mono text-[11px] text-[#688285]">{tx.date}</span>
                                {tx.referenceId && (
                                  <span className="font-mono text-[10px] text-[#0B9FA5] font-bold">Ref: {tx.referenceId}</span>
                                )}
                              </div>
                              <p className="text-[#17383B] font-medium text-[11px]">{tx.description}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-black text-[#229A73]">+{formatCurrency(tx.amount, language)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {clientCheques.length > 0 ? (
                  <div className="space-y-2 pt-2 border-t border-[#E6F0F1]">
                    <h5 className="text-[11px] font-bold text-[#688285]">Registered Cheques (চেক সমূহ)</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {clientCheques.map(chk => (
                        <div key={chk.id} className="p-3 rounded-xl bg-[#F9FBFC] border border-[#E6F0F1] space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="font-bold text-[#17383B]">Cheque #{chk.chequeNumber}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              chk.status === 'Cleared' ? 'bg-[#E5F8F1] text-[#229A73]' : 'bg-amber-50 text-[#C47D1C]'
                            }`}>
                              {chk.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#688285]">{chk.bankName} - Clearing: {chk.clearingDate}</p>
                          <div className="font-black text-[#0B9FA5] text-sm">{formatCurrency(chk.amount, language)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : clientTransactions.length === 0 ? (
                  <div className="py-8 text-center text-[#8EA3A5] border border-dashed border-[#D9EAEB] rounded-2xl">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-xs text-[#17383B]">No payment records yet</p>
                    <p className="text-[11px] text-[#688285]">Click "+ Receive Payment" above to collect money against bills or orders.</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Pay Bill Modal */}
          {isPayBillModalOpen && (
            <PayBillModal
              isOpen={isPayBillModalOpen}
              onClose={() => {
                setIsPayBillModalOpen(false);
                setBillIdToPay(undefined);
              }}
              preselectedClientId={client.id}
              preselectedBillId={billIdToPay}
            />
          )}

          {/* Print Bill Invoice Modal */}
          {printingBill && (
            <PrintBillInvoiceModal
              isOpen={Boolean(printingBill)}
              onClose={() => setPrintingBill(null)}
              bill={printingBill}
              client={client}
            />
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
