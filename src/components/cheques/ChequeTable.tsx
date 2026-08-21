import React, { useState } from 'react';
import { Cheque, Account } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency } from '../../utils/translation';
import { Search, Filter, Clock, CheckCircle2, AlertOctagon, XCircle, FileText, ChevronRight, Check } from 'lucide-react';
import { ChequeDetailsModal } from './ChequeDetailsModal';
import { ChequeClearConfirmModal } from './ChequeClearConfirmModal';

interface ChequeTableProps {
  cheques: Cheque[];
  onAddCheque: () => void;
}

export const ChequeTable: React.FC<ChequeTableProps> = ({ cheques, onAddCheque }) => {
  const { updateChequeStatus, language, t } = useERP();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [partyTypeFilter, setPartyTypeFilter] = useState<string>('all');

  const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null);
  const [confirmingCheque, setConfirmingCheque] = useState<{ cheque: Cheque; status: Cheque['status'] } | null>(null);

  const filteredCheques = cheques.filter(c => {
    const matchesSearch = 
      c.chequeNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.partyName.toLowerCase().includes(search.toLowerCase()) ||
      c.bankName.toLowerCase().includes(search.toLowerCase()) ||
      (c.notes && c.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesPartyType = partyTypeFilter === 'all' || c.partyType === partyTypeFilter;

    return matchesSearch && matchesStatus && matchesPartyType;
  });

  const getStatusBadge = (status: Cheque['status']) => {
    switch (status) {
      case 'Pending':
        return {
          icon: Clock,
          text: language === 'bn' ? 'অপেক্ষমাণ' : 'Pending',
          class: 'bg-[#FFF3DF] text-[#C47D1C] border-[#F3B562]/30'
        };
      case 'Cleared':
        return {
          icon: CheckCircle2,
          text: language === 'bn' ? 'ক্লিয়ারড' : 'Cleared',
          class: 'bg-[#E5F8F1] text-[#229A73] border-[#38C99A]/30'
        };
      case 'Bounced':
        return {
          icon: AlertOctagon,
          text: language === 'bn' ? 'বাউন্সড' : 'Bounced',
          class: 'bg-[#FDECEF] text-[#C93B55] border-[#EA7185]/30'
        };
      case 'Cancelled':
      default:
        return {
          icon: XCircle,
          text: language === 'bn' ? 'বাতিল' : 'Cancelled',
          class: 'bg-[#F1FAFA] text-[#8EA3A5] border-[#D9EAEB]'
        };
    }
  };

  const handleConfirmAction = () => {
    if (confirmingCheque) {
      updateChequeStatus(confirmingCheque.cheque.id, confirmingCheque.status);
      setConfirmingCheque(null);
      if (selectedCheque && selectedCheque.id === confirmingCheque.cheque.id) {
        setSelectedCheque(null);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-xs border border-[#D9EAEB] shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'bn' ? 'চেক নম্বর, ব্যাংক বা পার্টির নাম দিয়ে খুঁজুন...' : 'Search cheque number, drawer bank, party...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] placeholder-[#8EA3A5] focus:bg-white focus:border-[#0B9FA5] focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
            >
              <option value="all">{t('allStatus')}</option>
              <option value="Pending">{t('pendingChequesLabel')}</option>
              <option value="Cleared">{t('clearedChequesLabel')}</option>
              <option value="Bounced">{t('bouncedChequesLabel')}</option>
              <option value="Cancelled">{t('cancelledChequesLabel')}</option>
            </select>

            <select
              value={partyTypeFilter}
              onChange={(e) => setPartyTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
            >
              <option value="all">{language === 'bn' ? 'সকল পার্টি' : 'All Parties'}</option>
              <option value="Client">{language === 'bn' ? 'গ্রাহক (Client)' : 'Clients'}</option>
              <option value="Supplier">{language === 'bn' ? 'মহাজন (Supplier)' : 'Suppliers'}</option>
              <option value="Other">{language === 'bn' ? 'অন্যান্য' : 'Other'}</option>
            </select>

            <button
              type="button"
              onClick={onAddCheque}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white text-xs font-extrabold shadow-2xs hover:shadow-xs transition-all shrink-0"
            >
              {t('addChequeBtn')}
            </button>
          </div>
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
        <div className="rounded-2xl bg-white/95 backdrop-blur-sm border border-[#D9EAEB] shadow-2xs overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E6F0F1] bg-[#F1FAFA]/70 text-[#8EA3A5] font-extrabold uppercase tracking-wider">
                  <th className="py-3.5 px-4">{language === 'bn' ? 'চেক নম্বর' : 'Cheque #'}</th>
                  <th className="py-3.5 px-4">{language === 'bn' ? 'ড্রয়ার ব্যাংক' : 'Bank'}</th>
                  <th className="py-3.5 px-4">{language === 'bn' ? 'পার্টি ও ধরন' : 'Party & Type'}</th>
                  <th className="py-3.5 px-4">{language === 'bn' ? 'ইস্যু তারিখ' : 'Issue Date'}</th>
                  <th className="py-3.5 px-4">{language === 'bn' ? 'ক্লিয়ারিং তারিখ' : 'Clearing Date'}</th>
                  <th className="py-3.5 px-4 text-right">{language === 'bn' ? 'পরিমাণ (৳)' : 'Amount'}</th>
                  <th className="py-3.5 px-4 text-center">{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="py-3.5 px-4 text-right">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1FAFA]">
                {filteredCheques.map((cheque) => {
                  const badge = getStatusBadge(cheque.status);
                  const Icon = badge.icon;

                  return (
                    <tr key={cheque.id} className="hover:bg-[#F1FAFA]/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#17383B] whitespace-nowrap">
                        {cheque.chequeNumber}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-[#688285] whitespace-nowrap">
                        {cheque.bankName}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#17383B]">{cheque.partyName}</span>
                          <span className="text-[10px] text-[#8EA3A5] font-semibold">{cheque.partyType}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[#688285] font-medium whitespace-nowrap">
                        {cheque.issueDate}
                      </td>

                      <td className="py-3.5 px-4 text-[#688285] font-medium whitespace-nowrap">
                        {cheque.clearingDate || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-sm text-[#0B9FA5] whitespace-nowrap">
                        {formatCurrency(cheque.amount, language)}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${badge.class}`}>
                          <Icon className="w-3 h-3" />
                          <span>{badge.text}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {cheque.status === 'Pending' && (
                            <button
                              type="button"
                              onClick={() => setConfirmingCheque({ cheque, status: 'Cleared' })}
                              className="px-2.5 py-1 rounded-lg bg-[#E5F8F1] hover:bg-[#229A73] text-[#229A73] hover:text-white text-[11px] font-extrabold transition-colors flex items-center gap-1"
                              title={t('markAsClearedBtn')}
                            >
                              <Check className="w-3 h-3" />
                              <span>{language === 'bn' ? 'ক্লিয়ার' : 'Clear'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedCheque(cheque)}
                            className="p-1.5 rounded-lg hover:bg-[#F1FAFA] text-[#8EA3A5] hover:text-[#0B9FA5] transition-colors"
                            title={language === 'bn' ? 'বিস্তারিত দেখুন' : 'View Details'}
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked View */}
          <div className="md:hidden divide-y divide-[#E6F0F1]">
            {filteredCheques.map((cheque) => {
              const badge = getStatusBadge(cheque.status);
              const Icon = badge.icon;

              return (
                <div key={cheque.id} className="p-4 space-y-2 hover:bg-[#F1FAFA]/40 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#17383B]">{cheque.chequeNumber}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${badge.class}`}>
                          <Icon className="w-2.5 h-2.5" />
                          <span>{badge.text}</span>
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-[#17383B] mt-0.5">{cheque.partyName}</h4>
                      <p className="text-[11px] text-[#688285]">{cheque.bankName} • {cheque.partyType}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-sm text-[#0B9FA5] block">
                        {formatCurrency(cheque.amount, language)}
                      </span>
                      <span className="text-[10px] text-[#8EA3A5] font-semibold">{cheque.issueDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F1FAFA]">
                    {cheque.status === 'Pending' && (
                      <button
                        type="button"
                        onClick={() => setConfirmingCheque({ cheque, status: 'Cleared' })}
                        className="px-3 py-1 rounded-lg bg-[#E5F8F1] text-[#229A73] text-xs font-bold flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>{language === 'bn' ? 'ক্লিয়ার' : 'Clear'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedCheque(cheque)}
                      className="px-3 py-1 rounded-lg bg-[#F1FAFA] text-[#17383B] text-xs font-bold flex items-center gap-1"
                    >
                      <span>{language === 'bn' ? 'বিস্তারিত' : 'Details'}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cheque Details Modal */}
      {selectedCheque && (
        <ChequeDetailsModal
          cheque={selectedCheque}
          onClose={() => setSelectedCheque(null)}
          onUpdateStatus={(targetStatus) => {
            setConfirmingCheque({ cheque: selectedCheque, status: targetStatus });
          }}
        />
      )}

      {/* Cheque Clear / Status Confirmation Modal */}
      {confirmingCheque && (
        <ChequeClearConfirmModal
          cheque={confirmingCheque.cheque}
          targetStatus={confirmingCheque.status}
          isOpen={true}
          onClose={() => setConfirmingCheque(null)}
          onConfirm={handleConfirmAction}
        />
      )}
    </div>
  );
};
