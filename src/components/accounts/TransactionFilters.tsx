import React from 'react';
import { Account } from '../../types';
import { useERP } from '../../context/ERPContext';
import { Search, Filter, RotateCcw, Calendar, Landmark, ArrowDownLeft, ArrowUpRight, ArrowRightLeft } from 'lucide-react';

export interface TransactionFilterState {
  search: string;
  type: string;
  accountId: string;
  category: string;
  dateRange: string;
}

interface TransactionFiltersProps {
  filters: TransactionFilterState;
  onChange: (filters: TransactionFilterState) => void;
  accounts: Account[];
  categories: string[];
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  filters,
  onChange,
  accounts,
  categories
}) => {
  const { language, t } = useERP();

  const handleReset = () => {
    onChange({
      search: '',
      type: 'all',
      accountId: 'all',
      category: 'all',
      dateRange: 'all'
    });
  };

  const hasActiveFilters = 
    filters.search !== '' ||
    filters.type !== 'all' ||
    filters.accountId !== 'all' ||
    filters.category !== 'all' ||
    filters.dateRange !== 'all';

  return (
    <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-xs border border-[#D9EAEB] shadow-2xs space-y-3">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={language === 'bn' ? 'বিবরণ, রেফারেন্স বা খাত দিয়ে খুঁজুন...' : 'Search description, reference, category...'}
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] placeholder-[#8EA3A5] focus:bg-white focus:border-[#0B9FA5] focus:outline-none transition-colors"
          />
        </div>

        {/* Filter controls row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => onChange({ ...filters, type: e.target.value })}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
          >
            <option value="all">{t('allTypes')}</option>
            <option value="credit">{t('typeInflow')} (Credit)</option>
            <option value="debit">{t('typeOutflow')} (Debit)</option>
            <option value="transfer">{t('typeTransfer')} (Transfer)</option>
          </select>

          {/* Account Filter */}
          <select
            value={filters.accountId}
            onChange={(e) => onChange({ ...filters, accountId: e.target.value })}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none max-w-[170px] truncate"
          >
            <option value="all">{language === 'bn' ? 'সকল একাউন্ট' : 'All Accounts'}</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.accountName}</option>
            ))}
          </select>

          {/* Category Filter */}
          {categories.length > 0 && (
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
          )}

          {/* Date Range Preset */}
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

          {/* Reset button */}
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
