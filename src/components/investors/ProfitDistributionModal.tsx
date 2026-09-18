import React, { useState, useEffect, useMemo } from 'react';
import { Investor, Account, ProfitDistribution, Language, InvestorProfitAllocation } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { 
  X, 
  HandCoins, 
  Calendar, 
  Building2, 
  TrendingUp, 
  Calculator, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  HelpCircle, 
  Percent, 
  DollarSign, 
  ChevronRight, 
  Eye, 
  ShieldCheck, 
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProfitDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  investors: Investor[];
  accounts: Account[];
  onDistribute: (data: any) => Promise<void>;
  language: Language;
  t: (key: string) => string;
}

interface AllocationRowState {
  investorId: string;
  investorName: string;
  investedAmount: number;
  existingFactoryCapital: number;
  totalCapitalAfterInvestment: number;
  ownershipPercentage: number;
  proportionalProfit: number;
  mudarabaProfitSharePercentage: number;
  allocatedProfit: number;
  factoryRetainedProfit: number;
  status: 'paid' | 'pending';
  accountId?: string;
  accountName?: string;
}

export const ProfitDistributionModal: React.FC<ProfitDistributionModalProps> = ({
  isOpen,
  onClose,
  investors,
  accounts,
  onDistribute,
  language,
  t
}) => {
  const [period, setPeriod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [existingFactoryCapital, setExistingFactoryCapital] = useState<number | ''>(1000000);
  const [totalCompanyNetProfit, setTotalCompanyNetProfit] = useState<number | ''>(500000);
  const [distributionRule, setDistributionRule] = useState<ProfitDistribution['distributionRule']>('mudaraba_proportional');
  const [allocations, setAllocations] = useState<AllocationRowState[]>([]);
  const [defaultAccountId, setDefaultAccountId] = useState('');
  const [selectedBreakdownInvestor, setSelectedBreakdownInvestor] = useState<AllocationRowState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const activeInvestors = useMemo(() => investors.filter(i => i.status === 'active'), [investors]);

  // Compute total active investor injected capital
  const totalActiveInvestorCapital = useMemo(() => {
    return activeInvestors.reduce((sum, i) => sum + Math.max(0, (i.totalInvested || 0) - (i.totalWithdrawn || 0)), 0);
  }, [activeInvestors]);

  // Set default initial period, dates, and factory capital
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthNamesBn = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
      const currentMonth = language === 'bn' ? monthNamesBn[now.getMonth()] : monthNamesEn[now.getMonth()];
      setPeriod(`${currentMonth} ${now.getFullYear()}`);
      
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
      
      // Default to 10,00,000 factory capital if not set
      setExistingFactoryCapital(1000000);
      setTotalCompanyNetProfit(500000);
      setDistributionRule('mudaraba_proportional');
      
      if (accounts.length > 0) {
        setDefaultAccountId(accounts[0].id);
      }
      setError('');
      setSelectedBreakdownInvestor(null);
    }
  }, [isOpen, language, accounts]);

  // Core Mudaraba Calculation Engine
  useEffect(() => {
    const netProfitNum = Number(totalCompanyNetProfit) || 0;
    const factoryCapNum = Number(existingFactoryCapital) || 0;

    if (activeInvestors.length === 0) {
      setAllocations([]);
      return;
    }

    const defaultAcc = accounts.find(a => a.id === defaultAccountId) || accounts[0];
    const totalEnterpriseCapital = factoryCapNum + totalActiveInvestorCapital;

    if (distributionRule === 'mudaraba_proportional' || distributionRule === 'proportional') {
      const newAllocations: AllocationRowState[] = activeInvestors.map(inv => {
        const invCap = Math.max(0, (inv.totalInvested || 0) - (inv.totalWithdrawn || 0));
        
        // 1. Total Capital After Investment = Existing Factory Capital + Investor Capital Base
        // For combined portfolio: ownership % in enterprise
        const ownershipPct = totalEnterpriseCapital > 0 ? (invCap / totalEnterpriseCapital) * 100 : 0;
        
        // 2. Proportional share of company net profit
        const proportionalProfit = (netProfitNum * (ownershipPct / 100));
        
        // 3. Agreed Mudaraba profit sharing %
        const mudarabaPct = inv.mudarabaProfitSharePercentage ?? (inv.sharePercentage ?? 30);
        
        // 4. Final Investor Profit = Proportional Profit * (Mudaraba % / 100)
        const finalProfit = Math.round((proportionalProfit * (mudarabaPct / 100)) * 100) / 100;
        const factoryRetained = Math.round((proportionalProfit - finalProfit) * 100) / 100;

        return {
          investorId: inv.id,
          investorName: inv.name,
          investedAmount: invCap,
          existingFactoryCapital: factoryCapNum,
          totalCapitalAfterInvestment: totalEnterpriseCapital,
          ownershipPercentage: Math.round(ownershipPct * 10000) / 10000,
          proportionalProfit: Math.round(proportionalProfit * 100) / 100,
          mudarabaProfitSharePercentage: mudarabaPct,
          allocatedProfit: finalProfit,
          factoryRetainedProfit: factoryRetained,
          status: 'pending',
          accountId: defaultAcc?.id,
          accountName: defaultAcc?.accountName
        };
      });

      setAllocations(newAllocations);
    } else if (distributionRule === 'agreed_share') {
      const totalAgreed = activeInvestors.reduce((s, i) => s + (i.sharePercentage || 0), 0);
      const newAllocations: AllocationRowState[] = activeInvestors.map(inv => {
        const invCap = Math.max(0, (inv.totalInvested || 0) - (inv.totalWithdrawn || 0));
        const pct = inv.sharePercentage || 0;
        const normalizedPct = totalAgreed > 0 ? (pct / totalAgreed) * 100 : (100 / activeInvestors.length);
        const allocated = Math.round((netProfitNum * (normalizedPct / 100)) * 100) / 100;
        return {
          investorId: inv.id,
          investorName: inv.name,
          investedAmount: invCap,
          existingFactoryCapital: factoryCapNum,
          totalCapitalAfterInvestment: totalEnterpriseCapital,
          ownershipPercentage: Math.round(normalizedPct * 100) / 100,
          proportionalProfit: allocated,
          mudarabaProfitSharePercentage: 100,
          allocatedProfit: allocated,
          factoryRetainedProfit: 0,
          status: 'pending',
          accountId: defaultAcc?.id,
          accountName: defaultAcc?.accountName
        };
      });
      setAllocations(newAllocations);
    } else if (distributionRule === 'equal') {
      const pct = 100 / activeInvestors.length;
      const allocated = Math.round((netProfitNum / activeInvestors.length) * 100) / 100;
      const newAllocations: AllocationRowState[] = activeInvestors.map(inv => {
        const invCap = Math.max(0, (inv.totalInvested || 0) - (inv.totalWithdrawn || 0));
        return {
          investorId: inv.id,
          investorName: inv.name,
          investedAmount: invCap,
          existingFactoryCapital: factoryCapNum,
          totalCapitalAfterInvestment: totalEnterpriseCapital,
          ownershipPercentage: Math.round(pct * 100) / 100,
          proportionalProfit: allocated,
          mudarabaProfitSharePercentage: 100,
          allocatedProfit: allocated,
          factoryRetainedProfit: 0,
          status: 'pending',
          accountId: defaultAcc?.id,
          accountName: defaultAcc?.accountName
        };
      });
      setAllocations(newAllocations);
    }
  }, [existingFactoryCapital, totalCompanyNetProfit, distributionRule, activeInvestors, totalActiveInvestorCapital, defaultAccountId, accounts]);

  const handleRowProfitChange = (index: number, val: number) => {
    setAllocations(prev => {
      const updated = [...prev];
      const netProfitNum = Number(totalCompanyNetProfit) || 0;
      updated[index] = {
        ...updated[index],
        allocatedProfit: val,
        ownershipPercentage: netProfitNum > 0 ? Math.round((val / netProfitNum) * 10000) / 100 : 0
      };
      return updated;
    });
    setDistributionRule('manual');
  };

  const handleRowMudarabaPctChange = (index: number, val: number) => {
    setAllocations(prev => {
      const updated = [...prev];
      const row = updated[index];
      const newFinalProfit = Math.round((row.proportionalProfit * (val / 100)) * 100) / 100;
      updated[index] = {
        ...row,
        mudarabaProfitSharePercentage: val,
        allocatedProfit: newFinalProfit,
        factoryRetainedProfit: Math.round((row.proportionalProfit - newFinalProfit) * 100) / 100
      };
      return updated;
    });
  };

  const handleRowStatusChange = (index: number, newStatus: 'paid' | 'pending') => {
    setAllocations(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        status: newStatus
      };
      return updated;
    });
  };

  const handleRowAccountChange = (index: number, accId: string) => {
    const acc = accounts.find(a => a.id === accId);
    setAllocations(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        accountId: accId,
        accountName: acc?.accountName || 'Cash Account'
      };
      return updated;
    });
  };

  const totalAllocated = allocations.reduce((s, a) => s + (a.allocatedProfit || 0), 0);
  const totalImmediatePaid = allocations.filter(a => a.status === 'paid').reduce((s, a) => s + (a.allocatedProfit || 0), 0);
  const totalPending = allocations.filter(a => a.status === 'pending').reduce((s, a) => s + (a.allocatedProfit || 0), 0);
  const totalFactoryRetained = allocations.reduce((s, a) => s + (a.factoryRetainedProfit || 0), 0);

  const factoryBaseCapital = Number(existingFactoryCapital) || 0;
  const combinedTotalCapital = factoryBaseCapital + totalActiveInvestorCapital;
  const companyProfitNum = Number(totalCompanyNetProfit) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!period.trim()) {
      setError(language === 'bn' ? 'বণ্টন মেয়াদের নাম লিখুন' : 'Please enter period name');
      return;
    }
    if (!totalCompanyNetProfit || Number(totalCompanyNetProfit) <= 0) {
      setError(language === 'bn' ? 'কোম্পানির অর্জিত নিট মুনাফার পরিমাণ লিখুন' : 'Please enter company net profit amount');
      return;
    }
    if (allocations.length === 0) {
      setError(language === 'bn' ? 'কোন সক্রিয় বিনিয়োগকারী পাওয়া যায়নি' : 'No active investors found');
      return;
    }

    // Check account balances for immediate payouts
    const accountDeductions: Record<string, number> = {};
    for (const alloc of allocations) {
      if (alloc.status === 'paid' && alloc.accountId) {
        accountDeductions[alloc.accountId] = (accountDeductions[alloc.accountId] || 0) + alloc.allocatedProfit;
      }
    }

    for (const [accId, needed] of Object.entries(accountDeductions)) {
      const acc = accounts.find(a => a.id === accId);
      if (acc && needed > (acc.currentBalance || 0)) {
        setError(language === 'bn'
          ? `অ্যাকাউন্ট "${acc.accountName}"-এ তাত্ক্ষণিক পরিশোধের জন্য পর্যাপ্ত ব্যালেন্স নেই (প্রয়োজন: ${formatCurrency(needed, language)}, বর্তমান: ${formatCurrency(acc.currentBalance || 0, language)})`
          : `Insufficient balance in ${acc.accountName} for instant payout.`);
        return;
      }
    }

    setIsSubmitting(true);
    setError('');

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const distributionStatus = totalPending === 0 ? 'fully_paid' : (totalImmediatePaid > 0 ? 'partially_paid' : 'approved');

      await onDistribute({
        period: period.trim(),
        startDate,
        endDate,
        existingFactoryCapital: factoryBaseCapital,
        totalCompanyNetProfit: companyProfitNum,
        totalDistributableProfit: totalAllocated,
        totalFactoryRetainedProfit: totalFactoryRetained,
        totalAllocated,
        totalPaid: totalImmediatePaid,
        totalPending,
        distributionRule,
        allocations: allocations.map(a => ({
          investorId: a.investorId,
          investorName: a.investorName,
          investedAmount: a.investedAmount,
          existingFactoryCapital: a.existingFactoryCapital,
          totalCapitalAfterInvestment: a.totalCapitalAfterInvestment,
          ownershipPercentage: a.ownershipPercentage,
          proportionalProfit: a.proportionalProfit,
          mudarabaProfitSharePercentage: a.mudarabaProfitSharePercentage,
          allocatedProfit: a.allocatedProfit,
          factoryRetainedProfit: a.factoryRetainedProfit,
          sharePercentage: a.ownershipPercentage,
          status: a.status,
          accountId: a.status === 'paid' ? a.accountId : undefined,
          accountName: a.status === 'paid' ? a.accountName : undefined,
          paidAt: a.status === 'paid' ? todayStr : undefined
        })),
        status: distributionStatus
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to distribute profit');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-white rounded-3xl shadow-2xl border border-[#D9EAEB] w-full max-w-5xl overflow-hidden my-4 sm:my-6 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-[#17383B] via-[#0D5B57] to-[#229A73] text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-white/15 text-white backdrop-blur-sm border border-white/20 shadow-inner">
                <HandCoins className="w-6 h-6 text-[#45DFB1]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                    {language === 'bn' ? 'মুদারাবা লভ্যাংশ বণ্টন ক্যালকুলেটর ও হিসাব' : 'Mudaraba Profit Allocation & Distribution'}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E8F8F2] text-[#17383B] font-extrabold text-[10px] uppercase tracking-wider hidden sm:inline-block">
                    {language === 'bn' ? 'শরিয়াহ সম্মত' : 'Shariah Standard'}
                  </span>
                </div>
                <p className="text-xs text-white/80 mt-0.5">
                  {language === 'bn' 
                    ? 'কারখানার পূর্বের মূলধন + বিনিয়োগের ভিত্তিতে মূলধনি মালিকানা % এবং এরপর চুক্তিকৃত মুদারাবা হারে মুনাফা বণ্টন' 
                    : 'Calculate Capital Ownership %, Proportional Net Profit, and Final Mudaraba Profit Sharing'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5 overflow-y-auto flex-1">
            {error && (
              <div className="p-3.5 bg-[#FDF4F5] border border-[#F8D2D9] rounded-2xl flex items-center gap-2.5 text-xs text-[#EA7185]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* Mudaraba Shariah Standard Banner */}
            <div className="p-3.5 bg-[#F1FAFA] border border-[#BCE7E4] rounded-2xl flex items-start gap-3 text-xs">
              <ShieldCheck className="w-5 h-5 text-[#0B9FA5] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-black text-[#17383B] block">
                  {language === 'bn' ? 'মুদারাবা মুনাফা বণ্টন মূলনীতি ও সূত্রবিধি:' : 'Mudaraba Business Investment Standard Rule:'}
                </span>
                <p className="text-[11px] text-[#486B6E] leading-relaxed">
                  {language === 'bn' ? (
                    <>
                      <strong>সূত্র:</strong> (১) পূর্বের মূলধন + (২) বিনিয়োগকৃত মূলধন = (৩) সমন্বিত মোট মূলধন ➔ 
                      (৪) মূলধনি মালিকানা % ➔ (৫) কোম্পানির নিট মুনাফায় আনুপাতিক অংশ ➔ (৬) চুক্তিকৃত মুদারাবা হার % ➔ 
                      (৭) চূড়ান্ত বিনিয়োগকারী মুনাফা। <em>(কখনোই সরাসরি মোট কোম্পানির মুনাফার সাথে চুক্তির হার গুণ করা হয় না)</em>
                    </>
                  ) : (
                    <>
                      <strong>Formula:</strong> (1) Existing Capital + (2) Injected Capital = (3) Combined Capital ➔ 
                      (4) Ownership % ➔ (5) Proportional Net Profit ➔ (6) Agreed Mudaraba % ➔ 
                      (7) Final Investor Profit. <em>(NEVER calculate Total Company Profit × Direct %)</em>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Step 1 & 2 Inputs: Capital & Company Net Profit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gradient-to-br from-[#F8FCFC] to-[#F1FAFA] p-4 sm:p-5 rounded-2xl border border-[#D9EAEB] shadow-2xs">
              {/* Existing Factory Capital */}
              <div className="space-y-2">
                <label className="text-xs font-black text-[#17383B] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#0B9FA5]" />
                    {t('existingFactoryCapital')} (৳) *
                  </span>
                  <span className="text-[10px] text-[#688285] font-semibold">
                    {language === 'bn' ? 'কারখানার নিজস্ব প্রাথমিক মূলধন' : 'Factory Base Capital'}
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#688285]">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={existingFactoryCapital}
                    onChange={e => setExistingFactoryCapital(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="1,000,000"
                    required
                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-[#D9EAEB] rounded-xl text-sm font-black text-[#17383B] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]"
                  />
                </div>
                {/* Quick Presets for Factory Capital */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-[#688285] font-bold mr-1">Preset:</span>
                  {[500000, 1000000, 2000000, 5000000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setExistingFactoryCapital(amt)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                        existingFactoryCapital === amt 
                          ? 'bg-[#17383B] text-white border-[#17383B]' 
                          : 'bg-white text-[#486B6E] border-[#D9EAEB] hover:bg-[#F1FAFA]'
                      }`}
                    >
                      {formatCurrency(amt, language)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Company Net Profit */}
              <div className="space-y-2">
                <label className="text-xs font-black text-[#17383B] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[#229A73]" />
                    {t('totalCompanyNetProfit')} (৳) *
                  </span>
                  <span className="text-[10px] text-[#229A73] font-bold">
                    {language === 'bn' ? 'কারখানার মোট অর্জিত নিট লাভ' : 'Enterprise Net Profit'}
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#688285]">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={totalCompanyNetProfit}
                    onChange={e => setTotalCompanyNetProfit(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="500,000"
                    required
                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-[#D9EAEB] rounded-xl text-sm font-black text-[#17383B] focus:outline-none focus:ring-2 focus:ring-[#229A73]"
                  />
                </div>
                {/* Quick Presets for Net Profit */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-[#688285] font-bold mr-1">Preset:</span>
                  {[200000, 300000, 500000, 1000000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTotalCompanyNetProfit(amt)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                        totalCompanyNetProfit === amt 
                          ? 'bg-[#229A73] text-white border-[#229A73]' 
                          : 'bg-white text-[#486B6E] border-[#D9EAEB] hover:bg-[#F1FAFA]'
                      }`}
                    >
                      {formatCurrency(amt, language)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Period and Dates Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-[#17383B]">
                  {t('periodName')} *
                </label>
                <input
                  type="text"
                  value={period}
                  onChange={e => setPeriod(e.target.value)}
                  placeholder={language === 'bn' ? 'যেমন: জানুয়ারি ২০২৬ অথবা ১ম কোয়ার্টার' : 'e.g., January 2026 or Q1 2026'}
                  required
                  className="w-full px-4 py-2.5 bg-[#F1FAFA] border border-[#D9EAEB] rounded-xl text-sm font-semibold text-[#17383B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#229A73]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#688285]" />
                  {t('startDate')}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#F1FAFA] border border-[#D9EAEB] rounded-xl text-xs text-[#17383B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#229A73]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#688285]" />
                  {t('endDate')}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#F1FAFA] border border-[#D9EAEB] rounded-xl text-xs text-[#17383B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#229A73]"
                />
              </div>
            </div>

            {/* Live 7-Step Mudaraba Mathematical Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Card 1: Combined Capital Base */}
              <div className="p-3.5 rounded-2xl bg-[#F1FAFA] border border-[#D9EAEB]">
                <span className="text-[10px] text-[#688285] font-bold uppercase block">
                  {language === 'bn' ? '১-৩. সমন্বিত মোট মূলধন' : '1-3. Total Enterprise Capital'}
                </span>
                <span className="text-base font-black text-[#17383B] block mt-0.5">
                  {formatCurrency(combinedTotalCapital, language)}
                </span>
                <span className="text-[10px] text-[#0B9FA5] font-bold block mt-0.5">
                  {formatCurrency(factoryBaseCapital, language)} (কারখানা) + {formatCurrency(totalActiveInvestorCapital, language)} (বিনিয়োগকারী)
                </span>
              </div>

              {/* Card 2: Combined Investor Ownership */}
              <div className="p-3.5 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD]">
                <span className="text-[10px] text-[#0369A1] font-bold uppercase block">
                  {language === 'bn' ? '৪. বিনিয়োগকারী মালিকানা %' : '4. Investor Ownership %'}
                </span>
                <span className="text-base font-black text-[#0369A1] block mt-0.5">
                  {combinedTotalCapital > 0 ? ((totalActiveInvestorCapital / combinedTotalCapital) * 100).toFixed(2) : 0}%
                </span>
                <span className="text-[10px] text-[#0369A1]/80 font-semibold block mt-0.5">
                  ({formatCurrency(totalActiveInvestorCapital, language)} ÷ {formatCurrency(combinedTotalCapital, language)})
                </span>
              </div>

              {/* Card 3: Final Allocated to Investors */}
              <div className="p-3.5 rounded-2xl bg-[#E8F8F2] border border-[#BDEBD7]">
                <span className="text-[10px] text-[#229A73] font-bold uppercase block">
                  {language === 'bn' ? '৭. বিনিয়োগকারীদের প্রদেয় লভ্যাংশ' : '7. Final Investor Payout'}
                </span>
                <span className="text-base font-black text-[#229A73] block mt-0.5">
                  {formatCurrency(totalAllocated, language)}
                </span>
                <span className="text-[10px] text-[#229A73]/80 font-bold block mt-0.5">
                  {allocations.length} {language === 'bn' ? 'জন অংশীদার' : 'partners'}
                </span>
              </div>

              {/* Card 4: Factory Retained Profit */}
              <div className="p-3.5 rounded-2xl bg-[#FFF3DF] border border-[#FED7AA]">
                <span className="text-[10px] text-[#D98A1B] font-bold uppercase block">
                  {language === 'bn' ? '৮. কারখানা সংরক্ষিত মুনাফা' : '8. Factory Retained Share'}
                </span>
                <span className="text-base font-black text-[#D98A1B] block mt-0.5">
                  {formatCurrency(Math.max(0, companyProfitNum - totalAllocated), language)}
                </span>
                <span className="text-[10px] text-[#D98A1B]/80 font-semibold block mt-0.5">
                  {language === 'bn' ? 'মুদারিব ব্যবস্থাপনা ও কারখানা অংশ' : 'Mudarib management retained'}
                </span>
              </div>
            </div>

            {/* Distribution Rule Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-[#F9FCFC] border border-[#D9EAEB] rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#17383B]">{t('distributionRule')}:</span>
                <select
                  value={distributionRule}
                  onChange={e => setDistributionRule(e.target.value as any)}
                  className="px-3 py-1.5 bg-white border border-[#D9EAEB] rounded-lg font-bold text-[#17383B] focus:outline-none focus:ring-1 focus:ring-[#0B9FA5]"
                >
                  <option value="mudaraba_proportional">{t('mudarabaProportionalRule')}</option>
                  <option value="proportional">{t('proportionalRule')}</option>
                  <option value="agreed_share">{t('ruleAgreedShare')}</option>
                  <option value="equal">{t('ruleEqual')}</option>
                  <option value="manual">{t('ruleManual')}</option>
                </select>
              </div>
              <span className="text-[11px] text-[#688285]">
                {language === 'bn' ? 'প্রতিটি অংশীদারের বিস্তারিত হিসাব দেখতে ' : 'Click '}
                <strong className="text-[#0B9FA5]">{language === 'bn' ? '"হিসাব বিবরণী"' : '"Breakdown"'}</strong>
                {language === 'bn' ? ' বাটনে চাপুন।' : ' to inspect exact formulas.'}
              </span>
            </div>

            {/* Allocation Matrix Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#17383B] uppercase tracking-wider flex items-center gap-1.5">
                  <span>{t('allocationMatrix')}</span>
                  <span className="text-[10px] font-normal text-[#688285]">
                    ({formatNumber(allocations.length, language)} {language === 'bn' ? 'জন অংশীদার' : 'partners'})
                  </span>
                </h4>
              </div>

              <div className="border border-[#D9EAEB] rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F1FAFA] text-[#688285] font-bold border-b border-[#D9EAEB]">
                      <tr>
                        <th className="p-3 pl-4">{t('investorName')}</th>
                        <th className="p-3 text-right">{language === 'bn' ? 'সক্রিয় বিনিয়োগ (৳)' : 'Active Capital (৳)'}</th>
                        <th className="p-3 text-center">{t('investorOwnership')}</th>
                        <th className="p-3 text-right">{t('proportionalProfit')} (৳)</th>
                        <th className="p-3 text-center">{t('mudarabaShareShort')} (%)</th>
                        <th className="p-3 text-right">{t('finalInvestorProfit')} (৳)</th>
                        <th className="p-3 text-center">{t('status')}</th>
                        <th className="p-3 pr-4 text-center">{language === 'bn' ? 'হিসাব' : 'Math'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6F0F1]">
                      {allocations.map((alloc, idx) => (
                        <tr key={alloc.investorId} className="hover:bg-[#F9FCFC] transition-colors">
                          {/* Name */}
                          <td className="p-3 pl-4 font-bold text-[#17383B]">
                            {alloc.investorName}
                          </td>

                          {/* Invested Amount */}
                          <td className="p-3 text-right font-semibold text-[#0B9FA5]">
                            {formatCurrency(alloc.investedAmount, language)}
                          </td>

                          {/* Ownership % */}
                          <td className="p-3 text-center">
                            <span className="inline-flex px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1] font-black text-[11px]">
                              {alloc.ownershipPercentage.toFixed(2)}%
                            </span>
                          </td>

                          {/* Proportional Profit */}
                          <td className="p-3 text-right font-semibold text-[#17383B]">
                            {formatCurrency(alloc.proportionalProfit, language)}
                          </td>

                          {/* Mudaraba Agreed % */}
                          <td className="p-3 text-center">
                            <div className="inline-flex items-center justify-center">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={alloc.mudarabaProfitSharePercentage}
                                onChange={e => handleRowMudarabaPctChange(idx, parseFloat(e.target.value) || 0)}
                                className="w-16 px-1.5 py-1 text-center font-bold bg-white border border-[#D9EAEB] rounded-lg text-xs text-[#229A73] focus:outline-none focus:ring-1 focus:ring-[#229A73]"
                              />
                            </div>
                          </td>

                          {/* Final Allocated Profit */}
                          <td className="p-3 text-right">
                            <div className="relative inline-block max-w-[130px]">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#688285]">
                                ৳
                              </span>
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={alloc.allocatedProfit}
                                onChange={e => handleRowProfitChange(idx, parseFloat(e.target.value) || 0)}
                                className="w-full pl-6 pr-2 py-1.5 bg-white border border-[#D9EAEB] rounded-lg text-xs font-black text-[#229A73] text-right focus:outline-none focus:ring-1 focus:ring-[#229A73]"
                              />
                            </div>
                          </td>

                          {/* Status */}
                          <td className="p-3 text-center">
                            <div className="inline-flex rounded-lg p-0.5 bg-[#F1FAFA] border border-[#D9EAEB]">
                              <button
                                type="button"
                                onClick={() => handleRowStatusChange(idx, 'pending')}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                                  alloc.status === 'pending'
                                    ? 'bg-[#FFF3DF] text-[#D98A1B] shadow-xs'
                                    : 'text-[#688285] hover:text-[#17383B]'
                                }`}
                              >
                                <Clock className="w-3 h-3" />
                                {t('profitStatusPending')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRowStatusChange(idx, 'paid')}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                                  alloc.status === 'paid'
                                    ? 'bg-[#229A73] text-white shadow-xs'
                                    : 'text-[#688285] hover:text-[#17383B]'
                                }`}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                {t('payNow')}
                              </button>
                            </div>
                          </td>

                          {/* Breakdown Button */}
                          <td className="p-3 pr-4 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedBreakdownInvestor(alloc)}
                              className="px-2.5 py-1 rounded-lg bg-[#F1FAFA] hover:bg-[#E6F8F7] text-[#0B9FA5] font-bold text-[11px] border border-[#D9EAEB] transition-colors inline-flex items-center gap-1"
                              title="View detailed Mudaraba 7-step calculation"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{language === 'bn' ? 'বিবরণ' : 'Math'}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Paying Accounts Row if any instant payouts */}
            {allocations.some(a => a.status === 'paid') && (
              <div className="p-4 bg-[#E8F8F2] border border-[#BDEBD7] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#17383B] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#229A73]" />
                    {language === 'bn' ? 'তাত্ক্ষণিক পরিশোধের জন্য ব্যাংক/ক্যাশ অ্যাকাউন্ট নির্বাচন করুন:' : 'Select paying accounts for instant disbursements:'}
                  </span>
                  <span className="text-xs font-bold text-[#229A73]">
                    {language === 'bn' ? 'মোট তাত্ক্ষণিক পরিশোধ:' : 'Total Instant Payout:'} {formatCurrency(totalImmediatePaid, language)}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {allocations.filter(a => a.status === 'paid').map((alloc, i) => {
                    const rowIdx = allocations.findIndex(x => x.investorId === alloc.investorId);
                    return (
                      <div key={alloc.investorId} className="bg-white p-3 rounded-xl border border-[#D9EAEB] space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-[#17383B]">{alloc.investorName}</span>
                          <span className="text-[#229A73]">{formatCurrency(alloc.allocatedProfit, language)}</span>
                        </div>
                        <select
                          value={alloc.accountId || defaultAccountId}
                          onChange={e => handleRowAccountChange(rowIdx, e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#F1FAFA] border border-[#D9EAEB] rounded-lg text-xs font-semibold text-[#17383B] focus:outline-none focus:ring-1 focus:ring-[#229A73]"
                        >
                          {accounts.map(a => (
                            <option key={a.id} value={a.id}>
                              {a.accountName} ({formatCurrency(a.currentBalance || 0, language)})
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#17383B] text-white p-4 rounded-2xl shadow-inner">
              <div>
                <span className="text-[10px] text-white/70 block uppercase font-bold">
                  {t('totalCompanyNetProfit')}
                </span>
                <span className="text-sm font-black text-white">
                  {formatCurrency(companyProfitNum, language)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-white/70 block uppercase font-bold">
                  {t('totalAllocated')} ({language === 'bn' ? 'বিনিয়োগকারীগণ' : 'Investors'})
                </span>
                <span className="text-sm font-black text-[#45DFB1]">
                  {formatCurrency(totalAllocated, language)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-white/70 block uppercase font-bold">
                  {t('factoryRetainedProfit')}
                </span>
                <span className="text-sm font-black text-[#F3B562]">
                  {formatCurrency(Math.max(0, companyProfitNum - totalAllocated), language)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-white/70 block uppercase font-bold">
                  {t('pendingPayout')} ({language === 'bn' ? 'বকেয়া' : 'Pending'})
                </span>
                <span className="text-sm font-black text-[#FED7AA]">
                  {formatCurrency(totalPending, language)}
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-[#D9EAEB] flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-[#D9EAEB] text-xs font-bold text-[#688285] hover:bg-[#F1FAFA] transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#229A73] hover:bg-[#1C8260] text-white text-xs font-black shadow-md shadow-[#229A73]/20 transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <span className="inline-block animate-spin">⏳</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('confirmDistribution')}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Individual Transparent 7-Step Breakdown Modal */}
          {selectedBreakdownInvestor && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-2xl border border-[#D9EAEB] w-full max-w-xl overflow-hidden p-6 sm:p-7 space-y-5"
              >
                <div className="flex items-center justify-between border-b border-[#D9EAEB] pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-[#E8F8F2] text-[#229A73]">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-[#17383B]">
                        {selectedBreakdownInvestor.investorName} - {language === 'bn' ? 'মুদারাবা হিসাব বিবরণী' : 'Mudaraba Calculation Breakdown'}
                      </h4>
                      <p className="text-xs text-[#688285]">
                        {period} • {language === 'bn' ? 'স্বচ্ছ গাণিতিক হিসাব বিবরণ' : 'Full Mathematical Step-by-Step Transparency'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedBreakdownInvestor(null)}
                    className="p-1.5 rounded-full hover:bg-[#F1FAFA] text-[#688285]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 7 Calculation Steps */}
                <div className="space-y-3 text-xs">
                  {/* Step 1 & 2 */}
                  <div className="p-3 bg-[#F1FAFA] rounded-xl space-y-1.5 border border-[#D9EAEB]">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#688285]">{t('step1FactoryCapital')}:</span>
                      <span className="font-black text-[#17383B]">{formatCurrency(selectedBreakdownInvestor.existingFactoryCapital, language)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#688285]">{t('step2InvestorCapital')}:</span>
                      <span className="font-black text-[#0B9FA5]">+ {formatCurrency(selectedBreakdownInvestor.investedAmount, language)}</span>
                    </div>
                    <div className="pt-1.5 border-t border-[#D9EAEB] flex items-center justify-between font-black">
                      <span className="text-[#17383B]">{t('step3TotalCapital')}:</span>
                      <span className="text-[#17383B]">{formatCurrency(selectedBreakdownInvestor.totalCapitalAfterInvestment, language)}</span>
                    </div>
                  </div>

                  {/* Step 4: Ownership % */}
                  <div className="p-3 bg-[#E0F2FE] rounded-xl flex items-center justify-between border border-[#BAE6FD]">
                    <div>
                      <span className="font-bold text-[#0369A1] block">{t('step4Ownership')}:</span>
                      <span className="text-[11px] text-[#0369A1]/80">
                        ({formatCurrency(selectedBreakdownInvestor.investedAmount, language)} ÷ {formatCurrency(selectedBreakdownInvestor.totalCapitalAfterInvestment, language)}) × 100
                      </span>
                    </div>
                    <span className="text-base font-black text-[#0369A1]">
                      {selectedBreakdownInvestor.ownershipPercentage.toFixed(2)}%
                    </span>
                  </div>

                  {/* Step 5: Proportional Profit */}
                  <div className="p-3 bg-[#F1FAFA] rounded-xl space-y-1 border border-[#D9EAEB]">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#17383B] block">{t('step5ProportionalProfit')}:</span>
                        <span className="text-[11px] text-[#688285]">
                          {formatCurrency(companyProfitNum, language)} × {selectedBreakdownInvestor.ownershipPercentage.toFixed(2)}%
                        </span>
                      </div>
                      <span className="text-sm font-black text-[#17383B]">
                        {formatCurrency(selectedBreakdownInvestor.proportionalProfit, language)}
                      </span>
                    </div>
                  </div>

                  {/* Step 6 & 7: Mudaraba Rate & Final Profit */}
                  <div className="p-4 bg-[#E8F8F2] rounded-2xl space-y-2 border border-[#BDEBD7]">
                    <div className="flex items-center justify-between text-[#229A73]">
                      <span className="font-bold">{t('step6MudarabaRate')}:</span>
                      <span className="font-black text-sm">{selectedBreakdownInvestor.mudarabaProfitSharePercentage}%</span>
                    </div>
                    <div className="flex items-center justify-between text-[#229A73]">
                      <span className="font-semibold text-[11px]">
                        {language === 'bn' ? 'কারখানা মুদারিব অংশ (৭০%):' : 'Factory Retained Share:'}
                      </span>
                      <span className="font-bold text-xs">{100 - selectedBreakdownInvestor.mudarabaProfitSharePercentage}%</span>
                    </div>
                    <div className="pt-2 border-t border-[#BDEBD7] flex items-center justify-between">
                      <div>
                        <span className="font-black text-sm text-[#17383B] block">{t('step7FinalProfit')}:</span>
                        <span className="text-[11px] text-[#229A73] font-semibold">
                          {formatCurrency(selectedBreakdownInvestor.proportionalProfit, language)} × {selectedBreakdownInvestor.mudarabaProfitSharePercentage}%
                        </span>
                      </div>
                      <span className="text-lg font-black text-[#229A73]">
                        {formatCurrency(selectedBreakdownInvestor.allocatedProfit, language)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBreakdownInvestor(null)}
                    className="px-5 py-2 rounded-xl bg-[#17383B] text-white text-xs font-bold hover:bg-[#0D5B57] transition-colors"
                  >
                    {language === 'bn' ? 'ঠিক আছে' : 'Got It'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
