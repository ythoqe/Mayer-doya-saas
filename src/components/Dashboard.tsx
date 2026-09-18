import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import { GlassCard } from './ui/GlassCard';
import { StatusBadge } from './ui/StatusBadge';
import { formatCurrency, formatNumber } from '../utils/translation';
import { getCategoryLabel } from '../utils/chemicalCategories';
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
  Info,
  Banknote,
  ArrowDownLeft,
  Coins
} from 'lucide-react';
import { motion } from 'motion/react';

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
    return orders.filter(o => ['lot_received', 'batch_assigned', 'washing', 'dyeing', 'hydro', 'drying', 'finishing', 'qc_passed', 'ready_for_delivery'].includes(o.status));
  }, [orders]);

  const totalPiecesInProcess = useMemo(() => {
    return activeOrdersInFloor.reduce((sum, o) => sum + (o.quantityPcs || 0), 0);
  }, [activeOrdersInFloor]);

  // Production Pipeline Stage Breakdown: ৩টি সুনির্দিষ্ট ধাপ (পেন্ডিং, ওয়াশিং, ডেলিভারি)
  const stageStats = useMemo(() => {
    const stages: { 
      id: string; 
      statuses: OrderStatus[]; 
      labelBn: string; 
      labelEn: string; 
      icon: React.ElementType; 
      color: string; 
      bg: string;
      barColor: string;
      descBn: string;
      descEn: string;
    }[] = [
      { 
        id: 'stage-pending',
        statuses: ['pending', 'lot_received'], 
        labelBn: 'পেন্ডিং', 
        labelEn: 'Pending', 
        icon: Clock, 
        color: 'text-amber-600', 
        bg: 'bg-amber-50',
        barColor: 'bg-amber-500',
        descBn: 'লট গ্রহণ ও অপেক্ষমাণ লট',
        descEn: 'Lot intake & waiting'
      },
      { 
        id: 'stage-washing',
        statuses: ['washing', 'batch_assigned', 'dyeing', 'hydro', 'drying', 'finishing', 'qc_passed', 'ready_for_delivery'], 
        labelBn: 'ওয়াশিং', 
        labelEn: 'Washing', 
        icon: Droplets, 
        color: 'text-[#0B9FA5]', 
        bg: 'bg-[#DDF4F3]',
        barColor: 'bg-[#0B9FA5]',
        descBn: 'ড্রাম ওয়াশ, ডাইং ও ফিনিশিং লাইন',
        descEn: 'Washing, dyeing & finishing'
      },
      { 
        id: 'stage-delivered',
        statuses: ['delivered'], 
        labelBn: 'ডেলিভারি', 
        labelEn: 'Delivery', 
        icon: CheckCircle2, 
        color: 'text-[#229A73]', 
        bg: 'bg-[#E5F8F1]',
        barColor: 'bg-[#229A73]',
        descBn: 'চালান সম্পন্ন ও ডেলিভার্ড',
        descEn: 'Delivered & invoiced'
      },
    ];

    const totalOrdersCount = orders.length || 1;

    return stages.map(st => {
      const matchingOrders = orders.filter(o => st.statuses.includes(o.status));
      const count = matchingOrders.length;
      const yards = matchingOrders.reduce((sum, o) => sum + (o.finishingYards || o.greyYards || o.quantityPcs || 0), 0);
      const percentage = Math.round((count / totalOrdersCount) * 100);
      return {
        ...st,
        count,
        yards,
        percentage
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

      {/* 2.5. Live Financial & Cash Liquidity Overview */}
      <div className="w-full">
        <GlassCard padding="md" className="border-[#D9EAEB] bg-gradient-to-r from-white via-[#F8FBFA] to-[#F1FAFA]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#E6F0F1]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#E5F8F1] text-[#229A73]">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#17383B]">
                  {language === 'bn' ? 'ফ্যাক্টরি আর্থিক ও ক্যাশ ব্যালেন্স সামারি' : 'Factory Financial & Cash Liquidity'}
                </h3>
                <p className="text-[11px] text-[#688285]">
                  {language === 'bn' ? 'সকল একাউন্ট, চলতি মাসের আয়-ব্যয় এবং দেনা-পাওনা রিয়েল-টাইম হিসেব' : 'Real-time account balances, monthly cash flow, and receivables/payables'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab('accounts')}
                className="text-xs font-bold text-[#0B9FA5] hover:text-[#078A90] px-3 py-1.5 rounded-lg bg-white border border-[#D9EAEB] shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>{language === 'bn' ? 'একাউন্টস লেজার দেখুন' : 'Accounts Ledger'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3">
            {/* Total Liquidity */}
            <div 
              onClick={() => onNavigateTab('accounts')}
              className="p-3 rounded-xl bg-white border border-[#E6F0F1] hover:border-[#0B9FA5] transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center justify-between text-[11px] text-[#688285] font-semibold mb-1">
                <span>{language === 'bn' ? 'মোট ক্যাশ ব্যালেন্স' : 'Total Cash & Bank'}</span>
                <Coins className="w-3.5 h-3.5 text-[#0B9FA5]" />
              </div>
              <p className="text-base font-black text-[#17383B]">
                {formatCurrency(metrics.netCashBalance, language)}
              </p>
              <p className="text-[10px] text-[#8EA3A5] mt-0.5 truncate">
                {language === 'bn' ? `ক্যাশ: ${formatCurrency(metrics.cashBalance, language)}` : `Cash: ${formatCurrency(metrics.cashBalance, language)}`}
              </p>
            </div>

            {/* Monthly Inflow */}
            <div className="p-3 rounded-xl bg-white border border-[#E6F0F1] shadow-2xs">
              <div className="flex items-center justify-between text-[11px] text-[#688285] font-semibold mb-1">
                <span>{language === 'bn' ? 'চলতি মাসের জমা (Inflow)' : 'Month Inflow'}</span>
                <ArrowDownLeft className="w-3.5 h-3.5 text-[#229A73]" />
              </div>
              <p className="text-base font-black text-[#229A73]">
                +{formatCurrency(metrics.monthlyRevenue, language)}
              </p>
              <p className="text-[10px] text-[#688285] mt-0.5">
                {language === 'bn' ? 'ক্লায়েন্ট পেমেন্ট ও জমা' : 'Client collections'}
              </p>
            </div>

            {/* Monthly Outflow */}
            <div className="p-3 rounded-xl bg-white border border-[#E6F0F1] shadow-2xs">
              <div className="flex items-center justify-between text-[11px] text-[#688285] font-semibold mb-1">
                <span>{language === 'bn' ? 'চলতি মাসের খরচ (Outflow)' : 'Month Outflow'}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#EA7185]" />
              </div>
              <p className="text-base font-black text-[#EA7185]">
                -{formatCurrency(metrics.monthlyExpenses, language)}
              </p>
              <p className="text-[10px] text-[#688285] mt-0.5">
                {language === 'bn' ? 'বিল, বেতন ও কেমিক্যাল' : 'Expenses & purchases'}
              </p>
            </div>

            {/* Net Monthly Cashflow */}
            <div className="p-3 rounded-xl bg-white border border-[#E6F0F1] shadow-2xs">
              <div className="flex items-center justify-between text-[11px] text-[#688285] font-semibold mb-1">
                <span>{language === 'bn' ? 'নেট ক্যাশ ফ্লো' : 'Net Cash Flow'}</span>
                <TrendingUp className="w-3.5 h-3.5 text-[#6357E8]" />
              </div>
              <p className={`text-base font-black ${metrics.netCashFlow >= 0 ? 'text-[#229A73]' : 'text-[#EA7185]'}`}>
                {metrics.netCashFlow >= 0 ? '+' : ''}{formatCurrency(metrics.netCashFlow, language)}
              </p>
              <p className="text-[10px] text-[#688285] mt-0.5">
                {metrics.netCashFlow >= 0 ? (language === 'bn' ? 'উদ্বৃত্ত ক্যাশ' : 'Net surplus') : (language === 'bn' ? 'ঘাটতি ক্যাশ' : 'Net deficit')}
              </p>
            </div>

            {/* Client Receivables */}
            <div 
              onClick={() => onNavigateTab('clients')}
              className="p-3 rounded-xl bg-white border border-[#E6F0F1] hover:border-[#EA7185] transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center justify-between text-[11px] text-[#688285] font-semibold mb-1">
                <span>{language === 'bn' ? 'মার্কেট বাকি (Receivables)' : 'Receivables'}</span>
                <Receipt className="w-3.5 h-3.5 text-[#EA7185]" />
              </div>
              <p className="text-base font-black text-[#EA7185]">
                {formatCurrency(metrics.totalReceivables, language)}
              </p>
              <p className="text-[10px] text-[#688285] mt-0.5">
                {formatNumber(metrics.totalClients, language)} {language === 'bn' ? 'জন ক্লায়েন্ট' : 'clients'}
              </p>
            </div>

            {/* Supplier Payables */}
            <div 
              onClick={() => onNavigateTab('suppliers')}
              className="p-3 rounded-xl bg-white border border-[#E6F0F1] hover:border-[#C47D1C] transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center justify-between text-[11px] text-[#688285] font-semibold mb-1">
                <span>{language === 'bn' ? 'মহাজন বাকি (Payables)' : 'Payables'}</span>
                <Banknote className="w-3.5 h-3.5 text-[#C47D1C]" />
              </div>
              <p className="text-base font-black text-[#C47D1C]">
                {formatCurrency(metrics.supplierDue, language)}
              </p>
              <p className="text-[10px] text-[#688285] mt-0.5">
                {formatNumber(suppliers.length, language)} {language === 'bn' ? 'জন মহাজন/সাপ্লায়ার' : 'suppliers'}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* 3. Main Section: Production Pipeline Breakdown */}
      <div className="w-full">
        <GlassCard padding="lg" className="w-full">
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
                  {language === 'bn' ? 'ফ্যাক্টরির ৩টি মূল প্রসেসিং ধাপ (পেন্ডিং, ওয়াশিং, ডেলিভারি)' : 'Garment throughput across 3 pipeline stages (Pending, Washing, Delivery)'}
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

            {/* Stage Progress Grid - Exactly 3 stages */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              {stageStats.map(stage => {
                const Icon = stage.icon;
                const label = language === 'bn' ? stage.labelBn : stage.labelEn;
                const desc = language === 'bn' ? stage.descBn : stage.descEn;
                return (
                  <div 
                    key={stage.id}
                    onClick={() => onNavigateTab?.('orders')}
                    className={`p-4 rounded-2xl border border-[#E6F0F1] transition-all hover:border-[#0B9FA5]/50 hover:bg-[#F1FAFA]/60 cursor-pointer ${stage.count > 0 ? 'bg-white shadow-2xs' : 'bg-slate-50/50 opacity-70'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-xl ${stage.bg} ${stage.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-black text-[#17383B]">
                        {formatNumber(stage.count, language)}
                        <span className="text-xs font-normal text-[#8EA3A5] ml-1">{language === 'bn' ? 'লট' : 'lots'}</span>
                      </span>
                    </div>
                    <p className="text-sm font-black text-[#17383B]" title={label}>
                      {label}
                    </p>
                    <p className="text-[11px] text-[#8EA3A5] mb-2 truncate">
                      {desc}
                    </p>
                    <div className="flex items-center justify-between text-xs text-[#688285] mt-1">
                      <span className="font-semibold text-[#17383B]">{formatNumber(stage.yards, language)} <span className="text-[10px] text-[#8EA3A5] font-normal">{language === 'bn' ? 'গজ' : 'yds'}</span></span>
                      <span className="text-xs font-bold text-[#0B9FA5]">{stage.percentage}%</span>
                    </div>
                    {/* Mini visual indicator */}
                    <div className="w-full bg-[#E6F0F1] h-2 rounded-full mt-2.5 overflow-hidden">
                      <div 
                        className={`${stage.barColor} h-full rounded-full transition-all duration-500`} 
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
                        {getCategoryLabel(item.category, language)} • {item.location || 'Chemical Rack'}
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
