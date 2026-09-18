import React from 'react';
import { Order, OrderStatus, Language } from '../../types';
import { useERP } from '../../context/ERPContext';
import { StatusBadge } from '../ui/StatusBadge';
import { PIPELINE_STAGES, getStageProgressPercentage } from './ProductionTimeline';
import { formatNumber } from '../../utils/translation';
import { 
  Package, 
  Droplets, 
  Layers, 
  Wind, 
  CheckCircle2, 
  Truck, 
  ChevronRight, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { motion } from 'motion/react';

interface ProductionBoardProps {
  orders: Order[];
  onViewOrder: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

interface LaneConfig {
  id: string;
  title: string;
  titleBn: string;
  statuses: OrderStatus[];
  icon: React.ElementType;
  color: string;
  badgeBg: string;
}

export const ProductionBoard: React.FC<ProductionBoardProps> = ({
  orders,
  onViewOrder,
  onUpdateStatus
}) => {
  const { language, t } = useERP();

  const LANES: LaneConfig[] = [
    {
      id: 'pending',
      title: 'Pending',
      titleBn: 'পেন্ডিং',
      statuses: ['pending', 'lot_received'],
      icon: Clock,
      color: 'border-amber-400 bg-amber-500/10 text-amber-700',
      badgeBg: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'washing',
      title: 'Washing',
      titleBn: 'ওয়াশিং',
      statuses: ['washing', 'batch_assigned', 'dyeing', 'hydro', 'drying', 'finishing', 'qc_passed', 'ready_for_delivery'],
      icon: Droplets,
      color: 'border-[#0B9FA5] bg-[#0B9FA5]/10 text-[#0B9FA5]',
      badgeBg: 'bg-[#DDF4F3] text-[#0B9FA5]'
    },
    {
      id: 'delivered',
      title: 'Delivered',
      titleBn: 'ডেলিভারি',
      statuses: ['delivered'],
      icon: CheckCircle2,
      color: 'border-[#38C99A] bg-[#38C99A]/10 text-[#229A73]',
      badgeBg: 'bg-[#E5F8F1] text-[#229A73]'
    }
  ];

  // Helper to advance to next stage
  const advanceStage = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    const curIdx = PIPELINE_STAGES.findIndex(s => s.key === order.status);
    if (curIdx >= 0 && curIdx < PIPELINE_STAGES.length - 1) {
      const next = PIPELINE_STAGES[curIdx + 1];
      onUpdateStatus(order.id, next.key);
    }
  };

  return (
    <div className="space-y-4">
      {/* Board Description */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-[#17383B]">
            {t('productionBoardTitle')}
          </h3>
          <p className="text-xs text-[#688285]">
            {language === 'bn' ? '৩টি মূল পাইপলাইন ধাপ: পেন্ডিং, ওয়াশিং ও ডেলিভারি' : t('productionBoardSubtitle')}
          </p>
        </div>
      </div>

      {/* Kanban Lanes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start pb-4">
        {LANES.map((lane) => {
          const laneOrders = orders.filter(o => lane.statuses.includes(o.status));
          const totalPieces = laneOrders.reduce((sum, o) => sum + (Number(o.quantityPcs) || 0), 0);
          const Icon = lane.icon;

          return (
            <div
              key={lane.id}
              className="flex flex-col bg-[#F9FBFC] rounded-2xl border border-[#D9EAEB] p-3 min-w-[220px] max-h-[calc(100vh-280px)]"
            >
              {/* Lane Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E6F0F1]">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${lane.badgeBg}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-[#17383B]">
                      {language === 'bn' ? lane.titleBn : lane.title}
                    </h4>
                    <span className="text-[10px] text-[#8EA3A5] font-medium">
                      {formatNumber(totalPieces, language)} pcs
                    </span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-xs font-black ${lane.badgeBg}`}>
                  {laneOrders.length}
                </span>
              </div>

              {/* Lane Cards Scrollable Column */}
              <div className="space-y-2.5 pt-3 overflow-y-auto custom-scrollbar flex-1 pr-0.5">
                {laneOrders.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#8EA3A5] border border-dashed border-[#D9EAEB] rounded-xl bg-white/60">
                    No active jobs
                  </div>
                ) : (
                  laneOrders.map((order) => {
                    const curIdx = PIPELINE_STAGES.findIndex(s => s.key === order.status);
                    const canAdvance = curIdx >= 0 && curIdx < PIPELINE_STAGES.length - 1;
                    const nextStage = canAdvance ? PIPELINE_STAGES[curIdx + 1] : null;
                    const progress = getStageProgressPercentage(order.status);

                    return (
                      <motion.div
                        key={order.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={() => onViewOrder(order)}
                        className="p-3.5 rounded-xl bg-white border border-[#D9EAEB] shadow-2xs hover:shadow-md hover:border-[#0B9FA5]/50 transition-all cursor-pointer space-y-2.5 group"
                      >
                        {/* Header: Order # & Priority */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-[#0B9FA5] group-hover:underline">
                            {order.orderNumber}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            order.priority === 'urgent' ? 'bg-rose-50 text-[#C83F57] border border-rose-200' :
                            order.priority === 'high' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {t(order.priority)}
                          </span>
                        </div>

                        {/* Client & Style */}
                        <div>
                          <div className="font-bold text-xs text-[#17383B] line-clamp-1">
                            {order.clientName}
                          </div>
                          <div className="text-[11px] text-[#688285] line-clamp-1">
                            {order.garmentType} • <strong className="text-[#17383B]">{order.styleNo}</strong>
                          </div>
                        </div>

                        {/* Wash Type & Quantity */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-[#F1FAFA]">
                          <span className="px-1.5 py-0.5 rounded bg-[#F1FAFA] border border-[#D9EAEB] text-[10px] text-[#688285] font-medium line-clamp-1">
                            {order.washType}
                          </span>
                          <strong className="text-xs text-[#17383B]">
                            {formatNumber(order.quantityPcs, language)} <span className="text-[10px] text-[#8EA3A5] font-normal">pcs</span>
                          </strong>
                        </div>

                        {/* Mini Progress bar */}
                        <div className="w-full bg-[#E6F0F1] h-1 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#0B9FA5] to-[#38C99A] h-full rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        {/* Fast Advance button */}
                        {nextStage && order.status !== 'delivered' && (
                          <button
                            type="button"
                            onClick={(e) => advanceStage(e, order)}
                            className="w-full py-1.5 px-2 rounded-lg bg-[#F1FAFA] hover:bg-[#0B9FA5] text-[#17383B] hover:text-white text-[10px] font-bold border border-[#D9EAEB] hover:border-[#0B9FA5] transition-all flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <span>Next: {t(nextStage.labelKey)}</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
