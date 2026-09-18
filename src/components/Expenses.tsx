import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { useERP } from '../context/ERPContext';
import { formatCurrency, formatNumber } from '../utils/translation';
import { Receipt, Plus, FileText, Printer, Filter } from 'lucide-react';
import { ExpenseSummaryCards } from './expenses/ExpenseSummaryCards';
import { ExpenseCategoryChart } from './expenses/ExpenseCategoryChart';
import { ExpenseFilters, ExpenseFilterState } from './expenses/ExpenseFilters';
import { ExpenseTable } from './expenses/ExpenseTable';
import { ExpenseModal } from './expenses/ExpenseModal';
import { ExpenseDetailsModal } from './expenses/ExpenseDetailsModal';
import { PrintExpenseVoucher } from './expenses/PrintExpenseVoucher';

export const Expenses: React.FC = () => {
  const { expenses, accounts, deleteExpense, language, t } = useERP();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [printingExpense, setPrintingExpense] = useState<Expense | null>(null);

  const [filters, setFilters] = useState<ExpenseFilterState>({
    search: '',
    category: 'all',
    accountId: 'all',
    dateRange: 'all'
  });

  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach(e => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set);
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = 
        !filters.search ||
        (e.notes && e.notes.toLowerCase().includes(filters.search.toLowerCase())) ||
        (e.category && e.category.toLowerCase().includes(filters.search.toLowerCase())) ||
        (e.voucherNo && e.voucherNo.toLowerCase().includes(filters.search.toLowerCase())) ||
        (e.paidBy && e.paidBy.toLowerCase().includes(filters.search.toLowerCase()));

      const matchesCategory = filters.category === 'all' || e.category === filters.category;
      const matchesAccount = filters.accountId === 'all' || e.accountId === filters.accountId;

      let matchesDate = true;
      if (filters.dateRange !== 'all') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (filters.dateRange === 'today') {
          matchesDate = e.date === todayStr;
        } else if (filters.dateRange === 'this_month') {
          const currentMonth = todayStr.slice(0, 7);
          matchesDate = e.date.startsWith(currentMonth);
        }
      }

      return matchesSearch && matchesCategory && matchesAccount && matchesDate;
    });
  }, [expenses, filters]);

  const printingAccount = printingExpense ? accounts.find(a => a.id === printingExpense.accountId) : undefined;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#17383B]">
              {t('expensesTitle')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#FDECEF] text-[#C93B55] border border-[#EA7185]/20">
              {formatNumber(expenses.length, language)} {language === 'bn' ? 'ভাউচার' : 'Vouchers'}
            </span>
          </div>
          <p className="text-xs text-[#688285] mt-1 font-medium">
            {t('expensesSubtitle')}
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={() => {
            setEditingExpense(null);
            setIsAddOpen(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addExpenseBtn')}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <ExpenseSummaryCards />

      {/* Breakdown Chart & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ExpenseCategoryChart expenses={expenses} />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <ExpenseFilters
            filters={filters}
            onChange={setFilters}
            categories={uniqueCategories}
            accounts={accounts}
          />

          <ExpenseTable
            expenses={filteredExpenses}
            accounts={accounts}
            onSelectExpense={(exp) => setSelectedExpense(exp)}
            onEditExpense={(exp) => setEditingExpense(exp)}
            onPrintExpense={(exp) => setPrintingExpense(exp)}
            onDeleteExpense={(id) => deleteExpense(id)}
          />
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {(isAddOpen || editingExpense) && (
        <ExpenseModal
          isOpen={isAddOpen || !!editingExpense}
          expenseToEdit={editingExpense}
          onClose={() => {
            setIsAddOpen(false);
            setEditingExpense(null);
          }}
        />
      )}

      {/* Expense Details Modal */}
      {selectedExpense && (
        <ExpenseDetailsModal
          expense={selectedExpense}
          onClose={() => setSelectedExpense(null)}
          onEdit={(exp) => {
            setSelectedExpense(null);
            setEditingExpense(exp);
          }}
          onDelete={(id) => deleteExpense(id)}
        />
      )}

      {/* Print Expense Voucher Modal */}
      {printingExpense && (
        <PrintExpenseVoucher
          expense={printingExpense}
          account={printingAccount}
          onClose={() => setPrintingExpense(null)}
        />
      )}
    </div>
  );
};
