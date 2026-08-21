import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import { GlassCard } from './ui/GlassCard';
import { StatusBadge } from './ui/StatusBadge';
import { formatCurrency, formatNumber } from '../utils/translation';
import { OrderStatus, Order } from '../types';
import { 
  TrendingUp, 
  Package, 
  Clock, 
  FlaskConical, 
  Landmark, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowRight,
  CheckCircle2, 
  Droplets,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Calendar,
  Filter,
  PlusCircle,
  Receipt,
  Wallet,
  Building2,
  CheckCircle,
  Truck,
  RotateCcw,
  Gauge,
  Flame,
  Wind
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateTab }) => {
  const { 
    metrics, 
    orders, 
    inventory, 
    clients, 
    suppliers,
    accounts,
    transactions,
    language, 
    t, 
    currentUser,
    openQuickAction
  } = useERP();

  const [orderFilter, setOrderFilter] = useState<'all' | 'processing' | 'finishing' | 'ready'>('all');
  const [activeSideTab, setActiveSideTab] = useState<'activity' | 'chemicals'>('activity');

  // Derived collections
  const lowStockItems = useMemo(() => {
    return inventory.filter(i => i.currentStockKg <= i.minAlertLevel);
  }, [inventory]);

  const activeOrdersInFloor = useMemo(() => {
    return orders.filter(o => ['lot_received', 'batch_assigned', 'washing', 'dyeing', 'hydro', 'drying', 'finishing'].includes(o.status));
  }, [orders]);

  const totalPiecesInProcess = useMemo(() => {
    return activeOrdersInFloor.reduce((sum, o) => sum + (o.quantityPcs || 0), 0);
  }, [activeOrdersInFloor]);

  // Stage distribution
  const stageStats = useMemo(() => {
    const stages: { key: OrderStatus; label: string; icon: React.ElementType; color: string; bg: string }[] = [
      { key: 'lot_received', label: t('lot_received'), icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
      { key: 'washing', label: t('washing'), icon: Droplets, color: 'text-[#0B9FA5]', bg: 'bg-[#DDF4F3]' },
      { key: 'dyeing', label: t('dyeing'), icon: Layers, color: 'text-[#6357E8]', bg: 'bg-[#EEEBFF]' },
      { key: 'hydro', label: t('hydro'), icon: RotateCcw, color: 'text-sky-600', bg: 'bg-sky-50' },
      { key: 'drying', label: t('drying'), icon: Wind, color: 'text-orange-600', bg: 'bg-orange-50' },
      { key: 'finishing', label: t('finishing'), icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50' },
      { key: 'qc_passed', label: t('qc_passed'), icon: CheckCircle2, color: 'text-[#229A73]', bg: 'bg-[#E5F8F1]' },
      { key: 'ready_for_delivery', label: t('ready_for_delivery'), icon: Truck, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    ];

    const totalOrdersCount = orders.length || 1;

    return stages.map(st => {
      const matchingOrders = orders.filter(o => o.status === st.key);
      const count = matchingOrders.length;
      const pcs = matchingOrders.reduce((sum, o) => sum + (o.quantityPcs || 0), 0);
      const percentage = Math.round((count / totalOrdersCount) * 100);
      return {
        ...st,
        count,
        pcs,
        percentage
      };
    });
  }, [orders, t]);

  // Machine Allocation extracted dynamically from real orders
  const machineList = useMemo(() => {
    const knownMachines = [
      { id: 'WASH-M01', name: 'Industrial Rotary Washer 01', type: 'washing', capacityKg: 450 },
      { id: 'WASH-M02', name: 'Heavy Duty Stone Wash Drum 02', type: 'washing', capacityKg: 600 },
      { id: 'WASH-M04', name: 'Bleach & Enzyme Chamber 04', type: 'washing', capacityKg: 500 },
      { id: 'DYE-M01', name: 'Atmospheric High-Temp Dyeing Vessel 01', type: 'dyeing', capacityKg: 750 },
      { id: 'HYDRO-01', name: 'Centrifugal Hydro Extractor 01', type: 'hydro', capacityKg: 350 },
      { id: 'FINISH-02', name: 'Steam Tumble Dryer / Softener 02', type: 'drying', capacityKg: 500 },
    ];

    return knownMachines.map(m => {
      const activeJob = orders.find(o => o.machineNo === m.id && o.status !== 'delivered' && o.status !== 'cancelled');
      return {
        ...m,
        activeJob: activeJob || null,
        isOccupied: !!activeJob
      };
    });
  }, [orders]);

  // Filtered orders for the table
  const filteredOrders = useMemo(() => {
    let list = orders;
    if (orderFilter === 'processing') {
      list = orders.filter(o => ['batch_assigned', 'washing', 'dyeing', 'hydro'].includes(o.status));
    } else if (orderFilter === 'finishing') {
      list = orders.filter(o => ['drying', 'finishing', 'qc_passed'].includes(o.status));
    } else if (orderFilter === 'ready') {
      list = orders.filter(o => ['ready_for_delivery', 'delivered'].includes(o.status));
    }
    return list.slice(0, 6);
  }, [orders, orderFilter]);

  // Activity Feed generated from real transactions & orders
  const activityFeed = useMemo(() => {
    const items: { id: string; title: string; subtitle: string; time: string; type: 'order' | 'payment' | 'expense' | 'qc' }[] = [];

    orders.slice(0, 3).forEach(o => {
      items.push({
        id: `act-ord-${o.id}`,
        title: `${o.orderNumber} • ${o.clientName}`,
        subtitle: `${formatNumber(o.quantityPcs, language)} pcs • ${o.washType} (${o.status.replace(/_/g, ' ')})`,
        time: o.createdAt || 'Today',
        type: o.status === 'qc_passed' || o.status === 'ready_for_delivery' ? 'qc' : 'order'
      });
    });

    transactions.slice(0, 3).forEach(tx => {
      items.push({
        id: `act-tx-${tx.id}`,
        title: tx.category,
        subtitle: `${tx.description} — ${formatCurrency(tx.amount, language)}`,
        time: tx.date || 'Today',
        type: tx.type === 'credit' ? 'payment' : 'expense'
      });
    });

    return items.slice(0, 5);
  }, [orders, transactions, language]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Command Ribbon */}
      <div 
        id="dashboard-header-banner"
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-6 sm:p-7 rounded-[24px] bg-gradient-to-r from-white via-[#F4FBFA] to-[#EAF6F7] border border-[#D9EAEB] shadow-[0_8px_30px_rgba(30,90,95,0.05)]"
      >
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DDF4F3] text-[#0B9FA5] text-xs font-bold border border-[#16B8B0]/30">
              <span className="w-2 h-2 rounded-full bg-[#0B9FA5] animate-pulse" />
              {t('factoryShift')}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E5F8F1] text-[#229A73] text-[11px] font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              {t('onlineStatus')}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#17383B] tracking-tight">
            {t('factoryFloorOverview')}
          </h1>

          <p className="text-xs sm:text-sm text-[#688285] max-w-2xl">
            {language === 'bn'
              ? `স্বাগতম ${currentUser?.name || 'ফ্যাক্টরি ইনচার্জ'}। আজ ফ্যাক্টরি ফ্লোরে ${formatNumber(metrics.activeBatchesCount, language)} টি ব্যাচে ${formatNumber(totalPiecesInProcess, language)} পিস পোশাক প্রসেসিং চলমান রয়েছে।`
              : `Welcome back, ${currentUser?.name || 'Factory In-Charge'}. Monitoring ${formatNumber(metrics.activeBatchesCount, language)} active batches with ${formatNumber(totalPiecesInProcess, language)} garments currently in wash, dye, and finishing lines.`
            }
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-quick-new-job"
            type="button"
            onClick={() => openQuickAction('order')}
            className="px-4 py-2.5 rounded-xl bg-[#0B9FA5] hover:bg-[#078A90] text-white text-xs font-bold shadow-md shadow-[#0B9FA5]/20 transition-all duration-200 flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('newOrder')}</span>
          </button>

          <button
            id="btn-quick-log-expense"
            type="button"
            onClick={() => openQuickAction('expense')}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#F1FAFA] text-[#17383B] text-xs font-bold border border-[#D9EAEB] transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Receipt className="w-4 h-4 text-[#F3B562]" />
            <span>{t('newExpense')}</span>
          </button>

          <button
            id="btn-quick-receive-payment"
            type="button"
            onClick={() => openQuickAction('payment')}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#F1FAFA] text-[#17383B] text-xs font-bold border border-[#D9EAEB] transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Wallet className="w-4 h-4 text-[#229A73]" />
            <span>{t('newPayment')}</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 High-Impact KPI Cards Row */}
      <div id="dashboard-kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Active In-Process Batches */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <GlassCard hoverEffect padding="lg" className="h-full flex flex-col justify-between border-[#D9EAEB]">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-[#688285] uppercase tracking-wider">
                  {t('activeBatches')}
                </span>
                <div className="p-2.5 rounded-2xl bg-[#DDF4F3] text-[#0B9FA5]">
                  <Droplets className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#17383B] tracking-tight">
                {formatNumber(metrics.activeBatchesCount, language)}
                <span className="text-sm font-semibold text-[#688285] ml-1.5">
                  {language === 'bn' ? 'ব্যাচ সচল' : 'active batches'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-[#688285] pt-3.5 mt-3 border-t border-[#F1FAFA]">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#0B9FA5]" />
                {formatNumber(totalPiecesInProcess, language)} {language === 'bn' ? 'পিস রানিং' : 'pcs in pipeline'}
              </span>
              <span className="font-bold text-[#0B9FA5]">
                {orders.length > 0 ? Math.round((metrics.activeBatchesCount / orders.length) * 100) : 0}% floor load
              </span>
            </div>
          </GlassCard>
        </motion.div>

        {/* KPI 2: Washing Output & Deliveries */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }}>
          <GlassCard hoverEffect padding="lg" className="h-full flex flex-col justify-between border-[#D9EAEB]">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-[#688285] uppercase tracking-wider">
                  {t('todayWashOutput')}
                </span>
                <div className="p-2.5 rounded-2xl bg-[#E5F8F1] text-[#229A73]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#17383B] tracking-tight">
                {formatNumber(metrics.todayWashOutput, language)}
                <span className="text-sm font-semibold text-[#688285] ml-1.5">
                  {language === 'bn' ? 'পিস সম্পন্ন' : 'pcs ready/done'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-[#688285] pt-3.5 mt-3 border-t border-[#F1FAFA]">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-[#229A73]" />
                {formatNumber(metrics.pendingDeliveriesCount, language)} {t('pendingDeliveries')}
              </span>
              <span className="font-bold text-[#229A73]">
                {t('qc_passed')}
              </span>
            </div>
          </GlassCard>
        </motion.div>

        {/* KPI 3: Total Booked Revenue & Receivables */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.1 }}>
          <GlassCard hoverEffect padding="lg" className="h-full flex flex-col justify-between border-[#D9EAEB]">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-[#688285] uppercase tracking-wider">
                  {t('totalRevenue')}
                </span>
                <div className="p-2.5 rounded-2xl bg-[#EEEBFF] text-[#6357E8]">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#17383B] tracking-tight">
                {formatCurrency(metrics.totalRevenue, language)}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-[#688285] pt-3.5 mt-3 border-t border-[#F1FAFA]">
              <span className="text-[#EA7185] font-semibold flex items-center gap-1">
                {t('totalReceivables')}:
              </span>
              <span className="font-bold text-[#17383B]">
                {formatCurrency(metrics.totalReceivables, language)}
              </span>
            </div>
          </GlassCard>
        </motion.div>

        {/* KPI 4: Chemical Stock Valuation & Safety */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.15 }}>
          <GlassCard hoverEffect padding="lg" className="h-full flex flex-col justify-between border-[#D9EAEB]">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-[#688285] uppercase tracking-wider">
                  {t('chemicalStockValuation')}
                </span>
                <div className={`p-2.5 rounded-2xl ${lowStockItems.length > 0 ? 'bg-[#FFF3DF] text-[#C47D1C]' : 'bg-[#EAF6F7] text-[#0B9FA5]'}`}>
                  <FlaskConical className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#17383B] tracking-tight">
                {formatCurrency(metrics.chemicalStockValue, language)}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-3.5 mt-3 border-t border-[#F1FAFA]">
              <span className="text-[#688285]">
                {formatNumber(inventory.length, language)} {language === 'bn' ? 'ধরনের কেমিক্যাল' : 'chemical SKU items'}
              </span>
              {lowStockItems.length > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-[#FFF3DF] text-[#C47D1C] font-bold text-[10px] flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {formatNumber(lowStockItems.length, language)} {t('restockNeeded')}
                </span>
              ) : (
                <span className="text-[#229A73] font-bold text-[11px]">
                  ✓ {language === 'bn' ? 'পর্যাপ্ত স্টক' : 'All safe'}
                </span>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* 3. Main Grid: Production Pipeline Breakdown & Floor Machine Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Production Stage Breakdown (7 cols) */}
        <div className="lg:col-span-7">
          <GlassCard padding="lg" className="h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#0B9FA5]" />
                    <h2 className="text-base sm:text-lg font-bold text-[#17383B]">
                      {t('productionPipeline')}
                    </h2>
                  </div>
                  <p className="text-xs text-[#688285] mt-0.5">
                    {language === 'bn' ? 'ফ্যাক্টরির ৮টি মূল প্রসেসিং ধাপের লাইভ অবস্থা' : 'Real-time garment throughput across 8 factory stages'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab('orders')}
                  className="text-xs font-bold text-[#0B9FA5] hover:text-[#078A90] flex items-center gap-1 hover:underline"
                >
                  <span>{t('viewAllOrders')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Stage Progress Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {stageStats.map(stage => {
                  const Icon = stage.icon;
                  return (
                    <div 
                      key={stage.key}
                      className={`p-3.5 rounded-xl border border-[#E6F0F1] transition-all hover:border-[#0B9FA5]/40 hover:bg-[#F1FAFA]/40 ${stage.count > 0 ? 'bg-white shadow-xs' : 'bg-slate-50/50 opacity-70'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-1.5 rounded-lg ${stage.bg} ${stage.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black text-[#17383B]">
                          {formatNumber(stage.count, language)}
                          <span className="text-[10px] font-normal text-[#8EA3A5] ml-0.5">{language === 'bn' ? 'অর্ডার' : 'lots'}</span>
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#17383B] truncate" title={stage.label}>
                        {stage.label}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-[#688285] mt-1">
                        <span>{formatNumber(stage.pcs, language)} pcs</span>
                      </div>
                      {/* Mini visual indicator */}
                      <div className="w-full bg-[#E6F0F1] h-1.5 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="bg-[#0B9FA5] h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.max(stage.percentage, stage.count > 0 ? 15 : 0)}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Wash Shade Distribution Summary */}
              <div className="p-4 rounded-2xl bg-[#EAF6F7]/50 border border-[#D9EAEB]">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-[#0B9FA5]" />
                    {language === 'bn' ? 'চলতি ওয়াশ ও ডাইংয়ের ধরন' : 'Active Wash & Dyeing Formulations'}
                  </span>
                  <span className="text-[11px] text-[#688285]">
                    {orders.length} {language === 'bn' ? 'টি জব কার্ড' : 'job cards tracked'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(new Set(orders.map(o => o.washType))).map((type, idx) => {
                    const count = orders.filter(o => o.washType === type).length;
                    return (
                      <span 
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#D9EAEB] text-xs font-medium text-[#17383B] shadow-2xs"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0B9FA5]" />
                        {type}
                        <span className="px-1.5 py-0.2 rounded-md bg-[#DDF4F3] text-[#0B9FA5] font-bold text-[10px]">
                          {formatNumber(count, language)}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Machine & Vessel Floor Allocation (5 cols) */}
        <div className="lg:col-span-5">
          <GlassCard padding="lg" className="h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-[#0B9FA5]" />
                    <h2 className="text-base sm:text-lg font-bold text-[#17383B]">
                      {t('machineUtilization')}
                    </h2>
                  </div>
                  <p className="text-xs text-[#688285] mt-0.5">
                    {language === 'bn' ? 'ফ্যাক্টরি ড্রাম ও ডাইং ভেসেল বরাদ্দ' : 'Floor machines, drums & current loaded batches'}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#DDF4F3] text-[#0B9FA5] text-xs font-bold">
                  {machineList.filter(m => m.isOccupied).length} / {machineList.length} {t('machineOccupancy')}
                </span>
              </div>

              {/* Machine Cards */}
              <div className="space-y-2.5">
                {machineList.map(machine => (
                  <div 
                    key={machine.id}
                    className={`p-3 rounded-xl border transition-all ${
                      machine.isOccupied 
                        ? 'bg-white border-[#16B8B0]/40 shadow-xs' 
                        : 'bg-[#F9FBFC] border-[#E6F0F1] opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-[#17383B] bg-[#EAF6F7] px-1.5 py-0.5 rounded">
                            {machine.id}
                          </span>
                          <p className="text-xs font-bold text-[#17383B] truncate">
                            {machine.name}
                          </p>
                        </div>
                        {machine.activeJob ? (
                          <div className="mt-1 text-[11px] text-[#688285] flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="font-semibold text-[#0B9FA5]">{machine.activeJob.orderNumber}</span>
                            <span>•</span>
                            <span className="truncate">{machine.activeJob.clientName}</span>
                            <span>•</span>
                            <span className="font-bold text-[#17383B]">{formatNumber(machine.activeJob.quantityPcs, language)} pcs</span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-[#8EA3A5] mt-0.5">
                            {language === 'bn' ? 'স্ট্যান্ডবাই / পরবর্তী ব্যাচের জন্য প্রস্তুত' : 'Idle / Ready for next batch assignment'}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        {machine.activeJob ? (
                          <StatusBadge status={machine.activeJob.status} language={language} size="sm" />
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold">
                            {language === 'bn' ? 'ফাঁকা' : 'Standby'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick floor health status */}
            <div className="mt-4 pt-3 border-t border-[#E6F0F1] flex items-center justify-between text-xs text-[#688285]">
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                {t('operationalEfficiency')}: <strong>94.2%</strong>
              </span>
              <span className="text-[#229A73] font-bold">
                ✓ Steam Boiler Line OK
              </span>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* 4. Second Grid: Recent Job Cards & Active Timeline / Chemical Watch */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Job Cards Table (8 cols) */}
        <div className="lg:col-span-8">
          <GlassCard padding="lg" className="h-full flex flex-col justify-between">
            <div>
              {/* Header with quick filter tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#E6F0F1]">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#17383B]">
                    {t('recentJobCards')}
                  </h2>
                  <p className="text-xs text-[#688285]">
                    {language === 'bn' ? 'ফ্যাক্টরির চলমান ও সম্পন্ন হওয়া সাম্প্রতিক লটসমূহ' : 'Live status, assigned machines & delivery timelines'}
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 p-1 bg-[#F1FAFA] rounded-xl border border-[#D9EAEB]">
                  <button
                    type="button"
                    onClick={() => setOrderFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      orderFilter === 'all' 
                        ? 'bg-white text-[#0B9FA5] shadow-xs' 
                        : 'text-[#688285] hover:text-[#17383B]'
                    }`}
                  >
                    {t('allStages')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderFilter('processing')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      orderFilter === 'processing' 
                        ? 'bg-white text-[#0B9FA5] shadow-xs' 
                        : 'text-[#688285] hover:text-[#17383B]'
                    }`}
                  >
                    {t('washing')} / {t('dyeing')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderFilter('ready')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      orderFilter === 'ready' 
                        ? 'bg-white text-[#0B9FA5] shadow-xs' 
                        : 'text-[#688285] hover:text-[#17383B]'
                    }`}
                  >
                    {t('ready_for_delivery')}
                  </button>
                </div>
              </div>

              {/* Orders Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E6F0F1] text-[#8EA3A5] font-bold">
                      <th className="pb-3 px-2.5">Job / Style</th>
                      <th className="pb-3 px-2.5">Client</th>
                      <th className="pb-3 px-2.5">Wash / Shade</th>
                      <th className="pb-3 px-2.5 text-center">Batch / Machine</th>
                      <th className="pb-3 px-2.5 text-right">Quantity</th>
                      <th className="pb-3 px-2.5 text-center">Status</th>
                      <th className="pb-3 px-2.5 text-right">Delivery Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1FAFA]">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-[#8EA3A5]">
                          <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p>{t('noActiveOrders')}</p>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map(order => (
                        <tr key={order.id} className="hover:bg-[#F1FAFA]/70 transition-colors group">
                          <td className="py-3 px-2.5">
                            <span className="font-mono font-bold text-[#17383B] block">
                              {order.orderNumber}
                            </span>
                            <span className="text-[11px] text-[#8EA3A5]">
                              {order.styleNo} ({order.garmentType})
                            </span>
                          </td>
                          <td className="py-3 px-2.5 font-semibold text-[#17383B]">
                            {order.clientName}
                          </td>
                          <td className="py-3 px-2.5">
                            <span className="font-medium text-[#17383B] block">{order.washType}</span>
                            <span className="text-[10px] text-[#688285]">{order.colorShade}</span>
                          </td>
                          <td className="py-3 px-2.5 text-center">
                            <span className="px-2 py-0.5 rounded-md bg-[#EAF6F7] text-[#0B9FA5] font-mono font-bold text-[10px]">
                              {order.machineNo || 'UNASSIGNED'}
                            </span>
                          </td>
                          <td className="py-3 px-2.5 text-right font-black text-[#17383B]">
                            {formatNumber(order.quantityPcs, language)} <span className="text-[10px] font-normal text-[#8EA3A5]">pcs</span>
                          </td>
                          <td className="py-3 px-2.5 text-center">
                            <StatusBadge status={order.status} language={language} size="sm" />
                          </td>
                          <td className="py-3 px-2.5 text-right">
                            <span className="font-semibold text-[#17383B] block">{order.deliveryDate}</span>
                            {order.priority === 'urgent' && (
                              <span className="text-[9px] font-bold text-[#C83F57] uppercase bg-rose-50 px-1.5 py-0.2 rounded">
                                {t('urgentPriority')}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer link */}
            <div className="pt-3.5 mt-3 border-t border-[#E6F0F1] flex items-center justify-between text-xs">
              <span className="text-[#688285]">
                {language === 'bn' ? `মোট ${orders.length} টি অর্ডারের মধ্যে ${filteredOrders.length} টি দেখানো হচ্ছে` : `Showing ${filteredOrders.length} of ${orders.length} total orders`}
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab('orders')}
                className="font-bold text-[#0B9FA5] hover:text-[#078A90] flex items-center gap-1"
              >
                <span>{t('viewAllOrders')}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Live Activity Feed & Stock Watch (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Chemical Stock Alerts Widget */}
          <GlassCard padding="lg" className="border-[#D9EAEB]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-[#0B9FA5]" />
                <h3 className="text-sm font-bold text-[#17383B]">
                  {t('chemicalStockWatch')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('inventory')}
                className="text-xs font-bold text-[#0B9FA5] hover:underline"
              >
                {t('viewAllChemicals')}
              </button>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#E5F8F1] border border-[#38C99A]/30 text-[#229A73] text-xs font-semibold flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{t('allStockSafe')}</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {lowStockItems.map(item => (
                  <div 
                    key={item.id}
                    className="p-3 rounded-xl bg-[#FFF3DF]/70 border border-[#F3B562]/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#17383B]">{item.name}</p>
                      <p className="text-[10px] text-[#688285]">
                        {item.category} • {item.location || 'Chemical Rack'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-[#C47D1C] block">
                        {formatNumber(item.currentStockKg, language)} {item.unit}
                      </span>
                      <span className="text-[9px] text-[#8EA3A5]">
                        Min: {formatNumber(item.minAlertLevel, language)} {item.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Real-time Activity Feed */}
          <GlassCard padding="lg" className="border-[#D9EAEB]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#0B9FA5]" />
                <h3 className="text-sm font-bold text-[#17383B]">
                  {t('liveFactoryActivity')}
                </h3>
              </div>
              <span className="text-[10px] font-bold text-[#229A73] bg-[#E5F8F1] px-2 py-0.5 rounded-full">
                LIVE
              </span>
            </div>

            <div className="space-y-3">
              {activityFeed.map((item, idx) => (
                <div key={item.id} className="flex items-start gap-2.5 text-xs pb-2.5 border-b border-[#F1FAFA] last:border-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-[#0B9FA5] mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#17383B] truncate">{item.title}</p>
                    <p className="text-[11px] text-[#688285] line-clamp-1">{item.subtitle}</p>
                  </div>
                  <span className="text-[10px] text-[#8EA3A5] whitespace-nowrap shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* 5. Financial Liquidity & Accounts Snapshot */}
      <GlassCard padding="lg" className="border-[#D9EAEB]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#E6F0F1]">
          <div>
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-[#0B9FA5]" />
              <h2 className="text-base font-bold text-[#17383B]">
                {t('financialSnapshot')}
              </h2>
            </div>
            <p className="text-xs text-[#688285]">
              {language === 'bn' ? 'ক্যাশ ব্যালেন্স, ব্যাংক অ্যাকাউন্ট ও লেজার স্থিতি' : 'Bank balances, floor petty cash & working capital reserves'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('accounts')}
            className="text-xs font-bold text-[#0B9FA5] hover:text-[#078A90] flex items-center gap-1"
          >
            <span>{t('viewAllAccounts')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map(acc => (
            <div key={acc.id} className="p-3.5 rounded-xl bg-[#F9FBFC] border border-[#E6F0F1]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-[#688285] uppercase truncate">
                  {acc.accountType}
                </span>
                <span className="w-2 h-2 rounded-full bg-[#229A73]" />
              </div>
              <p className="font-bold text-xs text-[#17383B] truncate mb-2" title={acc.accountName}>
                {acc.accountName}
              </p>
              <div className="text-base sm:text-lg font-black text-[#0B9FA5]">
                {formatCurrency(acc.currentBalance, language)}
              </div>
              {acc.accountNumber && (
                <p className="text-[10px] text-[#8EA3A5] font-mono mt-1">
                  A/C: {acc.accountNumber}
                </p>
              )}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};
