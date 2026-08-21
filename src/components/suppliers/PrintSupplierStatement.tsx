import React from 'react';
import { Supplier, Language } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { Printer, X, Building2, Calendar, Phone, MapPin, FlaskConical } from 'lucide-react';
import { motion } from 'motion/react';

interface PrintSupplierStatementProps {
  supplier: Supplier;
  language: Language;
  onClose: () => void;
}

export const PrintSupplierStatement: React.FC<PrintSupplierStatementProps> = ({
  supplier,
  language,
  onClose
}) => {
  const { expenses } = useERP();

  const supplierCompName = supplier.company || supplier.companyName || '';

  // Filter linked expenses
  const supplierExpenses = expenses.filter(e => 
    e.notes?.toLowerCase().includes(supplierCompName.toLowerCase()) ||
    e.category?.toLowerCase() === supplier.category?.toLowerCase()
  );

  // Generate synthetic ledger rows based on supplier purchases and paid history
  const ledgerRows = [
    {
      date: '2026-01-10',
      reference: `PO-SUP-${supplier.id.toUpperCase()}-01`,
      description: `Initial ${supplier.category} bulk consignment supply`,
      credit: supplier.totalPurchases || 0,
      debit: 0,
      balance: supplier.totalPurchases || 0
    },
    {
      date: '2026-02-01',
      reference: `PMT-${supplier.id.toUpperCase()}-88`,
      description: `Bank payment via Accounts clearance`,
      credit: 0,
      debit: supplier.totalPaid || 0,
      balance: supplier.balance || 0
    }
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center p-2 sm:p-6 print:p-0 print:bg-white print:static">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#D9EAEB] my-auto print:border-none print:shadow-none print:rounded-none"
      >
        {/* Screen Header (Hidden during print) */}
        <div className="px-6 py-4 bg-[#17383B] text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <Printer className="w-5 h-5 text-[#0B9FA5]" />
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">
                Vendor Ledger Statement
              </h3>
              <p className="text-xs text-[#8EA3A5]">{supplierCompName} ({supplier.category})</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#0B9FA5] hover:bg-[#078A90] text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Statement</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="p-8 sm:p-12 text-[#17383B] bg-white space-y-8 print:p-6" id="supplier-ledger-statement">
          {/* Factory Official Header */}
          <div className="border-b-2 border-[#17383B] pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0B9FA5] text-white flex items-center justify-center font-black text-xl shadow-md">
                MD
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-[#17383B] tracking-tight uppercase">
                  Mayer Doya
                </h1>
                <p className="text-xs font-extrabold text-[#0B9FA5] tracking-widest uppercase">
                  Washing & Dyeing Factory Ltd.
                </p>
                <p className="text-[11px] text-[#688285] leading-tight mt-0.5">
                  Plot 18/A, Block C, Tongi Industrial Zone, Gazipur, Bangladesh
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <div className="inline-block px-3 py-1 bg-[#F1FAFA] border border-[#D9EAEB] rounded-lg text-xs font-black text-[#17383B] uppercase">
                Vendor / Supplier Ledger
              </div>
              <p className="text-[11px] text-[#688285]">
                Statement Date: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-[10px] text-[#8EA3A5] font-mono">SUP-REF: {supplier.id.toUpperCase()}-{Date.now().toString().slice(-4)}</p>
            </div>
          </div>

          {/* Supplier Particulars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 rounded-2xl bg-[#F9FBFC] border border-[#E6F0F1]">
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8EA3A5]">Vendor Particulars</span>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-[#17383B]">{supplierCompName}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DDF4F3] text-[#0B9FA5]">
                  {supplier.category}
                </span>
              </div>
              <p className="text-xs text-[#688285]">Contact: <strong>{supplier.name}</strong></p>
              <p className="text-xs text-[#688285] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#8EA3A5]" />
                <span>{supplier.address || 'Dhaka, Bangladesh'}</span>
              </p>
              <p className="text-xs text-[#688285] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#8EA3A5]" />
                <span className="font-mono">{supplier.phone}</span>
              </p>
            </div>

            {/* Financial Summary */}
            <div className="space-y-2 sm:border-l sm:border-[#E6F0F1] sm:pl-6 flex flex-col justify-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8EA3A5]">Payable Summary</span>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-white border border-[#D9EAEB] text-center">
                  <span className="text-[9px] font-bold text-[#8EA3A5] uppercase block">Purchases</span>
                  <strong className="text-xs text-[#17383B]">{formatCurrency(supplier.totalPurchases, language)}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#D9EAEB] text-center">
                  <span className="text-[9px] font-bold text-[#8EA3A5] uppercase block">Paid</span>
                  <strong className="text-xs text-[#229A73]">{formatCurrency(supplier.totalPaid, language)}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <span className="text-[9px] font-bold text-rose-700 uppercase block">Payable Due</span>
                  <strong className="text-xs text-[#C83F57]">{formatCurrency(supplier.balance, language)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Statement Transaction Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-[#17383B] uppercase tracking-wider">
              Procurement & Payment Ledger
            </h4>
            <div className="border border-[#D9EAEB] rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F1FAFA] border-b border-[#D9EAEB] text-[#17383B] font-extrabold text-[10px] uppercase">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Voucher / PO #</th>
                    <th className="py-2.5 px-4">Supply Particulars</th>
                    <th className="py-2.5 px-3 text-right">Debit (Paid)</th>
                    <th className="py-2.5 px-3 text-right">Credit (Purchased)</th>
                    <th className="py-2.5 px-3 text-right">Payable Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6F0F1]">
                  {ledgerRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#F9FBFC]">
                      <td className="py-2.5 px-3 text-[#688285] font-mono text-[11px] whitespace-nowrap">{row.date}</td>
                      <td className="py-2.5 px-3 font-bold text-[#0B9FA5] font-mono text-[11px] whitespace-nowrap">{row.reference}</td>
                      <td className="py-2.5 px-4 text-[#17383B] font-medium">{row.description}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-[#229A73]">{formatCurrency(row.debit, language)}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-[#17383B]">{formatCurrency(row.credit, language)}</td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-[#C83F57]">{formatCurrency(row.balance, language)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#F1FAFA] border-t-2 border-[#D9EAEB] font-extrabold text-xs text-[#17383B]">
                    <td colSpan={3} className="py-3 px-4 uppercase text-right">Total Summary</td>
                    <td className="py-3 px-3 text-right text-[#229A73]">{formatCurrency(supplier.totalPaid, language)}</td>
                    <td className="py-3 px-3 text-right">{formatCurrency(supplier.totalPurchases, language)}</td>
                    <td className="py-3 px-3 text-right text-[#C83F57] text-sm font-black">{formatCurrency(supplier.balance, language)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Authorization & Signatures */}
          <div className="pt-12 grid grid-cols-3 gap-8 text-center text-xs">
            <div className="space-y-1">
              <div className="border-t border-[#17383B]/40 pt-2 font-bold text-[#17383B]">
                Store / Inventory Officer
              </div>
              <p className="text-[10px] text-[#8EA3A5]">Goods Received & Verified</p>
            </div>

            <div className="space-y-1">
              <div className="border-t border-[#17383B]/40 pt-2 font-bold text-[#17383B]">
                Accounts & Finance
              </div>
              <p className="text-[10px] text-[#8EA3A5]">Accounts Manager</p>
            </div>

            <div className="space-y-1">
              <div className="border-t border-[#17383B]/40 pt-2 font-bold text-[#17383B]">
                Factory Owner / MD Seal
              </div>
              <p className="text-[10px] text-[#8EA3A5]">Authorized Approval</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
