import React from 'react';
import { Client, Order, Language } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { Printer, X, Building2, Calendar, Phone, MapPin, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface PrintClientStatementProps {
  client: Client;
  orders: Order[];
  language: Language;
  onClose: () => void;
}

export const PrintClientStatement: React.FC<PrintClientStatementProps> = ({
  client,
  orders,
  language,
  onClose
}) => {
  const clientOrders = orders.filter(o => o.clientId === client.id);

  // Generate ledger items from orders
  let runningBal = 0;
  const ledgerRows = clientOrders.map((order) => {
    const debit = order.totalAmount || 0;
    const credit = order.advanceAmount || 0;
    runningBal += debit - credit;
    return {
      date: order.receivedDate || new Date().toISOString().split('T')[0],
      reference: order.orderNumber,
      description: `${order.garmentType} - ${order.washType} (${order.quantityPcs} pcs @ ৳${order.unitRate})`,
      debit,
      credit,
      balance: runningBal
    };
  });

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
        {/* Screen Header Controls (Hidden during print) */}
        <div className="px-6 py-4 bg-[#17383B] text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <Printer className="w-5 h-5 text-[#0B9FA5]" />
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">
                Customer Ledger Statement
              </h3>
              <p className="text-xs text-[#8EA3A5]">{client.companyName}</p>
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

        {/* Printable Document Paper */}
        <div className="p-8 sm:p-12 text-[#17383B] bg-white space-y-8 print:p-6" id="client-ledger-statement">
          {/* Factory Official Letterhead */}
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
                Customer Ledger Statement
              </div>
              <p className="text-[11px] text-[#688285]">
                Statement Date: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-[10px] text-[#8EA3A5] font-mono">DOC ID: STMT-{client.id.toUpperCase()}-{Date.now().toString().slice(-4)}</p>
            </div>
          </div>

          {/* Client & Account Particulars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 rounded-2xl bg-[#F9FBFC] border border-[#E6F0F1]">
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8EA3A5]">Customer Particulars</span>
              <h3 className="font-extrabold text-base text-[#17383B]">{client.companyName}</h3>
              <p className="text-xs text-[#688285]">Attn: <strong>{client.name}</strong></p>
              <p className="text-xs text-[#688285] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#8EA3A5]" />
                <span>{client.address || 'Dhaka, Bangladesh'}</span>
              </p>
              <p className="text-xs text-[#688285] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#8EA3A5]" />
                <span className="font-mono">{client.phone}</span>
              </p>
            </div>

            {/* Financial Status Box */}
            <div className="space-y-2 sm:border-l sm:border-[#E6F0F1] sm:pl-6 flex flex-col justify-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8EA3A5]">Statement Account Summary</span>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-white border border-[#D9EAEB] text-center">
                  <span className="text-[9px] font-bold text-[#8EA3A5] uppercase block">Total Billed</span>
                  <strong className="text-xs text-[#17383B]">{formatCurrency(client.totalBilled, language)}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#D9EAEB] text-center">
                  <span className="text-[9px] font-bold text-[#8EA3A5] uppercase block">Total Received</span>
                  <strong className="text-xs text-[#229A73]">{formatCurrency(client.totalPaid, language)}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <span className="text-[9px] font-bold text-amber-700 uppercase block">Balance Due</span>
                  <strong className="text-xs text-[#C47D1C]">{formatCurrency(client.balance, language)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Statement Transaction Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-[#17383B] uppercase tracking-wider">
              Transactions & Job Card Billings
            </h4>
            <div className="border border-[#D9EAEB] rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F1FAFA] border-b border-[#D9EAEB] text-[#17383B] font-extrabold text-[10px] uppercase">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Job / Ref #</th>
                    <th className="py-2.5 px-4">Processing Description</th>
                    <th className="py-2.5 px-3 text-right">Debit (Billed)</th>
                    <th className="py-2.5 px-3 text-right">Credit (Paid)</th>
                    <th className="py-2.5 px-3 text-right">Balance Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6F0F1]">
                  {ledgerRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-[#8EA3A5]">
                        No transactions or orders recorded for this client yet.
                      </td>
                    </tr>
                  ) : (
                    ledgerRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#F9FBFC]">
                        <td className="py-2.5 px-3 text-[#688285] font-mono text-[11px] whitespace-nowrap">{row.date}</td>
                        <td className="py-2.5 px-3 font-bold text-[#0B9FA5] font-mono text-[11px] whitespace-nowrap">{row.reference}</td>
                        <td className="py-2.5 px-4 text-[#17383B] font-medium">{row.description}</td>
                        <td className="py-2.5 px-3 text-right font-medium text-[#17383B]">{formatCurrency(row.debit, language)}</td>
                        <td className="py-2.5 px-3 text-right font-medium text-[#229A73]">{formatCurrency(row.credit, language)}</td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-[#17383B]">{formatCurrency(row.balance, language)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-[#F1FAFA] border-t-2 border-[#D9EAEB] font-extrabold text-xs text-[#17383B]">
                    <td colSpan={3} className="py-3 px-4 uppercase text-right">Total Summary</td>
                    <td className="py-3 px-3 text-right">{formatCurrency(client.totalBilled, language)}</td>
                    <td className="py-3 px-3 text-right text-[#229A73]">{formatCurrency(client.totalPaid, language)}</td>
                    <td className="py-3 px-3 text-right text-[#C47D1C] text-sm font-black">{formatCurrency(client.balance, language)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Authorization & Signatures */}
          <div className="pt-12 grid grid-cols-3 gap-8 text-center text-xs">
            <div className="space-y-1">
              <div className="border-t border-[#17383B]/40 pt-2 font-bold text-[#17383B]">
                Prepared By (Accounts Desk)
              </div>
              <p className="text-[10px] text-[#8EA3A5]">Mayer Doya Washing ERP</p>
            </div>

            <div className="space-y-1">
              <div className="border-t border-[#17383B]/40 pt-2 font-bold text-[#17383B]">
                Checked & Verified By
              </div>
              <p className="text-[10px] text-[#8EA3A5]">Accounts Manager</p>
            </div>

            <div className="space-y-1">
              <div className="border-t border-[#17383B]/40 pt-2 font-bold text-[#17383B]">
                Authorized Signature & Seal
              </div>
              <p className="text-[10px] text-[#8EA3A5]">Managing Director / Factory Owner</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
