import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { Investor, Language } from '../types';
import { InvestorSummaryCards } from './investors/InvestorSummaryCards';
import { InvestorTable } from './investors/InvestorTable';
import { InvestmentsLogTable } from './investors/InvestmentsLogTable';
import { WithdrawalsLogTable } from './investors/WithdrawalsLogTable';
import { ProfitDistributionsTable } from './investors/ProfitDistributionsTable';
import { InvestorModal } from './investors/InvestorModal';
import { InvestmentModal } from './investors/InvestmentModal';
import { WithdrawalModal } from './investors/WithdrawalModal';
import { ProfitDistributionModal } from './investors/ProfitDistributionModal';
import { ProfitPayoutModal } from './investors/ProfitPayoutModal';
import { InvestorProfileModal } from './investors/InvestorProfileModal';
import { PrintInvestorStatement } from './investors/PrintInvestorStatement';
import { PrintInvestorReport } from './investors/PrintInvestorReport';
import { 
  Users, 
  TrendingUp, 
  ArrowDownRight, 
  HandCoins, 
  Plus, 
  Minus, 
  Printer, 
  FileSpreadsheet, 
  Calculator,
  Layers,
  Sparkles
} from 'lucide-react';

interface InvestorsProps {
  language: Language;
  t: (key: string) => string;
}

export const Investors: React.FC<InvestorsProps> = ({ language, t }) => {
  const {
    investors,
    investments,
    withdrawals,
    profitDistributions,
    accounts,
    addInvestor,
    updateInvestor,
    deleteInvestor,
    addInvestment,
    deleteInvestment,
    addWithdrawal,
    deleteWithdrawal,
    distributeProfit,
    payoutInvestorProfit
  } = useERP();

  const [activeTab, setActiveTab] = useState<'investors' | 'investments' | 'withdrawals' | 'distributions'>('investors');

  // Modals state
  const [isInvestorModalOpen, setIsInvestorModalOpen] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);

  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [selectedInvestorForInvestment, setSelectedInvestorForInvestment] = useState<Investor | null>(null);

  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [selectedInvestorForWithdrawal, setSelectedInvestorForWithdrawal] = useState<Investor | null>(null);

  const [isDistributionModalOpen, setIsDistributionModalOpen] = useState(false);

  const [payoutModalData, setPayoutModalData] = useState<{
    isOpen: boolean;
    distributionId: string;
    investorId: string;
    investorName: string;
    period: string;
    amount: number;
  }>({
    isOpen: false,
    distributionId: '',
    investorId: '',
    investorName: '',
    period: '',
    amount: 0
  });

  const [viewingProfileInvestor, setViewingProfileInvestor] = useState<Investor | null>(null);
  const [statementInvestor, setStatementInvestor] = useState<Investor | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Handlers
  const handleOpenAddInvestor = () => {
    setEditingInvestor(null);
    setIsInvestorModalOpen(true);
  };

  const handleOpenEditInvestor = (inv: Investor) => {
    setEditingInvestor(inv);
    setIsInvestorModalOpen(true);
  };

  const handleSaveInvestor = async (data: any) => {
    if (editingInvestor) {
      await updateInvestor(editingInvestor.id, data);
    } else {
      await addInvestor(data);
    }
  };

  const handleOpenAddInvestment = (inv?: Investor) => {
    setSelectedInvestorForInvestment(inv || null);
    setIsInvestmentModalOpen(true);
  };

  const handleOpenAddWithdrawal = (inv?: Investor) => {
    setSelectedInvestorForWithdrawal(inv || null);
    setIsWithdrawalModalOpen(true);
  };

  const handleOpenPayout = (distributionId: string, investorId: string, investorName: string, period: string, amount: number) => {
    setPayoutModalData({
      isOpen: true,
      distributionId,
      investorId,
      investorName,
      period,
      amount
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-[#D9EAEB] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#17383B] to-[#0B9FA5] text-white shadow-md">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#17383B] tracking-tight">
                {t('investors')}
              </h1>
              <p className="text-xs text-[#688285] font-medium mt-0.5">
                {language === 'bn' 
                  ? 'কারখানার মূলধন, শেয়ার হোল্ডার ও মুনাফা বণ্টন ব্যবস্থাপনা' 
                  : 'Factory Capital Inflows, Partner Equity & Profit Distribution Management'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#F1FAFA] hover:bg-[#E6F0F1] text-[#17383B] text-xs font-bold border border-[#D9EAEB] flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-4 h-4 text-[#0B9FA5]" />
            <span>{t('investorReports')}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDistributionModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#229A73] hover:bg-[#1C8260] text-white text-xs font-bold shadow-md shadow-[#229A73]/20 flex items-center gap-1.5 transition-all"
          >
            <HandCoins className="w-4 h-4" />
            <span>{t('profitDistribution')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddWithdrawal()}
            className="px-3.5 py-2 rounded-xl bg-[#EA7185] hover:bg-[#D95B70] text-white text-xs font-bold shadow-md shadow-[#EA7185]/20 flex items-center gap-1.5 transition-all"
          >
            <Minus className="w-4 h-4" />
            <span>{t('addWithdrawal')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddInvestment()}
            className="px-3.5 py-2 rounded-xl bg-[#0B9FA5] hover:bg-[#09878C] text-white text-xs font-bold shadow-md shadow-[#0B9FA5]/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addInvestment')}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddInvestor}
            className="px-4 py-2 rounded-xl bg-[#17383B] hover:bg-[#20494C] text-white text-xs font-bold shadow-md shadow-[#17383B]/20 flex items-center gap-1.5 transition-all"
          >
            <Users className="w-4 h-4 text-[#16B8B0]" />
            <span>{t('addInvestor')}</span>
          </button>
        </div>
      </div>

      {/* KPI Dashboard */}
      <InvestorSummaryCards
        investors={investors}
        investments={investments}
        withdrawals={withdrawals}
        profitDistributions={profitDistributions}
        language={language}
        t={t}
      />

      {/* Main Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-[#D9EAEB] p-1.5 flex gap-1 overflow-x-auto shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('investors')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'investors'
              ? 'bg-[#17383B] text-white shadow-sm'
              : 'text-[#688285] hover:text-[#17383B] hover:bg-[#F1FAFA]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t('investorList')} ({investors.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('investments')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'investments'
              ? 'bg-[#0B9FA5] text-white shadow-sm'
              : 'text-[#688285] hover:text-[#17383B] hover:bg-[#F1FAFA]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{t('investments')} ({investments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('withdrawals')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'withdrawals'
              ? 'bg-[#EA7185] text-white shadow-sm'
              : 'text-[#688285] hover:text-[#17383B] hover:bg-[#F1FAFA]'
          }`}
        >
          <ArrowDownRight className="w-4 h-4" />
          <span>{t('withdrawals')} ({withdrawals.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('distributions')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'distributions'
              ? 'bg-[#229A73] text-white shadow-sm'
              : 'text-[#688285] hover:text-[#17383B] hover:bg-[#F1FAFA]'
          }`}
        >
          <HandCoins className="w-4 h-4" />
          <span>{t('profitDistribution')} ({profitDistributions.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'investors' && (
          <InvestorTable
            investors={investors}
            onViewProfile={(inv) => setViewingProfileInvestor(inv)}
            onAddInvestment={(inv) => handleOpenAddInvestment(inv)}
            onAddWithdrawal={(inv) => handleOpenAddWithdrawal(inv)}
            onEditInvestor={(inv) => handleOpenEditInvestor(inv)}
            onDeleteInvestor={deleteInvestor}
            language={language}
            t={t}
          />
        )}

        {activeTab === 'investments' && (
          <InvestmentsLogTable
            investments={investments}
            investors={investors}
            onDeleteInvestment={deleteInvestment}
            language={language}
            t={t}
          />
        )}

        {activeTab === 'withdrawals' && (
          <WithdrawalsLogTable
            withdrawals={withdrawals}
            investors={investors}
            onDeleteWithdrawal={deleteWithdrawal}
            language={language}
            t={t}
          />
        )}

        {activeTab === 'distributions' && (
          <ProfitDistributionsTable
            profitDistributions={profitDistributions}
            accounts={accounts}
            onOpenPayout={handleOpenPayout}
            language={language}
            t={t}
          />
        )}
      </div>

      {/* Modals & Dialogs */}
      {/* 1. Add / Edit Investor */}
      <InvestorModal
        isOpen={isInvestorModalOpen}
        onClose={() => {
          setIsInvestorModalOpen(false);
          setEditingInvestor(null);
        }}
        initialData={editingInvestor}
        onSave={handleSaveInvestor}
        language={language}
        t={t}
      />

      {/* 2. Add Investment */}
      <InvestmentModal
        isOpen={isInvestmentModalOpen}
        onClose={() => {
          setIsInvestmentModalOpen(false);
          setSelectedInvestorForInvestment(null);
        }}
        investors={investors}
        accounts={accounts}
        initialInvestorId={selectedInvestorForInvestment?.id}
        onSave={async (data) => { await addInvestment(data); }}
        language={language}
        t={t}
      />

      {/* 3. Add Withdrawal */}
      <WithdrawalModal
        isOpen={isWithdrawalModalOpen}
        onClose={() => {
          setIsWithdrawalModalOpen(false);
          setSelectedInvestorForWithdrawal(null);
        }}
        investors={investors}
        accounts={accounts}
        initialInvestorId={selectedInvestorForWithdrawal?.id}
        onSave={async (data) => { await addWithdrawal(data); }}
        language={language}
        t={t}
      />

      {/* 4. Profit Distribution */}
      <ProfitDistributionModal
        isOpen={isDistributionModalOpen}
        onClose={() => setIsDistributionModalOpen(false)}
        investors={investors}
        accounts={accounts}
        onDistribute={async (data) => { await distributeProfit(data); }}
        language={language}
        t={t}
      />

      {/* 5. Profit Payout */}
      <ProfitPayoutModal
        isOpen={payoutModalData.isOpen}
        onClose={() => setPayoutModalData(prev => ({ ...prev, isOpen: false }))}
        distributionId={payoutModalData.distributionId}
        investorId={payoutModalData.investorId}
        investorName={payoutModalData.investorName}
        period={payoutModalData.period}
        amount={payoutModalData.amount}
        accounts={accounts}
        onPayout={payoutInvestorProfit}
        language={language}
        t={t}
      />

      {/* 6. Investor Profile & Comprehensive Ledger */}
      {viewingProfileInvestor && (
        <InvestorProfileModal
          isOpen={Boolean(viewingProfileInvestor)}
          onClose={() => setViewingProfileInvestor(null)}
          investor={investors.find(i => i.id === viewingProfileInvestor.id) || viewingProfileInvestor}
          investments={investments}
          withdrawals={withdrawals}
          profitDistributions={profitDistributions}
          accounts={accounts}
          onAddInvestment={(inv) => {
            setViewingProfileInvestor(null);
            handleOpenAddInvestment(inv);
          }}
          onAddWithdrawal={(inv) => {
            setViewingProfileInvestor(null);
            handleOpenAddWithdrawal(inv);
          }}
          onEditInvestor={(inv) => {
            setViewingProfileInvestor(null);
            handleOpenEditInvestor(inv);
          }}
          onOpenStatement={(inv) => {
            setStatementInvestor(inv);
          }}
          language={language}
          t={t}
        />
      )}

      {/* 7. Print Individual Investor Statement */}
      {statementInvestor && (
        <PrintInvestorStatement
          isOpen={Boolean(statementInvestor)}
          onClose={() => setStatementInvestor(null)}
          investor={statementInvestor}
          investments={investments}
          withdrawals={withdrawals}
          profitDistributions={profitDistributions}
          language={language}
          t={t}
        />
      )}

      {/* 8. Print Factory Cap Table & Equity Report */}
      <PrintInvestorReport
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        investors={investors}
        investments={investments}
        withdrawals={withdrawals}
        profitDistributions={profitDistributions}
        language={language}
        t={t}
      />
    </div>
  );
};
