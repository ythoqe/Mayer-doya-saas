import React from 'react';
import { Account, Transaction } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency } from '../../utils/translation';
import { Printer, X, Landmark, FileText } from 'lucide-react';
import { MayerLogo } from '../ui/MayerLogo';

interface PrintAccountStatementProps {
  account: Account;
  transactions: Transaction[];
  onClose: () => void;
}

export const PrintAccountStatement: React.FC<PrintAccountStatementProps> = ({
  account,
  transactions,
  onClose
}) => {
  const { language } = useERP();

  const handlePrint = () => {
    window.print();
  };

  const accountTxs = transactions.filter(t => t.accountId === account.id || t.toAccountId === account.id);
  const totalInflow = accountTxs.filter(t => t.type === 'credit' || (t.type === 'transfer' && t.toAccountId === account.id)).reduce((s, t) => s + t.amount, 0);
  const totalOutflow = accountTxs.filter(t => t.type === 'debit' || (t.type === 'transfer' && t.accountId === account.id)).reduce((s, t) => s + t.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17383B]/50 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-[#D9EAEB] overflow-hidden my-6 print:border-none print:shadow-none print:m-0 print:max-w-full">
        {/* Modal Controls (Hidden in Print) */}
        <div className="p-4 bg-[#F1FAFA] border-b border-[#D9EAEB] flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0B9FA5]" />
            <span className="text-xs font-bold text-[#17383B]">{language === 'bn' ? 'একাউন্ট স্টেটমেন্ট প্রিন্ট প্রিভিউ' : 'Account Statement Print Preview'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-[#0B9FA5] hover:bg-[#078A90] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'প্রিন্ট করুন' : 'Print Statement'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white text-[#8EA3A5] hover:text-[#17383B]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div className="p-8 space-y-6 text-[#17383B]">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-[#17383B] pb-5">
            <div className="flex items-center gap-3">
              <MayerLogo size={44} />
              <div>
                <h1 className="text-xl font-black tracking-tight text-[#17383B]">
                  MAYER DOYA WASHING & DYEING LTD.
                </h1>
                <p className="text-xs font-semibold text-[#688285]">
                  Plot 14-16, BSCIC Industrial Estate, Konabari, Gazipur, Bangladesh
                </p>
                <p className="text-[11px] text-[#8EA3A5]">
                  Phone: +880 1711-000000 | Email: accounts@mayerdoya-washing.com
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="px-3 py-1 bg-[#F1FAFA] border border-[#D9EAEB] rounded-lg text-xs font-black text-[#0B9FA5] uppercase">
                Official Account Statement
              </div>
              <div className="text-[11px] text-[#8EA3A5] font-semibold mt-1">
                Generated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Account Profile Card */}
          <div className="p-4 rounded-xl bg-[#F8FAFB] border border-[#E6F0F1] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-extrabold text-[#8EA3A5] block">Account Name</span>
              <span className="font-extrabold text-sm text-[#17383B]">{account.accountName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-extrabold text-[#8EA3A5] block">Type & Bank</span>
              <span className="font-bold text-[#17383B]">{account.accountType} {account.bankName ? `• ${account.bankName}` : ''}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-extrabold text-[#8EA3A5] block">Account Number</span>
              <span className="font-mono font-bold text-[#17383B]">{account.accountNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-extrabold text-[#8EA3A5] block">Current Balance</span>
              <span className="font-black text-sm text-[#0B9FA5]">{formatCurrency(account.currentBalance, language)}</span>
            </div>
          </div>

          {/* Statement Ledger Table */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#688285] mb-2">
              Transaction History
            </h3>
            <table className="w-full text-left text-xs border-collapse border border-[#E6F0F1]">
              <thead>
                <tr className="bg-[#F1FAFA] border-b border-[#E6F0F1] text-[#688285] font-extrabold uppercase text-[10px]">
                  <th className="py-2.5 px-3 border-r border-[#E6F0F1]">Date</th>
                  <th className="py-2.5 px-3 border-r border-[#E6F0F1]">Ref / Voucher</th>
                  <th className="py-2.5 px-3 border-r border-[#E6F0F1]">Category & Description</th>
                  <th className="py-2.5 px-3 border-r border-[#E6F0F1] text-right">Inflow (৳)</th>
                  <th className="py-2.5 px-3 text-right">Outflow (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6F0F1]">
                {accountTxs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-[#8EA3A5] italic">No transaction records found for this account</td>
                  </tr>
                ) : (
                  accountTxs.map((tx) => {
                    const isInflow = tx.type === 'credit' || (tx.type === 'transfer' && tx.toAccountId === account.id);
                    const isOutflow = tx.type === 'debit' || (tx.type === 'transfer' && tx.accountId === account.id);

                    return (
                      <tr key={tx.id}>
                        <td className="py-2 px-3 border-r border-[#E6F0F1] whitespace-nowrap">{tx.date}</td>
                        <td className="py-2 px-3 border-r border-[#E6F0F1] font-mono text-[11px] text-[#8EA3A5]">{tx.referenceId || '—'}</td>
                        <td className="py-2 px-3 border-r border-[#E6F0F1]">
                          <span className="font-bold text-[#17383B] block">{tx.category}</span>
                          <span className="text-[11px] text-[#688285]">{tx.description}</span>
                        </td>
                        <td className="py-2 px-3 border-r border-[#E6F0F1] text-right font-bold text-[#229A73]">
                          {isInflow ? formatCurrency(tx.amount, language) : '—'}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-[#C93B55]">
                          {isOutflow ? formatCurrency(tx.amount, language) : '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-[#F8FAFB] font-extrabold border-t-2 border-[#17383B]">
                  <td colSpan={3} className="py-2.5 px-3 text-right uppercase text-[10px]">Total Movements</td>
                  <td className="py-2.5 px-3 text-right text-[#229A73] border-r border-[#E6F0F1]">{formatCurrency(totalInflow, language)}</td>
                  <td className="py-2.5 px-3 text-right text-[#C93B55]">{formatCurrency(totalOutflow, language)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Authorization Signatures */}
          <div className="pt-12 grid grid-cols-3 gap-8 text-center text-xs">
            <div className="border-t border-[#17383B] pt-2">
              <span className="font-extrabold block text-[#17383B]">Prepared By</span>
              <span className="text-[10px] text-[#8EA3A5]">Accounts Officer</span>
            </div>
            <div className="border-t border-[#17383B] pt-2">
              <span className="font-extrabold block text-[#17383B]">Verified By</span>
              <span className="text-[10px] text-[#8EA3A5]">Chief Financial Controller</span>
            </div>
            <div className="border-t border-[#17383B] pt-2">
              <span className="font-extrabold block text-[#17383B]">Authorized Signatory</span>
              <span className="text-[10px] text-[#8EA3A5]">Managing Director</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
