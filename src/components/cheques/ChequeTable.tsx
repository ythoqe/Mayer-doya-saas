import React, { useState } from 'react';
import { Cheque, ChequeDirection, ChequeStatus } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  ChevronRight, 
  Check, 
  Edit2, 
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Plus,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { ChequeDetailsModal } from './ChequeDetailsModal';
import { ChequeClearConfirmModal } from './ChequeClearConfirmModal';
import { EndorseChequeModal } from './EndorseChequeModal';
import { ConfirmDeleteModal } from '../ui/ConfirmDeleteModal';

interface ChequeTableProps {
  cheques: Cheque[];
  onAddCheque: (direction?: ChequeDirection) => void;
  onEditCheque?: (cheque: Cheque) => void;
  onDeleteCheque?: (id: string) => void;
}

export const ChequeTable: React.FC<ChequeTableProps> = ({ 
  cheques, 
  onAddCheque, 
  onEditCheque, 
  onDeleteCheque 
}) => {
  const { updateChequeStatus, deleteCheque, language, t } = useERP();

  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'received' | 'issued'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [partyTypeFilter, setPartyTypeFilter] = useState<string>('all');

  const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null);
  const [chequeToDelete, setChequeToDelete] = useState<Cheque | null>(null);
  const [confirmingCheque, setConfirmingCheque] = useState<{ cheque: Cheque; status: ChequeStatus } | null>(null);
  const [endorsingCheque, setEndorsingCheque] = useState<Cheque | null>(null);

  const filteredCheques = cheques.filter(c => {
    const matchesSearch = 
      (c.chequeNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.partyName || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.bankName || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.notes ? c.notes.toLowerCase().includes(search.toLowerCase()) : false) ||
      (c.endorsedToSupplierName ? c.endorsedToSupplierName.toLowerCase().includes(search.toLowerCase()) : false) ||
      (c.clientName ? c.clientName.toLowerCase().includes(search.toLowerCase()) : false);

    const isRec = c.direction === 'received' || c.partyType === 'Client';
    const isIss = c.direction === 'issued' || c.partyType === 'Supplier';

    const matchesDirection = 
      directionFilter === 'all' || 
      (directionFilter === 'received' && isRec) || 
      (directionFilter === 'issued' && isIss);

    const isClear = c.status === 'Clear' || c.status === 'Cleared';
    const isCancel = c.status === 'Cancel' || c.status === 'Cancelled' || c.status === 'Bounced';
    const isPend = !isClear && !isCancel;

    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'Pending' && isPend) ||
      (statusFilter === 'Clear' && isClear) ||
      (statusFilter === 'Cancel' && isCancel);

    const matchesPartyType = partyTypeFilter === 'all' || c.partyType === partyTypeFilter;

    return matchesSearch && matchesDirection && matchesStatus && matchesPartyType;
  });

  const getStatusBadge = (status: ChequeStatus) => {
    const isClear = status === 'Clear' || status === 'Cleared';
    const isCancel = status === 'Cancel' || status === 'Cancelled' || status === 'Bounced';

    if (isClear) {
      return {
        icon: CheckCircle2,
        text: language === 'bn' ? '✓ Clear (ক্লিয়ার)' : 'Clear',
        class: 'bg-[#E5F8F1] text-[#229A73] border-[#38C99A]/30'
      };
    } else if (isCancel) {
      return {
        icon: XCircle,
        text: language === 'bn' ? '✕ Cancel (বাতিল)' : 'Cancel',
        class: 'bg-[#FDECEF] text-[#C93B55] border-[#EA7185]/30'
      };
    } else {
      return {
        icon: Clock,
        text: language === 'bn' ? '⏳ Pending (অপেক্ষমাণ)' : 'Pending',
        class: 'bg-[#FFF3DF] text-[#C47D1C] border-[#F3B562]/30'
      };
    }
  };

  const handleConfirmAction = (reason?: string) => {
    if (confirmingCheque) {
      updateChequeStatus(confirmingCheque.cheque.id, confirmingCheque.status, reason);
      setConfirmingCheque(null);
      if (selectedCheque && selectedCheque.id === confirmingCheque.cheque.id) {
        setSelectedCheque(null);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header with Dual Action Buttons: 'চেক গ্রহণ' and 'চেক প্রদান' */}
      <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-xs border border-[#D9EAEB] shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Direction Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F1FAFA] rounded-xl border border-[#D9EAEB] overflow-x-auto">
          <button
            type="button"
            onClick={() => setDirectionFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              directionFilter === 'all'
                ? 'bg-white text-[#17383B] shadow-2xs border border-[#D9EAEB]'
                : 'text-[#688285] hover:text-[#17383B]'
            }`}
          >
            {language === 'bn' ? 'সকল চেক' : 'All Cheques'} ({cheques.length})
          </button>

          <button
            type="button"
            onClick={() => setDirectionFilter('received')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
              directionFilter === 'received'
                ? 'bg-white text-[#0B9FA5] shadow-2xs border border-[#D9EAEB]'
                : 'text-[#688285] hover:text-[#17383B]'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            {language === 'bn' ? '📥 চেক গ্রহণ (Client)' : 'Received'} ({cheques.filter(c => c.direction === 'received' || c.partyType === 'Client').length})
          </button>

          <button
            type="button"
            onClick={() => setDirectionFilter('issued')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
              directionFilter === 'issued'
                ? 'bg-white text-[#6357E8] shadow-2xs border border-[#D9EAEB]'
                : 'text-[#688285] hover:text-[#17383B]'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            {language === 'bn' ? '📤 চেক প্রদান (Supplier)' : 'Issued / Endorsed'} ({cheques.filter(c => c.direction === 'issued' || c.partyType === 'Supplier').length})
          </button>
        </div>

        {/* Dual Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onAddCheque('received')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white text-xs font-black shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5"
          >
            <ArrowDownLeft className="w-4 h-4" />
            {language === 'bn' ? '+ চেক গ্রহণ (Client)' : '+ Receive Cheque'}
          </button>

          <button
            type="button"
            onClick={() => onAddCheque('issued')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#6357E8] to-[#4838D1] hover:from-[#5144D3] hover:to-[#3C2BBF] text-white text-xs font-black shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4" />
            {language === 'bn' ? '+ চেক প্রদান (Supplier)' : '+ Give Cheque'}
          </button>
        </div>
      </div>

      {/* Search & Status Filters Bar */}
      <div className="p-3.5 rounded-2xl bg-white/90 backdrop-blur-xs border border-[#D9EAEB] shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={language === 'bn' ? 'চেক নম্বর, ব্যাংক, ক্লায়েন্ট বা মহাজনের নাম দিয়ে খুঁজুন...' : 'Search cheque number, drawer bank, client or supplier...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] placeholder-[#8EA3A5] focus:bg-white focus:border-[#0B9FA5] focus:outline-none transition-colors font-medium"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Pills */}
          <div className="flex items-center gap-1 p-1 bg-[#F1FAFA] rounded-xl border border-[#D9EAEB]">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                statusFilter === 'all' ? 'bg-white text-[#17383B] shadow-2xs' : 'text-[#688285]'
              }`}
            >
              {language === 'bn' ? 'সকল' : 'All'}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Pending')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                statusFilter === 'Pending' ? 'bg-[#FFF3DF] text-[#C47D1C] shadow-2xs' : 'text-[#688285]'
              }`}
            >
              {language === 'bn' ? '⏳ Pending' : 'Pending'}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Clear')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                statusFilter === 'Clear' ? 'bg-[#E5F8F1] text-[#229A73] shadow-2xs' : 'text-[#688285]'
              }`}
            >
              {language === 'bn' ? '✓ Clear' : 'Clear'}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Cancel')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                statusFilter === 'Cancel' ? 'bg-[#FDECEF] text-[#C93B55] shadow-2xs' : 'text-[#688285]'
              }`}
            >
              {language === 'bn' ? '✕ Cancel' : 'Cancel'}
            </button>
          </div>

          <select
            value={partyTypeFilter}
            onChange={(e) => setPartyTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
          >
            <option value="all">{language === 'bn' ? 'সকল ধরন' : 'All Parties'}</option>
            <option value="Client">{language === 'bn' ? 'ক্লায়েন্ট (Client)' : 'Clients'}</option>
            <option value="Supplier">{language === 'bn' ? 'মহাজন (Supplier)' : 'Suppliers'}</option>
          </select>
        </div>
      </div>

      {/* Cheques Ledger Table */}
      {filteredCheques.length === 0 ? (
        <div className="p-12 text-center bg-white/80 backdrop-blur-xs rounded-2xl border border-[#D9EAEB] shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F1FAFA] text-[#8EA3A5] flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-sm text-[#17383B]">
            {t('noChequesFound')}
          </h4>
          <p className="text-xs text-[#688285]">
            {language === 'bn' ? 'কোনো চেকের তথ্য পাওয়া যায়নি।' : 'No cheque records matched your search filters.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#D9EAEB] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFB] text-[#688285] font-extrabold border-b border-[#D9EAEB] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">{language === 'bn' ? 'ধরন' : 'Direction'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'চেক নং ও ব্যাংক' : 'Cheque & Bank'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'পার্টি / গ্রহীতা' : 'Party / Assignee'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'পরিমাণ (৳)' : 'Amount (BDT)'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'তারিখ' : 'Date'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="py-3 px-4 text-right">{language === 'bn' ? 'অ্যাকশন ও ক্লিয়ারেন্স' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6F0F1]">
                {filteredCheques.map(cheque => {
                  const isRec = cheque.direction === 'received' || cheque.partyType === 'Client';
                  const isIss = cheque.direction === 'issued' || cheque.partyType === 'Supplier';
                  const isClear = cheque.status === 'Clear' || cheque.status === 'Cleared';
                  const isCancel = cheque.status === 'Cancel' || cheque.status === 'Cancelled' || cheque.status === 'Bounced';
                  const isPending = !isClear && !isCancel;

                  const statusBadge = getStatusBadge(cheque.status);
                  const StatusIcon = statusBadge.icon;

                  return (
                    <tr 
                      key={cheque.id} 
                      className="hover:bg-[#F1FAFA]/50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedCheque(cheque)}
                    >
                      {/* Direction Badge */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black border ${
                          isRec 
                            ? 'bg-[#DDF4F3] text-[#0B9FA5] border-[#0B9FA5]/20' 
                            : 'bg-[#EEEBFF] text-[#6357E8] border-[#6357E8]/20'
                        }`}>
                          {isRec ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {isRec 
                            ? (language === 'bn' ? '📥 গ্রহণ' : 'Received') 
                            : (language === 'bn' ? '📤 প্রদান' : 'Issued')}
                        </span>
                      </td>

                      {/* Cheque No & Bank */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-black text-xs text-[#17383B]">
                          #{cheque.chequeNumber}
                        </div>
                        <div className="text-[11px] text-[#688285] truncate max-w-[140px]">
                          {cheque.bankName}
                        </div>
                      </td>

                      {/* Party Name & Linked Endorsement */}
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-xs text-[#17383B]">
                          {cheque.partyName}
                        </div>

                        {/* Endorsed Badge */}
                        {cheque.isEndorsed && (
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#4838D1] bg-[#EEEBFF] px-2 py-0.5 rounded-md mt-0.5">
                            <ShieldCheck className="w-3 h-3" />
                            {isRec 
                              ? (language === 'bn' ? `➜ মহাজন: ${cheque.endorsedToSupplierName || 'Supplier'}` : `➜ ${cheque.endorsedToSupplierName}`)
                              : (language === 'bn' ? `(মূল ক্লায়েন্ট: ${cheque.clientName || 'Client'})` : `(Client: ${cheque.clientName})`)}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4">
                        <span className="font-black text-xs text-[#0B9FA5]">
                          {formatCurrency(cheque.amount, language)}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4">
                        <div className="text-[11px] font-medium text-[#17383B]">
                          {cheque.issueDate}
                        </div>
                        <div className="text-[10px] text-[#8EA3A5]">
                          {cheque.clearingDate ? `${language === 'bn' ? 'ক্লিয়ার:' : 'Clear:'} ${cheque.clearingDate}` : ''}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${statusBadge.class}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusBadge.text}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              {/* If Received & Not yet endorsed, quick "সাপ্লায়ারকে দিন" button */}
                              {isRec && !cheque.isEndorsed && (
                                <button
                                  type="button"
                                  title={language === 'bn' ? 'মহাজন/সাপ্লায়ারকে চেক হস্তান্তর করুন' : 'Endorse to Supplier'}
                                  onClick={() => setEndorsingCheque(cheque)}
                                  className="px-2 py-1 bg-[#EEEBFF] hover:bg-[#D1CAFF] text-[#4838D1] text-[10px] font-black rounded-lg transition-colors flex items-center gap-1 shrink-0"
                                >
                                  <ArrowUpRight className="w-3 h-3" />
                                  {language === 'bn' ? 'সাপ্লায়ারকে দিন' : 'Endorse'}
                                </button>
                              )}

                              {/* Clear Action Button */}
                              <button
                                type="button"
                                title={language === 'bn' ? 'চেক ক্লিয়ার ও টাকা উত্তোলন নিশ্চিত করুন' : 'Mark as Cleared'}
                                onClick={() => setConfirmingCheque({ cheque, status: 'Clear' })}
                                className="px-2.5 py-1 bg-[#E5F8F1] hover:bg-[#D1F2E6] text-[#229A73] text-[10px] font-black rounded-lg transition-colors flex items-center gap-1 shrink-0"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                {language === 'bn' ? 'Clear' : 'Clear'}
                              </button>

                              {/* Cancel Action Button */}
                              <button
                                type="button"
                                title={language === 'bn' ? 'চেক বাতিল করুন' : 'Cancel Cheque'}
                                onClick={() => setConfirmingCheque({ cheque, status: 'Cancel' })}
                                className="px-2.5 py-1 bg-[#FDECEF] hover:bg-[#FCD8DF] text-[#C93B55] text-[10px] font-black rounded-lg transition-colors flex items-center gap-1 shrink-0"
                              >
                                <XCircle className="w-3 h-3" />
                                {language === 'bn' ? 'Cancel' : 'Cancel'}
                              </button>
                            </>
                          )}

                          {!isPending && (
                            <button
                              type="button"
                              onClick={() => setSelectedCheque(cheque)}
                              className="px-2.5 py-1 bg-[#F1FAFA] hover:bg-[#E6F0F1] text-[#688285] text-[10px] font-bold rounded-lg transition-colors"
                            >
                              {language === 'bn' ? 'বিবরণ' : 'Details'}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onEditCheque ? onEditCheque(cheque) : null}
                            className="p-1 rounded-lg text-[#8EA3A5] hover:text-[#0B9FA5] hover:bg-[#F1FAFA] transition-colors"
                            title={language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setChequeToDelete(cheque)}
                            className="p-1 rounded-lg text-[#8EA3A5] hover:text-red-600 hover:bg-red-50 transition-colors"
                            title={language === 'bn' ? 'মুছুন' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cheque Details Modal */}
      {selectedCheque && (
        <ChequeDetailsModal
          cheque={selectedCheque}
          onClose={() => setSelectedCheque(null)}
          onUpdateStatus={(st) => {
            updateChequeStatus(selectedCheque.id, st);
            setSelectedCheque(null);
          }}
          onEndorse={(chq) => {
            setSelectedCheque(null);
            setEndorsingCheque(chq);
          }}
          onEdit={(chq) => {
            setSelectedCheque(null);
            onEditCheque?.(chq);
          }}
          onDelete={(id) => {
            const chq = cheques.find(c => c.id === id);
            if (chq) {
              setChequeToDelete(chq);
            } else {
              deleteCheque(id);
            }
            setSelectedCheque(null);
          }}
        />
      )}

      {/* Cheque Clear / Cancel Confirm Modal */}
      {confirmingCheque && (
        <ChequeClearConfirmModal
          cheque={confirmingCheque.cheque}
          targetStatus={confirmingCheque.status}
          isOpen={true}
          onClose={() => setConfirmingCheque(null)}
          onConfirm={handleConfirmAction}
        />
      )}

      {/* Cheque Endorse Modal */}
      {endorsingCheque && (
        <EndorseChequeModal
          cheque={endorsingCheque}
          isOpen={true}
          onClose={() => setEndorsingCheque(null)}
        />
      )}

      <ConfirmDeleteModal
        isOpen={!!chequeToDelete}
        title={language === 'bn' ? 'চেক রেকর্ড মুছে ফেলুন' : 'Delete Cheque Record'}
        itemName={chequeToDelete ? `#${chequeToDelete.chequeNumber} (${chequeToDelete.partyName} - ৳${chequeToDelete.amount})` : ''}
        onClose={() => setChequeToDelete(null)}
        onConfirm={() => {
          if (chequeToDelete) {
            if (onDeleteCheque) {
              onDeleteCheque(chequeToDelete.id);
            } else {
              deleteCheque(chequeToDelete.id);
            }
            setChequeToDelete(null);
          }
        }}
      />
    </div>
  );
};
