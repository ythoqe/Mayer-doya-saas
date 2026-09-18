import React, { useState } from 'react';
import { Supplier } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { getCategoryLabel } from '../../utils/chemicalCategories';
import { 
  Building2, 
  User, 
  Phone, 
  MapPin, 
  DollarSign, 
  Printer, 
  Edit, 
  X, 
  FlaskConical, 
  FileText, 
  Layers, 
  CheckCircle2, 
  Package, 
  Clock, 
  Tag 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SupplierDetailsModalProps {
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
  onEditSupplier: (supplier: Supplier) => void;
  onPaySupplier: (supplier: Supplier) => void;
  onPrintStatement: (supplier: Supplier) => void;
}

export const SupplierDetailsModal: React.FC<SupplierDetailsModalProps> = ({
  supplier,
  isOpen,
  onClose,
  onEditSupplier,
  onPaySupplier,
  onPrintStatement
}) => {
  const { inventory, expenses, supplierPurchases, supplierPayments, language, t } = useERP();
  const [activeTab, setActiveTab] = useState<'items' | 'ledger' | 'vouchers'>('items');

  if (!isOpen || !supplier) return null;

  // Real supplier purchases and payments
  const thisSupplierPurchases = (supplierPurchases || []).filter(p => p.supplierId === supplier.id);
  const thisSupplierPayments = (supplierPayments || []).filter(p => p.supplierId === supplier.id);

  // Combine purchases & payments into a chronological ledger
  type LedgerEntry = {
    id: string;
    date: string;
    ref: string;
    type: 'purchase' | 'payment';
    description: string;
    debit: number; // Payment made to supplier
    credit: number; // Purchase from supplier
    paymentStatus?: string;
  };

  const combinedLedger: LedgerEntry[] = [
    ...thisSupplierPurchases.map(p => ({
      id: p.id,
      date: p.purchaseDate,
      ref: p.purchaseNumber || p.invoiceRef || 'PUR',
      type: 'purchase' as const,
      description: `Chemical Purchase: ${formatNumber(p.quantity, language)} ${p.unit || 'kg'} ${p.itemName} @ ৳${p.unitPrice}${p.notes ? ` (${p.notes})` : ''}`,
      debit: 0,
      credit: p.totalAmount,
      paymentStatus: p.paymentStatus
    })),
    ...thisSupplierPayments.map(p => ({
      id: p.id,
      date: p.paymentDate,
      ref: p.paymentNumber || p.reference || 'PMT',
      type: 'payment' as const,
      description: `Payment to Supplier: ৳${formatNumber(p.amount, language)} via ${p.accountName || 'Cash/Bank'}${p.notes ? ` (${p.notes})` : ''}`,
      debit: p.amount,
      credit: 0
    }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate running balance for each entry
  let runningBal = 0;
  const ledgerWithBalance = combinedLedger.map(entry => {
    runningBal += (entry.credit - entry.debit);
    return {
      ...entry,
      runningBalance: Math.max(0, runningBal)
    };
  });

  // Find linked chemicals/inventory items by supplierId or category
  const supplierCompName = supplier.company || supplier.companyName || '';
  const linkedInventory = inventory.filter(item => 
    item.supplierId === supplier.id ||
    (item.category && supplier.category && item.category.toLowerCase() === supplier.category.toLowerCase()) ||
    (supplierCompName && item.category && supplierCompName.toLowerCase().includes(item.category.toLowerCase()))
  );

  // Find linked expenses/vouchers
  const linkedExpenses = expenses.filter(e => 
    (supplierCompName && (e.notes || '').toLowerCase().includes(supplierCompName.toLowerCase())) ||
    (e.category && supplier.category && e.category.toLowerCase() === supplier.category.toLowerCase())
  );

  const getInitials = (name: string, company: string) => {
    const text = company || name || 'SP';
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
                {getInitials(supplier.name, supplierCompName)}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-[#17383B]">
                    {supplierCompName}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#DDF4F3] text-[#0B9FA5] border border-[#0B9FA5]/20">
                    {supplier.category}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                    supplier.status === 'active'
                      ? 'bg-[#E5F8F1] text-[#229A73] border border-[#38C99A]/30'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {t(supplier.status)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#688285] mt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#0B9FA5]" />
                    <strong>{supplier.name}</strong>
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-[#0B9FA5]" />
                    {supplier.phone}
                  </span>
                  {supplier.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#0B9FA5]" />
                      {supplier.address}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => onPaySupplier(supplier)}
                className="px-3.5 py-2 rounded-xl bg-[#0B9FA5] hover:bg-[#078A90] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>{t('paySupplierBtn')}</span>
              </button>

              <button
                type="button"
                onClick={() => onPrintStatement(supplier)}
                className="p-2 rounded-xl bg-white border border-[#D9EAEB] text-[#17383B] hover:bg-[#F1FAFA] transition-colors"
                title={t('printStatementBtn')}
              >
                <Printer className="w-4 h-4 text-[#0B9FA5]" />
              </button>

              <button
                type="button"
                onClick={() => onEditSupplier(supplier)}
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

          {/* 3 Financial Summary Cards */}
          <div className="p-6 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-white">
            <div className="p-4 rounded-2xl bg-[#F9FBFC] border border-[#E6F0F1] space-y-1">
              <span className="text-[10px] font-bold text-[#8EA3A5] uppercase tracking-wider block">
                Total Lifetime Purchases
              </span>
              <div className="text-xl font-black text-[#17383B]">
                {formatCurrency(supplier.totalPurchases, language)}
              </div>
              <p className="text-[11px] text-[#688285]">
                Dyes, chemicals & consumables
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#E5F8F1]/40 border border-[#38C99A]/20 space-y-1">
              <span className="text-[10px] font-bold text-[#229A73] uppercase tracking-wider block">
                Total Payments Cleared
              </span>
              <div className="text-xl font-black text-[#229A73]">
                {formatCurrency(supplier.totalPaid, language)}
              </div>
              <p className="text-[11px] text-[#229A73]/80">
                Bank vouchers & cleared funds
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/60 space-y-1">
              <span className="text-[10px] font-bold text-[#C83F57] uppercase tracking-wider block">
                Outstanding Payable Due
              </span>
              <div className="text-xl font-black text-[#C83F57]">
                {formatCurrency(supplier.balance, language)}
              </div>
              <p className="text-[11px] text-[#C83F57]/80">
                {supplier.balance > 0 ? 'Vendor invoice due for payment' : 'Zero balance / fully paid'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 border-b border-[#E6F0F1] flex items-center gap-6 bg-white">
            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className={`py-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'items'
                  ? 'border-[#0B9FA5] text-[#0B9FA5]'
                  : 'border-transparent text-[#688285] hover:text-[#17383B]'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>{t('suppliedItemsTab')} ({linkedInventory.length})</span>
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
              <span>{t('supplierLedgerTab')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vouchers')}
              className={`py-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'vouchers'
                  ? 'border-[#0B9FA5] text-[#0B9FA5]'
                  : 'border-transparent text-[#688285] hover:text-[#17383B]'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>{t('vouchersHistoryTab')} ({linkedExpenses.length})</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-white">
            {/* TAB 1: SUPPLIED ITEMS */}
            {activeTab === 'items' && (
              <div className="space-y-3">
                {linkedInventory.length === 0 ? (
                  <div className="py-10 text-center text-[#8EA3A5]">
                    <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-sm text-[#17383B]">No specific inventory items linked</p>
                    <p className="text-xs text-[#688285]">Supplies general items under {supplier.category}.</p>
                  </div>
                ) : (
                  <div className="border border-[#D9EAEB] rounded-2xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-[#F1FAFA] border-b border-[#D9EAEB] text-[#17383B] font-bold text-[10px] uppercase">
                          <th className="py-2.5 px-3">Chemical / Item Name</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3 text-center">Current Stock</th>
                          <th className="py-2.5 px-3 text-right">Unit Rate</th>
                          <th className="py-2.5 px-3">Storage Location</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6F0F1]">
                        {linkedInventory.map(item => (
                          <tr key={item.id} className="hover:bg-[#F9FBFC]">
                            <td className="py-2.5 px-3 font-extrabold text-[#17383B]">
                              {item.name}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DDF4F3] text-[#0B9FA5]">
                                {getCategoryLabel(item.category, language)}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold">
                              {formatNumber(item.currentStockKg, language)} {item.unit}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-[#17383B]">
                              {formatCurrency(item.unitPrice, language)} / {item.unit}
                            </td>
                            <td className="py-2.5 px-3 text-[#688285]">
                              {item.location || 'Chemical Rack'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: VENDOR LEDGER */}
            {activeTab === 'ledger' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-[#17383B] uppercase tracking-wider">
                    Vendor Running Balance & Transaction History
                  </h4>
                  <button
                    type="button"
                    onClick={() => onPrintStatement(supplier)}
                    className="text-xs font-bold text-[#0B9FA5] hover:underline flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Vendor Ledger</span>
                  </button>
                </div>

                {ledgerWithBalance.length > 0 ? (
                  <div className="border border-[#D9EAEB] rounded-2xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-[#F1FAFA] border-b border-[#D9EAEB] text-[#17383B] font-bold text-[10px] uppercase">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Ref / Invoice</th>
                          <th className="py-2.5 px-4">Description</th>
                          <th className="py-2.5 px-3 text-right">Debit (Payment -)</th>
                          <th className="py-2.5 px-3 text-right">Credit (Purchase +)</th>
                          <th className="py-2.5 px-3 text-right">Payable Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6F0F1]">
                        {ledgerWithBalance.map((row) => (
                          <tr key={row.id} className="hover:bg-[#F9FBFC]">
                            <td className="py-2.5 px-3 text-[#688285] font-mono text-[11px]">{row.date}</td>
                            <td className="py-2.5 px-3 font-bold text-[#0B9FA5] font-mono">{row.ref}</td>
                            <td className="py-2.5 px-4 text-[#17383B]">
                              <span>{row.description}</span>
                              {row.paymentStatus && (
                                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                  row.paymentStatus === 'Paid' ? 'bg-[#EBF7EE] text-[#2E7D32]' : row.paymentStatus === 'Due' ? 'bg-[#FDF2F4] text-[#EA7185]' : 'bg-[#FFF9EB] text-[#D97706]'
                                }`}>
                                  {row.paymentStatus}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-[#229A73]">
                              {row.debit > 0 ? formatCurrency(row.debit, language) : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-[#17383B]">
                              {row.credit > 0 ? formatCurrency(row.credit, language) : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-extrabold text-[#C83F57]">
                              {formatCurrency(row.runningBalance, language)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border border-[#D9EAEB] rounded-2xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-[#F1FAFA] border-b border-[#D9EAEB] text-[#17383B] font-bold text-[10px] uppercase">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">PO / Ref</th>
                          <th className="py-2.5 px-4">Supply Description</th>
                          <th className="py-2.5 px-3 text-right">{t('debitCol')} (Paid)</th>
                          <th className="py-2.5 px-3 text-right">{t('creditCol')} (Purchased)</th>
                          <th className="py-2.5 px-3 text-right">Payable Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6F0F1]">
                        <tr className="hover:bg-[#F9FBFC]">
                          <td className="py-2.5 px-3 text-[#688285] font-mono text-[11px]">{new Date().toISOString().split('T')[0]}</td>
                          <td className="py-2.5 px-3 font-bold text-[#0B9FA5] font-mono">INIT-{supplier.id.substring(0, 4).toUpperCase()}</td>
                          <td className="py-2.5 px-4 text-[#17383B]">Initial purchase balance</td>
                          <td className="py-2.5 px-3 text-right font-medium text-[#229A73]">৳ 0</td>
                          <td className="py-2.5 px-3 text-right font-medium text-[#17383B]">{formatCurrency(supplier.totalPurchases, language)}</td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-[#C83F57]">{formatCurrency(supplier.totalPurchases, language)}</td>
                        </tr>
                        {supplier.totalPaid > 0 && (
                          <tr className="hover:bg-[#F9FBFC]">
                            <td className="py-2.5 px-3 text-[#688285] font-mono text-[11px]">{new Date().toISOString().split('T')[0]}</td>
                            <td className="py-2.5 px-3 font-bold text-[#0B9FA5] font-mono">PMT-{supplier.id.substring(0, 4).toUpperCase()}</td>
                            <td className="py-2.5 px-4 text-[#17383B]">Payment clearance</td>
                            <td className="py-2.5 px-3 text-right font-medium text-[#229A73]">{formatCurrency(supplier.totalPaid, language)}</td>
                            <td className="py-2.5 px-3 text-right font-medium text-[#17383B]">৳ 0</td>
                            <td className="py-2.5 px-3 text-right font-extrabold text-[#C83F57]">{formatCurrency(supplier.balance, language)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: VOUCHERS & EXPENSES */}
            {activeTab === 'vouchers' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-[#17383B] uppercase tracking-wider">
                    Purchase Vouchers & Settle Logs
                  </h4>
                  <button
                    type="button"
                    onClick={() => onPaySupplier(supplier)}
                    className="px-3 py-1.5 rounded-xl bg-[#0B9FA5] text-white text-xs font-bold flex items-center gap-1 shadow-2xs"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>+ Make Payment</span>
                  </button>
                </div>

                {linkedExpenses.length > 0 ? (
                  <div className="border border-[#D9EAEB] rounded-2xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-[#F1FAFA] border-b border-[#D9EAEB] text-[#17383B] font-bold text-[10px] uppercase">
                          <th className="py-2.5 px-3">Voucher #</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-4">Notes / Remarks</th>
                          <th className="py-2.5 px-3">Paid From Account</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6F0F1]">
                        {linkedExpenses.map(exp => (
                          <tr key={exp.id} className="hover:bg-[#F9FBFC]">
                            <td className="py-2.5 px-3 font-mono font-bold text-[#0B9FA5]">
                              {exp.voucherNo}
                            </td>
                            <td className="py-2.5 px-3 text-[#688285] font-mono text-[11px]">
                              {exp.date}
                            </td>
                            <td className="py-2.5 px-4 text-[#17383B]">
                              {exp.notes}
                            </td>
                            <td className="py-2.5 px-3 text-[#688285]">
                              {exp.accountName}
                            </td>
                            <td className="py-2.5 px-3 text-right font-extrabold text-[#229A73]">
                              {formatCurrency(exp.amount, language)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-[#8EA3A5] border border-dashed border-[#D9EAEB] rounded-2xl">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-xs text-[#17383B]">No past vouchers linked directly</p>
                    <p className="text-[11px] text-[#688285]">Click Make Payment above to record an expense voucher for this vendor.</p>
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
