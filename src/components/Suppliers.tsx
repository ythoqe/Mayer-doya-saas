import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import { Supplier } from '../types';
import { formatCurrency, formatNumber } from '../utils/translation';
import { 
  Building2, 
  FlaskConical, 
  DollarSign, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp,
  Tag
} from 'lucide-react';
import { SupplierFilters, SupplierFilterState } from './suppliers/SupplierFilters';
import { SupplierTable } from './suppliers/SupplierTable';
import { SupplierModal } from './suppliers/SupplierModal';
import { SupplierDetailsModal } from './suppliers/SupplierDetailsModal';
import { SupplierPaymentModal } from './suppliers/SupplierPaymentModal';
import { PrintSupplierStatement } from './suppliers/PrintSupplierStatement';

export const Suppliers: React.FC = () => {
  const { suppliers, deleteSupplier, language, t } = useERP();

  // Filters state
  const [filters, setFilters] = useState<SupplierFilterState>({
    search: '',
    category: 'all',
    status: 'all',
    balance: 'all',
    sortBy: 'company'
  });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [paymentSupplier, setPaymentSupplier] = useState<Supplier | null>(null);
  const [statementSupplier, setStatementSupplier] = useState<Supplier | null>(null);

  // 1. Calculate KPI Metrics from real ERPContext
  const totalSuppliersCount = suppliers.length;
  const activeSuppliersCount = suppliers.filter(s => s.status === 'active').length;
  const totalPurchases = suppliers.reduce((acc, s) => acc + (s.totalPurchases || 0), 0);
  const outstandingPayables = suppliers.reduce((acc, s) => acc + (s.balance || 0), 0);

  // 2. Filter & Sort Logic
  const filteredSuppliers = useMemo(() => {
    return suppliers
      .filter((supplier) => {
        // Search filter (company, contact name, phone, category, address)
        if (filters.search) {
          const q = filters.search.toLowerCase();
          const matchCompany = (supplier.company || supplier.companyName || '').toLowerCase().includes(q);
          const matchName = supplier.name?.toLowerCase().includes(q);
          const matchPhone = supplier.phone?.toLowerCase().includes(q);
          const matchCategory = supplier.category?.toLowerCase().includes(q);
          const matchAddress = supplier.address?.toLowerCase().includes(q);
          if (!matchCompany && !matchName && !matchPhone && !matchCategory && !matchAddress) {
            return false;
          }
        }

        // Category filter
        if (filters.category !== 'all' && supplier.category !== filters.category) {
          return false;
        }

        // Status filter
        if (filters.status !== 'all' && supplier.status !== filters.status) {
          return false;
        }

        // Balance filter
        if (filters.balance === 'has_payable' && supplier.balance <= 0) {
          return false;
        }
        if (filters.balance === 'zero_balance' && supplier.balance > 0) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'balance_desc') {
          return (b.balance || 0) - (a.balance || 0);
        }
        if (filters.sortBy === 'purchases_desc') {
          return (b.totalPurchases || 0) - (a.totalPurchases || 0);
        }
        if (filters.sortBy === 'newest') {
          return b.id.localeCompare(a.id);
        }
        // Default sort by company name
        return (a.company || a.companyName || '').localeCompare(b.company || b.companyName || '');
      });
  }, [suppliers, filters]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      status: 'all',
      balance: 'all',
      sortBy: 'company'
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header & Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-[#17383B] tracking-tight">
              {t('supplierDirectoryTitle')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#DDF4F3] text-[#0B9FA5] border border-[#0B9FA5]/20">
              {formatNumber(totalSuppliersCount, language)}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#688285] mt-0.5">
            {t('supplierDirectorySubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white font-extrabold text-xs shadow-md shadow-[#0B9FA5]/20 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addSupplierBtn')}</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Supplier KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Suppliers */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#D9EAEB] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#8EA3A5] uppercase tracking-wider block">
              {t('totalSuppliersLabel')}
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#17383B] mt-0.5 block">
              {formatNumber(totalSuppliersCount, language)}
            </span>
            <span className="text-[11px] text-[#688285]">
              Chemicals, dyes & spares
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center font-bold shadow-2xs shrink-0">
            <FlaskConical className="w-5 h-5" />
          </div>
        </div>

        {/* Active Vendors */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#D9EAEB] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#8EA3A5] uppercase tracking-wider block">
              {t('activeSuppliersLabel')}
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#229A73] mt-0.5 block">
              {formatNumber(activeSuppliersCount, language)}
            </span>
            <span className="text-[11px] text-[#229A73]/90 font-medium">
              Approved vendor list
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#E5F8F1] text-[#229A73] flex items-center justify-center font-bold shadow-2xs shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Total Purchases */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#D9EAEB] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#8EA3A5] uppercase tracking-wider block">
              {t('totalPurchasesLabel')}
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#17383B] mt-0.5 block">
              {formatCurrency(totalPurchases, language)}
            </span>
            <span className="text-[11px] text-[#688285]">
              Lifetime procurement value
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#F1FAFA] text-[#17383B] flex items-center justify-center font-bold shadow-2xs shrink-0 border border-[#D9EAEB]">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Outstanding Payables */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#D9EAEB] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#8EA3A5] uppercase tracking-wider block">
              {t('outstandingPayablesLabel')}
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#C83F57] mt-0.5 block">
              {formatCurrency(outstandingPayables, language)}
            </span>
            <span className="text-[11px] text-[#C83F57]/90 font-medium">
              Vendor invoices to settle
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-[#C83F57] flex items-center justify-center font-bold shadow-2xs shrink-0 border border-rose-100">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Supplier Filters & Search Bar */}
      <SupplierFilters
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* 4. Supplier Table & Mobile Cards */}
      <SupplierTable
        suppliers={filteredSuppliers}
        onViewSupplier={(s) => setViewingSupplier(s)}
        onEditSupplier={(s) => setEditingSupplier(s)}
        onPaySupplier={(s) => setPaymentSupplier(s)}
        onViewLedger={(s) => setViewingSupplier(s)}
        onDeleteSupplier={(id) => deleteSupplier(id)}
      />

      {/* 5. Modals & Drawers */}
      {/* Add Supplier Modal */}
      <SupplierModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Edit Supplier Modal */}
      <SupplierModal
        supplier={editingSupplier}
        isOpen={!!editingSupplier}
        onClose={() => setEditingSupplier(null)}
      />

      {/* Supplier Details Modal */}
      <SupplierDetailsModal
        supplier={viewingSupplier}
        isOpen={!!viewingSupplier}
        onClose={() => setViewingSupplier(null)}
        onEditSupplier={(s) => {
          setViewingSupplier(null);
          setEditingSupplier(s);
        }}
        onPaySupplier={(s) => {
          setViewingSupplier(null);
          setPaymentSupplier(s);
        }}
        onPrintStatement={(s) => {
          setStatementSupplier(s);
        }}
      />

      {/* Supplier Payment Modal */}
      <SupplierPaymentModal
        supplier={paymentSupplier}
        isOpen={!!paymentSupplier}
        onClose={() => setPaymentSupplier(null)}
      />

      {/* Printable Supplier Statement */}
      {statementSupplier && (
        <PrintSupplierStatement
          supplier={statementSupplier}
          language={language}
          onClose={() => setStatementSupplier(null)}
        />
      )}
    </div>
  );
};
