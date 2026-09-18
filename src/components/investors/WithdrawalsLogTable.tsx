import React, { useState, useMemo } from 'react';
import { InvestorWithdrawal, Investor, Language } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { Search, ArrowDownRight, Calendar, Tag, Landmark, FileText, Trash2 } from 'lucide-react';

interface WithdrawalsLogTableProps {
  withdrawals: InvestorWithdrawal[];
  investors: Investor[];
  onDeleteWithdrawal?: (id: string) => Promise<void>;
  language: Language;
  t: (key: string) => string;
}

export const WithdrawalsLogTable: React.FC<WithdrawalsLogTableProps> = ({
  withdrawals,
  investors,
  onDeleteWithdrawal,
  language,
  t
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvestorId, setSelectedInvestorId] = useState('all');
  const [selectedReason, setSelectedReason] = useState('all');

  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter(wd => {
      const matchesSearch = (wd.investorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (wd.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (wd.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesInvestor = selectedInvestorId === 'all' || wd.investorId === selectedInvestorId;
      const matchesReason = selectedReason === 'all' || wd.reason === selectedReason;
      return matchesSearch && matchesInvestor && matchesReason;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [withdrawals, searchTerm, selectedInvestorId, selectedReason]);

  const totalFilteredAmount = filteredWithdrawals.reduce((s, w) => s + (w.amount || 0), 0);

  const getReasonLabel = (reason: InvestorWithdrawal['reason']) => {
    switch (reason) {
      case 'capital_return': return t('reasonCapitalReturn');
      case 'partial_withdrawal': return t('reasonPartialWithdrawal');
      case 'partnership_settlement': return t('reasonPartnershipSettlement');
      case 'emergency': return t('reasonEmergency');
      case 'other': return t('reasonOther');
      default: return reason;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#688285]" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={language === 'bn' ? 'বিনিয়োগকারী, ভাউচার নং বা বিবরণ দিয়ে খুঁজুন...' : 'Search by investor, voucher, notes...'}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#D9EAEB] rounded-xl text-xs text-[#17383B] focus:outline-none focus:ring-2 focus:ring-[#EA7185]"
          />
        </div>

        <div className="flex flex-wrap gap-2.5">
          <select
            value={selectedInvestorId}
            onChange={e => setSelectedInvestorId(e.target.value)}
            className="px-3 py-2 bg-white border border-[#D9EAEB] rounded-xl text-xs text-[#17383B] focus:outline-none focus:ring-2 focus:ring-[#EA7185]"
          >
            <option value="all">{language === 'bn' ? 'সকল বিনিয়োগকারী' : 'All Investors'}</option>
            {investors.map(inv => (
              <option key={inv.id} value={inv.id}>{inv.name}</option>
            ))}
          </select>

          <select
            value={selectedReason}
            onChange={e => setSelectedReason(e.target.value)}
            className="px-3 py-2 bg-white border border-[#D9EAEB] rounded-xl text-xs text-[#17383B] focus:outline-none focus:ring-2 focus:ring-[#EA7185]"
          >
            <option value="all">{language === 'bn' ? 'সকল কারণ' : 'All Reasons'}</option>
            <option value="capital_return">{t('reasonCapitalReturn')}</option>
            <option value="partial_withdrawal">{t('reasonPartialWithdrawal')}</option>
            <option value="partnership_settlement">{t('reasonPartnershipSettlement')}</option>
            <option value="emergency">{t('reasonEmergency')}</option>
            <option value="other">{t('reasonOther')}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#D9EAEB] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F1FAFA] text-[#688285] font-bold border-b border-[#D9EAEB]">
              <tr>
                <th className="p-3.5 pl-5">{t('withdrawalDate')}</th>
                <th className="p-3.5">{t('investorName')}</th>
                <th className="p-3.5">{t('withdrawalReason')}</th>
                <th className="p-3.5">{t('payingAccount')}</th>
                <th className="p-3.5">{t('paymentReference')}</th>
                <th className="p-3.5 text-right">{t('withdrawalAmount')}</th>
                {onDeleteWithdrawal && <th className="p-3.5 pr-5 text-center">{t('action')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F0F1]">
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#8EA3A5] italic">
                    {language === 'bn' ? 'কোন মূলধন উত্তোলনের রেকর্ড পাওয়া যায়নি' : 'No withdrawal records found'}
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map(wd => (
                  <tr key={wd.id} className="hover:bg-[#F9FCFC] transition-colors">
                    <td className="p-3.5 pl-5 font-semibold text-[#17383B] whitespace-nowrap">
                      {wd.date}
                    </td>
                    <td className="p-3.5 font-bold text-[#17383B]">
                      {wd.investorName}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full bg-[#FDF4F5] text-[#EA7185] font-bold text-[11px]">
                        {getReasonLabel(wd.reason)}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#17383B] font-medium">
                      {wd.accountName || 'Cash Account'}
                    </td>
                    <td className="p-3.5 text-[#688285]">
                      {wd.reference || '—'}
                    </td>
                    <td className="p-3.5 text-right font-black text-sm text-[#EA7185] whitespace-nowrap">
                      - {formatCurrency(wd.amount, language)}
                    </td>
                    {onDeleteWithdrawal && (
                      <td className="p-3.5 pr-5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(language === 'bn' ? 'আপনি কি এই মূলধন উত্তোলনের রেকর্ডটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this withdrawal record?')) {
                              onDeleteWithdrawal(wd.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-[#EA7185] hover:bg-[#FDF4F5] transition-colors"
                          title={t('delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
            {filteredWithdrawals.length > 0 && (
              <tfoot className="bg-[#F1FAFA] font-bold border-t border-[#D9EAEB]">
                <tr>
                  <td colSpan={5} className="p-3.5 pl-5 text-[#17383B] uppercase tracking-wider">
                    {t('total')} ({formatNumber(filteredWithdrawals.length, language)} {language === 'bn' ? 'টি এন্ট্রি' : 'entries'})
                  </td>
                  <td className="p-3.5 text-right font-black text-sm text-[#EA7185]">
                    {formatCurrency(totalFilteredAmount, language)}
                  </td>
                  {onDeleteWithdrawal && <td />}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
