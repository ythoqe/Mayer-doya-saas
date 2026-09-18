import React, { useState, useMemo } from 'react';
import { Investment, Investor, Language } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { Search, TrendingUp, Calendar, Tag, Landmark, FileText, Trash2, ArrowUpDown } from 'lucide-react';

interface InvestmentsLogTableProps {
  investments: Investment[];
  investors: Investor[];
  onDeleteInvestment?: (id: string) => Promise<void>;
  language: Language;
  t: (key: string) => string;
}

export const InvestmentsLogTable: React.FC<InvestmentsLogTableProps> = ({
  investments,
  investors,
  onDeleteInvestment,
  language,
  t
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvestorId, setSelectedInvestorId] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const filteredInvestments = useMemo(() => {
    return investments.filter(inv => {
      const matchesSearch = (inv.investorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesInvestor = selectedInvestorId === 'all' || inv.investorId === selectedInvestorId;
      const matchesType = selectedType === 'all' || inv.investmentType === selectedType;
      return matchesSearch && matchesInvestor && matchesType;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [investments, searchTerm, selectedInvestorId, selectedType]);

  const totalFilteredAmount = filteredInvestments.reduce((s, i) => s + (i.amount || 0), 0);

  const getTypeLabel = (type: Investment['investmentType']) => {
    switch (type) {
      case 'initial': return t('typeInitial');
      case 'additional': return t('typeAdditional');
      case 'share_capital': return t('typeShareCapital');
      case 'machinery': return t('typeMachinery');
      case 'working_capital': return t('typeWorkingCapital');
      default: return type;
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
            placeholder={language === 'bn' ? 'বিনিয়োগকারী, চেক নং বা বিবরণ দিয়ে খুঁজুন...' : 'Search by investor, ref, notes...'}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#D9EAEB] rounded-xl text-xs text-[#17383B] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]"
          />
        </div>

        <div className="flex flex-wrap gap-2.5">
          <select
            value={selectedInvestorId}
            onChange={e => setSelectedInvestorId(e.target.value)}
            className="px-3 py-2 bg-white border border-[#D9EAEB] rounded-xl text-xs text-[#17383B] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]"
          >
            <option value="all">{language === 'bn' ? 'সকল বিনিয়োগকারী' : 'All Investors'}</option>
            {investors.map(inv => (
              <option key={inv.id} value={inv.id}>{inv.name}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-white border border-[#D9EAEB] rounded-xl text-xs text-[#17383B] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]"
          >
            <option value="all">{language === 'bn' ? 'সকল প্রকার' : 'All Types'}</option>
            <option value="initial">{t('typeInitial')}</option>
            <option value="additional">{t('typeAdditional')}</option>
            <option value="share_capital">{t('typeShareCapital')}</option>
            <option value="machinery">{t('typeMachinery')}</option>
            <option value="working_capital">{t('typeWorkingCapital')}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#D9EAEB] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F1FAFA] text-[#688285] font-bold border-b border-[#D9EAEB]">
              <tr>
                <th className="p-3.5 pl-5">{t('investmentDate')}</th>
                <th className="p-3.5">{t('investorName')}</th>
                <th className="p-3.5">{t('investmentType')}</th>
                <th className="p-3.5">{t('receivingAccount')}</th>
                <th className="p-3.5">{t('paymentReference')}</th>
                <th className="p-3.5 text-right">{t('investmentAmount')}</th>
                {onDeleteInvestment && <th className="p-3.5 pr-5 text-center">{t('action')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F0F1]">
              {filteredInvestments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#8EA3A5] italic">
                    {language === 'bn' ? 'কোন মূলধন জমার রেকর্ড পাওয়া যায়নি' : 'No investment records found'}
                  </td>
                </tr>
              ) : (
                filteredInvestments.map(inv => (
                  <tr key={inv.id} className="hover:bg-[#F9FCFC] transition-colors">
                    <td className="p-3.5 pl-5 font-semibold text-[#17383B] whitespace-nowrap">
                      {inv.date}
                    </td>
                    <td className="p-3.5 font-bold text-[#17383B]">
                      {inv.investorName}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full bg-[#E6F8F7] text-[#0B9FA5] font-bold text-[11px]">
                        {getTypeLabel(inv.investmentType)}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#17383B] font-medium">
                      {inv.accountName || 'Cash Account'}
                    </td>
                    <td className="p-3.5 text-[#688285]">
                      {inv.reference || '—'}
                    </td>
                    <td className="p-3.5 text-right font-black text-sm text-[#0B9FA5] whitespace-nowrap">
                      + {formatCurrency(inv.amount, language)}
                    </td>
                    {onDeleteInvestment && (
                      <td className="p-3.5 pr-5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(language === 'bn' ? 'আপনি কি এই মূলধন জমার রেকর্ডটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this investment record?')) {
                              onDeleteInvestment(inv.id);
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
            {filteredInvestments.length > 0 && (
              <tfoot className="bg-[#F1FAFA] font-bold border-t border-[#D9EAEB]">
                <tr>
                  <td colSpan={5} className="p-3.5 pl-5 text-[#17383B] uppercase tracking-wider">
                    {t('total')} ({formatNumber(filteredInvestments.length, language)} {language === 'bn' ? 'টি এন্ট্রি' : 'entries'})
                  </td>
                  <td className="p-3.5 text-right font-black text-sm text-[#0B9FA5]">
                    {formatCurrency(totalFilteredAmount, language)}
                  </td>
                  {onDeleteInvestment && <td />}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
