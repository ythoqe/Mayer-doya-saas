import React, { useState } from 'react';
import { Client, Order } from '../../types';
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
  DollarSign 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  const { language, t, cheques } = useERP();
  const [activeTab, setActiveTab] = useState<'orders' | 'ledger' | 'payments'>('orders');

  if (!isOpen || !client) return null;

  const clientOrders = orders.filter(o => o.clientId === client.id);
  const clientCheques = cheques.filter(c => c.partyName?.toLowerCase() === client.companyName?.toLowerCase() || c.partyName?.toLowerCase() === client.name?.toLowerCase());

  // Generate ledger rows
  let runningBal = 0;
  const ledgerRows = clientOrders.map((order) => {
    const debit = order.totalAmount || 0;
    const credit = order.advanceAmount || 0;
    runningBal += debit - credit;
    return {
      date: order.receivedDate || new Date().toISOString().split('T')[0],
      reference: order.orderNumber,
      description: `${order.garmentType} - ${order.washType} (${order.quantityPcs} pcs)`,
      debit,
      credit,
      balance: runningBal
    };
  });

  const getInitials = (name: string, company: string) => {
    const text = company || name || 'MD';
    return text.substring(0, 2).toUpperCase();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#17383B]/40 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 12 }}
          className="w-full max-w-4xl bg-white rounded-3xl border border-[#D9EAEB] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
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
                onClick={() => onRecordPayment(client)}
                className="px-3.5 py-2 rounded-xl bg-[#0B9FA5] hover:bg-[#078A90] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{t('recordClientPayment')}</span>
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
                Total Lifetime Billed
              </span>
              <div className="text-xl font-black text-[#17383B]">
                {formatCurrency(client.totalBilled, language)}
              </div>
              <p className="text-[11px] text-[#688285]">
                {formatNumber(clientOrders.length, language)} Job Cards Invoiced
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#E5F8F1]/40 border border-[#38C99A]/20 space-y-1">
              <span className="text-[10px] font-bold text-[#229A73] uppercase tracking-wider block">
                Total Payments Received
              </span>
              <div className="text-xl font-black text-[#229A73]">
                {formatCurrency(client.totalPaid, language)}
              </div>
              <p className="text-[11px] text-[#229A73]/80">
                Advances & Bank Receipts
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-1">
              <span className="text-[10px] font-bold text-[#C47D1C] uppercase tracking-wider block">
                Outstanding Receivable
              </span>
              <div className="text-xl font-black text-[#C47D1C]">
                {formatCurrency(client.balance, language)}
              </div>
              <p className="text-[11px] text-[#C47D1C]/80">
                {client.balance > 0 ? 'Pending Collection' : 'Account fully settled'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 border-b border-[#E6F0F1] flex items-center gap-6 bg-white">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`py-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 ${
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
              className={`py-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 ${
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
              className={`py-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'payments'
                  ? 'border-[#0B9FA5] text-[#0B9FA5]'
                  : 'border-transparent text-[#688285] hover:text-[#17383B]'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>{t('paymentHistoryTab')}</span>
            </button>
          </div>

          {/* Tab Content Workspace */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-white">
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
                              <div className="font-bold text-[#17383B]">{order.styleNo}</div>
                              <div className="text-[11px] text-[#688285]">{order.washType}</div>
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold">
                              {formatNumber(order.quantityPcs, language)} pcs
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
                    Running Ledger Balance
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
                    Payment Receipts & Cheques Received
                  </h4>
                  <button
                    type="button"
                    onClick={() => onRecordPayment(client)}
                    className="px-3 py-1.5 rounded-xl bg-[#0B9FA5] text-white text-xs font-bold flex items-center gap-1 shadow-2xs"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>+ Receive Payment</span>
                  </button>
                </div>

                {clientCheques.length > 0 ? (
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-bold text-[#688285]">Registered Cheques</h5>
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
                ) : (
                  <div className="py-8 text-center text-[#8EA3A5] border border-dashed border-[#D9EAEB] rounded-2xl">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-xs text-[#17383B]">No pending cheques</p>
                    <p className="text-[11px] text-[#688285]">All advance payments were received in Cash / Bank transfer.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
