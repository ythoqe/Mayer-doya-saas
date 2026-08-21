import React from 'react';
import { Account } from '../../types';
import { useERP } from '../../context/ERPContext';
import { Search, Filter, RotateCcw } from 'lucide-react';

export interface ExpenseFilterState {
  search: string;
  category: string;
  accountId: string;
  dateRange: string;
}

interface ExpenseFiltersProps {
  filters: ExpenseFilterState;
  onChange: (filters: ExpenseFilterState) => void;
  categories: string[];
  accounts: Account[];
}

export const ExpenseFilters: React.FC<ExpenseFiltersProps> = ({
  filters,
  onChange,
  categories,
  accounts
}) => {
  const { language, t } = useERP();

  const handleReset = () => {
    onChange({
      search: '',
      category: 'all',
      accountId: 'all',
      dateRange: 'all'
    });
  };

  const hasActiveFilters = 
    filters.search !== '' ||
    filters.category !== 'all' ||
    filters.accountId !== 'all' ||
    filters.dateRange !== 'all';

  return (
    <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-xs border border-[#D9EAEB] shadow-2xs space-y-3">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={language === 'bn' ? 'ভাউচার নং, বিবরণ বা খাত দিয়ে খুঁজুন...' : 'Search voucher #, notes, category, payer...'}
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] placeholder-[#8EA3A5] focus:bg-white focus:border-[#0B9FA5] focus:outline-none transition-colors"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => onChange({ ...filters, category: e.target.value })}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none max-w-[150px] truncate"
          >
            <option value="all">{t('allCategories')}</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Account Filter */}
          <select
            value={filters.accountId}
            onChange={(e) => onChange({ ...filters, accountId: e.target.value })}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none max-w-[160px] truncate"
          >
            <option value="all">{language === 'bn' ? 'সকল একাউন্ট' : 'All Accounts'}</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.accountName}</option>
            ))}
          </select>

          {/* Date Filter */}
          <select
            value={filters.dateRange}
            onChange={(e) => onChange({ ...filters, dateRange: e.target.value })}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
          >
            <option value="all">{t('allDates')}</option>
            <option value="today">{language === 'bn' ? 'আজকের' : 'Today'}</option>
            <option value="this_week">{language === 'bn' ? 'চলতি সপ্তাহ' : 'This Week'}</option>
            <option value="this_month">{language === 'bn' ? 'চলতি মাস' : 'This Month'}</option>
          </select>

          {/* Reset */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-[#FDECEF] hover:bg-[#EA7185] text-[#C93B55] hover:text-white transition-colors flex items-center gap-1.5 shrink-0"
              title={t('resetFilters')}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('resetFilters')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
