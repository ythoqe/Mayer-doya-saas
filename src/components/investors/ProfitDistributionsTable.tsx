import React, { useState } from 'react';
import { ProfitDistribution, Account, Language } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { HandCoins, Calendar, ChevronDown, ChevronUp, CheckCircle2, Clock, DollarSign, Building2, TrendingUp, Calculator, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProfitDistributionsTableProps {
  profitDistributions: ProfitDistribution[];
  accounts: Account[];
  onOpenPayout: (distributionId: string, investorId: string, investorName: string, period: string, amount: number) => void;
  language: Language;
  t: (key: string) => string;
}

export const ProfitDistributionsTable: React.FC<ProfitDistributionsTableProps> = ({
  profitDistributions,
  accounts,
  onOpenPayout,
  language,
  t
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const getStatusBadge = (status: ProfitDistribution['status']) => {
    switch (status) {
      case 'fully_paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F8F2] text-[#229A73] font-bold text-[11px]">
            <CheckCircle2 className="w-3 h-3" />
            {t('distributionFullyPaid')}
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1] font-bold text-[11px]">
            <Clock className="w-3 h-3" />
            {t('distributionPartiallyPaid')}
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E6F8F7] text-[#0B9FA5] font-bold text-[11px]">
            <CheckCircle2 className="w-3 h-3" />
            {language === 'bn' ? 'অনুমোদিত' : 'Approved'}
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF3DF] text-[#D98A1B] font-bold text-[11px]">
            <Clock className="w-3 h-3" />
            {t('profitStatusPending')}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#D9EAEB] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F1FAFA] text-[#688285] font-bold border-b border-[#D9EAEB]">
              <tr>
                <th className="p-3.5 pl-5">{t('periodName')}</th>
                <th className="p-3.5">{t('distributionDate')}</th>
                <th className="p-3.5">{t('distributionRule')}</th>
                <th className="p-3.5 text-right">{language === 'bn' ? 'কোম্পানির নিট মুনাফা' : 'Company Profit'}</th>
                <th className="p-3.5 text-right">{language === 'bn' ? 'বিনিয়োগকারী মুনাফা' : 'Investor Profit'}</th>
                <th className="p-3.5 text-right">{t('profitDistributed')}</th>
                <th className="p-3.5 text-right">{t('pendingProfit')}</th>
                <th className="p-3.5 text-center">{t('status')}</th>
                <th className="p-3.5 pr-5 text-center">{t('details')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F0F1]">
              {profitDistributions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-[#8EA3A5] italic">
                    {language === 'bn' ? 'কোন লভ্যাংশ বণ্টনের রেকর্ড পাওয়া যায়নি' : 'No profit distribution runs recorded'}
                  </td>
                </tr>
              ) : (
                profitDistributions.map(dist => {
                  const isExpanded = expandedId === dist.id;
                  const companyProfit = dist.totalCompanyNetProfit || (dist.totalAllocated + (dist.totalFactoryRetainedProfit || 0));

                  return (
                    <React.Fragment key={dist.id}>
                      <tr 
                        onClick={() => toggleExpand(dist.id)}
                        className={`cursor-pointer transition-colors ${
                          isExpanded ? 'bg-[#F1FAFA]/70' : 'hover:bg-[#F9FCFC]'
                        }`}
                      >
                        <td className="p-3.5 pl-5 font-black text-[#17383B] text-sm">
                          {dist.period}
                        </td>
                        <td className="p-3.5 font-semibold text-[#688285]">
                          {dist.startDate && dist.endDate ? `${dist.startDate} ~ ${dist.endDate}` : dist.createdAt}
                        </td>
                        <td className="p-3.5 font-semibold text-[#17383B]">
                          {dist.distributionRule === 'mudaraba_proportional' && (
                            <span className="inline-flex items-center gap-1 text-[#229A73] font-bold">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              {language === 'bn' ? 'মুদারাবা আনুপাতিক' : 'Mudaraba Proportional'}
                            </span>
                          )}
                          {dist.distributionRule === 'proportional' && t('ruleProportional')}
                          {dist.distributionRule === 'agreed_share' && t('ruleAgreedShare')}
                          {dist.distributionRule === 'equal' && t('ruleEqual')}
                          {dist.distributionRule === 'manual' && t('ruleManual')}
                        </td>
                        <td className="p-3.5 text-right font-black text-sm text-[#17383B]">
                          {formatCurrency(companyProfit, language)}
                        </td>
                        <td className="p-3.5 text-right font-black text-sm text-[#0B9FA5]">
                          {formatCurrency(dist.totalAllocated, language)}
                        </td>
                        <td className="p-3.5 text-right font-black text-sm text-[#229A73]">
                          {formatCurrency(dist.totalPaid, language)}
                        </td>
                        <td className="p-3.5 text-right font-black text-sm text-[#F3B562]">
                          {formatCurrency(dist.totalPending, language)}
                        </td>
                        <td className="p-3.5 text-center">
                          {getStatusBadge(dist.status)}
                        </td>
                        <td className="p-3.5 pr-5 text-center">
                          <button
                            type="button"
                            className="p-1.5 rounded-lg text-[#0B9FA5] hover:bg-white"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Nested Allocation Details with Full Mudaraba 7-Step Arithmetic */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="p-0 bg-[#F9FCFC] border-y border-[#D9EAEB]">
                            <div className="p-4 sm:p-6 space-y-4">
                              {/* Mudaraba Distribution Summary Cards */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-3 rounded-xl bg-white border border-[#D9EAEB]">
                                  <span className="text-[10px] text-[#688285] font-bold uppercase block">
                                    {t('existingFactoryCapital')}
                                  </span>
                                  <span className="text-sm font-black text-[#17383B]">
                                    {formatCurrency(dist.existingFactoryCapital || 1000000, language)}
                                  </span>
                                </div>
                                <div className="p-3 rounded-xl bg-white border border-[#D9EAEB]">
                                  <span className="text-[10px] text-[#688285] font-bold uppercase block">
                                    {t('totalCompanyNetProfit')}
                                  </span>
                                  <span className="text-sm font-black text-[#17383B]">
                                    {formatCurrency(companyProfit, language)}
                                  </span>
                                </div>
                                <div className="p-3 rounded-xl bg-[#E8F8F2] border border-[#BDEBD7]">
                                  <span className="text-[10px] text-[#229A73] font-bold uppercase block">
                                    {language === 'bn' ? 'মোট বিনিয়োগকারী মুনাফা' : 'Total Investor Profit'}
                                  </span>
                                  <span className="text-sm font-black text-[#229A73]">
                                    {formatCurrency(dist.totalAllocated, language)}
                                  </span>
                                </div>
                                <div className="p-3 rounded-xl bg-[#FFF3DF] border border-[#FED7AA]">
                                  <span className="text-[10px] text-[#D98A1B] font-bold uppercase block">
                                    {t('factoryRetainedProfit')}
                                  </span>
                                  <span className="text-sm font-black text-[#D98A1B]">
                                    {formatCurrency(Math.max(0, companyProfit - dist.totalAllocated), language)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-[#17383B] uppercase tracking-wider flex items-center gap-2">
                                  <Calculator className="w-4 h-4 text-[#0B9FA5]" />
                                  {language === 'bn' ? 'অংশীদার অনুযায়ী মুদারাবা বণ্টন ও হিসাব বিবরণী' : 'Partner Mudaraba Allocation & Mathematical Breakdown'}
                                </span>
                                <span className="text-[11px] text-[#688285] font-semibold">
                                  {formatNumber(dist.allocations.length, language)} {language === 'bn' ? 'জন অংশীদার' : 'partners'}
                                </span>
                              </div>

                              <div className="border border-[#D9EAEB] rounded-xl overflow-hidden bg-white shadow-2xs">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-[#F1FAFA] text-[#688285] font-bold border-b border-[#D9EAEB]">
                                    <tr>
                                      <th className="p-3 pl-4">{t('investorName')}</th>
                                      <th className="p-3 text-right">{language === 'bn' ? 'মূলধন (৳)' : 'Invested (৳)'}</th>
                                      <th className="p-3 text-center">{t('investorOwnership')}</th>
                                      <th className="p-3 text-right">{t('proportionalProfit')} (৳)</th>
                                      <th className="p-3 text-center">{t('mudarabaShareShort')} (%)</th>
                                      <th className="p-3 text-right">{t('finalInvestorProfit')} (৳)</th>
                                      <th className="p-3 text-center">{t('status')}</th>
                                      <th className="p-3">{t('paidAt')} / {t('payingAccount')}</th>
                                      <th className="p-3 pr-4 text-center">{t('action')}</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#E6F0F1]">
                                    {dist.allocations.map(alloc => {
                                      const ownership = alloc.ownershipPercentage || alloc.sharePercentage || 0;
                                      const proportional = alloc.proportionalProfit || (companyProfit * (ownership / 100));
                                      const mudarabaRate = alloc.mudarabaProfitSharePercentage || 30;

                                      return (
                                        <tr key={alloc.investorId} className="hover:bg-[#F9FCFC]">
                                          <td className="p-3 pl-4 font-bold text-[#17383B]">
                                            {alloc.investorName}
                                          </td>
                                          <td className="p-3 text-right font-semibold text-[#0B9FA5]">
                                            {formatCurrency(alloc.investedAmount || 0, language)}
                                          </td>
                                          <td className="p-3 text-center">
                                            <span className="inline-flex px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1] font-black text-[11px]">
                                              {ownership.toFixed(2)}%
                                            </span>
                                          </td>
                                          <td className="p-3 text-right font-semibold text-[#17383B]">
                                            {formatCurrency(proportional, language)}
                                          </td>
                                          <td className="p-3 text-center font-black text-[#229A73]">
                                            {mudarabaRate}%
                                          </td>
                                          <td className="p-3 text-right font-black text-sm text-[#229A73]">
                                            {formatCurrency(alloc.allocatedProfit, language)}
                                          </td>
                                          <td className="p-3 text-center">
                                            {alloc.status === 'paid' ? (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8F8F2] text-[#229A73] font-bold text-[10px]">
                                                <CheckCircle2 className="w-3 h-3" />
                                                {t('profitStatusPaid')}
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFF3DF] text-[#D98A1B] font-bold text-[10px]">
                                                <Clock className="w-3 h-3" />
                                                {t('profitStatusPending')}
                                              </span>
                                            )}
                                          </td>
                                          <td className="p-3 text-[#688285]">
                                            {alloc.status === 'paid' ? (
                                              <div>
                                                <span className="font-semibold text-[#17383B]">{alloc.accountName}</span>
                                                {alloc.paidAt && <span className="text-[10px] text-[#8EA3A5] block">({alloc.paidAt})</span>}
                                              </div>
                                            ) : (
                                              <span className="text-[#8EA3A5] italic">—</span>
                                            )}
                                          </td>
                                          <td className="p-3 pr-4 text-center">
                                            {alloc.status === 'pending' ? (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  onOpenPayout(dist.id, alloc.investorId, alloc.investorName, dist.period, alloc.allocatedProfit);
                                                }}
                                                className="px-3 py-1.5 rounded-xl bg-[#229A73] hover:bg-[#1C8260] text-white font-bold text-xs shadow-xs transition-all"
                                              >
                                                {t('payProfit')}
                                              </button>
                                            ) : (
                                              <span className="text-xs font-semibold text-[#229A73]">{t('profitStatusPaid')}</span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
