import React, { useState } from 'react';
import { Order, OrderStatus, Language } from '../../types';
import { useERP } from '../../context/ERPContext';
import { StatusBadge } from '../ui/StatusBadge';
import { ProductionTimeline, PIPELINE_STAGES } from './ProductionTimeline';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { 
  X, 
  Printer, 
  Edit2, 
  Trash2, 
  Calendar, 
  User, 
  Building2, 
  Phone, 
  MapPin, 
  Layers, 
  Droplets, 
  Clock, 
  AlertTriangle, 
  ChevronRight,
  Sparkles,
  DollarSign,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onEdit: (order: Order) => void;
  onPrint: (order: Order) => void;
  onDelete: (orderId: string) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
  onEdit,
  onPrint,
  onDelete
}) => {
  const { clients, updateOrderStatus, language, t } = useERP();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const client = clients.find(c => c.id === order.clientId);

  // Delivery status calculation
  const getDeliveryStatus = () => {
    if (order.status === 'delivered') {
      return { text: t('delivered'), color: 'text-[#229A73]', bg: 'bg-[#E5F8F1]' };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(order.deliveryDate);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);

    if (diffDays < 0) {
      return { 
        text: `${Math.abs(diffDays)} ${t('daysOverdue')}`, 
        color: 'text-[#C83F57]', 
        bg: 'bg-rose-50',
        isOverdue: true 
      };
    } else if (diffDays === 0) {
      return { text: t('dueToday'), color: 'text-amber-600', bg: 'bg-amber-50' };
    } else {
      return { text: `${diffDays} ${t('daysLeft')}`, color: 'text-[#0B9FA5]', bg: 'bg-[#DDF4F3]' };
    }
  };

  const deliveryStatus = getDeliveryStatus();

  // Find next logical stage
  const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.key === order.status);
  const nextStage = currentStageIndex >= 0 && currentStageIndex < PIPELINE_STAGES.length - 1 
    ? PIPELINE_STAGES[currentStageIndex + 1] 
    : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#17383B]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-4xl bg-white rounded-[26px] border border-[#D9EAEB] shadow-[0_25px_70px_rgba(23,56,59,0.18)] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Top Header */}
        <div className="px-6 py-5 border-b border-[#E6F0F1] flex flex-wrap items-center justify-between gap-3 bg-[#F1FAFA]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center font-mono font-bold text-sm shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-[#17383B] text-lg sm:text-xl tracking-tight">
                  {order.orderNumber}
                </h2>
                <StatusBadge status={order.status} language={language} size="sm" />
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  order.priority === 'urgent' ? 'bg-rose-50 text-[#C83F57] border border-rose-200' :
                  order.priority === 'high' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {t(order.priority)}
                </span>
              </div>
              <p className="text-xs text-[#688285] mt-0.5">
                {t('jobCardDetails')} • {order.styleNo} ({order.garmentType})
              </p>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPrint(order)}
              className="px-3 py-2 rounded-xl bg-white hover:bg-[#F1FAFA] text-[#17383B] text-xs font-bold border border-[#D9EAEB] transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-4 h-4 text-[#0B9FA5]" />
              <span className="hidden sm:inline">{t('printJobCard')}</span>
            </button>

            <button
              type="button"
              onClick={() => onEdit(order)}
              className="px-3 py-2 rounded-xl bg-white hover:bg-[#F1FAFA] text-[#17383B] text-xs font-bold border border-[#D9EAEB] transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Edit2 className="w-4 h-4 text-[#F3B562]" />
              <span className="hidden sm:inline">{t('edit')}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-xl hover:bg-[#FDECEF] text-[#8EA3A5] hover:text-[#EA7185] transition-colors"
              title={t('delete')}
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white text-[#8EA3A5] hover:text-[#17383B] transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 sm:p-7 space-y-6 overflow-y-auto custom-scrollbar">
          {/* 1. Production Stage Timeline & Fast Advance */}
          <div className="p-5 rounded-2xl bg-[#F9FBFC] border border-[#E6F0F1] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6F0F1]">
              <div>
                <h3 className="font-bold text-sm text-[#17383B] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0B9FA5]" />
                  {t('productionProgress')}
                </h3>
                <p className="text-xs text-[#688285]">
                  Click any stage below to update live status or advance to next machine line.
                </p>
              </div>

              {nextStage && order.status !== 'cancelled' && (
                <button
                  type="button"
                  onClick={() => updateOrderStatus(order.id, nextStage.key)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0B9FA5] hover:bg-[#078A90] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>{t('stageAdvance')}:</span>
                  <strong>{t(nextStage.labelKey)}</strong>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <ProductionTimeline
              currentStatus={order.status}
              onStatusChange={(newStatus) => updateOrderStatus(order.id, newStatus)}
              language={language}
              interactive={true}
            />
          </div>

          {/* 2. Client & Schedule Information Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Client Card */}
            <div className="p-4 rounded-2xl border border-[#D9EAEB] bg-white space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#688285] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#0B9FA5]" />
                {t('clientInfo')}
              </span>

              {client ? (
                <div className="space-y-1.5 text-xs">
                  <p className="text-sm font-extrabold text-[#17383B]">
                    {client.companyName}
                  </p>
                  <p className="text-[#688285] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#8EA3A5]" />
                    {client.name}
                  </p>
                  <p className="text-[#688285] flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#8EA3A5]" />
                    {client.phone}
                  </p>
                  {client.address && (
                    <p className="text-[#8EA3A5] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#8EA3A5] shrink-0" />
                      <span className="line-clamp-1">{client.address}</span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#8EA3A5] italic">
                  {t('clientNotAvailable')} ({order.clientName})
                </p>
              )}
            </div>

            {/* Production Schedule & Timeline Card */}
            <div className="p-4 rounded-2xl border border-[#D9EAEB] bg-white space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#688285] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0B9FA5]" />
                {t('scheduleInfo')}
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#688285]">{t('receivedDateLabel')}:</span>
                  <span className="font-semibold text-[#17383B]">{order.receivedDate || order.createdAt}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#688285]">{t('deliveryDateLabel')}:</span>
                  <span className="font-extrabold text-[#17383B]">{order.deliveryDate}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#F1FAFA]">
                  <span className="text-[#688285]">{t('deliveryDue')}:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${deliveryStatus.bg} ${deliveryStatus.color}`}>
                    {deliveryStatus.text}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Job Recipe & Formulation Parameters */}
          <div className="p-5 rounded-2xl border border-[#D9EAEB] bg-white space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#688285] flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-[#0B9FA5]" />
              {t('jobInfo')}
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-[#F9FBFC] border border-[#E6F0F1]">
                <span className="text-[10px] text-[#8EA3A5] block">{t('garmentTypeLabel')}</span>
                <strong className="text-xs text-[#17383B] block mt-0.5">{order.garmentType}</strong>
              </div>

              <div className="p-3 rounded-xl bg-[#F9FBFC] border border-[#E6F0F1]">
                <span className="text-[10px] text-[#8EA3A5] block">{t('washTypeLabel')}</span>
                <strong className="text-xs text-[#0B9FA5] block mt-0.5">{order.washType}</strong>
              </div>

              <div className="p-3 rounded-xl bg-[#F9FBFC] border border-[#E6F0F1]">
                <span className="text-[10px] text-[#8EA3A5] block">{t('colorShadeLabel')}</span>
                <strong className="text-xs text-[#17383B] block mt-0.5">{order.colorShade}</strong>
              </div>

              <div className="p-3 rounded-xl bg-[#F9FBFC] border border-[#E6F0F1]">
                <span className="text-[10px] text-[#8EA3A5] block">{t('batchNumberLabel')}</span>
                <strong className="text-xs font-mono text-[#17383B] block mt-0.5">
                  {order.batchNumber || 'BATCH-01'} / {order.machineNo || 'WASH-M01'}
                </strong>
              </div>
            </div>

            {order.remarks && (
              <div className="p-3.5 rounded-xl bg-[#FFF3DF]/60 border border-[#F3B562]/30 text-xs">
                <span className="font-bold text-[#C47D1C] block mb-0.5">{t('remarksLabel')}:</span>
                <p className="text-[#17383B]">{order.remarks}</p>
              </div>
            )}
          </div>

          {/* 4. Commercial & Financials Summary Grid */}
          <div className="p-5 rounded-2xl border border-[#D9EAEB] bg-gradient-to-r from-white via-[#F9FBFC] to-[#F1FAFA] space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#688285] flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#0B9FA5]" />
              {t('financialSummary')}
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white border border-[#D9EAEB]">
                <span className="text-[10px] text-[#8EA3A5] block">{t('quantityPcs')}</span>
                <strong className="text-sm sm:text-base font-black text-[#17383B] block mt-0.5">
                  {formatNumber(order.quantityPcs, language)} <span className="text-xs font-normal text-[#8EA3A5]">pcs</span>
                </strong>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#D9EAEB]">
                <span className="text-[10px] text-[#8EA3A5] block">{t('unitRateLabel')}</span>
                <strong className="text-sm sm:text-base font-black text-[#17383B] block mt-0.5">
                  {formatCurrency(order.unitRate, language)}
                </strong>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#D9EAEB]">
                <span className="text-[10px] text-[#8EA3A5] block">{t('advanceAmountLabel')}</span>
                <strong className="text-sm sm:text-base font-black text-[#229A73] block mt-0.5">
                  {formatCurrency(order.advanceAmount, language)}
                </strong>
              </div>

              <div className="p-3 rounded-xl bg-[#DDF4F3]/50 border border-[#16B8B0]/30">
                <span className="text-[10px] text-[#0B9FA5] font-bold block">{t('dueAmountLabel')}</span>
                <strong className="text-sm sm:text-base font-black text-[#0B9FA5] block mt-0.5">
                  {formatCurrency(order.dueAmount, language)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-4 bg-[#F1FAFA] border-t border-[#E6F0F1] flex items-center justify-between">
          <span className="text-xs text-[#8EA3A5] font-mono">
            ID: {order.id}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-[#D9EAEB] hover:bg-slate-50 text-[#17383B] text-xs font-bold transition-colors"
            >
              {t('closeView')}
            </button>

            <button
              type="button"
              onClick={() => onPrint(order)}
              className="px-4 py-2 rounded-xl bg-[#0B9FA5] hover:bg-[#078A90] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>{t('printJobCard')}</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Popup */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <div className="absolute inset-0 z-50 bg-[#17383B]/60 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[#D9EAEB] space-y-4"
              >
                <div className="flex items-center gap-3 text-[#EA7185]">
                  <div className="p-2.5 rounded-xl bg-[#FDECEF]">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#17383B] text-sm">{t('deleteConfirmTitle')}</h4>
                    <p className="text-xs text-[#688285]">{order.orderNumber}</p>
                  </div>
                </div>

                <p className="text-xs text-[#688285]">
                  {t('deleteConfirmDesc')}
                </p>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 text-[#17383B] text-xs font-bold"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(order.id);
                      setShowDeleteConfirm(false);
                      onClose();
                    }}
                    className="flex-1 py-2 rounded-xl bg-[#EA7185] hover:bg-[#E2536D] text-white text-xs font-bold shadow-md"
                  >
                    {t('confirmDeleteBtn')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
