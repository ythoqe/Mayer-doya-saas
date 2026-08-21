import React from 'react';
import { useERP } from '../../context/ERPContext';
import { InventoryItem } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { 
  FlaskConical, 
  Droplet, 
  Sparkles, 
  Layers, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  Plus, 
  Minus, 
  Edit, 
  MapPin, 
  Building2, 
  MoreVertical,
  AlertCircle
} from 'lucide-react';

interface InventoryTableProps {
  items: InventoryItem[];
  onViewDetails: (item: InventoryItem) => void;
  onStockIn: (item: InventoryItem) => void;
  onStockOut: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  onViewDetails,
  onStockIn,
  onStockOut,
  onEditItem
}) => {
  const { updateInventoryStock, language, t } = useERP();

  // Helper for category badge styling
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'Acid':
        return {
          bg: 'bg-[#FEECEE]',
          text: 'text-[#EA7185]',
          border: 'border-[#EA7185]/30',
          icon: FlaskConical
        };
      case 'Enzyme':
        return {
          bg: 'bg-[#F0EEFF]',
          text: 'text-[#6366F1]',
          border: 'border-[#6366F1]/30',
          icon: Sparkles
        };
      case 'Dye':
        return {
          bg: 'bg-[#EAF7F8]',
          text: 'text-[#0B9FA5]',
          border: 'border-[#0B9FA5]/30',
          icon: Droplet
        };
      case 'Softener':
        return {
          bg: 'bg-[#E5F8F1]',
          text: 'text-[#229A73]',
          border: 'border-[#229A73]/30',
          icon: Layers
        };
      case 'Bleach':
        return {
          bg: 'bg-[#FFF3DF]',
          text: 'text-[#C47D1C]',
          border: 'border-[#F3B562]/30',
          icon: Sparkles
        };
      case 'Alkali':
        return {
          bg: 'bg-[#FFF0E6]',
          text: 'text-[#E06D28]',
          border: 'border-[#E06D28]/30',
          icon: FlaskConical
        };
      case 'Fixing Agent':
        return {
          bg: 'bg-[#E6F4FF]',
          text: 'text-[#1E88E5]',
          border: 'border-[#1E88E5]/30',
          icon: Layers
        };
      default:
        return {
          bg: 'bg-[#F1FAFA]',
          text: 'text-[#688285]',
          border: 'border-[#D9EAEB]',
          icon: Package
        };
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-[#E6F0F1] bg-[#F8FCFC] text-[#688285] font-bold select-none">
            <th className="py-3.5 px-4">{t('itemCol')}</th>
            <th className="py-3.5 px-4">{t('categoryCol')}</th>
            <th className="py-3.5 px-4">{t('supplierCol')}</th>
            <th className="py-3.5 px-4 text-right">{t('currentStockCol')}</th>
            <th className="py-3.5 px-4">{t('minLevelCol')} & Gauge</th>
            <th className="py-3.5 px-4 text-right">{t('unitPriceCol')}</th>
            <th className="py-3.5 px-4 text-right">{t('stockValueCol')}</th>
            <th className="py-3.5 px-4 text-center">{t('statusCol')}</th>
            <th className="py-3.5 px-4 text-center">{t('quickAdjustCol')}</th>
            <th className="py-3.5 px-4 text-right">{t('actionsCol')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F1FAFA]">
          {items.map(item => {
            const isLow = item.currentStockKg <= item.minAlertLevel;
            const isCritical = item.currentStockKg <= item.minAlertLevel * 0.5;
            const badge = getCategoryBadge(item.category);
            const CategoryIcon = badge.icon;
            const valuation = item.currentStockKg * item.unitPrice;
            const stockRatio = item.minAlertLevel > 0 ? (item.currentStockKg / item.minAlertLevel) : 1;

            return (
              <tr 
                key={item.id} 
                className="hover:bg-[#F8FCFC] transition-colors group"
              >
                {/* Item Column */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl ${badge.bg} ${badge.border} border flex items-center justify-center ${badge.text} shrink-0`}>
                      <CategoryIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => onViewDetails(item)}
                        className="font-bold text-[#17383B] hover:text-[#0B9FA5] text-left transition-colors line-clamp-1 block text-xs"
                      >
                        {item.name}
                      </button>
                      <div className="flex items-center gap-2 text-[10px] text-[#8EA3A5] mt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />
                          {item.location || 'Chemical Store'}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Category Badge */}
                <td className="py-3.5 px-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${badge.bg} ${badge.text} ${badge.border}`}>
                    <CategoryIcon className="w-3 h-3" />
                    {item.category}
                  </span>
                </td>

                {/* Supplier */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5 text-[#17383B]">
                    <Building2 className="w-3.5 h-3.5 text-[#8EA3A5] shrink-0" />
                    <span className="font-semibold text-xs truncate max-w-[130px]" title={item.supplierName || 'General Supply'}>
                      {item.supplierName || t('supplierNotAssigned')}
                    </span>
                  </div>
                </td>

                {/* Current Stock */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <div className={`font-black text-sm ${isCritical ? 'text-[#EA7185]' : isLow ? 'text-[#C47D1C]' : 'text-[#17383B]'}`}>
                    {formatNumber(item.currentStockKg, language)} <span className="text-[11px] font-bold text-[#8EA3A5]">{item.unit}</span>
                  </div>
                </td>

                {/* Min Level & Gauge */}
                <td className="py-3.5 px-4 min-w-[140px]">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-[#688285]">
                      <span>Safety Min:</span>
                      <span className="font-bold text-[#17383B]">{formatNumber(item.minAlertLevel, language)} {item.unit}</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#EAF2F3] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCritical ? 'bg-[#EA7185]' : isLow ? 'bg-[#F3B562]' : 'bg-[#229A73]'
                        }`}
                        style={{ width: `${Math.min(100, stockRatio * 50)}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* Unit Price */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <span className="font-semibold text-xs text-[#17383B]">
                    {formatCurrency(item.unitPrice, language)}
                  </span>
                  <span className="text-[10px] text-[#8EA3A5] block">per {item.unit}</span>
                </td>

                {/* Total Stock Value */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <span className="font-extrabold text-xs text-[#0B9FA5]">
                    {formatCurrency(valuation, language)}
                  </span>
                </td>

                {/* Status */}
                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  {isCritical ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FEECEE] text-[#EA7185] text-[10px] font-extrabold border border-[#EA7185]/30">
                      <AlertCircle className="w-3 h-3" /> {t('criticalStock')}
                    </span>
                  ) : isLow ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFF3DF] text-[#C47D1C] text-[10px] font-extrabold border border-[#F3B562]/30">
                      <AlertTriangle className="w-3 h-3" /> {t('lowStock')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E5F8F1] text-[#229A73] text-[10px] font-extrabold border border-[#229A73]/20">
                      <CheckCircle2 className="w-3 h-3" /> {t('healthyStock')}
                    </span>
                  )}
                </td>

                {/* Quick Adjust Buttons (Preserved Functionality) */}
                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  <div className="inline-flex items-center gap-1 bg-[#F1FAFA] p-1 rounded-xl border border-[#D9EAEB]">
                    <button
                      type="button"
                      onClick={() => updateInventoryStock(item.id, Math.max(0, item.currentStockKg - 10))}
                      className="px-2 py-0.5 rounded-lg bg-white font-bold text-[11px] text-[#688285] hover:bg-[#FEECEE] hover:text-[#EA7185] transition-colors border border-[#E6F0F1]"
                      title="Quick issue -10kg"
                    >
                      -10
                    </button>
                    <button
                      type="button"
                      onClick={() => updateInventoryStock(item.id, item.currentStockKg + 25)}
                      className="px-2 py-0.5 rounded-lg bg-white font-bold text-[11px] text-[#688285] hover:bg-[#EAF7F8] hover:text-[#0B9FA5] transition-colors border border-[#E6F0F1]"
                      title="Quick receive +25kg"
                    >
                      +25
                    </button>
                  </div>
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* View Details */}
                    <button
                      type="button"
                      onClick={() => onViewDetails(item)}
                      className="p-1.5 rounded-lg text-[#688285] hover:text-[#0B9FA5] hover:bg-[#EAF7F8] transition-colors"
                      title="View Specifications & History"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Stock In */}
                    <button
                      type="button"
                      onClick={() => onStockIn(item)}
                      className="p-1.5 rounded-lg text-[#0B9FA5] hover:bg-[#EAF7F8] transition-colors"
                      title={t('stockInBtn')}
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    {/* Stock Out */}
                    <button
                      type="button"
                      onClick={() => onStockOut(item)}
                      className="p-1.5 rounded-lg text-[#E06D28] hover:bg-[#FFF0E6] transition-colors"
                      title={t('stockOutBtn')}
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => onEditItem(item)}
                      className="p-1.5 rounded-lg text-[#8EA3A5] hover:text-[#17383B] hover:bg-[#F1FAFA] transition-colors"
                      title={t('editItemBtn')}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
