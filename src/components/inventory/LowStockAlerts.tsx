import React from 'react';
import { useERP } from '../../context/ERPContext';
import { InventoryItem } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { AlertTriangle, AlertCircle, ArrowUpRight, CheckCircle2, ShieldCheck, Plus } from 'lucide-react';
import { formatNumber } from '../../utils/translation';

interface LowStockAlertsProps {
  onRestockItem: (item: InventoryItem) => void;
}

export const LowStockAlerts: React.FC<LowStockAlertsProps> = ({ onRestockItem }) => {
  const { inventory, language, t } = useERP();

  const lowStockItems = inventory.filter(item => item.currentStockKg <= item.minAlertLevel);

  if (lowStockItems.length === 0) {
    return (
      <GlassCard padding="sm" className="bg-[#E5F8F1]/40 border border-[#229A73]/20">
        <div className="flex items-center gap-3 py-1 px-2">
          <div className="w-8 h-8 rounded-lg bg-[#229A73]/10 text-[#229A73] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#17383B]">{t('allStockHealthy')}</h4>
            <p className="text-[11px] text-[#688285]">
              Every chemical drum, acid tank, enzyme container, and dyeing auxiliary meets or exceeds factory safety thresholds.
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard padding="none" className="overflow-hidden border border-[#F3B562]/40 bg-[#FFFDF8]">
      <div className="p-3.5 sm:p-4 bg-[#FFF8EB] border-b border-[#F3B562]/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FFF3DF] text-[#C47D1C] flex items-center justify-center shrink-0 border border-[#F3B562]/40">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs sm:text-sm text-[#17383B] flex items-center gap-2">
              <span>{t('lowStockItemsLabel')}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#EA7185] text-white">
                {lowStockItems.length} {lowStockItems.length === 1 ? 'Item' : 'Items'}
              </span>
            </h4>
            <p className="text-[11px] text-[#688285]">
              Items at or below designated factory safety reorder points. Immediate restock recommended.
            </p>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 divide-y divide-[#F9EFE2]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {lowStockItems.map(item => {
            const isCritical = item.currentStockKg <= item.minAlertLevel * 0.5;
            const deficitKg = item.minAlertLevel - item.currentStockKg;

            return (
              <div 
                key={item.id}
                className="p-3 rounded-xl bg-white border border-[#F3E2C9] hover:border-[#F3B562] transition-all flex flex-col justify-between gap-3 shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="font-extrabold text-xs text-[#17383B] line-clamp-1">
                        {item.name}
                      </h5>
                      <p className="text-[10px] text-[#8EA3A5] line-clamp-1">
                        {item.supplierName || 'General Supply'} • {item.location || 'Chemical Store'}
                      </p>
                    </div>
                    {isCritical ? (
                      <span className="shrink-0 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[#FEECEE] text-[#EA7185] border border-[#EA7185]/30">
                        {t('criticalStock')}
                      </span>
                    ) : (
                      <span className="shrink-0 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[#FFF3DF] text-[#C47D1C] border border-[#F3B562]/30">
                        {t('lowStock')}
                      </span>
                    )}
                  </div>

                  {/* Stock Bar vs Minimum */}
                  <div className="mt-2.5 space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="font-bold text-[#EA7185]">
                        Current: {formatNumber(item.currentStockKg, language)} {item.unit}
                      </span>
                      <span className="font-medium text-[#688285]">
                        Min: {formatNumber(item.minAlertLevel, language)} {item.unit}
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-[#F2F4F5] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isCritical ? 'bg-[#EA7185]' : 'bg-[#F3B562]'}`}
                        style={{ width: `${Math.min(100, (item.currentStockKg / (item.minAlertLevel || 1)) * 100)}%` }}
                      />
                    </div>

                    <div className="text-[10px] text-[#C47D1C] font-semibold">
                      Deficit: -{formatNumber(deficitKg > 0 ? deficitKg : 0, language)} {item.unit} below safety margin
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRestockItem(item)}
                  className="w-full py-1.5 px-3 rounded-lg bg-[#0B9FA5] hover:bg-[#088287] text-white font-bold text-[11px] transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('stockInBtn')} / Restock</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
};
