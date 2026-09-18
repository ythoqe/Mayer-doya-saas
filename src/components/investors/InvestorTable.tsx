import React, { useState, useMemo } from 'react';
import { Investor, Language } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { Search, Eye, Plus, Minus, Edit2, Trash2, User, Phone, CheckCircle2, XCircle, ArrowUpDown } from 'lucide-react';

interface InvestorTableProps {
  investors: Investor[];
  onViewProfile: (investor: Investor) => void;
  onAddInvestment: (investor: Investor) => void;
  onAddWithdrawal: (investor: Investor) => void;
  onEditInvestor: (investor: Investor) => void;
  onDeleteInvestor: (id: string) => Promise<void>;
  language: Language;
  t: (key: string) => string;
}

export const InvestorTable: React.FC<InvestorTableProps> = ({
  investors,
  onViewProfile,
  onAddInvestment,
  onAddWithdrawal,
  onEditInvestor,
  onDeleteInvestor,
  language,
  t
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'investment' | 'name' | 'profit' | 'position'>('investment');

  const filteredInvestors = useMemo(() => {
    return investors.filter(inv => {
      const matchesSearch = (inv.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.nidOrPassport || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      if (sortBy === 'investment') {
        return (b.totalInvested || 0) - (a.totalInvested || 0);
      }
      if (sortBy === 'profit') {
        return (b.totalProfitReceived || 0) - (a.totalProfitReceived || 0);
      }
      if (sortBy === 'position') {
        return (b.currentPosition || 0) - (a.currentPosition || 0);
      }
      return a.name.localeCompare(b.name);
    });
  }, [investors, searchTerm, statusFilter, sortBy]);

  const totalFilteredInvested = filteredInvestors.reduce((s, i) => s + (i.totalInvested || 0), 0);
  const totalFilteredWithdrawn = filteredInvestors.reduce((s, i) => s + (i.totalWithdrawn || 0), 0);
  const totalFilteredProfit = filteredInvestors.reduce((s, i) => s + (i.totalProfitReceived || 0), 0);
  const totalFilteredPending = filteredInvestors.reduce((s, i) => s + (i.pendingProfit || 0), 0);
  const totalFilteredPosition = filteredInvestors.reduce((s, i) => s + (i.currentPosition || 0), 0);

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#688285]" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={language === 'bn' ? 'নাম, মোবাইল নম্বর বা এনআইডি দিয়ে খুঁজুন...' : 'Search by name, phone or NID...'}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D9EAEB] rounded-xl text-xs text-[#17383B] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]"
          />
        </div>

        <div className="flex flex-wrap gap-2.5">
          {/* Status filter */}
          <div className="inline-flex rounded-xl p-1 bg-white border border-[#D9EAEB]">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-[#17383B] text-white shadow-xs'
                  : 'text-[#688285] hover:text-[#17383B]'
              }`}
            >
              {language === 'bn' ? 'সকল' : 'All'}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'active'
                  ? 'bg-[#0B9FA5] text-white shadow-xs'
                  : 'text-[#688285] hover:text-[#17383B]'
              }`}
            >
              {t('investorActive')}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'inactive'
                  ? 'bg-[#EA7185] text-white shadow-xs'
                  : 'text-[#688285] hover:text-[#17383B]'
              }`}
            >
              {t('investorInactive')}
            </button>
          </div>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-white border border-[#D9EAEB] rounded-xl text-xs text-[#17383B] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]"
          >
            <option value="investment">{language === 'bn' ? 'সর্বোচ্চ মূলধন' : 'Highest Investment'}</option>
            <option value="profit">{language === 'bn' ? 'সর্বোচ্চ লভ্যাংশ' : 'Highest Profit'}</option>
            <option value="position">{language === 'bn' ? 'সর্বোচ্চ চলতি পাওনা' : 'Highest Position'}</option>
            <option value="name">{language === 'bn' ? 'নামানুসারে (A-Z)' : 'Name (A-Z)'}</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-[#D9EAEB] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F1FAFA] text-[#688285] font-bold border-b border-[#D9EAEB]">
              <tr>
                <th className="p-3.5 pl-5">{t('investor')}</th>
                <th className="p-3.5 text-center">{t('mudarabaShareShort')} / {language === 'bn' ? 'চুক্তির মুনাফা %' : 'Contract %'}</th>
                <th className="p-3.5 text-right">{t('totalInvestment')}</th>
                <th className="p-3.5 text-right">{t('totalWithdrawals')}</th>
                <th className="p-3.5 text-right">{t('profitReceived')}</th>
                <th className="p-3.5 text-right">{t('pendingProfit')}</th>
                <th className="p-3.5 text-right">{t('currentPosition')}</th>
                <th className="p-3.5 pr-5 text-center">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F0F1]">
              {filteredInvestors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#8EA3A5] italic">
                    {language === 'bn' ? 'কোন বিনিয়োগকারী পাওয়া যায়নি' : 'No investors found'}
                  </td>
                </tr>
              ) : (
                filteredInvestors.map(inv => {
                  const netPrincipal = (inv.totalInvested || 0) - (inv.totalWithdrawn || 0);
                  return (
                    <tr key={inv.id} className="hover:bg-[#F9FCFC] transition-colors">
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#17383B] to-[#0B9FA5] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                            {inv.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span 
                                onClick={() => onViewProfile(inv)}
                                className="font-extrabold text-[#17383B] text-sm hover:text-[#0B9FA5] cursor-pointer transition-colors"
                              >
                                {inv.name}
                              </span>
                              {inv.status === 'active' ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-[#E8F8F2] text-[#229A73] font-bold text-[10px]">
                                  {t('investorActive')}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-[#FDF4F5] text-[#EA7185] font-bold text-[10px]">
                                  {t('investorInactive')}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-[#688285] mt-0.5">
                              <span>{inv.phone}</span>
                              {inv.startDate && <span>• {inv.startDate}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#E8F8F2] text-[#229A73] font-black text-[11px]">
                          {inv.mudarabaProfitSharePercentage ?? inv.sharePercentage ?? 30}%
                        </span>
                      </td>

                      <td className="p-3.5 text-right font-black text-sm text-[#0B9FA5] whitespace-nowrap">
                        {formatCurrency(inv.totalInvested || 0, language)}
                      </td>

                      <td className="p-3.5 text-right font-bold text-sm text-[#EA7185] whitespace-nowrap">
                        {formatCurrency(inv.totalWithdrawn || 0, language)}
                      </td>

                      <td className="p-3.5 text-right font-bold text-sm text-[#229A73] whitespace-nowrap">
                        {formatCurrency(inv.totalProfitReceived || 0, language)}
                      </td>

                      <td className="p-3.5 text-right font-bold text-sm text-[#F3B562] whitespace-nowrap">
                        {formatCurrency(inv.pendingProfit || 0, language)}
                      </td>

                      <td className="p-3.5 text-right font-black text-sm text-[#17383B] whitespace-nowrap bg-[#F1FAFA]/40">
                        {formatCurrency(inv.currentPosition || (netPrincipal + (inv.pendingProfit || 0)), language)}
                      </td>

                      <td className="p-3.5 pr-5">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Profile */}
                          <button
                            type="button"
                            onClick={() => onViewProfile(inv)}
                            className="p-1.5 rounded-lg text-[#0B9FA5] hover:bg-[#F1FAFA] transition-colors"
                            title={t('viewProfile')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Add Investment */}
                          <button
                            type="button"
                            onClick={() => onAddInvestment(inv)}
                            className="p-1.5 rounded-lg text-[#0B9FA5] hover:bg-[#E6F8F7] transition-colors"
                            title={t('addInvestment')}
                          >
                            <Plus className="w-4 h-4" />
                          </button>

                          {/* Record Withdrawal */}
                          <button
                            type="button"
                            onClick={() => onAddWithdrawal(inv)}
                            className="p-1.5 rounded-lg text-[#EA7185] hover:bg-[#FDF4F5] transition-colors"
                            title={t('addWithdrawal')}
                          >
                            <Minus className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => onEditInvestor(inv)}
                            className="p-1.5 rounded-lg text-[#688285] hover:bg-[#F1FAFA] transition-colors"
                            title={t('editInvestor')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(language === 'bn' ? `আপনি কি নিশ্চিত যে "${inv.name}" এর প্রোফাইল ও রেকর্ড মুছে ফেলতে চান?` : `Are you sure you want to delete "${inv.name}"?`)) {
                                onDeleteInvestor(inv.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-[#EA7185] hover:bg-[#FDF4F5] transition-colors"
                            title={t('delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredInvestors.length > 0 && (
              <tfoot className="bg-[#F1FAFA] font-bold border-t border-[#D9EAEB]">
                <tr>
                  <td className="p-3.5 pl-5 text-[#17383B] uppercase tracking-wider">
                    {t('total')} ({formatNumber(filteredInvestors.length, language)} {language === 'bn' ? 'জন' : 'investors'})
                  </td>
                  <td className="text-center">—</td>
                  <td className="p-3.5 text-right font-black text-sm text-[#0B9FA5]">
                    {formatCurrency(totalFilteredInvested, language)}
                  </td>
                  <td className="p-3.5 text-right font-black text-sm text-[#EA7185]">
                    {formatCurrency(totalFilteredWithdrawn, language)}
                  </td>
                  <td className="p-3.5 text-right font-black text-sm text-[#229A73]">
                    {formatCurrency(totalFilteredProfit, language)}
                  </td>
                  <td className="p-3.5 text-right font-black text-sm text-[#F3B562]">
                    {formatCurrency(totalFilteredPending, language)}
                  </td>
                  <td className="p-3.5 text-right font-black text-sm text-[#17383B] bg-[#E6F0F1]/60">
                    {formatCurrency(totalFilteredPosition, language)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
