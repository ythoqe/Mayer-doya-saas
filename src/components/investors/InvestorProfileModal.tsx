import React, { useState } from 'react';
import { Investor, Investment, InvestorWithdrawal, ProfitDistribution, Account, Language } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { 
  X, 
  Building2, 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight, 
  HandCoins, 
  Calendar, 
  Phone, 
  Mail, 
  FileText, 
  Plus, 
  Edit2, 
  CheckCircle2, 
  Clock, 
  Printer, 
  Percent, 
  Wallet,
  ShieldCheck,
  Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InvestorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  investor: Investor;
  investments: Investment[];
  withdrawals: InvestorWithdrawal[];
  profitDistributions: ProfitDistribution[];
  accounts?: Account[];
  onAddInvestment: (investor: Investor) => void;
  onAddWithdrawal: (investor: Investor) => void;
  onEditInvestor: (investor: Investor) => void;
  onPrintStatement?: (investor: Investor) => void;
  onOpenStatement?: (investor: Investor) => void;
  language: Language;
  t: (key: string) => string;
}

export const InvestorProfileModal: React.FC<InvestorProfileModalProps> = ({
  isOpen,
  onClose,
  investor,
  investments,
  withdrawals,
  profitDistributions,
  accounts,
  onAddInvestment,
  onAddWithdrawal,
  onEditInvestor,
  onPrintStatement,
  onOpenStatement,
  language,
  t
}) => {
  const handlePrintStatement = (inv: Investor) => {
    if (onPrintStatement) onPrintStatement(inv);
    else if (onOpenStatement) onOpenStatement(inv);
  };
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'investments' | 'withdrawals' | 'profits' | 'details'>('overview');

  if (!isOpen || !investor) return null;

  const investorInvestments = investments
    .filter(i => i.investorId === investor.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const investorWithdrawals = withdrawals
    .filter(w => w.investorId === investor.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Collect profit allocations with Mudaraba details
  const investorProfits = profitDistributions.flatMap(dist => {
    const alloc = dist.allocations.find(a => a.investorId === investor.id);
    if (!alloc) return [];
    return [{
      distributionId: dist.id,
      period: dist.period,
      rule: dist.distributionRule,
      date: dist.endDate || dist.createdAt,
      existingFactoryCapital: alloc.existingFactoryCapital || dist.existingFactoryCapital,
      totalCapitalAfterInvestment: alloc.totalCapitalAfterInvestment,
      ownershipPercentage: alloc.ownershipPercentage || alloc.sharePercentage || 0,
      proportionalProfit: alloc.proportionalProfit,
      mudarabaProfitSharePercentage: alloc.mudarabaProfitSharePercentage || investor.mudarabaProfitSharePercentage || 30,
      allocatedProfit: alloc.allocatedProfit,
      status: alloc.status,
      paidAt: alloc.paidAt,
      accountName: alloc.accountName,
      paymentReference: alloc.paymentReference
    }];
  });

  const totalInvested = investor.totalInvested || 0;
  const totalWithdrawn = investor.totalWithdrawn || 0;
  const netPrincipal = totalInvested - totalWithdrawn;
  const totalProfitReceived = investor.totalProfitReceived || 0;
  const pendingProfit = investor.pendingProfit || 0;
  const currentPosition = investor.currentPosition || (netPrincipal + pendingProfit);
  const contractMudarabaRate = investor.mudarabaProfitSharePercentage ?? (investor.sharePercentage ?? 30);

  // Unified Chronological Ledger
  const rawEvents: Array<{
    id: string;
    date: string;
    type: 'investment' | 'withdrawal' | 'profit_allocation' | 'profit_payout';
    amount: number;
    description: string;
    reference?: string;
  }> = [];

  investorInvestments.forEach(inv => {
    rawEvents.push({
      id: inv.id,
      date: inv.date,
      type: 'investment',
      amount: inv.amount,
      description: `Investment (${inv.investmentType.replace('_', ' ')}) - ${inv.accountName || 'Cash'}`,
      reference: inv.reference
    });
  });

  investorWithdrawals.forEach(wd => {
    rawEvents.push({
      id: wd.id,
      date: wd.date,
      type: 'withdrawal',
      amount: wd.amount,
      description: `Withdrawal (${wd.reason.replace('_', ' ')}) - ${wd.accountName || 'Cash'}`,
      reference: wd.reference
    });
  });

  profitDistributions.forEach(dist => {
    const alloc = dist.allocations.find(a => a.investorId === investor.id);
    if (alloc) {
      rawEvents.push({
        id: `alloc-${dist.id}`,
        date: dist.endDate || dist.createdAt || new Date().toISOString().split('T')[0],
        type: 'profit_allocation',
        amount: alloc.allocatedProfit,
        description: `Mudaraba Profit Allocated (${dist.period})`,
        reference: dist.period
      });

      if (alloc.status === 'paid') {
        rawEvents.push({
          id: `paid-${dist.id}`,
          date: alloc.paidAt || dist.endDate || dist.createdAt || new Date().toISOString().split('T')[0],
          type: 'profit_payout',
          amount: alloc.allocatedProfit,
          description: `Profit Paid (${dist.period}) - ${alloc.accountName || 'Cash'}`,
          reference: alloc.paymentReference
        });
      }
    }
  });

  rawEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningCap = 0;
  const ledgerRows = rawEvents.map(evt => {
    if (evt.type === 'investment') runningCap += evt.amount;
    if (evt.type === 'withdrawal') runningCap -= evt.amount;
    return {
      ...evt,
      runningCapBalance: runningCap
    };
  }).reverse();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-white rounded-3xl shadow-2xl border border-[#D9EAEB] w-full max-w-5xl overflow-hidden my-6 max-h-[92vh] flex flex-col"
        >
          {/* Header Banner */}
          <div className="p-6 bg-gradient-to-r from-[#17383B] via-[#1F4B4F] to-[#0B9FA5] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 text-white font-black text-2xl flex items-center justify-center shadow-md">
                {investor.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                    {investor.name}
                  </h2>
                  {investor.status === 'active' ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#229A73] text-white text-[11px] font-bold">
                      {t('investorActive')}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EA7185] text-white text-[11px] font-bold">
                      {t('investorInactive')}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E8F8F2] text-[#17383B] text-[11px] font-extrabold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#229A73]" />
                    {contractMudarabaRate}% {language === 'bn' ? 'মুদারাবা হার' : 'Mudaraba Share'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-white/80 mt-1">
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {investor.phone}</span>
                  {investor.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {investor.email}</span>}
                  {investor.startDate && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {investor.startDate}</span>}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => onAddInvestment(investor)}
                className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                title={t('addInvestment')}
              >
                <Plus className="w-4 h-4 text-[#16B8B0]" />
                <span>{t('invest')}</span>
              </button>
              <button
                type="button"
                onClick={() => onAddWithdrawal(investor)}
                className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                title={t('addWithdrawal')}
              >
                <ArrowUpRight className="w-4 h-4 text-[#EA7185]" />
                <span>{t('withdraw')}</span>
              </button>
              <button
                type="button"
                onClick={() => handlePrintStatement(investor)}
                className="px-3.5 py-2 rounded-xl bg-white text-[#17383B] hover:bg-white/90 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                title={t('printStatement')}
              >
                <Printer className="w-4 h-4 text-[#0B9FA5]" />
                <span>{t('printStatement')}</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-white/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sub Navigation Bar */}
          <div className="px-6 border-b border-[#D9EAEB] bg-[#F1FAFA] flex items-center gap-2 overflow-x-auto shrink-0">
            {[
              { id: 'overview', label: t('statement') + ' / ' + t('dashboard') },
              { id: 'investments', label: `${t('investments')} (${investorInvestments.length})` },
              { id: 'withdrawals', label: `${t('withdrawals')} (${investorWithdrawals.length})` },
              { id: 'profits', label: `${t('profitDistribution')} (${investorProfits.length})` },
              { id: 'details', label: t('investorInformation') }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`py-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                  activeSubTab === tab.id
                    ? 'border-[#0B9FA5] text-[#0B9FA5] bg-white rounded-t-xl'
                    : 'border-transparent text-[#688285] hover:text-[#17383B]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* KPI Cards Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-[#F1FAFA] p-3.5 rounded-2xl border border-[#D9EAEB]">
                <span className="text-[10px] text-[#688285] font-bold block uppercase">{t('totalInvestment')}</span>
                <span className="text-sm sm:text-base font-black text-[#0B9FA5] mt-1 block">
                  {formatCurrency(totalInvested, language)}
                </span>
              </div>
              <div className="bg-[#F1FAFA] p-3.5 rounded-2xl border border-[#D9EAEB]">
                <span className="text-[10px] text-[#688285] font-bold block uppercase">{t('totalWithdrawals')}</span>
                <span className="text-sm sm:text-base font-black text-[#EA7185] mt-1 block">
                  {formatCurrency(totalWithdrawn, language)}
                </span>
              </div>
              <div className="bg-[#F1FAFA] p-3.5 rounded-2xl border border-[#D9EAEB]">
                <span className="text-[10px] text-[#688285] font-bold block uppercase">{t('netPrincipal')}</span>
                <span className="text-sm sm:text-base font-black text-[#17383B] mt-1 block">
                  {formatCurrency(netPrincipal, language)}
                </span>
              </div>
              <div className="bg-[#E8F8F2] p-3.5 rounded-2xl border border-[#BDEBD7]">
                <span className="text-[10px] text-[#229A73] font-bold block uppercase">{t('profitReceived')}</span>
                <span className="text-sm sm:text-base font-black text-[#229A73] mt-1 block">
                  {formatCurrency(totalProfitReceived, language)}
                </span>
              </div>
              <div className="bg-[#FFF3DF] p-3.5 rounded-2xl border border-[#FED7AA]">
                <span className="text-[10px] text-[#D98A1B] font-bold block uppercase">{t('pendingProfit')}</span>
                <span className="text-sm sm:text-base font-black text-[#D98A1B] mt-1 block">
                  {formatCurrency(pendingProfit, language)}
                </span>
              </div>
              <div className="bg-[#17383B] p-3.5 rounded-2xl text-white shadow-xs">
                <span className="text-[10px] text-white/70 font-bold block uppercase">{t('currentPosition')}</span>
                <span className="text-sm sm:text-base font-black text-[#16B8B0] mt-1 block">
                  {formatCurrency(currentPosition, language)}
                </span>
              </div>
            </div>

            {/* 1. Overview / Ledger Statement */}
            {activeSubTab === 'overview' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#17383B] uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#0B9FA5]" />
                    {t('investorLedger')} ({language === 'bn' ? 'চলমান হিসাব খতিয়ান' : 'Chronological Statement'})
                  </h3>
                  <span className="text-[11px] text-[#688285]">
                    {formatNumber(ledgerRows.length, language)} {language === 'bn' ? 'টি লেনদেন' : 'events'}
                  </span>
                </div>

                <div className="border border-[#D9EAEB] rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F1FAFA] text-[#688285] font-bold border-b border-[#D9EAEB]">
                      <tr>
                        <th className="p-3 pl-4">{t('date')}</th>
                        <th className="p-3">{t('type')}</th>
                        <th className="p-3">{t('description')}</th>
                        <th className="p-3 text-right">{language === 'bn' ? 'বিনিয়োগ (+)' : 'In (+)'}</th>
                        <th className="p-3 text-right">{language === 'bn' ? 'উত্তোলন / প্রাপ্তি (-)' : 'Out (-)'}</th>
                        <th className="p-3 pr-4 text-right">{t('netPrincipal')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6F0F1]">
                      {ledgerRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-[#8EA3A5] italic">
                            No ledger transactions recorded yet.
                          </td>
                        </tr>
                      ) : (
                        ledgerRows.map(row => {
                          const isPlus = row.type === 'investment' || row.type === 'profit_allocation';
                          const isMinus = row.type === 'withdrawal' || row.type === 'profit_payout';

                          return (
                            <tr key={row.id} className="hover:bg-[#F9FCFC]">
                              <td className="p-3 pl-4 font-semibold text-[#17383B]">{row.date}</td>
                              <td className="p-3">
                                {row.type === 'investment' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E6F8F7] text-[#0B9FA5] font-bold text-[10px]">
                                    <ArrowDownLeft className="w-3 h-3" />
                                    {t('investmentTypePrincipal')}
                                  </span>
                                )}
                                {row.type === 'withdrawal' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FDF4F5] text-[#EA7185] font-bold text-[10px]">
                                    <ArrowUpRight className="w-3 h-3" />
                                    {t('withdrawals')}
                                  </span>
                                )}
                                {row.type === 'profit_allocation' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFF3DF] text-[#D98A1B] font-bold text-[10px]">
                                    <Clock className="w-3 h-3" />
                                    {t('profitAllocation')}
                                  </span>
                                )}
                                {row.type === 'profit_payout' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8F8F2] text-[#229A73] font-bold text-[10px]">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {t('profitStatusPaid')}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-[#17383B] font-medium">{row.description}</td>
                              <td className="p-3 text-right font-black text-[#0B9FA5]">
                                {row.type === 'investment' ? `+ ${formatCurrency(row.amount, language)}` : '—'}
                              </td>
                              <td className="p-3 text-right font-black text-[#EA7185]">
                                {row.type === 'withdrawal' ? `- ${formatCurrency(row.amount, language)}` : (row.type === 'profit_payout' ? formatCurrency(row.amount, language) : '—')}
                              </td>
                              <td className="p-3 pr-4 text-right font-black text-[#17383B]">
                                {formatCurrency(row.runningCapBalance, language)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. Investments */}
            {activeSubTab === 'investments' && (
              <div className="border border-[#D9EAEB] rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F1FAFA] text-[#688285] font-bold border-b border-[#D9EAEB]">
                    <tr>
                      <th className="p-3 pl-4">{t('investmentDate')}</th>
                      <th className="p-3">{t('investmentType')}</th>
                      <th className="p-3">{t('receivingAccount')}</th>
                      <th className="p-3">{t('paymentReference')}</th>
                      <th className="p-3">{t('notes')}</th>
                      <th className="p-3 pr-4 text-right">{t('investmentAmount')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6F0F1]">
                    {investorInvestments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-[#8EA3A5] italic">
                          No investment history found.
                        </td>
                      </tr>
                    ) : (
                      investorInvestments.map(inv => (
                        <tr key={inv.id} className="hover:bg-[#F9FCFC]">
                          <td className="p-3 pl-4 font-semibold text-[#17383B]">{inv.date}</td>
                          <td className="p-3 font-bold text-[#0B9FA5]">{inv.investmentType}</td>
                          <td className="p-3 text-[#17383B]">{inv.accountName || 'Cash Account'}</td>
                          <td className="p-3 text-[#688285]">{inv.reference || '—'}</td>
                          <td className="p-3 text-[#688285]">{inv.notes || '—'}</td>
                          <td className="p-3 pr-4 text-right font-black text-sm text-[#0B9FA5]">
                            + {formatCurrency(inv.amount, language)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. Withdrawals */}
            {activeSubTab === 'withdrawals' && (
              <div className="border border-[#D9EAEB] rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F1FAFA] text-[#688285] font-bold border-b border-[#D9EAEB]">
                    <tr>
                      <th className="p-3 pl-4">{t('withdrawalDate')}</th>
                      <th className="p-3">{t('withdrawalReason')}</th>
                      <th className="p-3">{t('payingAccount')}</th>
                      <th className="p-3">{t('paymentReference')}</th>
                      <th className="p-3">{t('notes')}</th>
                      <th className="p-3 pr-4 text-right">{t('withdrawalAmount')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6F0F1]">
                    {investorWithdrawals.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-[#8EA3A5] italic">
                          No withdrawal records found.
                        </td>
                      </tr>
                    ) : (
                      investorWithdrawals.map(wd => (
                        <tr key={wd.id} className="hover:bg-[#F9FCFC]">
                          <td className="p-3 pl-4 font-semibold text-[#17383B]">{wd.date}</td>
                          <td className="p-3 font-bold text-[#EA7185]">{wd.reason}</td>
                          <td className="p-3 text-[#17383B]">{wd.accountName || 'Cash Account'}</td>
                          <td className="p-3 text-[#688285]">{wd.reference || '—'}</td>
                          <td className="p-3 text-[#688285]">{wd.notes || '—'}</td>
                          <td className="p-3 pr-4 text-right font-black text-sm text-[#EA7185]">
                            - {formatCurrency(wd.amount, language)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. Profits with Full Mudaraba Proportional Breakdown */}
            {activeSubTab === 'profits' && (
              <div className="space-y-4">
                <div className="p-4 bg-[#F1FAFA] rounded-2xl border border-[#D9EAEB] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#17383B] block">
                      {language === 'bn' ? 'মুদারাবা চুক্তিভিত্তিক লভ্যাংশ বণ্টন হার:' : 'Contracted Mudaraba Profit Sharing Rate:'}
                    </span>
                    <p className="text-[#688285] text-[11px] mt-0.5">
                      {language === 'bn' 
                        ? `বিনিয়োগকারীর মূলধনি মালিকানা অনুযায়ী অর্জিত নিট মুনাফার ${contractMudarabaRate}% বিনিয়োগকারী পান এবং বাকি ${100 - contractMudarabaRate}% কারখানা ব্যবস্থাপনা গ্রহণ করে।`
                        : `Investor receives ${contractMudarabaRate}% of the proportional net profit generated by their equity base, while factory retains ${100 - contractMudarabaRate}%.`}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-[#229A73]">{contractMudarabaRate}%</span>
                  </div>
                </div>

                <div className="border border-[#D9EAEB] rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F1FAFA] text-[#688285] font-bold border-b border-[#D9EAEB]">
                      <tr>
                        <th className="p-3 pl-4">{t('periodName')}</th>
                        <th className="p-3 text-center">{t('investorOwnership')}</th>
                        <th className="p-3 text-right">{t('proportionalProfit')} (৳)</th>
                        <th className="p-3 text-center">{t('mudarabaShareShort')} (%)</th>
                        <th className="p-3 text-right">{t('finalInvestorProfit')} (৳)</th>
                        <th className="p-3 text-center">{t('status')}</th>
                        <th className="p-3 pr-4">{t('paidAt')} / {t('payingAccount')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6F0F1]">
                      {investorProfits.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-[#8EA3A5] italic">
                            No profit distribution history for this investor.
                          </td>
                        </tr>
                      ) : (
                        investorProfits.map((prof, pIdx) => (
                          <tr key={pIdx} className="hover:bg-[#F9FCFC]">
                            <td className="p-3 pl-4 font-bold text-[#17383B]">{prof.period}</td>
                            <td className="p-3 text-center">
                              <span className="inline-flex px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1] font-bold text-[11px]">
                                {prof.ownershipPercentage.toFixed(2)}%
                              </span>
                            </td>
                            <td className="p-3 text-right font-semibold text-[#17383B]">
                              {prof.proportionalProfit ? formatCurrency(prof.proportionalProfit, language) : '—'}
                            </td>
                            <td className="p-3 text-center font-bold text-[#229A73]">
                              {prof.mudarabaProfitSharePercentage}%
                            </td>
                            <td className="p-3 text-right font-black text-sm text-[#229A73]">
                              {formatCurrency(prof.allocatedProfit, language)}
                            </td>
                            <td className="p-3 text-center">
                              {prof.status === 'paid' ? (
                                <span className="inline-flex px-2 py-0.5 rounded-full bg-[#E8F8F2] text-[#229A73] font-bold text-[10px]">
                                  {t('profitStatusPaid')}
                                </span>
                              ) : (
                                <span className="inline-flex px-2 py-0.5 rounded-full bg-[#FFF3DF] text-[#D98A1B] font-bold text-[10px]">
                                  {t('profitStatusPending')}
                                </span>
                              )}
                            </td>
                            <td className="p-3 pr-4 text-[#688285]">
                              {prof.status === 'paid' ? (
                                <div>
                                  <span className="font-semibold text-[#17383B]">{prof.accountName}</span>
                                  {prof.paidAt && <span className="text-[10px] text-[#8EA3A5] block">({prof.paidAt})</span>}
                                </div>
                              ) : (
                                <span className="text-[#8EA3A5] italic">—</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. Details Profile */}
            {activeSubTab === 'details' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#F1FAFA] p-5 rounded-2xl border border-[#D9EAEB] space-y-3">
                  <h3 className="text-xs font-bold text-[#0B9FA5] uppercase tracking-wider">
                    {t('investorInformation')}
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-[#D9EAEB] pb-1.5">
                      <span className="text-[#688285] font-medium">{t('investorName')}:</span>
                      <span className="font-bold text-[#17383B]">{investor.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#D9EAEB] pb-1.5">
                      <span className="text-[#688285] font-medium">{t('investorPhone')}:</span>
                      <span className="font-bold text-[#17383B]">{investor.phone}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#D9EAEB] pb-1.5">
                      <span className="text-[#688285] font-medium">{t('investorEmail')}:</span>
                      <span className="font-semibold text-[#17383B]">{investor.email || '—'}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#D9EAEB] pb-1.5">
                      <span className="text-[#688285] font-medium">{t('nidOrPassport')}:</span>
                      <span className="font-semibold text-[#17383B]">{investor.nidOrPassport || '—'}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#D9EAEB] pb-1.5">
                      <span className="text-[#688285] font-medium">{t('startDate')}:</span>
                      <span className="font-semibold text-[#17383B]">{investor.startDate || '—'}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#D9EAEB] pb-1.5">
                      <span className="text-[#688285] font-medium">{t('mudarabaProfitSharePercentage')}:</span>
                      <span className="font-black text-[#229A73]">{contractMudarabaRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#688285] font-medium">{t('investorAddress')}:</span>
                      <span className="font-semibold text-[#17383B]">{investor.address || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#F1FAFA] p-5 rounded-2xl border border-[#D9EAEB] space-y-3 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[#0B9FA5] uppercase tracking-wider mb-3">
                      {t('bankDetails')} & {t('notes')}
                    </h3>
                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-[#688285] font-medium block">{t('bankDetails')}:</span>
                        <p className="font-semibold text-[#17383B] mt-0.5 bg-white p-3 rounded-xl border border-[#D9EAEB]">
                          {investor.bankDetails || 'No bank/MFS details specified.'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#688285] font-medium block">{t('notes')}:</span>
                        <p className="font-medium text-[#688285] mt-0.5 bg-white p-3 rounded-xl border border-[#D9EAEB]">
                          {investor.notes || 'No additional terms recorded.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#D9EAEB] flex justify-end">
                    <button
                      type="button"
                      onClick={() => onEditInvestor(investor)}
                      className="px-4 py-2 rounded-xl bg-[#0B9FA5] hover:bg-[#09878C] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{t('editInvestor')}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
