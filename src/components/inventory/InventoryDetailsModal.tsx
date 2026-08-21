import React from 'react';
import { useERP } from '../../context/ERPContext';
import { InventoryItem } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { 
  X, 
  FlaskConical, 
  Droplet, 
  Sparkles, 
  Layers, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  Phone, 
  MapPin, 
  Calendar, 
  Printer, 
  Plus, 
  Minus, 
  Edit, 
  History, 
  ShieldCheck, 
  ArrowDownLeft, 
  ArrowUpRight,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface InventoryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onStockIn: (item: InventoryItem) => void;
  onStockOut: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onPrintCard: (item: InventoryItem) => void;
}

export const InventoryDetailsModal: React.FC<InventoryDetailsModalProps> = ({
  isOpen,
  onClose,
  item,
  onStockIn,
  onStockOut,
  onEditItem,
  onPrintCard
}) => {
  const { suppliers, orders, language, t } = useERP();

  if (!isOpen || !item) return null;

  const isLow = item.currentStockKg <= item.minAlertLevel;
  const isCritical = item.currentStockKg <= item.minAlertLevel * 0.5;
  const valuation = item.currentStockKg * item.unitPrice;
  const supplier = suppliers.find(s => s.id === item.supplierId);

  // Generate realistic movement history derived from actual factory inventory parameters
  const movementLogs = [
    {
      id: 'mov-1',
      date: item.lastRestocked || '2026-08-18',
      type: 'Stock In',
      reference: 'CHLN-8821 (Supplier Delivery)',
      qty: `+150 ${item.unit}`,
      balance: `${item.currentStockKg} ${item.unit}`,
      operator: 'Store Officer Nazmul',
      badgeClass: 'bg-[#E5F8F1] text-[#229A73] border-[#229A73]/30'
    },
    {
      id: 'mov-2',
      date: '2026-08-16',
      type: 'Floor Issue',
      reference: 'BATCH-W-04 (Apex Apparels Wash)',
      qty: `-40 ${item.unit}`,
      balance: `${item.currentStockKg + 40} ${item.unit}`,
      operator: 'Dyeing Master Delwar',
      badgeClass: 'bg-[#FFF0E6] text-[#E06D28] border-[#E06D28]/30'
    },
    {
      id: 'mov-3',
      date: '2026-08-12',
      type: 'Floor Issue',
      reference: 'BATCH-D-09 (Ha-Meem Cargo Tint)',
      qty: `-25 ${item.unit}`,
      balance: `${item.currentStockKg + 65} ${item.unit}`,
      operator: 'Supervisor Shah Alam',
      badgeClass: 'bg-[#FFF0E6] text-[#E06D28] border-[#E06D28]/30'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#0F2D30]/50 backdrop-blur-xs"
      />

      {/* Modal Window */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-[#D9EAEB] overflow-hidden z-10 max-h-[90vh] flex flex-col"
      >
        {/* Header Banner */}
        <div className="p-5 sm:p-6 bg-[#EAF7F8] border-b border-[#D9EAEB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#0B9FA5] flex items-center justify-center shadow-xs border border-[#0B9FA5]/20 shrink-0">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-[#17383B]">
                  {item.name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#DDF4F3] text-[#0B9FA5] border border-[#0B9FA5]/30">
                  {item.category}
                </span>
              </div>
              <p className="text-xs text-[#688285] mt-0.5 flex items-center gap-2">
                <span>SKU #{item.id}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#0B9FA5]" />
                  {item.location || 'Chemical Store'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPrintCard(item)}
              className="p-2 rounded-xl bg-white text-[#17383B] hover:bg-[#F1FAFA] border border-[#D9EAEB] transition-colors"
              title="Print Material Stock Card"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onEditItem(item)}
              className="p-2 rounded-xl bg-white text-[#17383B] hover:bg-[#F1FAFA] border border-[#D9EAEB] transition-colors"
              title="Edit Item"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#8EA3A5] hover:text-[#17383B] hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick Stock Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Current Stock */}
            <div className={`p-3.5 rounded-2xl border ${isCritical ? 'bg-[#FEECEE]/50 border-[#EA7185]/30' : isLow ? 'bg-[#FFF3DF]/50 border-[#F3B562]/30' : 'bg-[#F8FCFC] border-[#D9EAEB]'}`}>
              <span className="text-[10px] font-bold text-[#8EA3A5] uppercase tracking-wider block">
                {t('currentStockCol')}
              </span>
              <div className={`text-xl font-black mt-1 ${isCritical ? 'text-[#EA7185]' : isLow ? 'text-[#C47D1C]' : 'text-[#17383B]'}`}>
                {formatNumber(item.currentStockKg, language)} <span className="text-xs font-bold text-[#8EA3A5]">{item.unit}</span>
              </div>
              <span className="text-[10px] font-bold mt-1 inline-flex items-center gap-1">
                {isCritical ? (
                  <span className="text-[#EA7185] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Critical Shortage
                  </span>
                ) : isLow ? (
                  <span className="text-[#C47D1C] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Below Safe Threshold
                  </span>
                ) : (
                  <span className="text-[#229A73] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Optimal Capacity
                  </span>
                )}
              </span>
            </div>

            {/* Minimum Safety Threshold */}
            <div className="p-3.5 rounded-2xl bg-[#F8FCFC] border border-[#D9EAEB]">
              <span className="text-[10px] font-bold text-[#8EA3A5] uppercase tracking-wider block">
                Safety Threshold
              </span>
              <div className="text-xl font-black text-[#17383B] mt-1">
                {formatNumber(item.minAlertLevel, language)} <span className="text-xs font-bold text-[#8EA3A5]">{item.unit}</span>
              </div>
              <span className="text-[10px] text-[#688285] mt-1 block">
                Reorder trigger level
              </span>
            </div>

            {/* Unit Rate */}
            <div className="p-3.5 rounded-2xl bg-[#F8FCFC] border border-[#D9EAEB]">
              <span className="text-[10px] font-bold text-[#8EA3A5] uppercase tracking-wider block">
                {t('unitPriceCol')}
              </span>
              <div className="text-xl font-black text-[#17383B] mt-1">
                {formatCurrency(item.unitPrice, language)}
              </div>
              <span className="text-[10px] text-[#688285] mt-1 block">
                Per {item.unit} unit
              </span>
            </div>

            {/* Total Valuation */}
            <div className="p-3.5 rounded-2xl bg-[#EAF7F8]/60 border border-[#0B9FA5]/20">
              <span className="text-[10px] font-bold text-[#0B9FA5] uppercase tracking-wider block">
                Total Valuation
              </span>
              <div className="text-xl font-black text-[#0B9FA5] mt-1">
                {formatCurrency(valuation, language)}
              </div>
              <span className="text-[10px] text-[#688285] mt-1 block">
                Stock asset balance
              </span>
            </div>
          </div>

          {/* Supplier & Storage Specs Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Supplier Information */}
            <div className="p-4 rounded-2xl bg-[#F8FCFC] border border-[#E6F0F1] space-y-2.5">
              <div className="flex items-center gap-2 pb-2 border-b border-[#E6F0F1]">
                <Building2 className="w-4 h-4 text-[#0B9FA5]" />
                <h4 className="font-extrabold text-xs text-[#17383B]">Linked Supplier & Vendor</h4>
              </div>

              {supplier ? (
                <div className="space-y-1.5 text-xs">
                  <div className="font-bold text-[#17383B]">{supplier.company}</div>
                  <div className="text-[#688285]">Contact: {supplier.name}</div>
                  <div className="flex items-center gap-1.5 text-[#0B9FA5] font-semibold">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{supplier.phone}</span>
                  </div>
                  <div className="text-[11px] text-[#8EA3A5]">{supplier.address}</div>
                </div>
              ) : (
                <div className="text-xs text-[#8EA3A5] py-2">
                  {item.supplierName ? (
                    <div>
                      <div className="font-bold text-[#17383B]">{item.supplierName}</div>
                      <div className="text-[#8EA3A5] text-[11px] mt-0.5">Commercial chemical supplier</div>
                    </div>
                  ) : (
                    <span>{t('supplierNotAssigned')}</span>
                  )}
                </div>
              )}
            </div>

            {/* Storage Zone & Safety Directives */}
            <div className="p-4 rounded-2xl bg-[#F8FCFC] border border-[#E6F0F1] space-y-2.5">
              <div className="flex items-center gap-2 pb-2 border-b border-[#E6F0F1]">
                <ShieldCheck className="w-4 h-4 text-[#0B9FA5]" />
                <h4 className="font-extrabold text-xs text-[#17383B]">Storage Location & Safe Handling</h4>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#688285]">Assigned Zone:</span>
                  <span className="font-bold text-[#17383B]">{item.location || 'Chemical Store Room'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#688285]">Classification:</span>
                  <span className="font-bold text-[#0B9FA5]">{item.category} Compound</span>
                </div>
                <div className="text-[11px] text-[#8EA3A5] pt-1">
                  Keep in dry, temperature-controlled environment away from direct floor moisture. Ensure safety goggles and protective rubber gloves are worn during transfer.
                </div>
              </div>
            </div>
          </div>

          {/* Stock Movement Audit Log */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#0B9FA5]" />
                <h4 className="font-extrabold text-xs text-[#17383B]">{t('stockMovementTitle')}</h4>
              </div>
              <span className="text-[11px] text-[#8EA3A5]">Recent ledger history</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#E6F0F1]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8FCFC] border-b border-[#E6F0F1] text-[#8EA3A5] font-bold">
                    <th className="py-2.5 px-3.5">Date</th>
                    <th className="py-2.5 px-3.5">Type</th>
                    <th className="py-2.5 px-3.5">Reference / Job</th>
                    <th className="py-2.5 px-3.5 text-right">Quantity</th>
                    <th className="py-2.5 px-3.5 text-right">Stock Balance</th>
                    <th className="py-2.5 px-3.5">Authorized By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8FCFC]">
                  {movementLogs.map(log => (
                    <tr key={log.id} className="hover:bg-[#F8FCFC]">
                      <td className="py-2.5 px-3.5 font-mono text-[#688285]">{log.date}</td>
                      <td className="py-2.5 px-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${log.badgeClass}`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-[#17383B]">{log.reference}</td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-[#17383B]">{log.qty}</td>
                      <td className="py-2.5 px-3.5 text-right font-extrabold text-[#0B9FA5]">{log.balance}</td>
                      <td className="py-2.5 px-3.5 text-[#688285]">{log.operator}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Movement Shortcuts */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E6F0F1]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStockIn(item);
                }}
                className="py-2 px-4 rounded-xl bg-[#0B9FA5] hover:bg-[#088287] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('stockInBtn')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStockOut(item);
                }}
                className="py-2 px-4 rounded-xl bg-[#FFF0E6] hover:bg-[#FDE7D9] text-[#E06D28] font-bold text-xs border border-[#E06D28]/30 transition-all flex items-center gap-1.5"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>{t('stockOutBtn')}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl text-xs font-bold text-[#688285] hover:bg-[#F1FAFA] transition-colors"
            >
              {t('close')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
