import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import { InventoryItem } from '../types';
import { GlassCard } from './ui/GlassCard';
import { InventoryKpis } from './inventory/InventoryKpis';
import { LowStockAlerts } from './inventory/LowStockAlerts';
import { InventoryFilters } from './inventory/InventoryFilters';
import { InventoryTable } from './inventory/InventoryTable';
import { InventoryCard } from './inventory/InventoryCard';
import { StockInModal } from './inventory/StockInModal';
import { StockOutModal } from './inventory/StockOutModal';
import { InventoryItemModal } from './inventory/InventoryItemModal';
import { InventoryDetailsModal } from './inventory/InventoryDetailsModal';
import { PrintStockReport } from './inventory/PrintStockReport';
import { 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Printer, 
  LayoutGrid, 
  Table as TableIcon,
  FlaskConical,
  PackageOpen,
  FilterX
} from 'lucide-react';

export const Inventory: React.FC = () => {
  const { inventory, suppliers, openQuickAction, language, t } = useERP();

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name_asc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modal States
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [isStockOutOpen, setIsStockOutOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Selected item for modals
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
  const [printSingleItem, setPrintSingleItem] = useState<InventoryItem | null>(null);

  // Filter & Sort Logic
  const filteredItems = useMemo(() => {
    return inventory
      .filter(item => {
        // Search
        const query = searchTerm.toLowerCase();
        const matchesSearch = 
          item.name.toLowerCase().includes(query) ||
          (item.supplierName && item.supplierName.toLowerCase().includes(query)) ||
          (item.location && item.location.toLowerCase().includes(query)) ||
          item.category.toLowerCase().includes(query);

        if (!matchesSearch) return false;

        // Category
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }

        // Supplier
        if (selectedSupplier !== 'all' && item.supplierId !== selectedSupplier) {
          return false;
        }

        // Status
        if (selectedStatus === 'low') {
          if (!(item.currentStockKg <= item.minAlertLevel && item.currentStockKg > item.minAlertLevel * 0.5)) {
            return false;
          }
        } else if (selectedStatus === 'critical') {
          if (!(item.currentStockKg <= item.minAlertLevel * 0.5)) {
            return false;
          }
        } else if (selectedStatus === 'healthy') {
          if (item.currentStockKg <= item.minAlertLevel) {
            return false;
          }
        }

        // Location
        if (selectedLocation !== 'all' && item.location !== selectedLocation) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'stock_desc') {
          return b.currentStockKg - a.currentStockKg;
        }
        if (sortBy === 'stock_asc') {
          return a.currentStockKg - b.currentStockKg;
        }
        if (sortBy === 'value_desc') {
          return (b.currentStockKg * b.unitPrice) - (a.currentStockKg * a.unitPrice);
        }
        if (sortBy === 'min_desc') {
          return b.minAlertLevel - a.minAlertLevel;
        }
        return 0;
      });
  }, [inventory, searchTerm, selectedCategory, selectedSupplier, selectedStatus, selectedLocation, sortBy]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedSupplier('all');
    setSelectedStatus('all');
    setSelectedLocation('all');
    setSortBy('name_asc');
  };

  // Handlers for item actions
  const handleViewDetails = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsDetailsModalOpen(true);
  };

  const handleStockIn = (item?: InventoryItem) => {
    setSelectedItem(item || null);
    setIsStockInOpen(true);
  };

  const handleStockOut = (item?: InventoryItem) => {
    setSelectedItem(item || null);
    setIsStockOutOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setItemToEdit(item);
    setIsItemModalOpen(true);
  };

  const handleAddNewItem = () => {
    setItemToEdit(null);
    setIsItemModalOpen(true);
  };

  const handlePrintStockCard = (item: InventoryItem) => {
    setPrintSingleItem(item);
    setIsPrintModalOpen(true);
  };

  const handlePrintAll = () => {
    setPrintSingleItem(null);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-2 sm:px-4">
      {/* Top Header & Factory Operations Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#D9EAEB] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#EAF7F8] text-[#0B9FA5] flex items-center justify-center shadow-xs border border-[#0B9FA5]/20 shrink-0">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#17383B] tracking-tight">
              {t('inventoryTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-[#688285]">
              {t('inventorySubtitle')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Print Statement */}
          <button
            type="button"
            onClick={handlePrintAll}
            className="py-2.5 px-3.5 rounded-xl bg-[#F8FCFC] hover:bg-[#F1FAFA] text-[#17383B] font-bold text-xs border border-[#D9EAEB] transition-colors flex items-center gap-1.5 shadow-xs"
            title="Print Factory Stock Statement"
          >
            <Printer className="w-4 h-4 text-[#688285]" />
            <span className="hidden sm:inline">Print Stock Report</span>
          </button>

          {/* Stock In */}
          <button
            type="button"
            onClick={() => handleStockIn()}
            className="py-2.5 px-3.5 rounded-xl bg-[#EAF7F8] hover:bg-[#DDF4F3] text-[#0B9FA5] font-extrabold text-xs border border-[#0B9FA5]/30 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>{t('stockInBtn')}</span>
          </button>

          {/* Stock Out */}
          <button
            type="button"
            onClick={() => handleStockOut()}
            className="py-2.5 px-3.5 rounded-xl bg-[#FFF0E6] hover:bg-[#FDE7D9] text-[#E06D28] font-extrabold text-xs border border-[#E06D28]/30 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>{t('stockOutBtn')}</span>
          </button>

          {/* Add Chemical */}
          <button
            type="button"
            onClick={handleAddNewItem}
            className="py-2.5 px-4 rounded-xl bg-[#0B9FA5] hover:bg-[#088287] text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addItemBtn')}</span>
          </button>
        </div>
      </div>

      {/* KPI & Stock Health Overview */}
      <InventoryKpis onRestockClick={() => handleStockIn()} />

      {/* Active Low Stock Alerts Banner / Section */}
      <LowStockAlerts onRestockItem={(item) => handleStockIn(item)} />

      {/* Filter and Search Bar */}
      <InventoryFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedSupplier={selectedSupplier}
        setSelectedSupplier={setSelectedSupplier}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onReset={handleResetFilters}
      />

      {/* View Switcher & Inventory Count Summary */}
      <div className="flex items-center justify-between px-1">
        <div className="text-xs text-[#688285] font-semibold">
          Showing <strong className="text-[#17383B]">{filteredItems.length}</strong> of {inventory.length} materials
        </div>

        {/* View Mode Toggle */}
        <div className="hidden sm:flex items-center bg-white p-1 rounded-xl border border-[#D9EAEB]">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'table' ? 'bg-[#0B9FA5] text-white shadow-xs' : 'text-[#8EA3A5] hover:text-[#17383B]'
            }`}
            title="Table View"
          >
            <TableIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'cards' ? 'bg-[#0B9FA5] text-white shadow-xs' : 'text-[#8EA3A5] hover:text-[#17383B]'
            }`}
            title="Card Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inventory Items Presentation */}
      {filteredItems.length === 0 ? (
        <GlassCard padding="lg" className="text-center py-12 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F1FAFA] text-[#8EA3A5] flex items-center justify-center mx-auto border border-[#D9EAEB]">
            <PackageOpen className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-sm text-[#17383B]">No chemicals or materials match your search</h4>
          <p className="text-xs text-[#688285] max-w-sm mx-auto">
            Try adjusting your search keyword, category filter, or status filters to view inventory items.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="py-2 px-4 rounded-xl bg-[#EAF7F8] text-[#0B9FA5] font-bold text-xs border border-[#0B9FA5]/20 hover:bg-[#DDF4F3] transition-colors inline-flex items-center gap-1.5"
          >
            <FilterX className="w-3.5 h-3.5" />
            <span>Clear All Filters</span>
          </button>
        </GlassCard>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className={`${viewMode === 'cards' ? 'hidden' : 'hidden md:block'}`}>
            <GlassCard padding="none" className="overflow-hidden border border-[#D9EAEB]">
              <InventoryTable
                items={filteredItems}
                onViewDetails={handleViewDetails}
                onStockIn={handleStockIn}
                onStockOut={handleStockOut}
                onEditItem={handleEditItem}
              />
            </GlassCard>
          </div>

          {/* Cards View (Active on mobile or when cards view is selected) */}
          <div className={`${viewMode === 'table' ? 'md:hidden' : ''} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5`}>
            {filteredItems.map(item => (
              <InventoryCard
                key={item.id}
                item={item}
                onViewDetails={handleViewDetails}
                onStockIn={handleStockIn}
                onStockOut={handleStockOut}
                onEditItem={handleEditItem}
              />
            ))}
          </div>
        </>
      )}

      {/* Stock In Modal */}
      <StockInModal
        isOpen={isStockInOpen}
        onClose={() => setIsStockInOpen(false)}
        selectedItem={selectedItem}
      />

      {/* Stock Out Modal */}
      <StockOutModal
        isOpen={isStockOutOpen}
        onClose={() => setIsStockOutOpen(false)}
        selectedItem={selectedItem}
      />

      {/* Add / Edit Inventory Item Modal */}
      <InventoryItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        itemToEdit={itemToEdit}
      />

      {/* Inventory Item Details & History Modal */}
      <InventoryDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        item={selectedItem}
        onStockIn={handleStockIn}
        onStockOut={handleStockOut}
        onEditItem={handleEditItem}
        onPrintCard={handlePrintStockCard}
      />

      {/* Printable Stock Report & Card */}
      <PrintStockReport
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        singleItem={printSingleItem}
      />
    </div>
  );
};
