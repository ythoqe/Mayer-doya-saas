import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { GlassCard } from '../ui/GlassCard';
import { OrderStatus } from '../../types';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  X, 
  Check, 
  ChevronDown,
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface OrderFilterState {
  search: string;
  clientId: string;
  status: string;
  washType: string;
  priority: string;
  dateRange: 'all' | 'today' | 'this_week' | 'overdue';
}

interface OrderFiltersProps {
  filters: OrderFilterState;
  onFilterChange: (filters: OrderFilterState) => void;
  onReset: () => void;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  filters,
  onFilterChange,
  onReset
}) => {
  const { clients, orders, language, t } = useERP();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Available unique wash types
  const washTypes = React.useMemo(() => {
    const set = new Set<string>();
    orders.forEach(o => {
      if (o.washType) set.add(o.washType);
    });
    return Array.from(set);
  }, [orders]);

  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.clientId !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.washType !== 'all') count++;
    if (filters.priority !== 'all') count++;
    if (filters.dateRange !== 'all') count++;
    return count;
  }, [filters]);

  const handleUpdate = (field: keyof OrderFilterState, value: any) => {
    onFilterChange({
      ...filters,
      [field]: value
    });
  };

  const statuses: { label: string; value: string }[] = [
    { label: t('allStatuses'), value: 'all' },
    { label: t('pending'), value: 'pending' },
    { label: t('lot_received'), value: 'lot_received' },
    { label: t('batch_assigned'), value: 'batch_assigned' },
    { label: t('washing'), value: 'washing' },
    { label: t('dyeing'), value: 'dyeing' },
    { label: t('hydro'), value: 'hydro' },
    { label: t('drying'), value: 'drying' },
    { label: t('finishing'), value: 'finishing' },
    { label: t('qc_passed'), value: 'qc_passed' },
    { label: t('ready_for_delivery'), value: 'ready_for_delivery' },
    { label: t('delivered'), value: 'delivered' },
    { label: t('cancelled'), value: 'cancelled' }
  ];

  return (
    <div className="space-y-3">
      {/* Desktop & Tablet Filter Bar */}
      <GlassCard padding="sm" className="border-[#D9EAEB]">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="order-search-input"
              type="text"
              placeholder={t('searchOrdersPlaceholder')}
              value={filters.search}
              onChange={(e) => handleUpdate('search', e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] placeholder-[#8EA3A5] focus:bg-white focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/15 focus:outline-none transition-all"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => handleUpdate('search', '')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8EA3A5] hover:text-[#17383B]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Desktop Selects (Hidden on small screens in favor of Mobile Filter Drawer) */}
          <div className="hidden md:flex items-center gap-2 flex-wrap">
            {/* Client Filter */}
            <select
              id="filter-client-select"
              value={filters.clientId}
              onChange={(e) => handleUpdate('clientId', e.target.value)}
              className="px-2.5 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] font-medium focus:bg-white focus:border-[#0B9FA5] focus:outline-none cursor-pointer"
            >
              <option value="all">{t('allClients')}</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              id="filter-status-select"
              value={filters.status}
              onChange={(e) => handleUpdate('status', e.target.value)}
              className="px-2.5 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] font-medium focus:bg-white focus:border-[#0B9FA5] focus:outline-none cursor-pointer"
            >
              {statuses.map(st => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>

            {/* Wash Type Filter */}
            <select
              id="filter-wash-select"
              value={filters.washType}
              onChange={(e) => handleUpdate('washType', e.target.value)}
              className="px-2.5 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] font-medium focus:bg-white focus:border-[#0B9FA5] focus:outline-none cursor-pointer"
            >
              <option value="all">{t('allWashTypes')}</option>
              {washTypes.map((type, idx) => (
                <option key={idx} value={type}>
                  {type}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              id="filter-priority-select"
              value={filters.priority}
              onChange={(e) => handleUpdate('priority', e.target.value)}
              className="px-2.5 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] font-medium focus:bg-white focus:border-[#0B9FA5] focus:outline-none cursor-pointer"
            >
              <option value="all">{t('allPriorities')}</option>
              <option value="normal">{t('normal')}</option>
              <option value="high">{t('high')}</option>
              <option value="urgent">{t('urgent')}</option>
            </select>

            {/* Date Timeline Filter */}
            <select
              id="filter-date-select"
              value={filters.dateRange}
              onChange={(e) => handleUpdate('dateRange', e.target.value)}
              className="px-2.5 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] font-medium focus:bg-white focus:border-[#0B9FA5] focus:outline-none cursor-pointer"
            >
              <option value="all">{t('allDates')}</option>
              <option value="today">{t('todayOrders')}</option>
              <option value="this_week">{t('thisWeekOrders')}</option>
              <option value="overdue">{t('overdueOrders')}</option>
            </select>

            {/* Reset Button */}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={onReset}
                className="px-2.5 py-2 rounded-xl bg-[#FDECEF] hover:bg-[#F9D6DC] text-[#EA7185] text-xs font-bold transition-colors flex items-center gap-1.5"
                title={t('resetFilters')}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('resetFilters')}</span>
              </button>
            )}
          </div>

          {/* Mobile Filter Drawer Trigger */}
          <div className="flex md:hidden items-center justify-between gap-2 pt-1 border-t border-[#E6F0F1]">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="flex-1 py-2 px-3 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] text-xs font-bold flex items-center justify-center gap-2"
            >
              <Filter className="w-3.5 h-3.5 text-[#0B9FA5]" />
              <span>{t('filter')}</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#0B9FA5] text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={onReset}
                className="p-2 rounded-xl bg-[#FDECEF] text-[#EA7185] text-xs font-bold"
                title={t('resetFilters')}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Mobile Filters Bottom Drawer Modal */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#17383B]/40 backdrop-blur-xs md:hidden">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full bg-white rounded-t-[28px] border-t border-[#D9EAEB] p-5 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E6F0F1]">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#0B9FA5]" />
                  <h3 className="font-bold text-sm text-[#17383B]">{t('filter')}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-[#8EA3A5]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Client Filter */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#688285]">{t('filterClient')}</label>
                <select
                  value={filters.clientId}
                  onChange={(e) => handleUpdate('clientId', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B]"
                >
                  <option value="all">{t('allClients')}</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.companyName}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#688285]">{t('filterStatus')}</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleUpdate('status', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B]"
                >
                  {statuses.map(st => (
                    <option key={st.value} value={st.value}>{st.label}</option>
                  ))}
                </select>
              </div>

              {/* Wash Process Filter */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#688285]">{t('filterWashType')}</label>
                <select
                  value={filters.washType}
                  onChange={(e) => handleUpdate('washType', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B]"
                >
                  <option value="all">{t('allWashTypes')}</option>
                  {washTypes.map((type, idx) => (
                    <option key={idx} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#688285]">{t('filterPriority')}</label>
                <select
                  value={filters.priority}
                  onChange={(e) => handleUpdate('priority', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B]"
                >
                  <option value="all">{t('allPriorities')}</option>
                  <option value="normal">{t('normal')}</option>
                  <option value="high">{t('high')}</option>
                  <option value="urgent">{t('urgent')}</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#688285]">{t('filterDate')}</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleUpdate('dateRange', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B]"
                >
                  <option value="all">{t('allDates')}</option>
                  <option value="today">{t('todayOrders')}</option>
                  <option value="this_week">{t('thisWeekOrders')}</option>
                  <option value="overdue">{t('overdueOrders')}</option>
                </select>
              </div>

              {/* Apply / Reset Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { onReset(); setIsMobileDrawerOpen(false); }}
                  className="flex-1 py-2.5 rounded-xl bg-[#FDECEF] text-[#EA7185] text-xs font-bold"
                >
                  {t('resetFilters')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#0B9FA5] text-white text-xs font-bold shadow-md"
                >
                  Apply Filters ({activeFiltersCount})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
