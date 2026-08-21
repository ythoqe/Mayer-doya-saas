import React, { useState, useMemo } from 'react';
import { Account, Transaction } from '../types';
import { useERP } from '../context/ERPContext';
import { formatCurrency, formatNumber } from '../utils/translation';
import { 
  Landmark, 
  ArrowRightLeft, 
  Plus, 
  FileSpreadsheet, 
  BarChart3, 
  Receipt, 
  Wallet, 
  Search,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AccountSummaryCards } from './accounts/AccountSummaryCards';
import { AccountCard } from './accounts/AccountCard';
import { AccountModal } from './accounts/AccountModal';
import { AccountDetailsModal } from './accounts/AccountDetailsModal';
import { FundTransferModal } from './accounts/FundTransferModal';
import { TransactionTable } from './accounts/TransactionTable';
import { TransactionFilters, TransactionFilterState } from './accounts/TransactionFilters';
import { CashFlowChart } from './accounts/CashFlowChart';
import { ChequeSummaryCards } from './cheques/ChequeSummaryCards';
import { ChequeTable } from './cheques/ChequeTable';
import { ChequeModal } from './cheques/ChequeModal';

export const Accounts: React.FC = () => {
  const { accounts, transactions, cheques, language, t } = useERP();

  const [activeSubTab, setActiveSubTab] = useState<'accounts' | 'transactions' | 'cheques'>('accounts');
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAddChequeOpen, setIsAddChequeOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [transferSourceAccount, setTransferSourceAccount] = useState<Account | null>(null);

  // Transaction Filters State
  const [txFilters, setTxFilters] = useState<TransactionFilterState>({
    search: '',
    type: 'all',
    accountId: 'all',
    category: 'all',
    dateRange: 'all'
  });

  // Extract unique categories from transactions
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = 
        !txFilters.search ||
        (tx.description && tx.description.toLowerCase().includes(txFilters.search.toLowerCase())) ||
        (tx.category && tx.category.toLowerCase().includes(txFilters.search.toLowerCase())) ||
        (tx.referenceId && tx.referenceId.toLowerCase().includes(txFilters.search.toLowerCase()));

      const matchesType = txFilters.type === 'all' || tx.type === txFilters.type;
      const matchesAccount = txFilters.accountId === 'all' || tx.accountId === txFilters.accountId || tx.toAccountId === txFilters.accountId;
      const matchesCategory = txFilters.category === 'all' || tx.category === txFilters.category;

      let matchesDate = true;
      if (txFilters.dateRange !== 'all') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (txFilters.dateRange === 'today') {
          matchesDate = tx.date === todayStr;
        } else if (txFilters.dateRange === 'this_month') {
          const currentMonth = todayStr.slice(0, 7);
          matchesDate = tx.date.startsWith(currentMonth);
        }
      }

      return matchesSearch && matchesType && matchesAccount && matchesCategory && matchesDate;
    });
  }, [transactions, txFilters]);

  const handleTransferFrom = (acc: Account) => {
    setTransferSourceAccount(acc);
    setIsTransferOpen(true);
  };

  const pendingChequesCount = cheques.filter(c => c.status === 'Pending').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#17383B]">
              {t('accountsTitle')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#DDF4F3] text-[#0B9FA5] border border-[#0B9FA5]/20">
              {formatNumber(accounts.length, language)} {language === 'bn' ? 'একাউন্ট' : 'Accounts'}
            </span>
          </div>
          <p className="text-xs text-[#688285] mt-1 font-medium">
            {t('accountsSubtitle')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setTransferSourceAccount(null);
              setIsTransferOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] hover:text-[#0B9FA5] text-xs font-extrabold shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-[#0B9FA5]" />
            <span>{t('transferFundsBtn')}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddAccountOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addAccountBtn')}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#F1FAFA] rounded-2xl border border-[#D9EAEB] w-fit max-w-full overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('accounts')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'accounts'
              ? 'bg-white text-[#0B9FA5] shadow-2xs border border-[#D9EAEB]'
              : 'text-[#688285] hover:text-[#17383B]'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'একাউন্ট ও ব্যালেন্স' : 'Accounts & Balances'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('transactions')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'transactions'
              ? 'bg-white text-[#0B9FA5] shadow-2xs border border-[#D9EAEB]'
              : 'text-[#688285] hover:text-[#17383B]'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'লেনদেন ও লেজার' : 'Transactions & Ledger'}</span>
          <span className="px-1.5 py-0.2 rounded-md bg-[#DDF4F3] text-[#0B9FA5] text-[10px] font-bold">
            {formatNumber(transactions.length, language)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('cheques')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'cheques'
              ? 'bg-white text-[#0B9FA5] shadow-2xs border border-[#D9EAEB]'
              : 'text-[#688285] hover:text-[#17383B]'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'চেক ম্যানেজমেন্ট' : 'Cheque Management'}</span>
          {pendingChequesCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-md bg-[#FFF3DF] text-[#C47D1C] text-[10px] font-bold">
              {formatNumber(pendingChequesCount, language)}
            </span>
          )}
        </button>
      </div>

      {/* Main Tab Views */}
      <AnimatePresence mode="wait">
        {activeSubTab === 'accounts' && (
          <motion.div
            key="tab-accounts"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Top Financial Summary KPI Cards */}
            <AccountSummaryCards />

            {/* Account List Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-extrabold text-sm text-[#17383B] uppercase tracking-wider">
                  {language === 'bn' ? 'সক্রিয় হিসাবসমূহ' : 'Active Financial Accounts'} ({accounts.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {accounts.map(account => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onSelect={(acc) => setSelectedAccount(acc)}
                    onTransfer={handleTransferFrom}
                  />
                ))}
              </div>
            </div>

            {/* Cash Flow Visualizer */}
            <CashFlowChart transactions={transactions} />
          </motion.div>
        )}

        {activeSubTab === 'transactions' && (
          <motion.div
            key="tab-transactions"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            <TransactionFilters
              filters={txFilters}
              onChange={setTxFilters}
              accounts={accounts}
              categories={uniqueCategories}
            />

            <TransactionTable
              transactions={filteredTransactions}
              accounts={accounts}
            />
          </motion.div>
        )}

        {activeSubTab === 'cheques' && (
          <motion.div
            key="tab-cheques"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            <ChequeSummaryCards />
            <ChequeTable
              cheques={cheques}
              onAddCheque={() => setIsAddChequeOpen(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {isAddAccountOpen && (
        <AccountModal
          isOpen={isAddAccountOpen}
          onClose={() => setIsAddAccountOpen(false)}
        />
      )}

      {isTransferOpen && (
        <FundTransferModal
          isOpen={isTransferOpen}
          onClose={() => setIsTransferOpen(false)}
          initialFromAccount={transferSourceAccount}
        />
      )}

      {isAddChequeOpen && (
        <ChequeModal
          isOpen={isAddChequeOpen}
          onClose={() => setIsAddChequeOpen(false)}
        />
      )}

      {selectedAccount && (
        <AccountDetailsModal
          account={selectedAccount}
          onClose={() => setSelectedAccount(null)}
          onTransfer={handleTransferFrom}
        />
      )}
    </div>
  );
};
