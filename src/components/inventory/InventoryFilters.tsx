import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Search, Filter, RotateCcw, X, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InventoryFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedSupplier: string;
  setSelectedSupplier: (sup: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedLocation: string;
  setSelectedLocation: (loc: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  onReset: () => void;
}

export const InventoryFilters: React.FC<InventoryFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedSupplier,
  setSelectedSupplier,
  selectedStatus,
  setSelectedStatus,
  selectedLocation,
  setSelectedLocation,
  sortBy,
  setSortBy,
  onReset
}) => {
  const { suppliers, inventory, t } = useERP();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Extract unique locations from real inventory
  const locations = Array.from(new Set(inventory.map(item => item.location).filter(Boolean))) as string[];

  // Active filter count
  const activeFilterCount = 
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedSupplier !== 'all' ? 1 : 0) +
    (selectedStatus !== 'all' ? 1 : 0) +
    (selectedLocation !== 'all' ? 1 : 0) +
    (sortBy !== 'name_asc' ? 1 : 0);

  const categories = [
    { key: 'all', label: t('allCategories') },
    { key: 'Acid', label: t('categoryAcid') || 'Acid' },
    { key: 'Enzyme', label: t('categoryEnzyme') || 'Enzyme' },
    { key: 'Dye', label: t('categoryDye') || 'Dye' },
    { key: 'Softener', label: t('categorySoftener') || 'Softener' },
    { key: 'Bleach', label: t('categoryBleach') || 'Bleach' },
    { key: 'Alkali', label: t('categoryAlkali') || 'Alkali' },
    { key: 'Fixing Agent', label: t('categoryFixingAgent') || 'Fixing Agent' },
    { key: 'Detergent', label: t('categoryDetergent') || 'Detergent' },
    { key: 'Other', label: t('categoryOther') || 'Other' }
  ];

  return (
    <div className="space-y-3">
      {/* Primary Desktop/Tablet Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#D9EAEB] shadow-xs">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchInventoryPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] placeholder-[#8EA3A5] focus:bg-white focus:border-[#0B9FA5] focus:outline-none transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8EA3A5] hover:text-[#17383B]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Desktop Filter Dropdowns */}
        <div className="hidden sm:flex flex-wrap items-center gap-2">
          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-2 px-3 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none font-medium"
          >
            {categories.map(c => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>

          {/* Supplier */}
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="py-2 px-3 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none font-medium max-w-[160px] truncate"
          >
            <option value="all">{t('allSuppliers')}</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.company || s.name}</option>
            ))}
          </select>

          {/* Stock Health */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-2 px-3 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none font-medium"
          >
            <option value="all">{t('allStatuses')}</option>
            <option value="healthy">{t('healthyStock')}</option>
            <option value="low">{t('lowStock')}</option>
            <option value="critical">{t('criticalStock')}</option>
          </select>

          {/* Location */}
          {locations.length > 0 && (
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="py-2 px-3 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none font-medium max-w-[140px] truncate"
            >
              <option value="all">{t('allLocations')}</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          )}

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="py-2 px-3 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none font-medium"
          >
            <option value="name_asc">Sort: Name (A-Z)</option>
            <option value="stock_desc">Sort: Stock (High to Low)</option>
            <option value="stock_asc">Sort: Stock (Low to High)</option>
            <option value="value_desc">Sort: Value (High to Low)</option>
            <option value="min_desc">Sort: Min Level</option>
          </select>

          {/* Reset */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="p-2 rounded-xl text-[#8EA3A5] hover:text-[#EA7185] hover:bg-[#FEECEE] transition-colors"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile Filter Button */}
        <div className="sm:hidden flex items-center justify-between gap-2 pt-1 border-t border-[#E6F0F1]">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex-1 py-2 px-3 rounded-xl bg-[#EAF7F8] text-[#0B9FA5] font-bold text-xs flex items-center justify-center gap-2 border border-[#0B9FA5]/20"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters & Sorting {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
          </button>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="p-2 rounded-xl bg-[#F8FCFC] text-[#8EA3A5] border border-[#D9EAEB]"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer / Bottom Sheet */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="fixed inset-0 bg-[#0F2D30]/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full bg-white rounded-t-3xl p-5 border-t border-[#D9EAEB] shadow-2xl max-h-[85vh] overflow-y-auto space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E6F0F1]">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#0B9FA5]" />
                  <h3 className="font-extrabold text-sm text-[#17383B]">Filter Inventory</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1.5 rounded-lg text-[#8EA3A5] hover:bg-[#F1FAFA]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#688285]">{t('categoryCol')}</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full py-2.5 px-3 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B]"
                >
                  {categories.map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Supplier */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#688285]">{t('supplierCol')}</label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full py-2.5 px-3 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B]"
                >
                  <option value="all">{t('allSuppliers')}</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.company || s.name}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#688285]">{t('statusCol')}</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full py-2.5 px-3 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B]"
                >
                  <option value="all">{t('allStatuses')}</option>
                  <option value="healthy">{t('healthyStock')}</option>
                  <option value="low">{t('lowStock')}</option>
                  <option value="critical">{t('criticalStock')}</option>
                </select>
              </div>

              {/* Location */}
              {locations.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#688285]">{t('locationCol')}</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full py-2.5 px-3 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B]"
                  >
                    <option value="all">{t('allLocations')}</option>
                    {locations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sort */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#688285]">Sorting</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full py-2.5 px-3 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B]"
                >
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="stock_desc">Stock (High to Low)</option>
                  <option value="stock_asc">Stock (Low to High)</option>
                  <option value="value_desc">Valuation (High to Low)</option>
                  <option value="min_desc">Minimum Level</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={onReset}
                  className="flex-1 py-2.5 rounded-xl border border-[#D9EAEB] font-bold text-xs text-[#688285]"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#0B9FA5] text-white font-bold text-xs shadow-md"
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
