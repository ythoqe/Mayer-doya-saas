import React, { useState } from 'react';
import { Client, Order, Language } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { 
  Building2, 
  User, 
  Phone, 
  MapPin, 
  Package, 
  CreditCard, 
  Eye, 
  Edit, 
  Trash2, 
  FileText, 
  Receipt,
  MoreVertical, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClientTableProps {
  clients: Client[];
  orders: Order[];
  onViewClient: (client: Client) => void;
  onEditClient: (client: Client) => void;
  onRecordPayment: (client: Client) => void;
  onViewLedger: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
}

export const ClientTable: React.FC<ClientTableProps> = ({
  clients,
  orders,
  onViewClient,
  onEditClient,
  onRecordPayment,
  onViewLedger,
  onDeleteClient
}) => {
  const { language, t } = useERP();
  const [activeMenuClientId, setActiveMenuClientId] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // Helper to count orders for a client
  const getOrderCount = (clientId: string) => {
    return orders.filter(o => o.clientId === clientId).length;
  };

  // Helper for company initial avatar
  const getInitials = (name: string, company: string) => {
    const text = company || name || 'MD';
    return text.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4">
      {/* 1. Desktop & Tablet Table (Hidden on small mobile) */}
      <div className="hidden md:block bg-white rounded-2xl border border-[#D9EAEB] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F1FAFA] border-b border-[#D9EAEB] text-[#17383B] uppercase tracking-wider font-extrabold text-[10px]">
                <th className="py-3 px-4">{t('clientCompanyCol')}</th>
                <th className="py-3 px-4">{t('contactPersonCol')}</th>
                <th className="py-3 px-4">{t('phoneLabel')}</th>
                <th className="py-3 px-3 text-center">{t('ordersCountCol')}</th>
                <th className="py-3 px-4 text-right">{t('totalBilledCol')}</th>
                <th className="py-3 px-4 text-right">{t('totalPaidCol')}</th>
                <th className="py-3 px-4 text-right">{t('balanceCol')}</th>
                <th className="py-3 px-3 text-center">{t('statusLabel')}</th>
                <th className="py-3 px-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F0F1]">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#8EA3A5]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Building2 className="w-8 h-8 text-[#8EA3A5]/50 stroke-[1.5]" />
                      <p className="font-bold text-sm text-[#17383B]">{t('noClientsFound')}</p>
                      <p className="text-xs text-[#688285]">{t('noClientsDesc')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                clients.map((client) => {
                  const orderCount = getOrderCount(client.id);
                  const hasDue = client.balance > 0;
                  const isCleared = client.balance === 0;

                  return (
                    <tr
                      key={client.id}
                      onClick={() => onViewClient(client)}
                      className="hover:bg-[#F9FBFC] transition-colors cursor-pointer group"
                    >
                      {/* Company & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#DDF4F3] to-[#D5EDEE] border border-[#0B9FA5]/20 text-[#0B9FA5] flex items-center justify-center font-black text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                            {getInitials(client.name, client.companyName)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-[#17383B] text-xs truncate group-hover:text-[#0B9FA5] transition-colors flex items-center gap-1.5">
                              <span>{client.companyName}</span>
                              {((client.openingBalance && client.openingBalance > 0) || (client.previousYearsDues && client.previousYearsDues.length > 0)) && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100/80 text-amber-800 border border-amber-300/60" title={`পূর্বের বকেয়া: ৳${formatCurrency(client.openingBalance || 0, language)}`}>
                                  {language === 'bn' ? 'বিগত বকেয়াসহ' : 'Prev. Dues'}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#8EA3A5] flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-[#8EA3A5] shrink-0" />
                              <span className="truncate">{client.address || 'Dhaka'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Person */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#17383B] text-xs flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#8EA3A5]" />
                          <span>{client.name}</span>
                        </div>
                        {client.email && (
                          <div className="text-[10px] text-[#8EA3A5] truncate pl-5">
                            {client.email}
                          </div>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs text-[#688285]">
                          {client.phone}
                        </span>
                      </td>

                      {/* Orders Count */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F1FAFA] text-[#0B9FA5] border border-[#D9EAEB]">
                          {formatNumber(orderCount, language)}
                        </span>
                      </td>

                      {/* Total Billed */}
                      <td className="py-3.5 px-4 text-right font-medium text-[#17383B]">
                        {formatCurrency(client.totalBilled, language)}
                      </td>

                      {/* Total Paid */}
                      <td className="py-3.5 px-4 text-right font-semibold text-[#229A73]">
                        {formatCurrency(client.totalPaid, language)}
                      </td>

                      {/* Balance Due */}
                      <td className="py-3.5 px-4 text-right">
                        <span className={`inline-block font-extrabold px-2 py-0.5 rounded-md text-xs ${
                          hasDue
                            ? 'bg-amber-50 text-[#C47D1C] border border-amber-200/60'
                            : isCleared
                            ? 'bg-[#E5F8F1] text-[#229A73] border border-[#38C99A]/30'
                            : 'bg-[#DDF4F3] text-[#0B9FA5] border border-[#0B9FA5]/20'
                        }`}>
                          {formatCurrency(client.balance, language)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          client.status === 'active'
                            ? 'bg-[#E5F8F1] text-[#229A73] border border-[#38C99A]/30'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${client.status === 'active' ? 'bg-[#38C99A]' : 'bg-slate-400'}`} />
                          {t(client.status)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Running Bill & Invoices */}
                          <button
                            type="button"
                            onClick={() => onViewClient(client)}
                            className="p-1.5 rounded-lg text-teal-700 hover:bg-teal-50 hover:text-teal-900 transition-colors"
                            title={language === 'bn' ? 'রানিং বিল ও চালানসমূহ' : 'Running Bill & Invoices'}
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Receive Payment */}
                          <button
                            type="button"
                            onClick={() => onRecordPayment(client)}
                            className="p-1.5 rounded-lg text-[#0B9FA5] hover:bg-[#DDF4F3] hover:text-[#078A90] transition-colors"
                            title={t('recordClientPayment')}
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick View Ledger */}
                          <button
                            type="button"
                            onClick={() => onViewLedger(client)}
                            className="p-1.5 rounded-lg text-[#6357E8] hover:bg-[#EEEBFF] hover:text-[#4F46E5] transition-colors"
                            title={t('clientLedgerTitle')}
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => onEditClient(client)}
                            className="p-1.5 rounded-lg text-[#688285] hover:bg-[#F1FAFA] hover:text-[#17383B] transition-colors"
                            title={t('edit')}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setClientToDelete(client)}
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

      {/* 2. Mobile Responsive Cards Grid (Shown on mobile devices) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 md:hidden">
        {clients.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#D9EAEB] text-[#8EA3A5]">
            <Building2 className="w-8 h-8 text-[#8EA3A5]/50 mx-auto mb-2" />
            <p className="font-bold text-sm text-[#17383B]">{t('noClientsFound')}</p>
            <p className="text-xs text-[#688285]">{t('noClientsDesc')}</p>
          </div>
        ) : (
          clients.map((client) => {
            const orderCount = getOrderCount(client.id);
            const hasDue = client.balance > 0;

            return (
              <div
                key={client.id}
                onClick={() => onViewClient(client)}
                className="p-4 rounded-2xl bg-white border border-[#D9EAEB] shadow-2xs space-y-3 hover:border-[#0B9FA5]/50 transition-all cursor-pointer"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center font-black text-xs shrink-0">
                      {getInitials(client.name, client.companyName)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-[#17383B] leading-tight">
                        {client.companyName}
                      </h4>
                      <p className="text-xs text-[#688285] font-medium">{client.name}</p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    client.status === 'active'
                      ? 'bg-[#E5F8F1] text-[#229A73]'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {t(client.status)}
                  </span>
                </div>

                {/* Contact & Orders info */}
                <div className="grid grid-cols-2 gap-2 text-xs text-[#688285] pt-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <Phone className="w-3.5 h-3.5 text-[#0B9FA5] shrink-0" />
                    <span className="font-mono text-[11px] truncate">{client.phone}</span>
                  </div>
                  <div className="flex items-center justify-end gap-1 text-[11px]">
                    <Package className="w-3.5 h-3.5 text-[#8EA3A5]" />
                    <span>{formatNumber(orderCount, language)} orders</span>
                  </div>
                </div>

                {/* Financial 3-Pill Strip */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#F9FBFC] border border-[#E6F0F1] text-center">
                  <div>
                    <span className="text-[9px] text-[#8EA3A5] uppercase font-bold block">Billed</span>
                    <span className="text-xs font-bold text-[#17383B]">
                      {formatCurrency(client.totalBilled, language)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#8EA3A5] uppercase font-bold block">Paid</span>
                    <span className="text-xs font-bold text-[#229A73]">
                      {formatCurrency(client.totalPaid, language)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#8EA3A5] uppercase font-bold block">Balance</span>
                    <span className={`text-xs font-black ${hasDue ? 'text-[#C47D1C]' : 'text-[#229A73]'}`}>
                      {formatCurrency(client.balance, language)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-[#F1FAFA]" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onRecordPayment(client)}
                    className="flex-1 py-1.5 rounded-lg bg-[#DDF4F3] hover:bg-[#0B9FA5] text-[#0B9FA5] hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1"
                  >
                    <CreditCard className="w-3 h-3" />
                    <span>{t('recordClientPayment')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onViewClient(client)}
                    className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200"
                    title={language === 'bn' ? 'রানিং বিল' : 'Running Bill'}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onViewLedger(client)}
                    className="p-1.5 rounded-lg bg-[#F1FAFA] text-[#6357E8] border border-[#D9EAEB]"
                    title={t('clientLedgerTitle')}
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditClient(client)}
                    className="p-1.5 rounded-lg bg-[#F1FAFA] text-[#688285] border border-[#D9EAEB]"
                    title={t('edit')}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setClientToDelete(client)}
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
        {clientToDelete && (
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
                    Delete Client: {clientToDelete.companyName}
                  </h3>
                  <p className="text-xs text-[#688285]">
                    Are you sure you want to remove this client? This cannot be undone.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F9FBFC] border border-[#E6F0F1] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#8EA3A5]">Outstanding Balance:</span>
                  <strong className="text-[#C47D1C]">{formatCurrency(clientToDelete.balance, language)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8EA3A5]">Total Lifetime Billed:</span>
                  <strong className="text-[#17383B]">{formatCurrency(clientToDelete.totalBilled, language)}</strong>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClientToDelete(null)}
                  className="px-4 py-2 rounded-xl border border-[#D9EAEB] text-xs font-bold text-[#688285] hover:bg-[#F1FAFA]"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteClient(clientToDelete.id);
                    setClientToDelete(null);
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
