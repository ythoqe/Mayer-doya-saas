import React, { useState } from 'react';
import { Supplier, Language } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { 
  Building2, 
  User, 
  Phone, 
  MapPin, 
  DollarSign, 
  CreditCard, 
  Eye, 
  Edit, 
  Trash2, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  FlaskConical,
  Wrench,
  Package,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SupplierTableProps {
  suppliers: Supplier[];
  onViewSupplier: (supplier: Supplier) => void;
  onEditSupplier: (supplier: Supplier) => void;
  onPaySupplier: (supplier: Supplier) => void;
  onViewLedger: (supplier: Supplier) => void;
  onDeleteSupplier: (supplierId: string) => void;
}

export const SupplierTable: React.FC<SupplierTableProps> = ({
  suppliers,
  onViewSupplier,
  onEditSupplier,
  onPaySupplier,
  onViewLedger,
  onDeleteSupplier
}) => {
  const { language, t } = useERP();
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // Helper for supplier initials
  const getInitials = (name: string, company: string) => {
    const text = company || name || 'SP';
    return text.substring(0, 2).toUpperCase();
  };

  // Helper for category badge styling and icon
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'Chemicals':
        return {
          bg: 'bg-cyan-50 text-cyan-800 border-cyan-200/80',
          icon: <FlaskConical className="w-3 h-3 text-cyan-600" />
        };
      case 'Dyes':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-200/80',
          icon: <Layers className="w-3 h-3 text-purple-600" />
        };
      case 'Machinery':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200/80',
          icon: <Wrench className="w-3 h-3 text-amber-600" />
        };
      case 'Packaging':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
          icon: <Package className="w-3 h-3 text-emerald-600" />
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: <Building2 className="w-3 h-3 text-slate-500" />
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Desktop & Tablet Table */}
      <div className="hidden md:block bg-white rounded-2xl border border-[#D9EAEB] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F1FAFA] border-b border-[#D9EAEB] text-[#17383B] uppercase tracking-wider font-extrabold text-[10px]">
                <th className="py-3 px-4">{t('clientCompanyCol')}</th>
                <th className="py-3 px-3 text-center">{t('suppliedCategoryCol')}</th>
                <th className="py-3 px-4">{t('contactPersonCol')}</th>
                <th className="py-3 px-4">{t('phoneLabel')}</th>
                <th className="py-3 px-4 text-right">{t('totalPurchasesCol')}</th>
                <th className="py-3 px-4 text-right">{t('totalPaidCol')}</th>
                <th className="py-3 px-4 text-right">{t('payableBalanceCol')}</th>
                <th className="py-3 px-3 text-center">{t('statusLabel')}</th>
                <th className="py-3 px-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F0F1]">
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#8EA3A5]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FlaskConical className="w-8 h-8 text-[#8EA3A5]/50 stroke-[1.5]" />
                      <p className="font-bold text-sm text-[#17383B]">{t('noSuppliersFound')}</p>
                      <p className="text-xs text-[#688285]">{t('noSuppliersDesc')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => {
                  const hasDue = supplier.balance > 0;
                  const isCleared = supplier.balance === 0;
                  const catStyle = getCategoryBadge(supplier.category);

                  return (
                    <tr
                      key={supplier.id}
                      onClick={() => onViewSupplier(supplier)}
                      className="hover:bg-[#F9FBFC] transition-colors cursor-pointer group"
                    >
                      {/* Supplier Company & Initials */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#DDF4F3] to-[#D5EDEE] border border-[#0B9FA5]/20 text-[#0B9FA5] flex items-center justify-center font-black text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                            {getInitials(supplier.name, supplier.company || supplier.companyName || '')}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-[#17383B] text-xs truncate group-hover:text-[#0B9FA5] transition-colors">
                              {supplier.company || supplier.companyName}
                            </div>
                            <div className="text-[11px] text-[#8EA3A5] flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-[#8EA3A5] shrink-0" />
                              <span className="truncate">{supplier.address || 'Dhaka'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${catStyle.bg}`}>
                          {catStyle.icon}
                          <span>{supplier.category}</span>
                        </span>
                      </td>

                      {/* Contact Person */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#17383B] text-xs flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#8EA3A5]" />
                          <span>{supplier.name}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs text-[#688285]">
                          {supplier.phone}
                        </span>
                      </td>

                      {/* Total Purchases */}
                      <td className="py-3.5 px-4 text-right font-medium text-[#17383B]">
                        {formatCurrency(supplier.totalPurchases, language)}
                      </td>

                      {/* Total Paid */}
                      <td className="py-3.5 px-4 text-right font-semibold text-[#229A73]">
                        {formatCurrency(supplier.totalPaid, language)}
                      </td>

                      {/* Payable Balance */}
                      <td className="py-3.5 px-4 text-right">
                        <span className={`inline-block font-extrabold px-2 py-0.5 rounded-md text-xs ${
                          hasDue
                            ? 'bg-rose-50 text-[#C83F57] border border-rose-200/60'
                            : isCleared
                            ? 'bg-[#E5F8F1] text-[#229A73] border border-[#38C99A]/30'
                            : 'bg-[#DDF4F3] text-[#0B9FA5] border border-[#0B9FA5]/20'
                        }`}>
                          {formatCurrency(supplier.balance, language)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          supplier.status === 'active'
                            ? 'bg-[#E5F8F1] text-[#229A73] border border-[#38C99A]/30'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${supplier.status === 'active' ? 'bg-[#38C99A]' : 'bg-slate-400'}`} />
                          {t(supplier.status)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Pay Supplier */}
                          <button
                            type="button"
                            onClick={() => onPaySupplier(supplier)}
                            className="p-1.5 rounded-lg text-[#0B9FA5] hover:bg-[#DDF4F3] hover:text-[#078A90] transition-colors"
                            title={t('paySupplierBtn')}
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick View Ledger */}
                          <button
                            type="button"
                            onClick={() => onViewLedger(supplier)}
                            className="p-1.5 rounded-lg text-[#6357E8] hover:bg-[#EEEBFF] hover:text-[#4F46E5] transition-colors"
                            title={t('supplierLedgerTitle')}
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => onEditSupplier(supplier)}
                            className="p-1.5 rounded-lg text-[#688285] hover:bg-[#F1FAFA] hover:text-[#17383B] transition-colors"
                            title={t('edit')}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setSupplierToDelete(supplier)}
                            className="p-1.5 rounded-lg text-[#EA7185] hover:bg-rose-50 hover:text-[#C83F57] transition-colors"
                            title={t('delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Mobile Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 md:hidden">
        {suppliers.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#D9EAEB] text-[#8EA3A5]">
            <FlaskConical className="w-8 h-8 text-[#8EA3A5]/50 mx-auto mb-2" />
            <p className="font-bold text-sm text-[#17383B]">{t('noSuppliersFound')}</p>
            <p className="text-xs text-[#688285]">{t('noSuppliersDesc')}</p>
          </div>
        ) : (
          suppliers.map((supplier) => {
            const hasDue = supplier.balance > 0;
            const catStyle = getCategoryBadge(supplier.category);

            return (
              <div
                key={supplier.id}
                onClick={() => onViewSupplier(supplier)}
                className="p-4 rounded-2xl bg-white border border-[#D9EAEB] shadow-2xs space-y-3 hover:border-[#0B9FA5]/50 transition-all cursor-pointer"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center font-black text-xs shrink-0">
                      {getInitials(supplier.name, supplier.company || supplier.companyName || '')}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-[#17383B] leading-tight">
                        {supplier.company || supplier.companyName}
                      </h4>
                      <p className="text-xs text-[#688285] font-medium">{supplier.name}</p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${catStyle.bg}`}>
                    {supplier.category}
                  </span>
                </div>

                {/* Contact info */}
                <div className="text-xs text-[#688285] flex items-center gap-1.5 truncate">
                  <Phone className="w-3.5 h-3.5 text-[#0B9FA5] shrink-0" />
                  <span className="font-mono text-[11px] truncate">{supplier.phone}</span>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#F9FBFC] border border-[#E6F0F1] text-center">
                  <div>
                    <span className="text-[9px] text-[#8EA3A5] uppercase font-bold block">Purchases</span>
                    <span className="text-xs font-bold text-[#17383B]">
                      {formatCurrency(supplier.totalPurchases, language)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#8EA3A5] uppercase font-bold block">Paid</span>
                    <span className="text-xs font-bold text-[#229A73]">
                      {formatCurrency(supplier.totalPaid, language)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#8EA3A5] uppercase font-bold block">Payable</span>
                    <span className={`text-xs font-black ${hasDue ? 'text-[#C83F57]' : 'text-[#229A73]'}`}>
                      {formatCurrency(supplier.balance, language)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-[#F1FAFA]" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onPaySupplier(supplier)}
                    className="flex-1 py-1.5 rounded-lg bg-[#DDF4F3] hover:bg-[#0B9FA5] text-[#0B9FA5] hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1"
                  >
                    <DollarSign className="w-3 h-3" />
                    <span>{t('paySupplierBtn')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onViewLedger(supplier)}
                    className="p-1.5 rounded-lg bg-[#F1FAFA] text-[#6357E8] border border-[#D9EAEB]"
                    title={t('supplierLedgerTitle')}
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditSupplier(supplier)}
                    className="p-1.5 rounded-lg bg-[#F1FAFA] text-[#688285] border border-[#D9EAEB]"
                    title={t('edit')}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSupplierToDelete(supplier)}
                    className="p-1.5 rounded-lg bg-rose-50 text-[#EA7185] border border-rose-100"
                    title={t('delete')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {supplierToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17383B]/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-2xl border border-rose-200 shadow-xl p-5 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#C83F57] flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#17383B]">
                    Delete Supplier: {supplierToDelete.company || supplierToDelete.companyName}
                  </h3>
                  <p className="text-xs text-[#688285]">
                    Are you sure you want to remove this vendor? This will not affect past inventory stock.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F9FBFC] border border-[#E6F0F1] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#8EA3A5]">Outstanding Payable:</span>
                  <strong className="text-[#C83F57]">{formatCurrency(supplierToDelete.balance, language)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8EA3A5]">Total Lifetime Purchases:</span>
                  <strong className="text-[#17383B]">{formatCurrency(supplierToDelete.totalPurchases, language)}</strong>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSupplierToDelete(null)}
                  className="px-4 py-2 rounded-xl border border-[#D9EAEB] text-xs font-bold text-[#688285] hover:bg-[#F1FAFA]"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteSupplier(supplierToDelete.id);
                    setSupplierToDelete(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#C83F57] hover:bg-[#a63045] text-white text-xs font-bold shadow-sm"
                >
                  {t('confirmDeleteBtn')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
