import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import { Client } from '../types';
import { formatCurrency, formatNumber } from '../utils/translation';
import { 
  Building2, 
  Users, 
  CreditCard, 
  DollarSign, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp,
  Download
} from 'lucide-react';
import { motion } from 'motion/react';
import { ClientFilters, ClientFilterState } from './clients/ClientFilters';
import { ClientTable } from './clients/ClientTable';
import { ClientModal } from './clients/ClientModal';
import { ClientDetailsModal } from './clients/ClientDetailsModal';
import { ClientPaymentModal } from './clients/ClientPaymentModal';
import { PrintClientStatement } from './clients/PrintClientStatement';

export const Clients: React.FC = () => {
  const { clients, orders, deleteClient, language, t } = useERP();

  // Filters state
  const [filters, setFilters] = useState<ClientFilterState>({
    search: '',
    status: 'all',
    balance: 'all',
    sortBy: 'company'
  });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [paymentClient, setPaymentClient] = useState<Client | null>(null);
  const [statementClient, setStatementClient] = useState<Client | null>(null);

  // 1. Calculate KPI Metrics from real ERPContext
  const totalClientsCount = clients.length;
  const activeClientsCount = clients.filter(c => c.status === 'active').length;
  const totalReceivables = clients.reduce((acc, c) => acc + (c.balance || 0), 0);
  const totalPaymentsReceived = clients.reduce((acc, c) => acc + (c.totalPaid || 0), 0);

  // 2. Filter & Sort Logic
  const filteredClients = useMemo(() => {
    return clients
      .filter((client) => {
        // Search filter (company, name, phone, address, email)
        if (filters.search) {
          const q = filters.search.toLowerCase();
          const matchCompany = client.companyName?.toLowerCase().includes(q);
          const matchName = client.name?.toLowerCase().includes(q);
          const matchPhone = client.phone?.toLowerCase().includes(q);
          const matchAddress = client.address?.toLowerCase().includes(q);
          const matchEmail = client.email?.toLowerCase().includes(q);
          if (!matchCompany && !matchName && !matchPhone && !matchAddress && !matchEmail) {
            return false;
          }
        }

        // Status filter
        if (filters.status !== 'all' && client.status !== filters.status) {
          return false;
        }

        // Balance filter
        if (filters.balance === 'has_balance' && client.balance <= 0) {
          return false;
        }
        if (filters.balance === 'zero_balance' && client.balance > 0) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'balance_desc') {
          return (b.balance || 0) - (a.balance || 0);
        }
        if (filters.sortBy === 'billed_desc') {
          return (b.totalBilled || 0) - (a.totalBilled || 0);
        }
        if (filters.sortBy === 'newest') {
          return b.id.localeCompare(a.id);
        }
        // Default sort by company name
        return (a.companyName || '').localeCompare(b.companyName || '');
      });
  }, [clients, filters]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
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
              {t('clientDirectoryTitle')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#DDF4F3] text-[#0B9FA5] border border-[#0B9FA5]/20">
              {formatNumber(totalClientsCount, language)}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#688285] mt-0.5">
            {t('clientDirectorySubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white font-extrabold text-xs shadow-md shadow-[#0B9FA5]/20 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addClientBtn')}</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Client KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Clients */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#D9EAEB] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#8EA3A5] uppercase tracking-wider block">
              {t('totalClientsLabel')}
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#17383B] mt-0.5 block">
              {formatNumber(totalClientsCount, language)}
            </span>
            <span className="text-[11px] text-[#688285]">
              Active textile & buying mills
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center font-bold shadow-2xs shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Active Accounts */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#D9EAEB] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#8EA3A5] uppercase tracking-wider block">
              {t('activeClientsLabel')}
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#229A73] mt-0.5 block">
              {formatNumber(activeClientsCount, language)}
            </span>
            <span className="text-[11px] text-[#229A73]/90 font-medium">
              Regular order accounts
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#E5F8F1] text-[#229A73] flex items-center justify-center font-bold shadow-2xs shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Total Receivables (Due from clients) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#D9EAEB] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#8EA3A5] uppercase tracking-wider block">
              {t('totalReceivablesLabel')}
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#C47D1C] mt-0.5 block">
              {formatCurrency(totalReceivables, language)}
            </span>
            <span className="text-[11px] text-[#C47D1C]/90 font-medium">
              Outstanding collection
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-[#C47D1C] flex items-center justify-center font-bold shadow-2xs shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Payments Received */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#D9EAEB] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#8EA3A5] uppercase tracking-wider block">
              {t('totalPaymentsReceived')}
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#0B9FA5] mt-0.5 block">
              {formatCurrency(totalPaymentsReceived, language)}
            </span>
            <span className="text-[11px] text-[#0B9FA5]/90 font-medium">
              Total lifetime receipts
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center font-bold shadow-2xs shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Client Filters & Search Bar */}
      <ClientFilters
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* 4. Client Directory Table & Cards */}
      <ClientTable
        clients={filteredClients}
        orders={orders}
        onViewClient={(c) => setViewingClient(c)}
        onEditClient={(c) => setEditingClient(c)}
        onRecordPayment={(c) => setPaymentClient(c)}
        onViewLedger={(c) => setViewingClient(c)}
        onDeleteClient={(id) => deleteClient(id)}
      />

      {/* 5. Modals & Drawers */}
      {/* Add Client Modal */}
      <ClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Edit Client Modal */}
      <ClientModal
        client={editingClient}
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
      />

      {/* Client Details Modal */}
      <ClientDetailsModal
        client={viewingClient}
        orders={orders}
        isOpen={!!viewingClient}
        onClose={() => setViewingClient(null)}
        onEditClient={(c) => {
          setViewingClient(null);
          setEditingClient(c);
        }}
        onRecordPayment={(c) => {
          setViewingClient(null);
          setPaymentClient(c);
        }}
        onPrintStatement={(c) => {
          setStatementClient(c);
        }}
      />

      {/* Client Payment Receipt Modal */}
      <ClientPaymentModal
        client={paymentClient}
        isOpen={!!paymentClient}
        onClose={() => setPaymentClient(null)}
      />

      {/* Printable Client Statement */}
      {statementClient && (
        <PrintClientStatement
          client={statementClient}
          orders={orders}
          language={language}
          onClose={() => setStatementClient(null)}
        />
      )}
    </div>
  );
};
