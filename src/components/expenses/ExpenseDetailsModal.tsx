import React, { useState } from 'react';
import { Expense, Account } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency } from '../../utils/translation';
import { Receipt, X, Printer, Calendar, User, Landmark, Tag, Trash2, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { PrintExpenseVoucher } from './PrintExpenseVoucher';

interface ExpenseDetailsModalProps {
  expense: Expense | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export const ExpenseDetailsModal: React.FC<ExpenseDetailsModalProps> = ({
  expense,
  onClose,
  onDelete
}) => {
  const { accounts, language, t } = useERP();
  const [showPrint, setShowPrint] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!expense) return null;

  const account = accounts.find(a => a.id === expense.accountId);

  const getCategoryColor = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('electric') || c.includes('power')) return 'bg-[#EEEBFF] text-[#8178F2] border-[#8178F2]/20';
    if (c.includes('chemical') || c.includes('dye')) return 'bg-[#DDF4F3] text-[#0B9FA5] border-[#0B9FA5]/20';
    if (c.includes('fuel') || c.includes('diesel') || c.includes('gas')) return 'bg-[#FDECEF] text-[#C93B55] border-[#EA7185]/20';
    if (c.includes('maintenance') || c.includes('spare')) return 'bg-[#FFF3DF] text-[#C47D1C] border-[#F3B562]/20';
    return 'bg-[#F1FAFA] text-[#17383B] border-[#D9EAEB]';
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17383B]/40 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#D9EAEB] overflow-hidden my-6"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-[#F1FAFA] to-[#E5F8F1] border-b border-[#D9EAEB] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B9FA5] to-[#16B8B0] text-white flex items-center justify-center shadow-xs shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-[#17383B]">
                    {expense.voucherNo || `VCH-${expense.id}`}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getCategoryColor(expense.category)}`}>
                    {expense.category}
                  </span>
                </div>
                <p className="text-xs text-[#688285]">
                  {expense.date} • {account ? account.accountName : 'Cash Account'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/80 text-[#8EA3A5] hover:text-[#17383B] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Amount Banner */}
            <div className="p-4 rounded-xl bg-[#FDECEF]/60 border border-[#EA7185]/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8EA3A5] block">
                  {language === 'bn' ? 'ভাউচারের মোট খরচ' : 'Total Voucher Expense'}
                </span>
                <span className="text-2xl font-black text-[#C93B55] tracking-tight">
                  {formatCurrency(expense.amount, language)}
                </span>
              </div>
              <div className="text-right text-xs">
                <span className="text-[10px] text-[#8EA3A5] uppercase font-bold block">{language === 'bn' ? 'পরিশোধকারী' : 'Paid By'}</span>
                <span className="font-extrabold text-[#17383B]">{expense.paidBy || 'Accounts Desk'}</span>
              </div>
            </div>

            {/* Meta specs */}
            <div className="p-4 rounded-xl bg-[#F8FAFB] border border-[#E6F0F1] space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[#E6F0F1]">
                <span className="text-[#8EA3A5] font-semibold">{language === 'bn' ? 'উৎস একাউন্ট:' : 'Payment Account:'}</span>
                <span className="font-bold text-[#17383B]">{account ? `${account.accountName} (${account.accountType})` : 'Cash'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#E6F0F1]">
                <span className="text-[#8EA3A5] font-semibold">{language === 'bn' ? 'তারিখ:' : 'Date:'}</span>
                <span className="font-bold text-[#17383B]">{expense.date}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[#8EA3A5] font-semibold">{language === 'bn' ? 'ক্যাটাগরি / খাত:' : 'Category:'}</span>
                <span className="font-bold text-[#0B9FA5]">{expense.category}</span>
              </div>
            </div>

            {/* Description Notes */}
            {expense.notes && (
              <div className="p-4 rounded-xl bg-white border border-[#E6F0F1] text-xs">
                <span className="font-extrabold text-[#17383B] block mb-1 uppercase text-[10px] tracking-wider text-[#8EA3A5]">
                  {language === 'bn' ? 'খরচের বিবরণ / নোট:' : 'Description & Remarks:'}
                </span>
                <p className="text-[#688285] leading-relaxed">{expense.notes}</p>
              </div>
            )}

            {/* Delete Confirmation Warning */}
            {showDeleteConfirm && (
              <div className="p-4 rounded-xl bg-[#FDECEF] border border-[#EA7185]/30 space-y-3">
                <p className="text-xs font-bold text-[#C93B55]">
                  {language === 'bn' ? 'আপনি কি নিশ্চিত যে এই ভাউচারটি ডিলিট করতে চান?' : 'Are you sure you want to permanently delete this expense voucher?'}
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-[#D9EAEB] text-xs font-bold text-[#688285]"
                  >
                    {language === 'bn' ? 'না' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onDelete) onDelete(expense.id);
                      onClose();
                    }}
                    className="px-4 py-1.5 rounded-lg bg-[#C93B55] hover:bg-[#A82B42] text-white text-xs font-extrabold"
                  >
                    {language === 'bn' ? 'হ্যাঁ, ডিলিট করুন' : 'Confirm Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-[#F1FAFA] border-t border-[#D9EAEB] flex items-center justify-between">
            {onDelete ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-xl text-[#8EA3A5] hover:text-[#C93B55] hover:bg-[#FDECEF] transition-colors"
                title={language === 'bn' ? 'ভাউচার ডিলিট' : 'Delete Voucher'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#D9EAEB] hover:bg-white text-xs font-bold text-[#688285] transition-colors"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>

              <button
                type="button"
                onClick={() => setShowPrint(true)}
                className="px-4 py-2 rounded-xl bg-[#0B9FA5] hover:bg-[#078A90] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'ভাউচার প্রিন্ট' : 'Print Voucher'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {showPrint && (
        <PrintExpenseVoucher
          expense={expense}
          account={account}
          onClose={() => setShowPrint(false)}
        />
      )}
    </>
  );
};
