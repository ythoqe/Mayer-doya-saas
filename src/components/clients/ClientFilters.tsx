import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Search, Filter, RotateCcw, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ClientFilterState {
  search: string;
  status: 'all' | 'active' | 'inactive';
  balance: 'all' | 'has_balance' | 'zero_balance';
  sortBy: 'company' | 'balance_desc' | 'billed_desc' | 'newest';
}

interface ClientFiltersProps {
  filters: ClientFilterState;
  onFilterChange: (filters: ClientFilterState) => void;
  onReset: () => void;
}

export const ClientFilters: React.FC<ClientFiltersProps> = ({
  filters,
  onFilterChange,
  onReset
}) => {
  const { t } = useERP();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const activeFiltersCount = 
    (filters.status !== 'all' ? 1 : 0) +
    (filters.balance !== 'all' ? 1 : 0) +
    (filters.sortBy !== 'company' ? 1 : 0) +
    (filters.search ? 1 : 0);

  return (
    <div className="space-y-3">
      {/* Desktop & Tablet Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#D9EAEB] p-3 sm:p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('searchClientsPlaceholder')}
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs sm:text-sm text-[#17383B] placeholder-[#8EA3A5] focus:bg-white focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/20 focus:outline-none transition-all"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, search: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8EA3A5] hover:text-[#17383B] rounded-full hover:bg-black/5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Desktop Filter Dropdowns */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-bold text-[#688285] whitespace-nowrap">
                {t('status')}:
              </label>
              <select
                value={filters.status}
                onChange={(e) => onFilterChange({ ...filters, status: e.target.value as any })}
                className="px-3 py-2 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs font-semibold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none cursor-pointer"
              >
                <option value="all">{t('allStatuses')}</option>
                <option value="active">{t('active')}</option>
                <option value="inactive">{t('inactive')}</option>
              </select>
            </div>

            {/* Balance Filter */}
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-bold text-[#688285] whitespace-nowrap">
                {t('filterBalance')}:
              </label>
              <select
                value={filters.balance}
                onChange={(e) => onFilterChange({ ...filters, balance: e.target.value as any })}
                className="px-3 py-2 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs font-semibold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none cursor-pointer"
              >
                <option value="all">{t('allBalances')}</option>
                <option value="has_balance">{t('hasReceivable')}</option>
                <option value="zero_balance">{t('zeroBalance')}</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#8EA3A5]" />
              <select
                value={filters.sortBy}
                onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value as any })}
                className="px-3 py-2 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs font-semibold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none cursor-pointer"
              >
                <option value="company">Sort by Name</option>
                <option value="balance_desc">Highest Balance Due</option>
                <option value="billed_desc">Highest Total Billed</option>
                <option value="newest">Recently Added</option>
              </select>
            </div>

            {/* Reset Button */}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={onReset}
                className="px-3 py-2 rounded-xl border border-dashed border-[#D9EAEB] hover:border-rose-300 text-xs font-bold text-[#688285] hover:text-[#C83F57] hover:bg-rose-50/50 transition-all flex items-center gap-1.5"
                title={t('resetFilters')}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('resetFilters')}</span>
              </button>
            )}
          </div>

          {/* Mobile Filter Button */}
          <div className="flex lg:hidden items-center justify-between gap-2 pt-1 sm:pt-0">
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="flex-1 py-2 px-3 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs font-bold text-[#17383B] flex items-center justify-center gap-2"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#0B9FA5]" />
              <span>{t('filter')}</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#0B9FA5] text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={onReset}
                className="p-2 rounded-xl border border-[#D9EAEB] text-xs text-[#C83F57] hover:bg-rose-50"
                title={t('resetFilters')}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet / Modal */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#17383B]/40 backdrop-blur-xs lg:hidden">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border border-[#D9EAEB] shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E6F0F1]">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#0B9FA5]" />
                  <h3 className="font-extrabold text-sm text-[#17383B]">{t('filter')}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1.5 rounded-full hover:bg-black/5 text-[#8EA3A5]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B]">{t('status')}</label>
                <select
                  value={filters.status}
                  onChange={(e) => onFilterChange({ ...filters, status: e.target.value as any })}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:outline-none"
                >
                  <option value="all">{t('allStatuses')}</option>
                  <option value="active">{t('active')}</option>
                  <option value="inactive">{t('inactive')}</option>
                </select>
              </div>

              {/* Balance */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B]">{t('filterBalance')}</label>
                <select
                  value={filters.balance}
                  onChange={(e) => onFilterChange({ ...filters, balance: e.target.value as any })}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:outline-none"
                >
                  <option value="all">{t('allBalances')}</option>
                  <option value="has_balance">{t('hasReceivable')}</option>
                  <option value="zero_balance">{t('zeroBalance')}</option>
                </select>
              </div>

              {/* Sort */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B]">Sorting</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value as any })}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:outline-none"
                >
                  <option value="company">Sort by Name</option>
                  <option value="balance_desc">Highest Balance Due</option>
                  <option value="billed_desc">Highest Total Billed</option>
                  <option value="newest">Recently Added</option>
                </select>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-[#E6F0F1] flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onReset();
                    setIsMobileFilterOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-[#D9EAEB] text-xs font-bold text-[#688285]"
                >
                  {t('resetFilters')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#0B9FA5] text-white text-xs font-bold shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
