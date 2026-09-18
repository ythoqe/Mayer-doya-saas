import React, { useState } from 'react';
import { 
  Printer, 
  X, 
  FileText, 
  Check, 
  Download, 
  Calendar, 
  Building2,
  Layers,
  Users,
  Truck,
  Boxes,
  Landmark,
  Receipt,
  UserCheck
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { DateRange, PrintDocumentType } from './types';
import { isDateInRange } from './dateUtils';

interface PrintCenterProps {
  isOpen: boolean;
  onClose: () => void;
  dateRange: DateRange;
  initialDocType?: PrintDocumentType;
}

export const PrintCenter: React.FC<PrintCenterProps> = ({
  isOpen,
  onClose,
  dateRange,
  initialDocType = 'executive_pnl'
}) => {
  const { 
    orders, 
    clients, 
    suppliers, 
    inventory, 
    expenses, 
    accounts, 
    transactions, 
    employees, 
    currentUser, 
    language, 
    t 
  } = useERP();

  const [selectedDoc, setSelectedDoc] = useState<PrintDocumentType>(initialDocType);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Filtered data for printing
  const filteredOrders = orders.filter(o => isDateInRange(o.receivedDate || o.createdAt, dateRange));
  const filteredExpenses = expenses.filter(e => isDateInRange(e.date || e.createdAt, dateRange));
  const filteredTransactions = transactions.filter(tr => isDateInRange(tr.date || tr.createdAt, dateRange));

  // Calculations
  const totalOrderBilling = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalAdvanceReceived = filteredOrders.reduce((sum, o) => sum + (o.advanceAmount || 0), 0);
  const totalOrderDues = filteredOrders.reduce((sum, o) => sum + (o.dueAmount || 0), 0);
  const totalVolumePcs = filteredOrders.reduce((sum, o) => sum + (o.quantityPcs || 0), 0);
  const totalOperatingExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalClientReceivables = clients.reduce((sum, c) => sum + (c.balance || 0), 0);
  const totalSupplierPayables = suppliers.reduce((sum, s) => sum + (s.balance || 0), 0);
  const totalInventoryValuation = inventory.reduce((sum, i) => sum + (i.currentStockKg * i.unitPrice), 0);
  const totalLiquidCash = accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  const totalMonthlyPayroll = employees.reduce((sum, e) => sum + (e.salary || 0), 0);

  const docOptions: { id: PrintDocumentType; title: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'executive_pnl', title: language === 'bn' ? 'এক্সিকিউটিভ P&L ও আর্থিক স্টেটমেন্ট' : 'Executive Factory P&L Statement', icon: Landmark },
    { id: 'production_sheet', title: language === 'bn' ? 'প্রোডাকশন ও ফ্লোর আউটপুট শিট' : 'Production Floor Output Sheet', icon: Layers },
    { id: 'client_receivables', title: language === 'bn' ? 'ক্লায়েন্ট বকেয়া পাওনা বিবরণী' : 'Client Receivables & Ledger Summary', icon: Users },
    { id: 'supplier_payables', title: language === 'bn' ? 'মহাজন দেনা ও বিল বিবরণী' : 'Vendor Payables & Purchase Statement', icon: Truck },
    { id: 'inventory_valuation', title: language === 'bn' ? 'কেমিক্যাল ও ডাইস স্টক মূল্যায়ন শিট' : 'Chemical Inventory Valuation Sheet', icon: Boxes },
    { id: 'expense_audit', title: language === 'bn' ? 'ফ্যাক্টরি পরিচালন ব্যয় অডিট শিট' : 'Factory Operational Expense Audit', icon: Receipt },
    { id: 'salary_sheet', title: language === 'bn' ? 'কর্মচারী মাসিক বেতন শিট' : 'Monthly Workforce Salary Sheet', icon: UserCheck },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full">
        {/* Modal Top Bar (Hidden during print) */}
        <div className="p-4 px-6 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {t('printA4ModalTitle')}
              </h2>
              <p className="text-xs text-slate-400">
                {t('printA4ModalSubtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="trigger-print-btn"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'bn' ? 'প্রিন্ট করুন (A4)' : 'Print Document (A4)'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Format Selector (Hidden during print) */}
        <div className="p-3 px-6 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto print:hidden scrollbar-none no-scrollbar">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap mr-1">
            {language === 'bn' ? 'ফরম্যাট:' : 'Document:'}
          </span>
          {docOptions.map(opt => {
            const Icon = opt.icon;
            const isSelected = selectedDoc === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedDoc(opt.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected 
                    ? 'bg-teal-600 text-white shadow-xs' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{opt.title}</span>
              </button>
            );
          })}
        </div>

        {/* Printable Document Body (A4 High Contrast Layout) */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-12 print:p-4 print:overflow-visible bg-white font-sans text-slate-900">
          {/* Official Factory Header */}
          <div className="border-b-2 border-slate-900 pb-5 mb-6 text-center">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                ERP Document Ref: MD-DOC-{Date.now().toString().slice(-6)}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">
              {language === 'bn' ? 'মায়ের দোয়া ওয়াশিং ও ডাইং ফ্যাক্টরি' : 'MAYER DOYA WASHING & DYEING FACTORY'}
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-1">
              Plot 42, BSCIC Industrial Area, Narayanganj, Dhaka, Bangladesh | Phone: +880 1711-234567
            </p>
            <div className="inline-block mt-3 px-4 py-1 rounded-full bg-slate-100 border border-slate-300 text-xs font-bold uppercase tracking-wider text-slate-800">
              {docOptions.find(d => d.id === selectedDoc)?.title}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {language === 'bn' ? 'রিপোর্ট সময়কাল:' : 'Report Period:'} <strong>{dateRange.startDate}</strong> {language === 'bn' ? 'হতে' : 'to'} <strong>{dateRange.endDate}</strong>
            </div>
          </div>

          {/* 1. Executive P&L Statement */}
          {selectedDoc === 'executive_pnl' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    {language === 'bn' ? 'বাণিজ্যিক ও বিলিং সারসংক্ষেপ' : 'Commercial & Billing Summary'}
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">{language === 'bn' ? 'মোট অর্ডার বিলিং:' : 'Total Order Billing:'}</span>
                      <strong className="font-mono">{formatCurrency(totalOrderBilling, language)}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">{language === 'bn' ? 'আদায়কৃত অগ্রিম:' : 'Advance Collected:'}</span>
                      <strong className="font-mono text-emerald-700">{formatCurrency(totalAdvanceReceived, language)}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">{language === 'bn' ? 'অর্ডার বকেয়া:' : 'Order Balance Due:'}</span>
                      <strong className="font-mono text-amber-700">{formatCurrency(totalOrderDues, language)}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-600">{language === 'bn' ? 'মোট প্রক্রিয়াজাত পোশাক:' : 'Total Garments Output:'}</span>
                      <strong className="font-mono">{formatNumber(totalVolumePcs, language)} Pcs</strong>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    {language === 'bn' ? 'পরিচালন ব্যয় ও তহবিল' : 'Operational Expenses & Balances'}
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">{language === 'bn' ? 'মোট ফ্যাক্টরি খরচ:' : 'Total Factory Expenses:'}</span>
                      <strong className="font-mono text-rose-700">{formatCurrency(totalOperatingExpenses, language)}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">{language === 'bn' ? 'ক্লায়েন্ট মোট বকেয়া:' : 'Client Receivables:'}</span>
                      <strong className="font-mono text-amber-700">{formatCurrency(totalClientReceivables, language)}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">{language === 'bn' ? 'মহাজন মোট দেনা:' : 'Vendor Payables:'}</span>
                      <strong className="font-mono text-purple-700">{formatCurrency(totalSupplierPayables, language)}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-600">{language === 'bn' ? 'বর্তমান ক্যাশ ও ব্যাংক তহবিল:' : 'Liquid Cash & Bank Funds:'}</span>
                      <strong className="font-mono text-teal-700">{formatCurrency(totalLiquidCash, language)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Position Banner */}
              <div className="p-4 rounded-xl border-2 border-slate-900 bg-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {language === 'bn' ? 'আনুমানিক ফ্যাক্টরি নেট মার্জিন' : 'Estimated Net Factory Operating Margin'}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Total Billed Revenue - Total Operating Expenses
                  </p>
                </div>
                <div className="text-xl font-black font-mono text-slate-950">
                  {formatCurrency(totalOrderBilling - totalOperatingExpenses, language)}
                </div>
              </div>
            </div>
          )}

          {/* 2. Production Sheet */}
          {selectedDoc === 'production_sheet' && (
            <div className="space-y-4">
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300 uppercase text-[11px]">
                  <tr>
                    <th className="p-2 border-r border-slate-300">Job Card #</th>
                    <th className="p-2 border-r border-slate-300">Client / Mill</th>
                    <th className="p-2 border-r border-slate-300">Style & Garment</th>
                    <th className="p-2 border-r border-slate-300">Wash Recipe</th>
                    <th className="p-2 border-r border-slate-300 text-right">Qty (Pcs)</th>
                    <th className="p-2 border-r border-slate-300">Machine/Batch</th>
                    <th className="p-2">Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredOrders.map(o => (
                    <tr key={o.id} className="font-mono">
                      <td className="p-2 border-r border-slate-300 font-bold">{o.orderNumber}</td>
                      <td className="p-2 border-r border-slate-300 font-sans">{o.clientName}</td>
                      <td className="p-2 border-r border-slate-300 font-sans">{o.styleNo} ({o.garmentType})</td>
                      <td className="p-2 border-r border-slate-300 font-sans">{o.washType}</td>
                      <td className="p-2 border-r border-slate-300 text-right font-bold">{formatNumber(o.quantityPcs, language)}</td>
                      <td className="p-2 border-r border-slate-300">{o.machineNo || 'N/A'}</td>
                      <td className="p-2 uppercase font-sans text-[10px] font-bold">{o.status}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold font-sans">
                    <td colSpan={4} className="p-2 border-r border-slate-300 text-right uppercase">Total Processed:</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono">{formatNumber(totalVolumePcs, language)} Pcs</td>
                    <td colSpan={2} className="p-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 3. Client Receivables */}
          {selectedDoc === 'client_receivables' && (
            <div className="space-y-4">
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300 uppercase text-[11px]">
                  <tr>
                    <th className="p-2 border-r border-slate-300">Company & Mill</th>
                    <th className="p-2 border-r border-slate-300">Contact / Phone</th>
                    <th className="p-2 border-r border-slate-300 text-right">Total Billed</th>
                    <th className="p-2 border-r border-slate-300 text-right">Total Paid</th>
                    <th className="p-2 border-r border-slate-300 text-right">Balance Due</th>
                    <th className="p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {clients.map(c => (
                    <tr key={c.id}>
                      <td className="p-2 border-r border-slate-300 font-bold">{c.companyName}</td>
                      <td className="p-2 border-r border-slate-300 text-slate-600">{c.name} ({c.phone})</td>
                      <td className="p-2 border-r border-slate-300 text-right font-mono">{formatCurrency(c.totalBilled, language)}</td>
                      <td className="p-2 border-r border-slate-300 text-right font-mono text-emerald-700">{formatCurrency(c.totalPaid, language)}</td>
                      <td className="p-2 border-r border-slate-300 text-right font-mono font-bold text-amber-800">{formatCurrency(c.balance, language)}</td>
                      <td className="p-2 text-center uppercase text-[10px] font-bold">{c.status}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={2} className="p-2 border-r border-slate-300 text-right uppercase">Grand Total Receivables:</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono">{formatCurrency(clients.reduce((s, c) => s + c.totalBilled, 0), language)}</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono">{formatCurrency(clients.reduce((s, c) => s + c.totalPaid, 0), language)}</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono text-amber-800">{formatCurrency(totalClientReceivables, language)}</td>
                    <td className="p-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 4. Supplier Payables */}
          {selectedDoc === 'supplier_payables' && (
            <div className="space-y-4">
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300 uppercase text-[11px]">
                  <tr>
                    <th className="p-2 border-r border-slate-300">Vendor / Company</th>
                    <th className="p-2 border-r border-slate-300">Category</th>
                    <th className="p-2 border-r border-slate-300">Phone</th>
                    <th className="p-2 border-r border-slate-300 text-right">Purchases</th>
                    <th className="p-2 border-r border-slate-300 text-right">Paid</th>
                    <th className="p-2 text-right">Payable Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {suppliers.map(s => (
                    <tr key={s.id}>
                      <td className="p-2 border-r border-slate-300 font-bold">{s.company || s.companyName || s.name}</td>
                      <td className="p-2 border-r border-slate-300">{s.category}</td>
                      <td className="p-2 border-r border-slate-300 font-mono text-slate-600">{s.phone}</td>
                      <td className="p-2 border-r border-slate-300 text-right font-mono">{formatCurrency(s.totalPurchases, language)}</td>
                      <td className="p-2 border-r border-slate-300 text-right font-mono text-emerald-700">{formatCurrency(s.totalPaid, language)}</td>
                      <td className="p-2 text-right font-mono font-bold text-purple-800">{formatCurrency(s.balance, language)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={3} className="p-2 border-r border-slate-300 text-right uppercase">Grand Total Liabilities:</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono">{formatCurrency(suppliers.reduce((sum, s) => sum + s.totalPurchases, 0), language)}</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono">{formatCurrency(suppliers.reduce((sum, s) => sum + s.totalPaid, 0), language)}</td>
                    <td className="p-2 text-right font-mono text-purple-800">{formatCurrency(totalSupplierPayables, language)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 5. Inventory Valuation */}
          {selectedDoc === 'inventory_valuation' && (
            <div className="space-y-4">
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300 uppercase text-[11px]">
                  <tr>
                    <th className="p-2 border-r border-slate-300">Chemical / Dye Name</th>
                    <th className="p-2 border-r border-slate-300">Category</th>
                    <th className="p-2 border-r border-slate-300 text-right">Current Stock</th>
                    <th className="p-2 border-r border-slate-300 text-right">Unit Rate</th>
                    <th className="p-2 border-r border-slate-300 text-right">Total Valuation</th>
                    <th className="p-2 text-center">Alert Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {inventory.map(i => {
                    const minLimit = i.minAlertLevel || 0;
                    const unitPrice = i.unitPrice || 0;
                    const isLow = i.currentStockKg <= minLimit;
                    const val = i.currentStockKg * unitPrice;
                    return (
                      <tr key={i.id}>
                        <td className="p-2 border-r border-slate-300 font-bold">{i.name}</td>
                        <td className="p-2 border-r border-slate-300">{i.category}</td>
                        <td className="p-2 border-r border-slate-300 text-right font-mono font-bold">{i.currentStockKg} {i.unit || 'kg'}</td>
                        <td className="p-2 border-r border-slate-300 text-right font-mono">৳{unitPrice}</td>
                        <td className="p-2 border-r border-slate-300 text-right font-mono font-bold">{formatCurrency(val, language)}</td>
                        <td className="p-2 text-center uppercase text-[10px] font-bold">
                          {isLow ? 'Low Stock Warning' : 'Safe Stock'}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={4} className="p-2 border-r border-slate-300 text-right uppercase">Total Chemical Store Valuation:</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono text-teal-800">{formatCurrency(totalInventoryValuation, language)}</td>
                    <td className="p-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 6. Expense Audit */}
          {selectedDoc === 'expense_audit' && (
            <div className="space-y-4">
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300 uppercase text-[11px]">
                  <tr>
                    <th className="p-2 border-r border-slate-300">Voucher #</th>
                    <th className="p-2 border-r border-slate-300">Date</th>
                    <th className="p-2 border-r border-slate-300">Category</th>
                    <th className="p-2 border-r border-slate-300">Paid By / Acc</th>
                    <th className="p-2 border-r border-slate-300">Notes</th>
                    <th className="p-2 text-right">Amount (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredExpenses.map(e => (
                    <tr key={e.id} className="font-mono">
                      <td className="p-2 border-r border-slate-300 font-bold">{e.voucherNo}</td>
                      <td className="p-2 border-r border-slate-300">{e.date}</td>
                      <td className="p-2 border-r border-slate-300 font-sans">{e.category}</td>
                      <td className="p-2 border-r border-slate-300 font-sans">{e.paidBy || 'Cash'}</td>
                      <td className="p-2 border-r border-slate-300 font-sans">{e.notes || '-'}</td>
                      <td className="p-2 text-right font-bold">{formatCurrency(e.amount, language)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold font-sans">
                    <td colSpan={5} className="p-2 border-r border-slate-300 text-right uppercase">Total Operating Expenses:</td>
                    <td className="p-2 text-right font-mono text-rose-800">{formatCurrency(totalOperatingExpenses, language)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 7. Salary Sheet */}
          {selectedDoc === 'salary_sheet' && (
            <div className="space-y-4">
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300 uppercase text-[11px]">
                  <tr>
                    <th className="p-2 border-r border-slate-300">Employee Name</th>
                    <th className="p-2 border-r border-slate-300">Designation</th>
                    <th className="p-2 border-r border-slate-300">Department</th>
                    <th className="p-2 border-r border-slate-300 text-center">Shift</th>
                    <th className="p-2 border-r border-slate-300 text-right">Monthly Salary</th>
                    <th className="p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {employees.map(emp => (
                    <tr key={emp.id}>
                      <td className="p-2 border-r border-slate-300 font-bold">{emp.name}</td>
                      <td className="p-2 border-r border-slate-300">{emp.designation}</td>
                      <td className="p-2 border-r border-slate-300">{emp.department}</td>
                      <td className="p-2 border-r border-slate-300 text-center capitalize">{emp.shift}</td>
                      <td className="p-2 border-r border-slate-300 text-right font-mono font-bold">{formatCurrency(emp.salary, language)}</td>
                      <td className="p-2 text-center uppercase text-[10px] font-bold">{emp.status}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={4} className="p-2 border-r border-slate-300 text-right uppercase">Total Monthly Payroll:</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono text-teal-800">{formatCurrency(totalMonthlyPayroll, language)}</td>
                    <td className="p-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Official Signatures Block */}
          <div className="mt-14 pt-8 border-t border-slate-300 grid grid-cols-4 gap-6 text-center text-xs">
            <div>
              <div className="border-t border-slate-700 w-3/4 mx-auto mb-1"></div>
              <span className="font-semibold text-slate-800">{t('docPreparedBy')}</span>
              <p className="text-[10px] text-slate-500 mt-0.5">{currentUser?.name || 'Floor Officer'}</p>
            </div>
            <div>
              <div className="border-t border-slate-700 w-3/4 mx-auto mb-1"></div>
              <span className="font-semibold text-slate-800">{t('docCheckedBy')}</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Production Master</p>
            </div>
            <div>
              <div className="border-t border-slate-700 w-3/4 mx-auto mb-1"></div>
              <span className="font-semibold text-slate-800">{t('docAccountsOfficer')}</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Chief Accountant</p>
            </div>
            <div>
              <div className="border-t border-slate-700 w-3/4 mx-auto mb-1"></div>
              <span className="font-semibold text-slate-800">{t('docManagingDirector')}</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Mayer Doya Group</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
