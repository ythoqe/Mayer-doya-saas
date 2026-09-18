import React, { useState } from 'react';
import { Expense, Account } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency } from '../../utils/translation';
import { Receipt, FileText, Printer, Edit2, Trash2, Calendar, User, Landmark, Tag, ChevronRight } from 'lucide-react';
import { ConfirmDeleteModal } from '../ui/ConfirmDeleteModal';

interface ExpenseTableProps {
  expenses: Expense[];
  accounts: Account[];
  onSelectExpense: (expense: Expense) => void;
  onEditExpense?: (expense: Expense) => void;
  onPrintExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  accounts,
  onSelectExpense,
  onEditExpense,
  onPrintExpense,
  onDeleteExpense
}) => {
  const { language, t } = useERP();
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const getAccountName = (accId: string) => {
    const acc = accounts.find(a => a.id === accId);
    return acc ? acc.accountName : 'Cash Account';
  };

  const getCategoryBadge = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('electric') || c.includes('power')) return 'bg-[#EEEBFF] text-[#8178F2] border-[#8178F2]/20';
    if (c.includes('chemical') || c.includes('dye')) return 'bg-[#DDF4F3] text-[#0B9FA5] border-[#0B9FA5]/20';
    if (c.includes('fuel') || c.includes('diesel') || c.includes('gas')) return 'bg-[#FDECEF] text-[#C93B55] border-[#EA7185]/20';
    if (c.includes('maintenance') || c.includes('spare')) return 'bg-[#FFF3DF] text-[#C47D1C] border-[#F3B562]/20';
    if (c.includes('labor') || c.includes('salary')) return 'bg-[#E5F8F1] text-[#229A73] border-[#38C99A]/20';
    return 'bg-[#F1FAFA] text-[#17383B] border-[#D9EAEB]';
  };

  if (expenses.length === 0) {
    return (
      <div className="p-12 text-center bg-white/80 backdrop-blur-xs rounded-2xl border border-[#D9EAEB] shadow-2xs space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-[#F1FAFA] text-[#8EA3A5] flex items-center justify-center mx-auto">
          <Receipt className="w-6 h-6" />
        </div>
        <h4 className="font-extrabold text-sm text-[#17383B]">
          {t('noExpensesRecorded')}
        </h4>
        <p className="text-xs text-[#688285]">
          {language === 'bn' ? 'কোনো খরচের ভাউচার রেকর্ড মেলেনি।' : 'No factory expense vouchers matched your filter criteria.'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/95 backdrop-blur-sm border border-[#D9EAEB] shadow-2xs overflow-hidden">
      {/* Desktop & Tablet Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E6F0F1] bg-[#F1FAFA]/70 text-[#8EA3A5] font-extrabold uppercase tracking-wider">
              <th className="py-3.5 px-4">{language === 'bn' ? 'তারিখ' : 'Date'}</th>
              <th className="py-3.5 px-4">{language === 'bn' ? 'ভাউচার নং' : 'Voucher #'}</th>
              <th className="py-3.5 px-4">{language === 'bn' ? 'খাত / ক্যাটাগরি' : 'Category'}</th>
              <th className="py-3.5 px-4">{language === 'bn' ? 'বিবরণ / নোট' : 'Description / Notes'}</th>
              <th className="py-3.5 px-4">{language === 'bn' ? 'পরিশোধের একাউন্ট' : 'Account'}</th>
              <th className="py-3.5 px-4">{language === 'bn' ? 'পরিশোধকারী' : 'Paid By'}</th>
              <th className="py-3.5 px-4 text-right">{language === 'bn' ? 'পরিমাণ (৳)' : 'Amount'}</th>
              <th className="py-3.5 px-4 text-right">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1FAFA]">
            {expenses.map((expense) => {
              const accountName = getAccountName(expense.accountId);
              const badgeClass = getCategoryBadge(expense.category);

              return (
                <tr key={expense.id} className="hover:bg-[#F1FAFA]/50 transition-colors group">
                  <td className="py-3.5 px-4 whitespace-nowrap font-medium text-[#688285]">
                    {expense.date}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-[#17383B]">
                    {expense.voucherNo || `VCH-${expense.id.slice(-5)}`}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${badgeClass}`}>
                      {expense.category}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-[#17383B] max-w-xs truncate font-medium" title={expense.notes}>
                    {expense.notes || '—'}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-[#688285] font-semibold">
                    <div className="flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-[#0B9FA5] shrink-0" />
                      <span>{accountName}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-[#8EA3A5] font-medium">
                    {expense.paidBy || 'Accounts'}
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <span className="font-black text-sm text-[#C93B55]">
                      {formatCurrency(expense.amount, language)}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onSelectExpense(expense)}
                        className="p-1.5 rounded-lg hover:bg-[#F1FAFA] text-[#8EA3A5] hover:text-[#0B9FA5] transition-colors"
                        title={language === 'bn' ? 'বিস্তারিত দেখুন' : 'View Details'}
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      {onEditExpense && (
                        <button
                          type="button"
                          onClick={() => onEditExpense(expense)}
                          className="p-1.5 rounded-lg hover:bg-[#F1FAFA] text-[#8EA3A5] hover:text-[#F3B562] transition-colors"
                          title={language === 'bn' ? 'এডিট করুন' : 'Edit Expense'}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onPrintExpense(expense)}
                        className="p-1.5 rounded-lg hover:bg-[#F1FAFA] text-[#8EA3A5] hover:text-[#17383B] transition-colors"
                        title={language === 'bn' ? 'ভাউচার প্রিন্ট' : 'Print Voucher'}
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpenseToDelete(expense)}
                        className="p-1.5 rounded-lg hover:bg-[#FDECEF] text-[#8EA3A5] hover:text-[#EA7185] transition-colors"
                        title={t('delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked View */}
      <div className="md:hidden divide-y divide-[#E6F0F1]">
        {expenses.map((expense) => {
          const accountName = getAccountName(expense.accountId);
          const badgeClass = getCategoryBadge(expense.category);

          return (
            <div key={expense.id} className="p-4 space-y-2 hover:bg-[#F1FAFA]/40 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#17383B]">{expense.voucherNo || `VCH-${expense.id.slice(-5)}`}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${badgeClass}`}>
                      {expense.category}
                    </span>
                  </div>
                  {expense.notes && (
                    <p className="text-xs text-[#17383B] font-medium mt-1 line-clamp-2">
                      {expense.notes}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="font-black text-sm text-[#C93B55] block">
                    {formatCurrency(expense.amount, language)}
                  </span>
                  <span className="text-[10px] text-[#8EA3A5] font-semibold">{expense.date}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#8EA3A5] pt-1 border-t border-[#F1FAFA]">
                <div className="flex items-center gap-1">
                  <Landmark className="w-3 h-3 text-[#0B9FA5]" />
                  <span className="font-semibold text-[#688285]">{accountName}</span>
                </div>

                <div className="flex items-center gap-1">
                  {onEditExpense && (
                    <button
                      type="button"
                      onClick={() => onEditExpense(expense)}
                      className="p-1 rounded-lg text-[#8EA3A5] hover:text-[#F3B562]"
                      title={t('edit')}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setExpenseToDelete(expense)}
                    className="p-1 rounded-lg text-[#8EA3A5] hover:text-[#EA7185]"
                    title={t('delete')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onPrintExpense(expense)}
                    className="p-1 rounded-lg text-[#8EA3A5] hover:text-[#17383B]"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectExpense(expense)}
                    className="px-2 py-1 rounded-lg bg-[#F1FAFA] text-[#17383B] text-xs font-bold flex items-center gap-1"
                  >
                    <span>{language === 'bn' ? 'বিস্তারিত' : 'Details'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDeleteModal
        isOpen={!!expenseToDelete}
        title={language === 'bn' ? 'খরচের ভাউচার মুছে ফেলুন' : 'Delete Expense Voucher'}
        itemName={expenseToDelete ? `${expenseToDelete.voucherNo || `VCH-${expenseToDelete.id.slice(-5)}`} (${expenseToDelete.category} - ৳${expenseToDelete.amount})` : ''}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={() => {
          if (expenseToDelete) {
            onDeleteExpense(expenseToDelete.id);
            setExpenseToDelete(null);
          }
        }}
      />
    </div>
  );
};
