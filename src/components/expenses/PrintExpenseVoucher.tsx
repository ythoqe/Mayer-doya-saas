import React from 'react';
import { Expense, Account } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency } from '../../utils/translation';
import { Printer, X, Receipt } from 'lucide-react';
import { MayerLogo } from '../ui/MayerLogo';

interface PrintExpenseVoucherProps {
  expense: Expense;
  account?: Account;
  onClose: () => void;
}

export const PrintExpenseVoucher: React.FC<PrintExpenseVoucherProps> = ({
  expense,
  account,
  onClose
}) => {
  const { language } = useERP();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17383B]/50 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#D9EAEB] overflow-hidden my-6 print:border-none print:shadow-none print:m-0 print:max-w-full">
        {/* Controls Bar (Hidden in Print) */}
        <div className="p-4 bg-[#F1FAFA] border-b border-[#D9EAEB] flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#0B9FA5]" />
            <span className="text-xs font-bold text-[#17383B]">
              {language === 'bn' ? 'ফ্যাক্টরি ডেবিট ভাউচার প্রিভিউ' : 'Factory Debit Voucher Print Preview'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-[#0B9FA5] hover:bg-[#078A90] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'ভাউচার প্রিন্ট' : 'Print Voucher'}</span>
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

        {/* Official Printable Sheet */}
        <div className="p-8 space-y-6 text-[#17383B]">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-[#17383B] pb-4">
            <div className="flex items-center gap-3">
              <MayerLogo size={42} />
              <div>
                <h1 className="text-lg font-black tracking-tight text-[#17383B]">
                  MAYER DOYA WASHING & DYEING LTD.
                </h1>
                <p className="text-[11px] font-semibold text-[#688285]">
                  Plot 14-16, BSCIC Industrial Estate, Konabari, Gazipur, Bangladesh
                </p>
                <p className="text-[10px] text-[#8EA3A5]">
                  Factory Accounts & Procurement Section
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="px-3 py-1 bg-[#FDECEF] border border-[#EA7185]/30 rounded-lg text-xs font-black text-[#C93B55] uppercase tracking-wider">
                DEBIT VOUCHER
              </div>
              <div className="text-xs font-mono font-bold text-[#17383B] mt-1.5">
                Voucher #: {expense.voucherNo || `VCH-${expense.id}`}
              </div>
            </div>
          </div>

          {/* Key Meta Grid */}
          <div className="p-4 rounded-xl bg-[#F8FAFB] border border-[#E6F0F1] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-extrabold text-[#8EA3A5] block">Voucher Date</span>
              <span className="font-extrabold text-sm text-[#17383B]">{expense.date}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-extrabold text-[#8EA3A5] block">Account Head / Category</span>
              <span className="font-bold text-[#17383B]">{expense.category}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-extrabold text-[#8EA3A5] block">Payment Account</span>
              <span className="font-bold text-[#17383B]">{account ? account.accountName : 'Cash in Hand'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-extrabold text-[#8EA3A5] block">Disbursed By</span>
              <span className="font-bold text-[#17383B]">{expense.paidBy || 'Accounts Officer'}</span>
            </div>
          </div>

          {/* Particulars & Amount Table */}
          <table className="w-full text-left text-xs border-collapse border border-[#E6F0F1]">
            <thead>
              <tr className="bg-[#F1FAFA] border-b border-[#E6F0F1] text-[#688285] font-extrabold uppercase text-[10px]">
                <th className="py-2.5 px-3 border-r border-[#E6F0F1] w-12 text-center">SL</th>
                <th className="py-2.5 px-3 border-r border-[#E6F0F1]">Particulars / Description of Expense</th>
                <th className="py-2.5 px-3 text-right w-40">Amount (BDT)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-3 px-3 border-r border-[#E6F0F1] text-center font-bold text-[#8EA3A5]">01</td>
                <td className="py-3 px-3 border-r border-[#E6F0F1]">
                  <span className="font-extrabold text-[#17383B] block text-sm">{expense.category}</span>
                  <span className="text-xs text-[#688285] mt-1 block leading-relaxed">
                    {expense.notes || 'Operating factory expense disbursement as authorized.'}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-black text-sm text-[#17383B]">
                  {formatCurrency(expense.amount, language)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-[#F8FAFB] font-extrabold border-t-2 border-[#17383B]">
                <td colSpan={2} className="py-2.5 px-3 text-right uppercase text-[10px]">Total Disbursed Amount</td>
                <td className="py-2.5 px-3 text-right text-base text-[#C93B55] font-black">
                  {formatCurrency(expense.amount, language)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Authorization Signatures */}
          <div className="pt-16 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="border-t border-[#17383B] pt-1.5">
              <span className="font-extrabold block text-[#17383B]">Prepared By</span>
              <span className="text-[10px] text-[#8EA3A5]">Accountant / Cashier</span>
            </div>
            <div className="border-t border-[#17383B] pt-1.5">
              <span className="font-extrabold block text-[#17383B]">Checked By</span>
              <span className="text-[10px] text-[#8EA3A5]">Accounts Manager</span>
            </div>
            <div className="border-t border-[#17383B] pt-1.5">
              <span className="font-extrabold block text-[#17383B]">Authorized Signatory</span>
              <span className="text-[10px] text-[#8EA3A5]">Director / Factory GM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
