import React, { useState } from 'react';
import { Order, OrderStatus, Language } from '../../types';
import { useERP } from '../../context/ERPContext';
import { StatusBadge } from '../ui/StatusBadge';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { 
  Eye, 
  Edit2, 
  Printer, 
  Trash2, 
  MoreVertical, 
  Calendar, 
  ChevronRight, 
  Layers, 
  Droplets, 
  Sparkles,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrderTableProps {
  orders: Order[];
  onViewOrder: (order: Order) => void;
  onEditOrder: (order: Order) => void;
  onPrintOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  onViewOrder,
  onEditOrder,
  onPrintOrder,
  onDeleteOrder,
  onUpdateStatus
}) => {
  const { language, t } = useERP();
  const [activeMenuOrderId, setActiveMenuOrderId] = useState<string | null>(null);

  const getDeliveryStatus = (order: Order) => {
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

  const statuses: OrderStatus[] = [
    'pending',
    'washing',
    'delivered'
  ];

  if (orders.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-[#D9EAEB]">
        <div className="w-12 h-12 rounded-2xl bg-[#F1FAFA] text-[#0B9FA5] flex items-center justify-center mx-auto mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-[#17383B]">{t('noOrdersFound')}</h4>
        <p className="text-xs text-[#688285] max-w-sm mx-auto mt-1">
          {t('noOrdersDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop & Tablet Table View */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-2xl border border-[#D9EAEB] shadow-2xs">
        <table className="w-full text-left text-xs text-[#17383B]">
          <thead>
            <tr className="bg-[#F1FAFA]/80 border-b border-[#D9EAEB] text-[#688285] font-bold text-[11px] uppercase tracking-wider select-none">
              <th className="py-3.5 px-4">{t('orderNo')}</th>
              <th className="py-3.5 px-4">{t('clientCompany')}</th>
              <th className="py-3.5 px-4">{t('garmentProcess')}</th>
              <th className="py-3.5 px-4 text-right">{t('quantityPcs')}</th>
              <th className="py-3.5 px-4 text-right">{t('financials')}</th>
              <th className="py-3.5 px-4">{t('deliveryDue')}</th>
              <th className="py-3.5 px-4 text-center">{t('orderPriority')}</th>
              <th className="py-3.5 px-4">{t('orderStatusCol')}</th>
              <th className="py-3.5 px-4 text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6F0F1]">
            {orders.map((order) => {
              const delivery = getDeliveryStatus(order);

              return (
                <tr 
                  key={order.id} 
                  className="hover:bg-[#F9FBFC] transition-colors group cursor-pointer"
                  onClick={() => onViewOrder(order)}
                >
                  {/* 1. Job Card # & Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="font-mono font-extrabold text-xs text-[#0B9FA5] group-hover:underline">
                        {order.orderNumber}
                      </div>
                    </div>
                    <div className="text-[10px] text-[#8EA3A5] font-medium mt-0.5">
                      {order.receivedDate || order.createdAt}
                    </div>
                  </td>

                  {/* 2. Client & Company */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-xs text-[#17383B] line-clamp-1 max-w-[150px]">
                      {order.clientName}
                    </div>
                    <div className="text-[10px] text-[#8EA3A5] font-mono">
                      {order.batchNumber ? `Batch: ${order.batchNumber}` : `Mayer Doya Floor`}
                    </div>
                  </td>

                  {/* 3. Garment & Process */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-xs text-[#17383B] flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-[#DDF4F3] text-[#0B9FA5] font-extrabold text-[11px]">
                        {order.fabricQuality || order.washType || 'মার্কিন'}
                      </span>
                      {order.colorShade && (
                        <span className="text-[11px] text-[#688285] font-medium">
                          • {order.colorShade}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#8EA3A5] mt-1 font-mono">
                      {order.styleNo ? `Ref: ${order.styleNo}` : `Rate: ৳${order.unitRate}/গজ`}
                    </div>
                  </td>

                  {/* 4. Quantity (Gaze / Yards) */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    {(() => {
                      const grey = order.greyYards || order.quantityPcs || 0;
                      const finish = order.finishingYards || 0;
                      const diff = finish > 0 ? finish - grey : 0;
                      const diffPct = finish > 0 && grey > 0 ? ((Math.abs(diff) / grey) * 100).toFixed(1) : '0';
                      const isLoss = finish > 0 && diff < 0;

                      return (
                        <>
                          <div className="font-extrabold text-xs text-[#17383B] flex items-center justify-end gap-1">
                            <span>
                              {formatNumber(finish > 0 ? finish : grey, language)}
                            </span>
                            <span className="text-[10px] text-[#0B9FA5] font-bold">{language === 'bn' ? 'গজ' : 'Yds'}</span>
                            {isLoss && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-50 border border-amber-200 text-[#C47D1C] font-black text-[10px]" title={language === 'bn' ? 'কাপড় কম হয়েছে' : 'Fabric Shortage'}>
                                -{formatNumber(diffPct, language)}%
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#8EA3A5] font-medium mt-0.5">
                            {language === 'bn' ? 'গেরে:' : 'Grey:'} {formatNumber(grey, language)}
                            {finish > 0 ? ` | ফিনিশ: ${formatNumber(finish, language)}` : ''}
                          </div>
                        </>
                      );
                    })()}
                  </td>

                  {/* 5. Financials */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="font-bold text-xs text-[#17383B]">
                      {formatCurrency(order.totalAmount, language)}
                    </div>
                    <div className="text-[10px] text-[#229A73] font-medium mt-0.5">
                      Adv: {formatCurrency(order.advanceAmount, language)}
                    </div>
                  </td>

                  {/* 6. Delivery Due */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold text-xs text-[#17383B]">
                      {order.deliveryDate}
                    </div>
                    <span className={`inline-block px-1.5 py-0.2 rounded-md text-[10px] font-bold mt-0.5 ${delivery.bg} ${delivery.color}`}>
                      {delivery.text}
                    </span>
                  </td>

                  {/* 7. Priority */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      order.priority === 'urgent' ? 'bg-rose-50 text-[#C83F57] border border-rose-200' :
                      order.priority === 'high' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-[#F1FAFA] text-[#688285]'
                    }`}>
                      {t(order.priority)}
                    </span>
                  </td>

                  {/* 8. Status & Quick Stage Dropdown */}
                  <td 
                    className="py-3.5 px-4 whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <select
                      value={order.status}
                      onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                      className="px-2 py-1 text-xs font-semibold rounded-lg bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] hover:border-[#0B9FA5] cursor-pointer focus:outline-none transition-colors"
                    >
                      {statuses.map(st => (
                        <option key={st} value={st}>
                          {t(st)}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* 9. Action Buttons */}
                  <td 
                    className="py-3.5 px-4 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onViewOrder(order)}
                        className="p-1.5 rounded-lg hover:bg-[#F1FAFA] text-[#0B9FA5] transition-colors"
                        title={t('jobCardDetails')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onPrintOrder(order)}
                        className="p-1.5 rounded-lg hover:bg-[#F1FAFA] text-[#688285] hover:text-[#17383B] transition-colors"
                        title={t('printJobCard')}
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditOrder(order)}
                        className="p-1.5 rounded-lg hover:bg-[#FFF3DF] text-[#C47D1C] transition-colors"
                        title={t('edit')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteOrder(order.id)}
                        className="p-1.5 rounded-lg hover:bg-[#FDECEF] text-[#EA7185] transition-colors"
                        title={t('delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive Card List */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {orders.map((order) => {
          const delivery = getDeliveryStatus(order);

          return (
            <div
              key={order.id}
              onClick={() => onViewOrder(order)}
              className="p-4 rounded-2xl bg-white border border-[#D9EAEB] shadow-2xs active:scale-[0.99] transition-all space-y-3"
            >
              {/* Header: Order # & Status Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs text-[#0B9FA5]">
                    {order.orderNumber}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                    order.priority === 'urgent' ? 'bg-rose-50 text-[#C83F57]' :
                    order.priority === 'high' ? 'bg-amber-50 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {t(order.priority)}
                  </span>
                </div>

                <StatusBadge status={order.status} language={language} size="sm" />
              </div>

              {/* Garment Details & Client */}
              <div>
                <h4 className="font-extrabold text-sm text-[#17383B]">
                  {order.clientName}
                </h4>
                <p className="text-xs text-[#688285] mt-0.5">
                  {order.garmentType} • <strong className="text-[#17383B]">{order.styleNo}</strong>
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-[#F1FAFA] border border-[#D9EAEB] text-[10px] font-medium text-[#688285]">
                    {order.washType}
                  </span>
                  <span className="text-[10px] text-[#8EA3A5]">
                    {order.colorShade}
                  </span>
                </div>
              </div>

              {/* Quantity, Amount & Due */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#F9FBFC] border border-[#E6F0F1] text-center text-xs">
                <div>
                  <span className="text-[10px] text-[#8EA3A5] block">{language === 'bn' ? 'মোট গজ' : 'Total Yds'}</span>
                  <strong className="font-bold text-[#17383B]">
                    {formatNumber(order.finishingYards && order.finishingYards > 0 ? order.finishingYards : (order.greyYards || order.quantityPcs), language)} {language === 'bn' ? 'গজ' : 'Yds'}
                  </strong>
                  {order.finishingYards && order.finishingYards > 0 && order.greyYards && order.finishingYards < order.greyYards && (
                    <span className="text-[9px] text-[#C47D1C] font-black block mt-0.5">
                      (-{formatNumber((((order.greyYards - order.finishingYards) / order.greyYards) * 100).toFixed(1), language)}% কম)
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-[#8EA3A5] block">Total</span>
                  <strong className="font-bold text-[#17383B]">
                    {formatCurrency(order.totalAmount, language)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#0B9FA5] font-bold block">{t('deliveryDue')}</span>
                  <strong className={`text-[10px] font-extrabold ${delivery.color}`}>
                    {delivery.text}
                  </strong>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div 
                className="flex items-center justify-between pt-2 border-t border-[#F1FAFA]"
                onClick={(e) => e.stopPropagation()}
              >
                <select
                  value={order.status}
                  onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                  className="px-2 py-1 text-xs font-semibold rounded-lg bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B]"
                >
                  {statuses.map(st => (
                    <option key={st} value={st}>{t(st)}</option>
                  ))}
                </select>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onPrintOrder(order)}
                    className="p-2 rounded-lg bg-[#F1FAFA] text-[#688285]"
                    title={t('printJobCard')}
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditOrder(order)}
                    className="p-2 rounded-lg bg-[#FFF3DF] text-[#C47D1C]"
                    title={t('edit')}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteOrder(order.id)}
                    className="p-2 rounded-lg bg-[#FDECEF] text-[#EA7185]"
                    title={t('delete')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
