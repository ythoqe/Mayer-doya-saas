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
  AlertCircle
} from 'lucide-react';

interface InventoryCardProps {
  item: InventoryItem;
  onViewDetails: (item: InventoryItem) => void;
  onStockIn: (item: InventoryItem) => void;
  onStockOut: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
}

export const InventoryCard: React.FC<InventoryCardProps> = ({
  item,
  onViewDetails,
  onStockIn,
  onStockOut,
  onEditItem
}) => {
  const { updateInventoryStock, language, t } = useERP();

  const isLow = item.currentStockKg <= item.minAlertLevel;
  const isCritical = item.currentStockKg <= item.minAlertLevel * 0.5;
  const valuation = item.currentStockKg * item.unitPrice;
  const stockRatio = item.minAlertLevel > 0 ? (item.currentStockKg / item.minAlertLevel) : 1;

  // Helper for category badge styling
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'Acid':
        return { bg: 'bg-[#FEECEE]', text: 'text-[#EA7185]', border: 'border-[#EA7185]/30', icon: FlaskConical };
      case 'Enzyme':
        return { bg: 'bg-[#F0EEFF]', text: 'text-[#6366F1]', border: 'border-[#6366F1]/30', icon: Sparkles };
      case 'Dye':
        return { bg: 'bg-[#EAF7F8]', text: 'text-[#0B9FA5]', border: 'border-[#0B9FA5]/30', icon: Droplet };
      case 'Softener':
        return { bg: 'bg-[#E5F8F1]', text: 'text-[#229A73]', border: 'border-[#229A73]/30', icon: Layers };
      case 'Bleach':
        return { bg: 'bg-[#FFF3DF]', text: 'text-[#C47D1C]', border: 'border-[#F3B562]/30', icon: Sparkles };
      case 'Alkali':
        return { bg: 'bg-[#FFF0E6]', text: 'text-[#E06D28]', border: 'border-[#E06D28]/30', icon: FlaskConical };
      case 'Fixing Agent':
        return { bg: 'bg-[#E6F4FF]', text: 'text-[#1E88E5]', border: 'border-[#1E88E5]/30', icon: Layers };
      default:
        return { bg: 'bg-[#F1FAFA]', text: 'text-[#688285]', border: 'border-[#D9EAEB]', icon: Package };
    }
  };

  const badge = getCategoryBadge(item.category);
  const CategoryIcon = badge.icon;

  return (
    <div className="p-4 rounded-2xl bg-white border border-[#D9EAEB] shadow-xs space-y-3 hover:border-[#0B9FA5]/50 transition-all">
      {/* Header: Category & Status */}
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${badge.bg} ${badge.text} ${badge.border}`}>
          <CategoryIcon className="w-3 h-3" />
          {item.category}
        </span>

        {isCritical ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FEECEE] text-[#EA7185] text-[10px] font-extrabold border border-[#EA7185]/30">
            <AlertCircle className="w-3 h-3" /> {t('criticalStock')}
          </span>
        ) : isLow ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF3DF] text-[#C47D1C] text-[10px] font-extrabold border border-[#F3B562]/30">
            <AlertTriangle className="w-3 h-3" /> {t('lowStock')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E5F8F1] text-[#229A73] text-[10px] font-extrabold border border-[#229A73]/20">
            <CheckCircle2 className="w-3 h-3" /> {t('healthyStock')}
          </span>
        )}
      </div>

      {/* Item Title & Location */}
      <div>
        <button
          type="button"
          onClick={() => onViewDetails(item)}
          className="font-bold text-sm text-[#17383B] hover:text-[#0B9FA5] text-left transition-colors line-clamp-1 block"
        >
          {item.name}
        </button>
        <div className="flex items-center gap-2 text-[11px] text-[#8EA3A5] mt-0.5">
          <span className="flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            {item.supplierName || t('supplierNotAssigned')}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {item.location || 'Chemical Store'}
          </span>
        </div>
      </div>

      {/* Stock Levels & Progress */}
      <div className="p-3 rounded-xl bg-[#F8FCFC] border border-[#E6F0F1] space-y-2">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#8EA3A5] uppercase tracking-wider block">
              {t('currentStockCol')}
            </span>
            <span className={`text-lg font-black ${isCritical ? 'text-[#EA7185]' : isLow ? 'text-[#C47D1C]' : 'text-[#17383B]'}`}>
              {formatNumber(item.currentStockKg, language)} <span className="text-xs font-bold text-[#8EA3A5]">{item.unit}</span>
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-[#8EA3A5] uppercase tracking-wider block">
              Safety Min
            </span>
            <span className="text-xs font-bold text-[#688285]">
              {formatNumber(item.minAlertLevel, language)} {item.unit}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full bg-[#EAF2F3] rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              isCritical ? 'bg-[#EA7185]' : isLow ? 'bg-[#F3B562]' : 'bg-[#229A73]'
            }`}
            style={{ width: `${Math.min(100, stockRatio * 50)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#E6F0F1]">
          <span className="text-[#688285]">
            Rate: <strong className="text-[#17383B]">{formatCurrency(item.unitPrice, language)}/{item.unit}</strong>
          </span>
          <span className="font-bold text-[#0B9FA5]">
            Valuation: {formatCurrency(valuation, language)}
          </span>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {/* Quick adjustments */}
        <div className="flex items-center gap-1 bg-[#F1FAFA] p-1 rounded-xl border border-[#D9EAEB]">
          <button
            type="button"
            onClick={() => updateInventoryStock(item.id, Math.max(0, item.currentStockKg - 10))}
            className="px-2.5 py-1 rounded-lg bg-white font-bold text-xs text-[#688285] hover:bg-[#FEECEE] hover:text-[#EA7185] transition-colors border border-[#E6F0F1]"
          >
            -10
          </button>
          <button
            type="button"
            onClick={() => updateInventoryStock(item.id, item.currentStockKg + 25)}
            className="px-2.5 py-1 rounded-lg bg-white font-bold text-xs text-[#688285] hover:bg-[#EAF7F8] hover:text-[#0B9FA5] transition-colors border border-[#E6F0F1]"
          >
            +25
          </button>
        </div>

        {/* Operations */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onStockIn(item)}
            className="p-2 rounded-xl bg-[#EAF7F8] text-[#0B9FA5] hover:bg-[#0B9FA5] hover:text-white transition-colors"
            title={t('stockInBtn')}
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onStockOut(item)}
            className="p-2 rounded-xl bg-[#FFF0E6] text-[#E06D28] hover:bg-[#E06D28] hover:text-white transition-colors"
            title={t('stockOutBtn')}
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onViewDetails(item)}
            className="p-2 rounded-xl bg-[#F8FCFC] text-[#688285] hover:text-[#17383B] border border-[#D9EAEB] transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onEditItem(item)}
            className="p-2 rounded-xl bg-[#F8FCFC] text-[#8EA3A5] hover:text-[#17383B] border border-[#D9EAEB] transition-colors"
            title={t('editItemBtn')}
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
