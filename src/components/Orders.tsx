import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import { Order, OrderStatus } from '../types';
import { OrderFilters, OrderFilterState } from './orders/OrderFilters';
import { OrderTable } from './orders/OrderTable';
import { ProductionBoard } from './orders/ProductionBoard';
import { OrderDetailsModal } from './orders/OrderDetailsModal';
import { OrderEditModal } from './orders/OrderEditModal';
import { PrintJobCard } from './orders/PrintJobCard';
import { formatNumber } from '../utils/translation';
import { 
  Package, 
  Plus, 
  Layers, 
  LayoutList, 
  Kanban, 
  Clock, 
  CheckCircle2, 
  CheckCircle, 
  AlertTriangle, 
  Droplets,
  Sparkles,
  Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Orders: React.FC = () => {
  const { orders, clients, updateOrderStatus, deleteOrder, openQuickAction, language, t } = useERP();

  // Active view: 'list' or 'kanban'
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Filter state
  const [filters, setFilters] = useState<OrderFilterState>({
    search: '',
    clientId: 'all',
    status: 'all',
    washType: 'all',
    priority: 'all',
    dateRange: 'all'
  });

  // Modal states
  const [selectedOrderForView, setSelectedOrderForView] = useState<Order | null>(null);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<Order | null>(null);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);

  // Top KPI Metrics derived from real order dataset
  const kpiMetrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const total = orders.length;
    const inProd = orders.filter(o => 
      ['lot_received', 'batch_assigned', 'washing', 'dyeing', 'hydro', 'drying', 'finishing'].includes(o.status)
    ).length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const qcReady = orders.filter(o => ['qc_passed', 'ready_for_delivery'].includes(o.status)).length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    
    const delayedOrUrgent = orders.filter(o => {
      if (o.status === 'delivered' || o.status === 'cancelled') return false;
      const due = new Date(o.deliveryDate);
      due.setHours(0, 0, 0, 0);
      return due < today || o.priority === 'urgent';
    }).length;

    const totalGarments = orders.reduce((sum, o) => sum + (Number(o.quantityPcs) || 0), 0);

    return {
      total,
      inProd,
      pending,
      qcReady,
      delivered,
      delayedOrUrgent,
      totalGarments
    };
  }, [orders]);

  // Filtered Orders List
  const filteredOrders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);

    return orders.filter(order => {
      // 1. Search Query
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const matchesQuery = 
          order.orderNumber.toLowerCase().includes(query) ||
          order.clientName.toLowerCase().includes(query) ||
          order.styleNo.toLowerCase().includes(query) ||
          order.washType.toLowerCase().includes(query) ||
          order.colorShade.toLowerCase().includes(query) ||
          (order.batchNumber && order.batchNumber.toLowerCase().includes(query));

        if (!matchesQuery) return false;
      }

      // 2. Client Filter
      if (filters.clientId !== 'all' && order.clientId !== filters.clientId) {
        return false;
      }

      // 3. Status Filter
      if (filters.status !== 'all' && order.status !== filters.status) {
        return false;
      }

      // 4. Wash Type Filter
      if (filters.washType !== 'all' && order.washType !== filters.washType) {
        return false;
      }

      // 5. Priority Filter
      if (filters.priority !== 'all' && order.priority !== filters.priority) {
        return false;
      }

      // 6. Timeline / Date Range Filter
      if (filters.dateRange !== 'all') {
        const dueDate = new Date(order.deliveryDate);
        dueDate.setHours(0, 0, 0, 0);

        if (filters.dateRange === 'today') {
          if (dueDate.getTime() !== today.getTime()) return false;
        } else if (filters.dateRange === 'this_week') {
          if (dueDate < today || dueDate > endOfWeek) return false;
        } else if (filters.dateRange === 'overdue') {
          if (dueDate >= today || order.status === 'delivered') return false;
        }
      }

      return true;
    });
  }, [orders, filters]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      clientId: 'all',
      status: 'all',
      washType: 'all',
      priority: 'all',
      dateRange: 'all'
    });
  };

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    // If active view modal is open for this order, refresh it
    if (selectedOrderForView && selectedOrderForView.id === orderId) {
      setSelectedOrderForView({
        ...selectedOrderForView,
        status: newStatus
      });
    }
  };

  const selectedClientForPrint = selectedOrderForPrint 
    ? clients.find(c => c.id === selectedOrderForPrint.clientId) 
    : undefined;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#17383B] tracking-tight">
              {t('ordersTitle')}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#688285] mt-1">
            {t('ordersSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="p-1 rounded-xl bg-white border border-[#D9EAEB] flex items-center shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-[#0B9FA5] text-white shadow-xs'
                  : 'text-[#688285] hover:text-[#17383B]'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>{t('listView')}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'kanban'
                  ? 'bg-[#0B9FA5] text-white shadow-xs'
                  : 'text-[#688285] hover:text-[#17383B]'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>{t('kanbanView')}</span>
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => openQuickAction('order')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white font-extrabold text-xs shadow-[0_4px_15px_rgba(11,159,165,0.25)] hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t('newOrderButton')}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Order KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Total Orders */}
        <div 
          onClick={() => setFilters({ ...filters, status: 'all' })}
          className="p-3.5 rounded-2xl bg-white border border-[#D9EAEB] shadow-2xs hover:border-[#0B9FA5]/50 transition-all cursor-pointer space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#688285]">{t('totalOrders')}</span>
            <div className="w-6 h-6 rounded-lg bg-[#F1FAFA] text-[#0B9FA5] flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-[#17383B]">
            {formatNumber(kpiMetrics.total, language)}
          </div>
          <span className="text-[10px] text-[#8EA3A5] font-medium block">
            {formatNumber(kpiMetrics.totalGarments, language)} pcs total
          </span>
        </div>

        {/* KPI 2: In Production */}
        <div 
          onClick={() => setFilters({ ...filters, status: 'washing' })}
          className="p-3.5 rounded-2xl bg-white border border-[#D9EAEB] shadow-2xs hover:border-[#0B9FA5]/50 transition-all cursor-pointer space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#0B9FA5]">{t('inProduction')}</span>
            <div className="w-6 h-6 rounded-lg bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center">
              <Droplets className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-[#0B9FA5]">
            {formatNumber(kpiMetrics.inProd, language)}
          </div>
          <span className="text-[10px] text-[#0B9FA5] font-semibold block">
            Active in machines
          </span>
        </div>

        {/* KPI 3: Pending Booking */}
        <div 
          onClick={() => setFilters({ ...filters, status: 'pending' })}
          className="p-3.5 rounded-2xl bg-white border border-[#D9EAEB] shadow-2xs hover:border-[#F3B562]/50 transition-all cursor-pointer space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#C47D1C]">{t('pendingOrders')}</span>
            <div className="w-6 h-6 rounded-lg bg-[#FFF3DF] text-[#F3B562] flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-[#C47D1C]">
            {formatNumber(kpiMetrics.pending, language)}
          </div>
          <span className="text-[10px] text-[#8EA3A5] font-medium block">
            Awaiting inspection
          </span>
        </div>

        {/* KPI 4: QC & Ready */}
        <div 
          onClick={() => setFilters({ ...filters, status: 'ready_for_delivery' })}
          className="p-3.5 rounded-2xl bg-white border border-[#D9EAEB] shadow-2xs hover:border-[#38C99A]/50 transition-all cursor-pointer space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#229A73]">{t('qcReady')}</span>
            <div className="w-6 h-6 rounded-lg bg-[#E5F8F1] text-[#38C99A] flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-[#229A73]">
            {formatNumber(kpiMetrics.qcReady, language)}
          </div>
          <span className="text-[10px] text-[#229A73] font-medium block">
            Ready for dispatch
          </span>
        </div>

        {/* KPI 5: Delivered Done */}
        <div 
          onClick={() => setFilters({ ...filters, status: 'delivered' })}
          className="p-3.5 rounded-2xl bg-white border border-[#D9EAEB] shadow-2xs hover:border-slate-400 transition-all cursor-pointer space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#17383B]">{t('deliveredOrders')}</span>
            <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Truck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-[#17383B]">
            {formatNumber(kpiMetrics.delivered, language)}
          </div>
          <span className="text-[10px] text-[#8EA3A5] font-medium block">
            Challan cleared
          </span>
        </div>

        {/* KPI 6: Delayed or Urgent */}
        <div 
          onClick={() => setFilters({ ...filters, dateRange: 'overdue' })}
          className={`p-3.5 rounded-2xl border shadow-2xs transition-all cursor-pointer space-y-1 ${
            kpiMetrics.delayedOrUrgent > 0 
              ? 'bg-rose-50/50 border-rose-200 hover:border-rose-400' 
              : 'bg-white border-[#D9EAEB]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#C83F57]">{t('delayedOrders')}</span>
            <div className="w-6 h-6 rounded-lg bg-[#FDECEF] text-[#EA7185] flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-[#C83F57]">
            {formatNumber(kpiMetrics.delayedOrUrgent, language)}
          </div>
          <span className="text-[10px] text-[#C83F57] font-semibold block">
            Needs attention
          </span>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <OrderFilters
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* 4. Main Workspace View (List View or Production Kanban Board) */}
      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <OrderTable
              orders={filteredOrders}
              onViewOrder={(order) => setSelectedOrderForView(order)}
              onEditOrder={(order) => setSelectedOrderForEdit(order)}
              onPrintOrder={(order) => setSelectedOrderForPrint(order)}
              onDeleteOrder={(orderId) => deleteOrder(orderId)}
              onUpdateStatus={handleUpdateStatus}
            />
          </motion.div>
        ) : (
          <motion.div
            key="kanban"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <ProductionBoard
              orders={filteredOrders}
              onViewOrder={(order) => setSelectedOrderForView(order)}
              onUpdateStatus={handleUpdateStatus}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Modals */}
      {/* View Job Card Details Modal */}
      {selectedOrderForView && (
        <OrderDetailsModal
          order={selectedOrderForView}
          onClose={() => setSelectedOrderForView(null)}
          onEdit={(order) => {
            setSelectedOrderForView(null);
            setSelectedOrderForEdit(order);
          }}
          onPrint={(order) => {
            setSelectedOrderForPrint(order);
          }}
          onDelete={(orderId) => {
            deleteOrder(orderId);
            setSelectedOrderForView(null);
          }}
        />
      )}

      {/* Edit Order Modal */}
      {selectedOrderForEdit && (
        <OrderEditModal
          order={selectedOrderForEdit}
          onClose={() => setSelectedOrderForEdit(null)}
        />
      )}

      {/* Print Job Card Challan Modal */}
      {selectedOrderForPrint && (
        <PrintJobCard
          order={selectedOrderForPrint}
          client={selectedClientForPrint}
          language={language}
          onClose={() => setSelectedOrderForPrint(null)}
        />
      )}
    </div>
  );
};
